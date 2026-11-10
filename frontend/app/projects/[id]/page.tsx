"use client";

import { apiFetch } from "@/lib/api";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProject() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects/${projectId}`, { cache: "no-store" });
      if (response.status === 404) throw new Error("Ce projet n'existe pas ou a été supprimé.");
      if (!response.ok) throw new Error(`Impossible de charger le projet (${response.status}).`);
      const data: Project = await response.json();
      setProject(data);
      setName(data.name);
      setDescription(data.description ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (projectId) void loadProject();
    // loadProject is intentionally invoked when the route ID changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? `La modification a échoué (${response.status}).`);
      }
      const updated: Project = await response.json();
      setProject(updated);
      setName(updated.name);
      setDescription(updated.description ?? "");
      setEditing(false);
      setSuccess("Les modifications ont été enregistrées.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    if (!project) return;
    setName(project.name);
    setDescription(project.description ?? "");
    setEditing(false);
    setError("");
  }

  async function removeProject() {
    if (!project || deleting) return;
    const confirmed = window.confirm(
      `Supprimer définitivement le projet « ${project.name} » ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`La suppression a échoué (${response.status}).`);
      router.push("/projects");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setDeleting(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a>
        <div className="nav-label">ESPACE DE TRAVAIL</div>
        <a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a>
        <a className="nav-item active" href="/projects" aria-current="page">▦ <span>Mes projets</span></a>
        <a className="nav-item" href="/assistants">◇ <span>Assistants IA</span></a>
        <a className="nav-item" href={`/projects/${projectId}/sources`}>▤ <span>Sources de données</span></a>
        <span className="nav-item disabled" title="Disponible dans une prochaine version">◎ <span>Agents &amp; workflows</span></span>
        <div className="sidebar-bottom"><span className="avatar">D</span><div><strong>Développement local</strong><small>Environnement de test</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <span>Workspace <span className="crumb-separator">/</span> <a href="/projects" className="breadcrumb-link">Mes projets</a> <span className="crumb-separator">/</span> Détail</span>
          <span className="local-pill"><i /> Environnement local</span>
        </header>

        <div className="project-detail-heading">
          <div>
            <a className="back-link" href="/projects">← Retour aux projets</a>
            <p className="eyebrow">ESPACE DE TRAVAIL · PROJET</p>
            <h1>{loading ? "Chargement du projet…" : project?.name ?? "Projet introuvable"}</h1>
            <p className="subtitle">{project?.description || "Configurez ici les ressources et les assistants de ce projet."}</p>
          </div>
          {project && <span className="status project-detail-status">{project.status === "active" ? "Actif" : project.status}</span>}
        </div>

        {error && <p className="error detail-alert" role="alert">{error}</p>}
        {success && <p className="success-message" role="status">{success}</p>}

        {loading ? (
          <section className="panel detail-loading">Chargement des informations du projet…</section>
        ) : !project ? (
          <section className="panel detail-not-found">
            <div className="empty-icon">⌕</div>
            <strong>Projet indisponible</strong>
            <span>Vérifiez l&apos;adresse ou retournez à la liste de vos projets.</span>
            <a className="primary-link" href="/projects">Voir mes projets</a>
          </section>
        ) : (
          <>
            <div className="project-detail-stats">
              <div className="stat-card"><span>Assistants IA</span><strong>→</strong><small><a className="stat-action-link" href={`/projects/${project.id}/assistants`}>Gérer les assistants</a></small></div>
              <div className="stat-card"><span>Sources de données</span><strong>→</strong><small><a className="stat-action-link" href={`/projects/${project.id}/sources`}>Gérer les sources</a></small></div>
              <div className="stat-card"><span>Agents spécialisés</span><strong>—</strong><small>À construire</small></div>
              <div className="stat-card"><span>Statut</span><strong className="detail-active-value">{project.status === "active" ? "Actif" : project.status}</strong><small>Projet disponible</small></div>
            </div>

            <div className="project-detail-grid">
              <section className="panel project-settings-panel">
                <div className="panel-heading">
                  <div><h3>Informations du projet</h3><p>Gérez les informations générales de cet espace.</p></div>
                  {!editing && <button type="button" className="secondary-button" onClick={() => { setEditing(true); setSuccess(""); }}>Modifier</button>}
                </div>

                {editing ? (
                  <form onSubmit={saveProject}>
                    <label htmlFor="detail-project-name">Nom du projet</label>
                    <input id="detail-project-name" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={120}/>
                    <label htmlFor="detail-project-description">Description</label>
                    <textarea id="detail-project-description" value={description} onChange={event => setDescription(event.target.value)} rows={5} maxLength={1000}/>
                    <div className="form-actions">
                      <button type="submit" disabled={saving || name.trim().length < 2}>{saving ? "Enregistrement…" : "Enregistrer les modifications"}</button>
                      <button type="button" className="secondary-button" onClick={cancelEditing} disabled={saving}>Annuler</button>
                    </div>
                  </form>
                ) : (
                  <div className="project-readonly-fields">
                    <div><span>Nom</span><strong>{project.name}</strong></div>
                    <div><span>Description</span><p>{project.description || "Aucune description renseignée."}</p></div>
                    <div><span>Créé le</span><strong>{formatDate(project.created_at)}</strong></div>
                    <div><span>Dernière modification</span><strong>{formatDate(project.updated_at)}</strong></div>
                  </div>
                )}
              </section>

              <section className="panel project-next-panel">
                <div className="panel-heading"><div><h3>Construire votre assistant</h3><p>Les prochaines briques de ce projet.</p></div><span className="icon-box">✧</span></div>
                <a className="next-step-row next-step-link" href={`/projects/${project.id}/assistants`}><span className="next-step-icon">◇</span><div><strong>Assistants IA</strong><small>Créer et configurer vos assistants dédiés.</small></div><span className="coming-soon">Configurer →</span></a>
                <a className="next-step-row next-step-link" href={`/projects/${project.id}/sources`}><span className="next-step-icon">▤</span><div><strong>Sources de connaissances</strong><small>Importer des documents et connecter vos données.</small></div><span className="coming-soon">Configurer →</span></a>
                <div className="next-step-row"><span className="next-step-icon">◎</span><div><strong>Agents &amp; workflows</strong><small>Orchestrer les tâches et vérifier les réponses.</small></div><span className="coming-soon">À venir</span></div>
              </section>
            </div>

            <section className="panel danger-zone">
              <div><h3>Zone de danger</h3><p>La suppression retire définitivement ce projet de votre base locale.</p></div>
              <button type="button" className="danger-button" onClick={() => void removeProject()} disabled={deleting}>{deleting ? "Suppression…" : "Supprimer ce projet"}</button>
            </section>
          </>
        )}
        <footer>Universal AI Platform <span>·</span> Local development build 0.7.0</footer>
      </section>
    </main>
  );
}
