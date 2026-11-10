"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Activity, Bot, ChevronRight, CircleCheck, FolderKanban, Search, Sparkles, Zap } from "lucide-react";

type Project = { id: string; name: string; description?: string };
type Assistant = { id: string; project_id: string; name: string; description: string; role: string; mission: string; responsibilities: string[]; deliverables: string[]; provider: string; model: string; status: string };
type ProviderStatus = { mode: string; providers: { ollama: { available: boolean; models: string[]; error?: string } } };
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function GlobalAssistantsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [providerStatus, setProviderStatus] = useState<ProviderStatus | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const [projectResponse, providerResponse] = await Promise.all([
          apiFetch("/api/v1/projects", { cache: "no-store" }),
          fetch(`${API}/system/providers`, { cache: "no-store" }).catch(() => null),
        ]);
        if (!projectResponse.ok) throw new Error("Impossible de charger les projets.");
        const projectList: Project[] = await projectResponse.json();
        const all = await Promise.all(projectList.map(async project => {
          const response = await apiFetch(`/api/v1/projects/${project.id}/assistants`, { cache: "no-store" });
          if (!response.ok) throw new Error(`Impossible de charger les assistants du projet ${project.name}.`);
          const items: Assistant[] = await response.json();
          return items.map(item => ({ ...item, project_id: project.id }));
        }));
        const providerData = providerResponse?.ok ? await providerResponse.json() : null;
        if (active) { setProjects(projectList); setAssistants(all.flat()); setProviderStatus(providerData); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Erreur de chargement."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => assistants.filter(item => `${item.name} ${item.description} ${item.role}`.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr"))), [assistants, search]);
  const projectName = (id: string) => projects.find(project => project.id === id)?.name ?? "Projet";
  const ollama = providerStatus?.providers?.ollama;

  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a>
      <div className="nav-label">ESPACE DE TRAVAIL</div>
      <a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a>
      <a className="nav-item" href="/projects">▦ <span>Mes projets</span></a>
      <a className="nav-item active" href="/assistants" aria-current="page">◇ <span>Assistants IA</span></a>
      <a className="nav-item" href="/settings/providers">⚡ <span>Fournisseurs IA</span></a>
      <span className="nav-item disabled">▤ <span>Sources de données</span></span>
      <a className="nav-item" href="/orchestra">◎ <span>Agent Orchestra</span></a>
      <div className="sidebar-bottom"><span className="avatar">U</span><div><strong>Universal AI Platform</strong><small>Environnement local</small></div></div>
    </aside>
    <section className="content uai-global-assistants">
      <header className="topbar"><span>Workspace <span className="crumb-separator">/</span> Assistants IA</span><span className="local-pill"><i/> Environnement local</span></header>
      <div className="projects-hero"><div><p className="eyebrow">CENTRE DE PILOTAGE IA</p><h1>Assistants IA</h1><p className="subtitle">Retrouvez, configurez et testez vos assistants, tous projets confondus.</p></div><div className="projects-hero-mark"><Sparkles size={30}/></div></div>
      <div className="assistant-summary">
        <div className="summary-card"><span className="summary-icon"><Bot size={18}/></span><div><small>Assistants configurés</small><strong>{assistants.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon"><FolderKanban size={18}/></span><div><small>Projets</small><strong>{projects.length}</strong></div></div>
        <div className="summary-card"><span className="summary-icon"><Activity size={18}/></span><div><small>IA locale Ollama</small><strong>{ollama?.available ? "Connectée" : "Non connectée"}</strong></div></div>
      </div>
      <section className={`uai-provider-banner ${ollama?.available ? "is-ready" : "is-offline"}`}>
        <div className="uai-provider-symbol"><Zap size={21}/></div>
        <div className="uai-provider-copy"><strong>{ollama?.available ? "Ollama est prêt pour les tests réels" : "Activez votre moteur IA local gratuit"}</strong><p>{ollama?.available ? `${ollama.models.length} modèle(s) détecté(s) : ${ollama.models.slice(0, 4).join(", ") || "aucun modèle téléchargé"}.` : "Ollama exécute les modèles sur votre Mac. Aucun coût par requête et vos prompts restent sur votre machine."}</p></div>
        <a href="https://ollama.com/download/mac" target="_blank" rel="noreferrer">{ollama?.available ? "Documentation" : "Installer Ollama"}<ChevronRight size={15}/></a>
      </section>
      {error && <p className="error detail-alert" role="alert">{error}</p>}
      <div className="assistant-toolbar"><div><h2>Votre bibliothèque d&apos;assistants</h2><p>Les assistants restent rattachés à leur projet et à ses droits d&apos;accès.</p></div><a className="assistant-create-button" href="/projects">＋ Créer dans un projet</a></div>
      <label className="assistant-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, rôle ou description…"/></label>
      {loading ? <section className="panel detail-loading">Chargement de vos assistants…</section> : filtered.length === 0 ? <section className="panel assistant-empty"><div className="empty-icon"><Bot size={25}/></div><strong>{search ? "Aucun assistant correspondant" : "Votre espace IA est prêt à démarrer"}</strong><span>{search ? "Modifiez votre recherche." : "Créez un projet, puis ajoutez-y votre premier assistant. Vous pourrez ensuite le tester avec un vrai modèle local ou un fournisseur cloud."}</span><a className="assistant-create-button" href="/projects">Voir mes projets <ChevronRight size={15}/></a></section> : <div className="assistant-card-grid">{filtered.map(item => <article className="panel assistant-card" key={item.id}><div className="assistant-card-top"><span className="assistant-card-icon"><Bot size={19}/></span><span className="assistant-draft-status">{item.status || "Configuré"}</span></div><h3>{item.name}</h3><p className="assistant-card-description">{item.description || "Aucune description renseignée."}</p><div className="assistant-role">{item.role}</div>{item.mission && <p className="assistant-mission-preview">{item.mission}</p>}<div className="assistant-responsibility-preview">{(item.responsibilities ?? []).slice(0,3).map((task,index)=><span key={index}>✓ {task}</span>)}{!(item.responsibilities ?? []).length && <span>Responsabilités à définir dans le Studio</span>}</div>{(item.deliverables ?? []).length > 0 && <div className="assistant-deliverables">Livrables : {(item.deliverables ?? []).slice(0,2).join(" · ")}</div>}<div className="assistant-model"><span>{projectName(item.project_id)}</span><strong>{item.provider} · {item.model}</strong></div><div className="assistant-card-footer"><span>{item.provider === "ollama" ? <><CircleCheck size={13}/> IA locale</> : "Fournisseur externe"}</span><div><a className="assistant-action chat-launch-link" href={`/projects/${item.project_id}/assistants/${item.id}/chat`}>Tester</a><a className="assistant-action" href={`/projects/${item.project_id}/assistants/${item.id}`}>Configurer</a></div></div></article>)}</div>}
      <footer>Universal AI Platform <span>·</span> Assistant workspace 0.17.0</footer>
    </section>
  </main>;
}
