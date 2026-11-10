"use client";

import { apiFetch } from "@/lib/api";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Erreur API (${response.status})`);
      setProjects(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger les projets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fr");
    if (!normalized) return projects;
    return projects.filter((project) =>
      `${project.name} ${project.description}`.toLocaleLowerCase("fr").includes(normalized)
    );
  }, [projects, query]);

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail ?? `La création a échoué (${response.status}).`);
      }
      setName("");
      setDescription("");
      setSuccess("Projet créé et enregistré.");
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Supprimer le projet « ${project.name} » ? Cette action est irréversible.`)) return;
    setError("");
    setSuccess("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects/${project.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`La suppression a échoué (${response.status}).`);
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setSuccess("Projet supprimé.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
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
        <span className="nav-item disabled" title="Disponible dans une prochaine version">▤ <span>Sources de données</span></span>
        <span className="nav-item disabled" title="Disponible dans une prochaine version">◎ <span>Agents &amp; workflows</span></span>
        <div className="sidebar-bottom"><span className="avatar">D</span><div><strong>Développement local</strong><small>Environnement de test</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <span>Workspace <span className="crumb-separator">/</span> Mes projets</span>
          <span className="local-pill"><i /> Environnement local</span>
        </header>

        <div className="projects-hero">
          <div>
            <p className="eyebrow">VOTRE ESPACE DE TRAVAIL</p>
            <h1>Mes projets</h1>
            <p className="subtitle">Organisez vos assistants, vos sources de connaissances et vos workflows IA.</p>
          </div>
          <div className="projects-hero-mark">✧</div>
        </div>

        <div className="project-summary">
          <div className="summary-card"><span className="summary-icon">▦</span><div><small>Projets enregistrés</small><strong>{projects.length}</strong></div></div>
          <div className="summary-card"><span className="summary-icon">◉</span><div><small>Projets actifs</small><strong>{projects.filter(p => p.status === "active").length}</strong></div></div>
          <div className="summary-card"><span className="summary-icon">⌁</span><div><small>Stockage</small><strong>Local</strong></div></div>
        </div>

        <div className="projects-layout">
          <section className="panel create-project-panel">
            <div className="panel-heading"><div><h3>Nouveau projet</h3><p>Créez un espace dédié à un besoin métier.</p></div><span className="icon-box">＋</span></div>
            <form onSubmit={createProject}>
              <label htmlFor="project-name">Nom du projet</label>
              <input id="project-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Assistant support client" required minLength={2} maxLength={120}/>
              <label htmlFor="project-description">Description <span className="optional-label">Facultatif</span></label>
              <textarea id="project-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez l'objectif de ce projet…" rows={4} maxLength={1000}/>
              <button disabled={saving}>{saving ? "Enregistrement…" : "Créer le projet"} <span>→</span></button>
            </form>
          </section>

          <section className="panel projects-list-panel">
            <div className="panel-heading projects-list-heading">
              <div><h3>Tous vos projets</h3><p>Vos espaces de travail enregistrés durablement.</p></div>
              <span className="count">{projects.length} projet(s)</span>
            </div>
            <div className="project-search">
              <span>⌕</span>
              <input aria-label="Rechercher un projet" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un projet…"/>
              <button type="button" className="text-button" onClick={() => void loadProjects()} disabled={loading}>↻</button>
            </div>

            {error && <p className="error" role="alert">{error}</p>}
            {success && <p className="success-message" role="status">{success}</p>}

            {loading ? <div className="projects-empty"><span className="loading-dot"/>Chargement de vos projets…</div> :
              filteredProjects.length === 0 ? (
                <div className="projects-empty">
                  <div className="empty-icon">✧</div>
                  <strong>{query ? "Aucun résultat" : "Votre espace commence ici"}</strong>
                  <span>{query ? "Essayez un autre terme de recherche." : "Créez votre premier projet avec le formulaire à gauche."}</span>
                </div>
              ) : (
                <div className="managed-project-list">
                  {filteredProjects.map(project => (
                    <article className="managed-project-card" key={project.id}>
                      <a className="managed-project-open" href={`/projects/${project.id}`} aria-label={`Ouvrir le projet ${project.name}`}>
                        <span className="managed-project-icon">✦</span>
                        <span className="managed-project-details">
                          <strong>{project.name}</strong>
                          <span>{project.description || "Aucune description renseignée."}</span>
                          <small>Créé le {new Date(project.created_at).toLocaleDateString("fr-FR")}</small>
                        </span>
                        <span className="managed-project-arrow">→</span>
                      </a>
                      <span className="status">{project.status === "active" ? "Actif" : project.status}</span>
                      <button type="button" className="delete-project" aria-label={`Supprimer ${project.name}`} title="Supprimer le projet" onClick={() => void deleteProject(project)}>×</button>
                    </article>
                  ))}
                </div>
              )}
          </section>
        </div>
        <div className="notice"><span>ⓘ</span><div><strong>Vos projets sont enregistrés durablement</strong><p>Ouvrez un projet pour modifier ses informations et préparer ses futurs assistants et sources de connaissances.</p></div></div>
        <footer>Universal AI Platform <span>·</span> Local development build 0.6.0</footer>
      </section>
    </main>
  );
}
