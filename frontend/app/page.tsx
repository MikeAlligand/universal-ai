"use client";

import { apiFetch, clearSession } from "@/lib/api";

import { useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
};

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadProjects() {
    try {
      const response = await apiFetch(`${API}/api/v1/projects`);
      if (!response.ok) throw new Error("Impossible de charger les projets.");
      setProjects(await response.json());
      setError("");
    } catch {
      setError("Backend indisponible. Vérifie que l’API FastAPI est démarrée sur le port configuré.");
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiFetch(`${API}/api/v1/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!response.ok) throw new Error("La création du projet a échoué.");
      setName("");
      setDescription("");
      await loadProjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✦</span><span>Universal AI</span></div>
        <div className="nav-label">ESPACE DE TRAVAIL</div>
        <a className="nav-item active" href="/">◫ <span>Vue d&apos;ensemble</span></a>
        <a className="nav-item" href="/projects">▦ <span>Mes projets</span></a>
        <a className="nav-item" href="/assistants">◇ <span>Assistants IA</span></a>
        <a className="nav-item disabled" href="#knowledge">▤ <span>Connaissances</span></a>
        <a className="nav-item disabled" href="#quality">◎ <span>Qualité</span></a>
        <div className="sidebar-bottom"><span className="avatar">D</span><div><strong>Développement local</strong><small>Environnement de test</small></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><span>Workspace / Vue d&apos;ensemble</span><div style={{display:"flex",alignItems:"center",gap:12}}><span className="local-pill"><i /> Environnement local</span><button type="button" onClick={() => { clearSession(); window.location.assign("/login"); }} style={{width:"auto",margin:0,padding:"8px 12px"}}>Déconnexion</button></div></header>
        <div className="page-heading">
          <div><p className="eyebrow">BIENVENUE SUR VOTRE ESPACE</p><h1>Construisez vos assistants IA.</h1><p className="subtitle">Connectez vos connaissances, orchestrez vos agents et contrôlez la qualité de leurs réponses.</p></div>
          <div className="sparkle">✧</div>
        </div>

        <div className="stats">
          <div className="stat-card"><span>Projets</span><strong>{projects.length}</strong><small>Dans cet environnement</small></div>
          <div className="stat-card"><span>Assistants IA</span><strong>—</strong><small><a href="/assistants">Ouvrir la bibliothèque</a></small></div>
          <div className="stat-card"><span>Sources connectées</span><strong>—</strong><small>Prochaine étape</small></div>
          <div className="stat-card"><span>Contrôle qualité</span><strong>À venir</strong><small>Moteur multi-agents</small></div>
        </div>

        <div className="section-title" id="projects"><div><p className="eyebrow">VOTRE ESPACE DE TRAVAIL</p><h2>Vos projets</h2></div><span className="count">{projects.length} projet(s)</span></div>

        <div className="main-grid">
          <section className="panel">
            <div className="panel-heading"><div><h3>Créer un projet</h3><p>Commencez par définir un espace de connaissances.</p></div><span className="icon-box">＋</span></div>
            <form onSubmit={createProject}>
              <label htmlFor="project-name">Nom du projet</label>
              <input id="project-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex. Assistant commercial" required minLength={2} />
              <label htmlFor="project-description">Description</label>
              <textarea id="project-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="À quoi servira cet assistant ?" rows={3} />
              <button disabled={loading}>{loading ? "Création..." : "Créer le projet"} <span>→</span></button>
            </form>
            {error && <p className="error">{error}</p>}
          </section>

          <section className="panel project-panel">
            <div className="panel-heading"><div><h3>Projets récents</h3><p>Vos espaces de travail locaux.</p></div><span className="icon-box">▦</span></div>
            {projects.length === 0 ? <div className="empty"><div className="empty-icon">✧</div><strong>Aucun projet pour le moment</strong><span>Créez votre premier projet pour commencer.</span></div> :
              <div className="project-list">{projects.map(project => <div className="project-row" key={project.id}><div className="project-icon">✦</div><div className="project-info"><strong>{project.name}</strong><span>{project.description || "Aucune description"}</span></div><span className="status">{project.status}</span></div>)}</div>}
          </section>
        </div>

        <div className="notice"><span>ⓘ</span><div><strong>Socle de développement initial</strong><p>Cette version intègre un compte administrateur local, une API protégée, l’import documentaire, le RAG lexical et le test des assistants. La gestion multi-utilisateur, les rôles avancés et les agents orchestrés restent à développer.</p></div></div>
        <footer>Universal AI Platform <span>·</span> Workspace redesign 0.16.0</footer>
      </section>
    </main>
  );
}
