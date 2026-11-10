"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowLeft, Bot, CheckCircle2, CircleAlert, Cloud, Cpu, ExternalLink, KeyRound, RefreshCw, Settings2, ShieldCheck, Zap } from "lucide-react";

type ProviderState = { configured?: boolean; enabled?: boolean; available?: boolean; models?: string[]; error?: string; embedding_model?: string; embedding_available?: boolean };
type ProviderPayload = { mode: string; default_provider: string; providers: Record<string, ProviderState> };
const API = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000").replace(/\/+$/, "");

const PROVIDERS = [
  { id: "ollama", name: "Ollama", kind: "Local · gratuit", description: "Exécute les modèles sur la machine qui héberge le backend. Les prompts et documents ne sont pas envoyés à un fournisseur cloud.", icon: Cpu, env: "OLLAMA_BASE_URL", link: "https://ollama.com/download/mac" },
  { id: "openai", name: "OpenAI", kind: "Cloud · API", description: "Modèles GPT via une clé API configurée côté backend.", icon: Cloud, env: "OPENAI_API_KEY", link: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Anthropic", kind: "Cloud · API", description: "Modèles Claude via une clé API configurée côté backend.", icon: Cloud, env: "ANTHROPIC_API_KEY", link: "https://console.anthropic.com/settings/keys" },
  { id: "mistral", name: "Mistral AI", kind: "Cloud · API", description: "Modèles Mistral via une clé API configurée côté backend.", icon: Cloud, env: "MISTRAL_API_KEY", link: "https://console.mistral.ai/api-keys/" },
] as const;

export default function ProviderSettingsPage() {
  const [data, setData] = useState<ProviderPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`${API}/system/providers`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Impossible de lire l'état des fournisseurs (${response.status}).`);
      setData(await response.json()); setLastChecked(new Date());
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur de connexion au backend."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const ollama = data?.providers?.ollama;

  return <main className="shell uai-provider-settings">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a>
      <div className="nav-label">ESPACE DE TRAVAIL</div>
      <a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a>
      <a className="nav-item" href="/projects">▦ <span>Mes projets</span></a>
      <a className="nav-item" href="/assistants">◇ <span>Assistants IA</span></a>
      <a className="nav-item active" href="/settings/providers">⚡ <span>Fournisseurs IA</span></a>
      <div className="sidebar-bottom"><span className="avatar">U</span><div><strong>Universal AI Platform</strong><small>Environnement local</small></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><span>Workspace <span className="crumb-separator">/</span> Paramètres <span className="crumb-separator">/</span> Fournisseurs IA</span><span className="local-pill"><i/> Environnement local</span></header>
      <div className="projects-hero"><div><a className="back-link" href="/assistants"><ArrowLeft size={14}/> Retour aux assistants</a><p className="eyebrow">CONFIGURATION DES MODÈLES</p><h1>Fournisseurs IA</h1><p className="subtitle">Surveillez les connexions et choisissez le moteur adapté à chaque assistant.</p></div><div className="projects-hero-mark"><Zap size={30}/></div></div>
      {error && <p className="error detail-alert" role="alert">{error}</p>}
      <section className="uai-provider-overview">
        <div><span className="uai-provider-overview-icon"><Activity size={18}/></span><div><small>Mode global du backend</small><strong>{data?.mode ?? "—"}</strong></div></div>
        <div><span className="uai-provider-overview-icon"><Bot size={18}/></span><div><small>Fournisseur par défaut</small><strong>{data?.default_provider ?? "—"}</strong></div></div>
        <button className="secondary-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={14} className={loading ? "uai-spin" : ""}/> Actualiser</button>
      </section>
      <div className="uai-provider-heading"><div><h2>Connexions disponibles</h2><p>Les clés API ne sont jamais affichées dans cette interface.</p></div><small>{lastChecked ? `Vérifié à ${lastChecked.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : "En attente de vérification"}</small></div>
      <div className="uai-provider-grid">
        {PROVIDERS.map(provider => {
          const state = data?.providers?.[provider.id] ?? {};
          const ready = provider.id === "ollama" ? !!state.available : !!state.configured;
          const Icon = provider.icon;
          return <article className="panel uai-provider-card" key={provider.id}>
            <div className="uai-provider-card-top"><span className="uai-provider-card-icon"><Icon size={20}/></span><span className={`uai-provider-state ${ready ? "ready" : "pending"}`}><i/>{loading ? "Vérification…" : ready ? (provider.id === "ollama" ? "Connecté" : "Clé configurée") : "Non configuré"}</span></div>
            <div className="uai-provider-card-title"><h3>{provider.name}</h3><small>{provider.kind}</small></div>
            <p>{provider.description}</p>
            {provider.id === "ollama" ? <>
              {state.error && <p className="uai-provider-warning"><CircleAlert size={14}/>{state.error}</p>}
              <div className="uai-provider-detail"><span>Modèles installés</span><strong>{state.models?.length ?? 0}</strong></div>
              {state.models?.length ? <div className="uai-model-chips">{state.models.map(model => <span key={model}>{model}</span>)}</div> : <p className="uai-provider-hint">Téléchargez un modèle avec <code>ollama pull qwen2.5:3b</code>.</p>}
              <div className="uai-provider-detail"><span>Modèle d&apos;embeddings RAG</span><strong>{state.embedding_available ? "Disponible" : "À installer"}</strong></div>
              <p className="uai-provider-hint">{state.embedding_model ?? "nomic-embed-text"} · <code>ollama pull nomic-embed-text</code></p>
            </> : <>
              <div className="uai-provider-detail"><span>Variable d&apos;environnement</span><strong>{provider.env}</strong></div>
              <p className="uai-provider-hint">À renseigner dans <code>backend/.env</code>. La valeur reste uniquement côté serveur.</p>
            </>}
            <a className="uai-provider-doc" href={provider.link} target="_blank" rel="noreferrer">{provider.id === "ollama" ? "Télécharger / documentation" : "Gérer la clé API"}<ExternalLink size={13}/></a>
          </article>;
        })}
      </div>
      <section className="panel uai-provider-security"><span><ShieldCheck size={20}/></span><div><strong>Sécurité des identifiants</strong><p>Les clés cloud doivent être stockées dans le fichier d&apos;environnement du backend ou dans un gestionnaire de secrets en production. Ne les saisissez jamais dans un prompt, dans le frontend ou dans un dépôt Git.</p></div><KeyRound size={18}/></section>
      <footer>Universal AI Platform <span>·</span> Centre de contrôle des fournisseurs</footer>
    </section>
  </main>;
}
