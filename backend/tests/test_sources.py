from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.main import app
from app.modules import users  # noqa: F401
from app.modules.projects.models import Project
from app.modules.assistants import models as assistant_models  # noqa: F401
from app.modules.conversations import models as conversation_models  # noqa: F401
from app.modules.sources import models as source_models  # noqa: F401

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
def override_db():
    Base.metadata.create_all(bind=engine)
    db=Session()
    try: yield db
    finally: db.close()
app.dependency_overrides[get_db]=override_db
from app.core.security import get_current_user
from types import SimpleNamespace
app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="test-user")
client=TestClient(app)

def test_upload_list_and_delete_source():
    db=Session(); Base.metadata.create_all(bind=engine)
    project=Project(id="source-test-project", owner_id="test-user", name="Sources test", description="")
    db.add(project); db.commit(); db.close()
    uploaded=client.post("/api/v1/projects/source-test-project/sources/upload", files={"file":("guide.txt",b"Hello knowledge base", "text/plain")})
    assert uploaded.status_code == 200
    source_id=uploaded.json()["id"]
    listed=client.get("/api/v1/projects/source-test-project/sources")
    assert listed.status_code == 200 and len(listed.json()) == 1
    assert client.delete(f"/api/v1/sources/{source_id}").json()["deleted"] is True
    assert client.get("/api/v1/projects/source-test-project/sources").json() == []


def test_url_validation_rejects_http_and_local_hosts():
    from fastapi import HTTPException
    from app.api.v1.routes.sources import validate_public_url
    for url in ("http://example.com", "https://localhost", "https://127.0.0.1", "https://192.168.1.1"):
        try:
            validate_public_url(url)
            assert False, f"URL should have been rejected: {url}"
        except HTTPException as exc:
            assert exc.status_code == 422


def test_security_headers_are_present():
    response = client.get("/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_upload_folder_preserves_relative_paths_and_continues_after_invalid_file():
    db = Session(); Base.metadata.create_all(bind=engine)
    project = Project(id="folder-source-project", owner_id="test-user", name="Folder test", description="")
    db.add(project); db.commit(); db.close()

    response = client.post(
        "/api/v1/projects/folder-source-project/sources/upload-folder",
        files=[
            ("files", ("Equipe/RH/guide.txt", b"Guide RH", "text/plain")),
            ("files", ("Equipe/RH/tableau.exe", b"not allowed", "application/octet-stream")),
            ("files", ("Equipe/IT/readme.md", b"Guide IT", "text/markdown")),
        ],
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["total"] == 3
    assert payload["imported_count"] == 2
    assert payload["failed_count"] == 1
    assert {item["origin"] for item in payload["imported"]} == {
        "Equipe/RH/guide.txt", "Equipe/IT/readme.md"
    }

    detail = client.get(f"/api/v1/sources/{payload['imported'][0]['id']}")
    assert detail.status_code == 200
    assert detail.json()["content"] in {"Guide RH", "Guide IT"}


def test_upload_folder_rejects_parent_path_traversal():
    db = Session(); Base.metadata.create_all(bind=engine)
    project = Project(id="folder-path-project", owner_id="test-user", name="Folder path test", description="")
    db.add(project); db.commit(); db.close()

    response = client.post(
        "/api/v1/projects/folder-path-project/sources/upload-folder",
        files=[("files", ("../outside.txt", b"unsafe", "text/plain"))],
    )
    assert response.status_code == 200
    assert response.json()["imported_count"] == 0
    assert response.json()["failed_count"] == 1
