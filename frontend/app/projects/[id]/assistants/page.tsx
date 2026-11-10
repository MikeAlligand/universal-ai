"use client";

import { apiFetch } from "@/lib/api";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Project = { id: string; name: string };
type Assistant = { id: string; project_id: string; name: string; description: string; role: string; mission: string; responsibilities: string[]; boundaries: string; deliverables: string[]; handoff_rules: string; configuration_mode: string; system_prompt: string; provider: string; model: string; temperature: number; status: string; created_at: string; updated_at: string };
type Draft = { name: string; description: string; role: string; mission: string; responsibilities: string[]; boundaries: string; deliverables: string[]; handoff_rules: string; configuration_mode: string; system_prompt: string; provider: string; model: string; temperature: number };
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const PROVIDERS: Record<string, { label: string; models: string[] }> = {
  openai: { label: "OpenAI", models: ["gpt-4.1-mini", "gpt-4.1", "o4-mini"] },
  anthropic: { label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3-7-sonnet-latest", "claude-3-5-haiku-latest"] },
  mistral: { label: "Mistral AI", models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"] },
  ollama: { label: "Ollama (local, gratuit)", models: ["qwen2.5:3b", "llama3.2:3b", "mistral:7b"] },
};
const defaultPrompt = "Tu es un assistant utile, précis et fiable. Réponds en français, structure tes réponses et indique clairement lorsque tu ne connais pas une information. Privilégie des réponses concises et concrètes.";
const emptyDraft: Draft = { name: "", description: "", role: "assistant", mission: "", responsibilities: [], boundaries: "", deliverables: [], handoff_rules: "", configuration_mode: "default", system_prompt: defaultPrompt, provider: "ollama", model: "qwen2.5:3b", temperature: 0.3 };

export default function AssistantsPage() {
  const { id: projectId } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [projectResponse, assistantsResponse] = await Promise.all([
        apiFetch(`${API}/api/v1/projects/${projectId}`, { cache: "no-store" }),
        apiFetch(`${API}/api/v1/projects/${projectId}/assistants`, { cache: "no-store" }),
      ]);
      if (!projectResponse.ok) throw new Error("Impossible de charger le projet.");
      if (!assistantsResponse.ok) throw new Error("Impossible de charger les assistants.");
      setProject(await projectResponse.json());
      setAssistants(await assistantsResponse.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue."); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (projectId) void load(); /* route ID */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const filtered = useMemo(() => assistants.filter(item => `${item.name} ${item.description} ${item.role}`.toLowerCase().includes(search.toLowerCase())), [assistants, search]);
  function openCreate() { setDraft(emptyDraft); setEditingId(null); setShowForm(true); setError(""); setSuccess(""); }
  function openEdit(item: Assistant) { setDraft({ name: item.name, description: item.description, role: item.role, mission: item.mission ?? "", responsibilities: item.responsibilities ?? [], boundaries: item.boundaries ?? "", deliverables: item.deliverables ?? [], handoff_rules: item.handoff_rules ?? "", configuration_mode: item.configuration_mode ?? "custom", system_prompt: item.system_prompt, provider: item.provider, model: item.model, temperature: item.temperature }); setEditingId(item.id); setShowForm(true); setError(""); setSuccess(""); }
  function changeProvider(provider: string) { setDraft(current => ({ ...current, provider, model: PROVIDERS[provider]?.models[0] ?? "" })); }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setSuccess("");
    try {
      const response = await apiFetch(editingId ? `${API}/api/v1/assistants/${editingId}` : `${API}/api/v1/projects/${projectId}/assistants`, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
      });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.detail ?? `Enregistrement impossible (${response.status}).`); }
      const saved: Assistant = await response.json();
      setAssistants(current => editingId ? current.map(item => item.id === saved.id ? saved : item) : [saved, ...current]);
      setShowForm(false); setEditingId(null); setSuccess(editingId ? "Assistant modifié." : "Assistant créé avec succès.");
    } catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue."); }
    finally { setSaving(false); }
  }
  async function remove(item: Assistant) {
    if (!window.confirm(`Supprimer l'assistant « ${item.name} » ?`)) return;
    setError(""); setSuccess("");
    try { const response = await apiFetch(`${API}/api/v1/assistants/${item.id}`, { method: "DELETE" }); if (!response.ok) throw new Error(`Suppression impossible (${response.status}).`); setAssistants(current => current.filter(value => value.id !== item.id)); setSuccess("Assistant supprimé."); }
    catch (err) { setError(err instanceof Error ? err.message : "Une erreur est survenue."); }
  }

  return <main className="shell">
    <aside className="sidebar"><a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a><div className="nav-label">ESPACE DE TRAVAIL</div><a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a><a className="nav-item active" href="/projects">▦ <span>Mes projets</span></a><a className="nav-item" href="/assistants">◇ <span>Assistants IA</span></a><a className="nav-item" href={`/projects/${projectId}/sources`}>▤ <span>Sources de données</span></a><a className="nav-item" href="/orchestra">◎ <span>Agent Orchestra</span></a><div className="sidebar-bottom"><span className="avatar">D</span><div><strong>Développement local</strong><small>Environnement de test</small></div></div></aside>
    <section className="content"><header className="topbar"><span>Workspace <span className="crumb-separator">/</span> <a className="breadcrumb-link" href="/projects">Mes projets</a> <span className="crumb-separator">/</span> <a className="breadcrumb-link" href={`/projects/${projectId}`}>{project?.name ?? "Projet"}</a> <span className="crumb-separator">/</span> Assistants IA</span><span className="local-pill"><i /> Environnement local</span></header>
      <div className="assistants-hero"><div><a className="back-link" href={`/projects/${projectId}`}>← Retour au projet</a><p className="eyebrow">CONFIGURATION · INTELLIGENCE ARTIFICIELLE</p><h1>Assistants IA</h1><p className="subtitle">Créez des assistants spécialisés et définissez leur comportement.</p></div><div className="assistants-hero-mark">✧</div></div>
      <div className="assistant-summary"><div className="summary-card"><span className="summary-icon">◇</span><div><small>Assistants configurés</small><strong>{assistants.length}</strong></div></div><div className="summary-card"><span className="summary-icon">◎</span><div><small>Fournisseurs disponibles</small><strong>4</strong></div></div><div className="summary-card"><span className="summary-icon">✦</span><div><small>Statut</small><strong>Configuration</strong></div></div></div>
      {error && <p className="error detail-alert" role="alert">{error}</p>}{success && <p className="success-message" role="status">{success}</p>}
      <div className="assistant-toolbar"><div><h2>Vos assistants</h2><p>Projet : {project?.name ?? "Chargement…"}</p></div><button className="assistant-create-button" type="button" onClick={openCreate}>＋ Créer un assistant</button></div>
      {showForm && <section className="panel assistant-form-panel"><div className="panel-heading"><div><h3>{editingId ? "Modifier l'assistant" : "Nouvel assistant"}</h3><p>Définissez son identité, ses instructions et son modèle cible.</p></div><button className="assistant-close" type="button" onClick={() => setShowForm(false)} aria-label="Fermer">×</button></div><form onSubmit={save}>
        <div className="config-mode-switch" role="group" aria-label="Mode de configuration"><button type="button" className={draft.configuration_mode === "default" ? "selected" : ""} onClick={() => setDraft(current => ({ ...current, configuration_mode: "default", system_prompt: defaultPrompt, temperature: 0.3 }))}><span>✦</span><strong>Configuration par défaut</strong><small>Un assistant prêt à tester, avec des réglages équilibrés.</small></button><button type="button" className={draft.configuration_mode === "custom" ? "selected" : ""} onClick={() => setDraft(current => ({ ...current, configuration_mode: "custom" }))}><span>⚙</span><strong>Configuration personnalisée</strong><small>Définissez finement le comportement et le modèle.</small></button></div>
        <div className="assistant-form-grid"><div><label htmlFor="assistant-name">Nom de l&apos;assistant *</label><input id="assistant-name" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required minLength={2} maxLength={120} placeholder="Ex. Assistant support client"/></div><div><label htmlFor="assistant-role">Rôle / spécialité *</label><input id="assistant-role" value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value })} required maxLength={80} placeholder="Ex. support, analyste, développeur"/></div></div>
        <label htmlFor="assistant-description">Description</label><input id="assistant-description" value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} maxLength={500} placeholder="À quoi sert cet assistant ?"/>
        <div className="assistant-responsibility-editor"><div className="panel-heading"><div><h3>Mission &amp; périmètre de responsabilité</h3><p>Définissez explicitement ce dont cet assistant est responsable.</p></div></div><label htmlFor="assistant-mission">Mission principale</label><textarea id="assistant-mission" rows={2} maxLength={2000} value={draft.mission} onChange={e => setDraft({ ...draft, mission: e.target.value })} placeholder="Ex. Analyser les documents contractuels et identifier les risques."/><label htmlFor="assistant-responsibilities">Responsabilités · une par ligne</label><textarea id="assistant-responsibilities" rows={4} value={draft.responsibilities.join("\n")} onChange={e => setDraft({ ...draft, responsibilities: e.target.value.split("\n").map(v => v.trim()).filter(Boolean).slice(0,30) })} placeholder="Analyser les clauses\nRepérer les incohérences\nCiter les passages concernés"/><label htmlFor="assistant-boundaries">Limites et exclusions</label><textarea id="assistant-boundaries" rows={2} maxLength={3000} value={draft.boundaries} onChange={e => setDraft({ ...draft, boundaries: e.target.value })} placeholder="Ex. Ne modifie jamais les documents et ne donne pas de conseil juridique définitif."/><label htmlFor="assistant-deliverables">Livrables attendus · un par ligne</label><textarea id="assistant-deliverables" rows={3} value={draft.deliverables.join("\n")} onChange={e => setDraft({ ...draft, deliverables: e.target.value.split("\n").map(v => v.trim()).filter(Boolean).slice(0,30) })} placeholder="Synthèse structurée\nListe des risques avec références"/><label htmlFor="assistant-handoff">Règles de transfert vers un autre assistant</label><textarea id="assistant-handoff" rows={2} maxLength={2000} value={draft.handoff_rules} onChange={e => setDraft({ ...draft, handoff_rules: e.target.value })} placeholder="Ex. Transférer au contrôleur qualité si une information est incertaine."/></div>
        {draft.configuration_mode === "custom" && <><label htmlFor="assistant-prompt">Instructions système</label><textarea id="assistant-prompt" rows={6} value={draft.system_prompt} onChange={e => setDraft({ ...draft, system_prompt: e.target.value })} maxLength={12000} placeholder="Décrivez le comportement, les objectifs et les limites de l'assistant…"/>
        <div className="assistant-form-grid assistant-model-grid"><div><label htmlFor="assistant-provider">Fournisseur IA</label><select id="assistant-provider" value={draft.provider} onChange={e => changeProvider(e.target.value)}>{Object.entries(PROVIDERS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></div><div><label htmlFor="assistant-model">Modèle</label><select id="assistant-model" value={draft.model} onChange={e => setDraft({ ...draft, model: e.target.value })}>{(PROVIDERS[draft.provider]?.models ?? []).map(model => <option key={model} value={model}>{model}</option>)}</select></div><div><label htmlFor="assistant-temperature">Température · {draft.temperature.toFixed(1)}</label><input id="assistant-temperature" type="range" min="0" max="2" step="0.1" value={draft.temperature} onChange={e => setDraft({ ...draft, temperature: Number(e.target.value) })}/><small className="field-hint">0 = réponses stables · 2 = réponses créatives</small></div></div>
        <p className="assistant-config-note">Ollama permet de tester un vrai modèle local sans facturation API. Les fournisseurs cloud restent disponibles avec leurs propres clés API.</p></>}
        {draft.configuration_mode === "default" && <p className="default-config-note">Les réglages recommandés sont appliqués automatiquement. Tu peux passer en mode personnalisé à tout moment.</p>}
        <div className="form-actions"><button type="submit" disabled={saving || draft.name.trim().length < 2}>{saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer l'assistant"}</button><button type="button" className="secondary-button" onClick={() => setShowForm(false)} disabled={saving}>Annuler</button></div>
      </form></section>}
      <div className="assistant-search"><span>⌕</span><input aria-label="Rechercher un assistant" placeholder="Rechercher un assistant…" value={search} onChange={e => setSearch(e.target.value)}/></div>
      {loading ? <section className="panel detail-loading">Chargement des assistants…</section> : filtered.length === 0 ? <section className="panel assistant-empty"><div className="empty-icon">✧</div><strong>{search ? "Aucun résultat" : "Aucun assistant pour le moment"}</strong><span>{search ? "Essayez un autre terme." : "Créez votre premier assistant pour commencer à configurer l'intelligence de ce projet."}</span>{!search && <button type="button" onClick={openCreate}>Créer mon premier assistant</button>}</section> : <div className="assistant-card-grid">{filtered.map(item => <article className="panel assistant-card" key={item.id}><div className="assistant-card-top"><span className="assistant-card-icon">✧</span><span className="assistant-draft-status">Brouillon</span></div><h3>{item.name}</h3><p className="assistant-card-description">{item.description || "Aucune description renseignée."}</p><div className="assistant-role">{item.role}</div>{item.mission && <p className="assistant-mission-preview">{item.mission}</p>}<div className="assistant-responsibility-preview">{(item.responsibilities ?? []).slice(0,3).map((task,index)=><span key={index}>✓ {task}</span>)}{!(item.responsibilities ?? []).length && <span>Responsabilités à définir dans le Studio</span>}</div><div className="assistant-model"><span>{item.configuration_mode === "default" ? "Configuration par défaut" : "Personnalisée"} · {PROVIDERS[item.provider]?.label ?? item.provider}</span><strong>{item.model}</strong></div><div className="assistant-card-footer"><span>Température <strong>{item.temperature.toFixed(1)}</strong></span><div><a className="assistant-action chat-launch-link" href={`/projects/${projectId}/assistants/${item.id}/chat`}>Tester</a><button type="button" className="assistant-action" onClick={() => openEdit(item)}>Modifier</button><button type="button" className="assistant-action danger-text" onClick={() => void remove(item)}>Supprimer</button></div></div></article>)}</div>}
      <footer>Universal AI Platform <span>·</span> Assistant configuration build 0.17.0</footer>
    </section></main>;
}
