from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
import httpx
import ipaddress
import socket
from urllib.parse import urlparse
import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.authorization import owned_project
from app.modules.users import User
from app.modules.projects.models import Project
from app.modules.sources.models import DataSource

router = APIRouter()
MAX_BYTES = 5 * 1024 * 1024
ALLOWED = {".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm", ".pdf", ".docx"}

def validate_public_url(raw_url: str) -> str:
    """Reject local/private targets before fetching user-supplied URLs (SSRF mitigation)."""
    try:
        parsed = urlparse(raw_url)
        if parsed.scheme != "https" or not parsed.hostname:
            raise ValueError("HTTPS requis")
        if parsed.username or parsed.password:
            raise ValueError("Identifiants dans l'URL interdits")
        host = parsed.hostname.rstrip(".").lower()
        if host in {"localhost", "localhost.localdomain"} or host.endswith((".local", ".internal", ".localhost")):
            raise ValueError("Hôte local interdit")
        addresses = {item[4][0] for item in socket.getaddrinfo(host, parsed.port or 443, type=socket.SOCK_STREAM)}
        if not addresses:
            raise ValueError("Hôte introuvable")
        for address in addresses:
            ip = ipaddress.ip_address(address.split("%")[0])
            if not ip.is_global:
                raise ValueError("Les adresses IP privées ou réservées sont interdites")
        return raw_url
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(422, "URL non autorisée ou impossible à résoudre.") from exc


def serialize(item: DataSource):
    return {"id": item.id, "project_id": item.project_id, "name": item.name, "source_type": item.source_type,
            "origin": item.origin, "status": item.status, "size_bytes": item.size_bytes,
            "created_at": item.created_at.isoformat(), "content_preview": item.content[:240]}

@router.get("/projects/{project_id}/sources")
def list_sources(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_project(db, project_id, user)
    rows = db.query(DataSource).filter(DataSource.project_id == project_id).order_by(DataSource.created_at.desc()).all()
    return [serialize(x) for x in rows]

def _extract_text(raw: bytes, suffix: str) -> str:
    """Extract searchable text from supported knowledge files."""
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
            import io
            reader = PdfReader(io.BytesIO(raw))
            content = "\n".join(page.extract_text() or "" for page in reader.pages)
        except ImportError as exc:
            raise HTTPException(503, "Le support PDF nécessite pypdf.") from exc
        except Exception as exc:
            raise HTTPException(422, "Impossible d'extraire le texte de ce PDF.") from exc
    elif suffix == ".docx":
        try:
            from docx import Document
            import io
            document = Document(io.BytesIO(raw))
            content = "\n".join(p.text for p in document.paragraphs if p.text.strip())
            for table in document.tables:
                content += "\n" + "\n".join(" | ".join(cell.text for cell in row.cells) for row in table.rows)
        except ImportError as exc:
            raise HTTPException(503, "Le support Word nécessite python-docx.") from exc
        except Exception as exc:
            raise HTTPException(422, "Impossible d'extraire le texte de ce document Word.") from exc
    else:
        try:
            content = raw.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise HTTPException(422, "Le fichier doit être encodé en UTF-8.") from exc
    if not content.strip():
        raise HTTPException(422, "Aucun texte exploitable n'a été trouvé dans ce fichier.")
    if len(content) > 2_000_000:
        raise HTTPException(413, "Le texte extrait dépasse la limite de 2 Mo.")
    return content


def _safe_relative_name(filename: str) -> str:
    # Browsers may send a relative path when a directory is selected.
    normalized = filename.replace("\\", "/").strip()
    parts = [part for part in normalized.split("/") if part not in ("", ".")]
    if (not parts or any(part == ".." for part in parts) or normalized.startswith("/")
            or re.match(r"^[A-Za-z]:/", normalized)):
        raise HTTPException(422, "Chemin de fichier invalide.")
    return "/".join(parts)


def _store_source(project_id: str, filename: str, raw: bytes, db: Session) -> DataSource:
    relative_name = _safe_relative_name(filename)
    suffix = Path(relative_name).suffix.lower()
    if suffix not in ALLOWED:
        raise HTTPException(415, "Format non pris en charge.")
    content = _extract_text(raw, suffix)
    item = DataSource(
        id=str(uuid4()), project_id=project_id,
        name=Path(relative_name).name, source_type="file", origin=relative_name,
        status="indexed", content=content, size_bytes=len(raw),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.post("/projects/{project_id}/sources/upload")
async def upload_source(project_id: str, file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_project(db, project_id, user, write=True)
    raw = await file.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise HTTPException(413, "Fichier trop volumineux (5 Mo maximum).")
    return serialize(_store_source(project_id, file.filename or "Document", raw, db))


@router.post("/projects/{project_id}/sources/upload-folder")
async def upload_source_folder(
    project_id: str,
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Import a directory selection in one request, retaining relative paths."""
    owned_project(db, project_id, user, write=True)
    if not files:
        raise HTTPException(422, "Aucun fichier sélectionné.")
    if len(files) > 100:
        raise HTTPException(413, "100 fichiers maximum par import de dossier.")

    total_bytes = 0
    imported: list[dict] = []
    failed: list[dict] = []
    for uploaded in files:
        filename = uploaded.filename or "Document"
        try:
            raw = await uploaded.read(MAX_BYTES + 1)
            if len(raw) > MAX_BYTES:
                raise HTTPException(413, "Fichier supérieur à 5 Mo.")
            total_bytes += len(raw)
            if total_bytes > 50 * 1024 * 1024:
                raise HTTPException(413, "Import limité à 50 Mo au total.")
            item = _store_source(project_id, filename, raw, db)
            imported.append(serialize(item))
        except HTTPException as exc:
            failed.append({"name": filename, "detail": str(exc.detail)})
        except Exception:
            db.rollback()
            failed.append({"name": filename, "detail": "Erreur inattendue pendant l'import."})
        finally:
            await uploaded.close()

    return {"total": len(files), "imported_count": len(imported), "failed_count": len(failed),
            "imported": imported, "failed": failed}

@router.post("/projects/{project_id}/sources/url")
async def add_url(project_id: str, url: str = Form(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_project(db, project_id, user, write=True)
    validate_public_url(url)
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(10.0), follow_redirects=False, headers={"User-Agent":"UniversalAIPlatform/0.9"}) as client:
            response = await client.get(url)
            response.raise_for_status()
    except Exception as exc: raise HTTPException(422, f"Impossible de récupérer cette URL : {type(exc).__name__}")
    ctype = response.headers.get("content-type", "")
    if "text/" not in ctype and "json" not in ctype: raise HTTPException(415, "Cette URL ne renvoie pas un contenu texte ou HTML.")
    if len(response.content) > MAX_BYTES:
        raise HTTPException(413, "La page distante dépasse la limite de 5 Mo.")
    content = response.text[:MAX_BYTES]
    from html import unescape
    import re
    text = unescape(re.sub(r"<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>", " ", content, flags=re.I|re.S))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    if not text: raise HTTPException(422, "Aucun contenu textuel exploitable sur cette page.")
    item = DataSource(id=str(uuid4()), project_id=project_id, name=url.split("/")[2], source_type="url", origin=url, status="indexed", content=text, size_bytes=len(content.encode("utf-8")))
    db.add(item); db.commit(); db.refresh(item)
    return serialize(item)

@router.get("/sources/{source_id}")
def get_source(source_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(DataSource).join(Project, DataSource.project_id == Project.id).filter(DataSource.id == source_id).first()
    if not item: raise HTTPException(404, "Source introuvable")
    owned_project(db, item.project_id, user)
    result = serialize(item); result["content"] = item.content
    return result

@router.delete("/sources/{source_id}")
def delete_source(source_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    item = db.query(DataSource).join(Project, DataSource.project_id == Project.id).filter(DataSource.id == source_id).first()
    if not item: raise HTTPException(404, "Source introuvable")
    owned_project(db, item.project_id, user, write=True)
    db.delete(item); db.commit(); return {"deleted": True}
