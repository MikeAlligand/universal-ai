"use client";

import { apiFetch } from "@/lib/api";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Activity, ArrowUp, Bot, Check, ChevronDown, CircleHelp, Command, FileText, FolderKanban, LayoutDashboard, MessageSquare, MoreHorizontal, Plus, Search, Settings2, Sparkles, Workflow, Zap } from "lucide-react";

type Assistant = { id: string; project_id: string; name: string; description: string; role: string; provider: string; model: string; system_prompt: string; temperature: number; source_ids: string[] };
type Conversation = { id: string; assistant_id: string; title: string; created_at: string; updated_at: string };
type Message = { id: string; conversation_id: string; role: "user" | "assistant"; content: string; provider: string; model: string; created_at: string };
type ChatResult = { conversation: Conversation; user_message: Message; assistant_message: Message; mode: string };
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function AssistantChatPage() {
  const params = useParams<{ id: string; assistantId: string }>();
  const projectId = params.id, assistantId = params.assistantId;
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true), [sending, setSending] = useState(false);
  const [error, setError] = useState(""), [mode, setMode] = useState("mock"), [filter, setFilter] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null), bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const r = await apiFetch(`${API}/api/v1/assistants/${assistantId}/conversations`, { cache: "no-store" });
    if (!r.ok) throw new Error("Impossible de charger les conversations.");
    setConversations(await r.json());
  }, [assistantId]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError("");
      try {
        const [ar, cr] = await Promise.all([
          apiFetch(`${API}/api/v1/assistants/${assistantId}`, { cache: "no-store" }),
          apiFetch(`${API}/api/v1/assistants/${assistantId}/conversations`, { cache: "no-store" })
        ]);
        if (!ar.ok) throw new Error("Assistant introuvable.");
        if (!cr.ok) throw new Error("Impossible de charger les conversations.");
        const a: Assistant = await ar.json(), cs: Conversation[] = await cr.json();
        if (!active) return;
        setAssistant(a); setConversations(cs);
        if (cs.length) {
          setConversationId(cs[0].id);
          const mr = await apiFetch(`${API}/api/v1/conversations/${cs[0].id}/messages`, { cache: "no-store" });
          if (!mr.ok) throw new Error("Impossible de charger les messages.");
          if (active) setMessages(await mr.json());
        } else { setConversationId(null); setMessages([]); }
      } catch (e) { if (active) setError(e instanceof Error ? e.message : "Une erreur est survenue."); }
      finally { if (active) setLoading(false); }
    }
    if (assistantId) void load();
    return () => { active = false; };
  }, [assistantId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  async function selectConversation(id: string) {
    setError(""); setConversationId(id);
    try {
      const r = await apiFetch(`${API}/api/v1/conversations/${id}/messages`, { cache: "no-store" });
      if (!r.ok) throw new Error("Impossible de charger cette conversation.");
      setMessages(await r.json());
    } catch (e) { setError(e instanceof Error ? e.message : "Une erreur est survenue."); }
  }
  function newConversation() { setConversationId(null); setMessages([]); setDraft(""); setError(""); textareaRef.current?.focus(); }

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || sending || loading) return;
    setSending(true); setError(""); setDraft("");
    try {
      const r = await apiFetch(`${API}/api/v1/assistants/${assistantId}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, conversation_id: conversationId })
      });
      const body = await r.json().catch(() => null);
      if (!r.ok) throw new Error(body?.detail ?? `L'envoi a échoué (${r.status}).`);
      const result: ChatResult = body;
      setConversationId(result.conversation.id);
      setMessages(current => [...current, result.user_message, result.assistant_message]);
      setMode(result.mode || "mock");
      await loadConversations();
    } catch (e) { setDraft(content); setError(e instanceof Error ? e.message : "Une erreur est survenue."); }
    finally { setSending(false); }
  }
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); }
  }
  const filtered = conversations.filter(c => c.title.toLowerCase().includes(filter.toLowerCase()));
  const ideas = [
    ["✦", "Présente-toi", "Bonjour, présente-toi et explique-moi ce que tu peux faire."],
    ["⌘", "Explorer les possibilités", "Quelles sont les fonctionnalités que je peux tester ?"],
    ["↗", "M'aider à démarrer", "Aide-moi à structurer mon prochain projet."]
  ];

  return <main className="uai-shell">
    <aside className="uai-sidebar">
      <a className="uai-brand" href="/"><span className="uai-brand-mark"><Sparkles size={19}/></span><span>UNIVERSAL<span className="uai-brand-ai">AI</span><small>PLATFORM</small></span><ChevronDown size={14}/></a>
      <div className="uai-workspace-switch"><span className="uai-workspace-avatar">U</span><span><strong>Mon espace de travail</strong><small>Environnement local</small></span><MoreHorizontal size={17}/></div>
      <div className="uai-side-label">ESPACE DE TRAVAIL</div>
      <nav className="uai-nav">
        <a href="/" className="uai-nav-item"><LayoutDashboard size={17}/>Vue d’ensemble</a>
        <a href="/projects" className="uai-nav-item active"><FolderKanban size={17}/>Projets</a>
        <a href="/assistants" className="uai-nav-item"><Bot size={17}/>Assistants IA</a>
        <a href="/settings/providers" className="uai-nav-item"><Zap size={17}/>Fournisseurs IA</a>
        <span className="uai-nav-item muted"><FileText size={17}/>Sources de connaissance <small>À venir</small></span>
        <span className="uai-nav-item muted"><Workflow size={17}/>Agents & workflows <small>À venir</small></span>
      </nav>
      <div className="uai-sidebar-fill"/>
      <div className="uai-side-label">AIDE & PRÉFÉRENCES</div>
      <a className="uai-nav-item" href="/settings/providers"><Settings2 size={17}/>Fournisseurs IA</a>
      <span className="uai-nav-item muted"><CircleHelp size={17}/>Centre d’aide</span>
      <div className="uai-profile"><span className="uai-profile-avatar">D</span><span><strong>Développement local</strong><small>Plan de démonstration</small></span><MoreHorizontal size={16}/></div>
    </aside>

    <section className="uai-main">
      <header className="uai-topbar">
        <div className="uai-breadcrumb"><a href="/projects">Projets</a><span>/</span><a href={`/projects/${projectId}/assistants`}>Assistants</a><span>/</span><strong>{assistant?.name ?? "Conversation"}</strong></div>
        <div className="uai-top-actions"><span className="uai-env"><i/>Environnement local</span><button className="uai-top-icon" aria-label="Activité"><Activity size={17}/></button><span className="uai-user-avatar">D</span></div>
      </header>

      <div className="uai-workspace">
        <aside className="uai-history">
          <div className="uai-history-heading"><div><span className="uai-kicker">VOTRE ESPACE</span><h2>Conversations</h2></div><button className="uai-add" onClick={newConversation} aria-label="Nouvelle conversation"><Plus size={18}/></button></div>
          <label className="uai-search"><Search size={15}/><input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Rechercher"/></label>
          <button className="uai-new-chat" onClick={newConversation}><Plus size={16}/>Nouvelle conversation</button>
          <div className="uai-history-label">RÉCENTES <span>{filtered.length}</span></div>
          <div className="uai-history-list">
            {filtered.map(c => <button key={c.id} className={`uai-history-entry ${conversationId === c.id ? "selected" : ""}`} onClick={() => void selectConversation(c.id)}><MessageSquare size={15}/><span>{c.title || "Nouvelle conversation"}</span><MoreHorizontal size={15}/></button>)}
            {!filtered.length && <p className="uai-history-empty">{filter ? "Aucun résultat." : "Vos conversations apparaîtront ici."}</p>}
          </div>
          <div className="uai-tip"><span><Zap size={15}/></span><strong>Un espace, plusieurs intelligences.</strong><p>Centralisez vos assistants et vos futurs workflows au même endroit.</p></div>
        </aside>

        <section className="uai-chat">
          <div className="uai-assistant-bar"><div className="uai-assistant-info"><span className="uai-assistant-icon"><Bot size={20}/></span><span><strong>{assistant?.name ?? "Assistant IA"}</strong><small>{assistant?.role || "Assistant de votre projet"} · {assistant?.provider ?? "mock"} / {assistant?.model ?? "demo"} · {(assistant?.source_ids??[]).length} source(s) RAG</small></span></div><div className="uai-assistant-status"><i className={mode === "cloud" || mode === "local" ? "cloud" : ""}/>{mode === "cloud" ? "Fournisseur cloud" : mode === "local" ? "IA locale connectée" : "Mode démonstration"}<button title="Configuration de l'assistant" onClick={() => window.location.href = `/projects/${projectId}/assistants/${assistantId}`}><Settings2 size={16}/></button></div></div>

          {assistant && (assistant.source_ids ?? []).length === 0 && <div className="uai-rag-warning"><FileText size={15}/><span><strong>Aucune source documentaire autorisée.</strong> Sélectionnez les documents du Knowledge Hub dans la configuration pour activer les réponses fondées sur vos fichiers.</span><a href={`/projects/${projectId}/assistants/${assistantId}`}>Configurer</a></div>}
          <div className="uai-message-area">
            {loading ? <div className="uai-welcome"><span className="uai-welcome-icon"><Sparkles size={26}/></span><h2>Préparation de votre espace…</h2></div> :
            messages.length === 0 ? <div className="uai-welcome"><span className="uai-welcome-icon"><Sparkles size={27}/></span><span className="uai-kicker">VOTRE ASSISTANT EST PRÊT</span><h1>Que souhaitez-vous<br/><em>accomplir aujourd’hui ?</em></h1><p>Commencez une conversation avec <strong>{assistant?.name ?? "votre assistant"}</strong>. Vos échanges resteront accessibles dans l’historique de votre projet.</p><div className="uai-suggestions">{ideas.map(([icon,title,body]) => <button key={title} className="uai-suggestion" onClick={() => { setDraft(body); textareaRef.current?.focus(); }}><span>{icon}</span><strong>{title}</strong><small>{body}</small></button>)}</div></div> :
            <div className="uai-message-list">{messages.map(m => <article key={m.id} className={`uai-message ${m.role}`}><span className={`uai-message-avatar ${m.role}`}>{m.role === "user" ? "D" : <Sparkles size={15}/>}</span><div className="uai-message-body"><div className="uai-message-meta"><strong>{m.role === "user" ? "Vous" : assistant?.name ?? "Assistant"}</strong><time>{new Date(m.created_at).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</time></div><div className="uai-bubble">{m.content.split("\n").map((line,i) => <p key={i}>{line || "\u00a0"}</p>)}</div></div></article>)}{sending && <article className="uai-message assistant"><span className="uai-message-avatar assistant"><Sparkles size={15}/></span><div className="uai-message-body"><div className="uai-message-meta"><strong>{assistant?.name ?? "Assistant"}</strong><span>Répond</span></div><div className="uai-typing"><i/><i/><i/></div></div></article>}<div ref={bottomRef}/></div>}
          </div>
          <div className="uai-composer-wrap">
            {error && <div className="uai-error" role="alert">{error}</div>}
            <form className="uai-composer" onSubmit={send}><textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder={`Écrivez à ${assistant?.name ?? "votre assistant"}…`} rows={2} maxLength={12000} disabled={sending || loading}/><div className="uai-composer-bottom"><span><Command size={12}/> Entrée pour envoyer · Maj + Entrée pour un saut de ligne</span><button type="submit" disabled={sending || loading || !draft.trim()} aria-label="Envoyer">{sending ? <span className="uai-spinner"/> : <ArrowUp size={19}/>}</button></div></form>
            <div className="uai-composer-note"><span><Check size={12}/>Historique sauvegardé automatiquement</span><span>{mode === "mock" ? "Mode démo · aucune API externe appelée" : mode === "local" ? "Inférence locale via Ollama" : "Inférence via fournisseur cloud"}</span></div>
          </div>
        </section>
      </div>
    </section>
  </main>;
}
