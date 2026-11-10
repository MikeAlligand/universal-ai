"use client";

import { apiFetch } from "@/lib/api";
import { ChangeEvent, FormEvent, InputHTMLAttributes, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Database, FileText, Globe, Upload, Trash2, RefreshCw,
  ShieldCheck, Search, FolderOpen, Eye, X, LoaderCircle, CheckCircle2,
  AlertCircle, FileUp, ChevronRight,
} from "lucide-react";

type Source = {
  id: string;
  name: string;
  source_type: string;
  origin: string;
  status: string;
  size_bytes: number;
  created_at: string;
  content_preview: string;
};
type SourceDetail = Source & { content: string };
type FolderResult = {
  total: number;
  imported_count: number;
  failed_count: number;
  imported: Source[];
  failed: { name: string; detail: string }[];
};

const formatSize = (bytes: number) => bytes < 1024 * 1024
  ? `${Math.max(1, bytes / 1024).toFixed(1)} Ko`
  : `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;

export default function SourcesPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [items, setItems] = useState<Source[]>([]);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [folderBusy, setFolderBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [folderReport, setFolderReport] = useState<FolderResult | null>(null);
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState<SourceDetail | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/v1/projects/${projectId}/sources`);
      if (!response.ok) throw new Error("Impossible de charger les sources.");
      setItems(await response.json());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur de chargement");
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) void load();
  }, [projectId, load]);

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    setBusy(true); setError(""); setSuccess(""); setFolderReport(null);
    try {
      const data = new FormData(); data.append("file", file);
      const response = await apiFetch(`/api/v1/projects/${projectId}/sources/upload`, { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Import impossible");
      setSuccess(`« ${body.name} » a été importé et indexé.`);
      form.reset(); await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur d'import");
    } finally { setBusy(false); }
  }

  async function uploadFolder(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(input.files ?? []);
    if (!files.length) return;
    setFolderBusy(true); setError(""); setSuccess(""); setFolderReport(null);
    try {
      const data = new FormData();
      files.forEach((file) => data.append("files", file, (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name));
      const response = await apiFetch(`/api/v1/projects/${projectId}/sources/upload-folder`, { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Import du dossier impossible");
      setFolderReport(body as FolderResult);
      setSuccess(`${body.imported_count} document(s) importé(s) sur ${body.total}.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur d'import du dossier");
    } finally {
      setFolderBusy(false);
      input.value = "";
    }
  }

  async function addUrl(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess("");
    try {
      const data = new FormData(); data.append("url", url);
      const response = await apiFetch(`/api/v1/projects/${projectId}/sources/url`, { method: "POST", body: data });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Import impossible");
      setUrl(""); setSuccess("Page web récupérée et enregistrée."); await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Erreur URL");
    } finally { setBusy(false); }
  }

  async function openSource(item: Source) {
    if (openingId === item.id) return;
    setOpeningId(item.id); setPreviewError(""); setActiveSource(null);
    try {
      const response = await apiFetch(`/api/v1/sources/${item.id}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail ?? "Impossible d'ouvrir ce document.");
      setActiveSource(body as SourceDetail);
    } catch (reason) {
      setPreviewError(reason instanceof Error ? reason.message : "Erreur d'ouverture");
    } finally { setOpeningId(null); }
  }

  async function remove(item: Source) {
    if (!confirm(`Supprimer la source « ${item.name} » ?`)) return;
    const response = await apiFetch(`/api/v1/sources/${item.id}`, { method: "DELETE" });
    if (!response.ok) { setError("La suppression a échoué."); return; }
    setItems((current) => current.filter((source) => source.id !== item.id));
    if (activeSource?.id === item.id) setActiveSource(null);
    setSuccess("Source supprimée.");
  }

  const visible = useMemo(() => items.filter((item) => `${item.name} ${item.origin}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const indexedCount = items.filter((item) => item.status === "indexed").length;

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a>
        <div className="nav-label">ESPACE DE TRAVAIL</div>
        <a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a>
        <a className="nav-item active" href="/projects">▦ <span>Mes projets</span></a>
        <div className="sidebar-bottom"><span className="avatar">U</span><div><strong>Universal AI</strong><small>Environnement local</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><span>Workspace <ChevronRight size={12}/> <a className="breadcrumb-link" href="/projects">Mes projets</a> <ChevronRight size={12}/> Sources</span><span className="local-pill"><i/> Données locales</span></header>

        <div className="project-detail-heading knowledge-hero">
          <div><a className="back-link" href={`/projects/${projectId}`}><ArrowLeft size={14}/> Retour au projet</a><p className="eyebrow">KNOWLEDGE HUB · PROJET</p><h1>Votre bibliothèque de connaissances</h1><p className="subtitle">Centralisez vos fichiers, dossiers et pages web dans un espace unique, prêt à alimenter vos assistants.</p></div>
          <div className="knowledge-hero-art"><div className="knowledge-art-orbit orbit-one"/><div className="knowledge-art-orbit orbit-two"/><div className="knowledge-art-core"><Database size={31}/></div><span className="art-file art-file-one"><FileText size={17}/></span><span className="art-file art-file-two"><Globe size={17}/></span><span className="art-file art-file-three"><FolderOpen size={17}/></span></div>
        </div>

        <div className="knowledge-stats">
          <div className="knowledge-stat"><span>Sources connectées</span><strong>{items.length}</strong><small>Tous les éléments du projet</small></div>
          <div className="knowledge-stat"><span>Prêtes à être utilisées</span><strong>{indexedCount}</strong><small>Documents avec texte extrait</small></div>
          <div className="knowledge-stat"><span>Types de sources</span><strong>{new Set(items.map((item) => item.source_type)).size}</strong><small>Fichiers et pages web</small></div>
        </div>

        {error && <p className="error detail-alert" role="alert">{error}</p>}
        {success && <p className="knowledge-success"><CheckCircle2 size={16}/>{success}</p>}

        <div className="knowledge-import-grid">
          <section className="panel knowledge-import-card">
            <div className="knowledge-card-icon purple"><FileUp size={19}/></div>
            <div className="panel-heading"><div><h3>Ajouter un document</h3><p>Pour un fichier ponctuel à intégrer rapidement.</p></div></div>
            <form onSubmit={uploadFile}>
              <label htmlFor="source-file">Sélectionner un fichier</label>
              <input id="source-file" name="file" type="file" accept=".txt,.md,.csv,.json,.xml,.html,.htm,.pdf,.docx" required/>
              <small>PDF, Word, TXT, Markdown, CSV, JSON, XML ou HTML · 5 Mo maximum.</small>
              <button type="submit" disabled={busy || folderBusy}>{busy ? <><LoaderCircle size={15} className="spin"/> Import en cours…</> : <><Upload size={15}/> Importer le document</>}</button>
            </form>
          </section>

          <section className="panel knowledge-import-card folder-import-card">
            <div className="knowledge-card-icon blue"><FolderOpen size={20}/></div>
            <div className="panel-heading"><div><h3>Importer un dossier complet</h3><p>Ajoutez un répertoire et tous ses sous-dossiers en une seule opération.</p></div><span className="new-feature-tag">Nouveau</span></div>
            <div className="folder-drop-zone"><FolderOpen size={26}/><strong>Tout votre dossier, en une fois</strong><span>Les chemins des sous-dossiers sont conservés pour retrouver facilement chaque fichier.</span>
              <label className="folder-select-button" htmlFor="source-folder">{folderBusy ? <><LoaderCircle size={15} className="spin"/> Import en cours…</> : <><FolderOpen size={15}/> Choisir un dossier</>}</label>
              <input id="source-folder" className="visually-hidden-input" type="file" multiple {...({ webkitdirectory: "", directory: "" } as InputHTMLAttributes<HTMLInputElement> & { webkitdirectory: string; directory: string })} onChange={uploadFolder} disabled={folderBusy || busy}/>
            </div>
            <small className="folder-limit-note">100 fichiers maximum · 5 Mo par fichier · 50 Mo par import.</small>
          </section>

          <section className="panel knowledge-import-card url-import-card">
            <div className="knowledge-card-icon green"><Globe size={19}/></div>
            <div className="panel-heading"><div><h3>Connecter une page web</h3><p>Récupérez le contenu textuel d&apos;une URL publique.</p></div></div>
            <form onSubmit={addUrl}><label htmlFor="source-url">Adresse de la page</label><input id="source-url" type="url" placeholder="https://exemple.fr/documentation" value={url} onChange={(event) => setUrl(event.target.value)} required/><small>La page est récupérée par votre backend.</small><button type="submit" disabled={busy || folderBusy || !url.trim()}>{busy ? <><LoaderCircle size={15} className="spin"/> Récupération…</> : <><Globe size={15}/> Connecter la page</>}</button></form>
          </section>
        </div>

        {folderReport && folderReport.failed.length > 0 && <section className="folder-report"><div><AlertCircle size={17}/><strong>{folderReport.failed_count} fichier(s) n&apos;ont pas pu être importés</strong></div><ul>{folderReport.failed.map((item, index) => <li key={`${item.name}-${index}`}><strong>{item.name}</strong><span>{item.detail}</span></li>)}</ul></section>}

        <section className="panel knowledge-library-panel">
          <div className="panel-heading library-heading"><div><p className="eyebrow">VOTRE ESPACE DOCUMENTAIRE</p><h3><Database size={18}/> Bibliothèque du projet</h3><p>Ouvrez un élément en un clic pour consulter son contenu extrait.</p></div><button className="secondary-button" onClick={() => void load()}><RefreshCw size={14}/> Actualiser</button></div>
          <div className="source-search"><Search size={16}/><input aria-label="Rechercher une source" placeholder="Rechercher un document, un dossier ou une URL…" value={query} onChange={(event) => setQuery(event.target.value)}/><span>{visible.length} résultat(s)</span></div>
          {visible.length === 0 ? <div className="empty-state"><FileText size={30}/><strong>{items.length ? "Aucun résultat" : "Votre bibliothèque est encore vide"}</strong><span>Importez un document, un dossier ou une page web pour commencer.</span></div> :
            <div className="source-list">{visible.map((item) => <div className="source-row knowledge-source-row" key={item.id}>
              <span className={`source-icon ${item.source_type === "url" ? "url-source-icon" : ""}`}>{item.source_type === "url" ? <Globe size={19}/> : <FileText size={19}/>}</span>
              <div className="source-main"><strong>{item.name}</strong><small><span>{item.origin}</span><i>·</i>{formatSize(item.size_bytes)}</small><p>{item.content_preview}</p></div>
              <span className="status">{item.status === "indexed" ? "Indexée" : item.status}</span>
              <button className="source-open-button" onClick={() => void openSource(item)} disabled={openingId === item.id} aria-label={`Ouvrir ${item.name}`}>{openingId === item.id ? <LoaderCircle size={16} className="spin"/> : <><Eye size={15}/><span>Ouvrir</span></>}</button>
              <button className="icon-button" title="Supprimer" aria-label={`Supprimer ${item.name}`} onClick={() => void remove(item)}><Trash2 size={16}/></button>
            </div>)}</div>}
        </section>

        <section className="privacy-note"><ShieldCheck size={19}/><div><strong>Vos sources restent sur votre infrastructure</strong><p>Les contenus importés sont enregistrés dans la base configurée par votre backend. L&apos;import de dossier conserve l&apos;arborescence relative des fichiers.</p></div></section>
        <footer>Universal AI Platform · Knowledge Hub</footer>
      </section>

      {previewError && <div className="knowledge-toast" role="alert"><AlertCircle size={16}/>{previewError}<button onClick={() => setPreviewError("")} aria-label="Fermer"><X size={15}/></button></div>}
      {openingId && <div className="knowledge-loading-overlay"><div><LoaderCircle size={28} className="spin"/><strong>Ouverture du document…</strong><span>Récupération du contenu depuis votre bibliothèque.</span></div></div>}
      {activeSource && <div className="document-preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveSource(null); }}>
        <section className="document-preview-modal" role="dialog" aria-modal="true" aria-labelledby="document-preview-title">
          <header className="document-preview-header"><div className="document-preview-icon"><FileText size={20}/></div><div><p className="eyebrow">APERÇU DU DOCUMENT</p><h2 id="document-preview-title">{activeSource.name}</h2><span>{activeSource.origin} · {formatSize(activeSource.size_bytes)}</span></div><button className="document-preview-close" onClick={() => setActiveSource(null)} aria-label="Fermer l'aperçu"><X size={19}/></button></header>
          <div className="document-preview-content"><pre>{activeSource.content || "Aucun contenu textuel disponible."}</pre></div>
          <footer className="document-preview-footer"><span><CheckCircle2 size={15}/> Contenu extrait et disponible</span><button onClick={() => setActiveSource(null)}>Fermer</button></footer>
        </section>
      </div>}
    </main>
  );
}
