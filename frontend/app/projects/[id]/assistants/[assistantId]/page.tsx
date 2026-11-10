"use client";

import { apiFetch } from "@/lib/api";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Bot, Check, SlidersHorizontal, Sparkles } from "lucide-react";

type Source = {id:string;name:string;source_type:string;status:string};
type Assistant = { mission:string; responsibilities:string[]; boundaries:string; deliverables:string[]; handoff_rules:string; source_ids:string[]; id:string; project_id:string; name:string; description:string; role:string; configuration_mode:string; system_prompt:string; provider:string; model:string; temperature:number; status:string };
const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const DEFAULT_PROMPT = "Tu es un assistant utile, précis et fiable. Réponds en français, structure tes réponses et indique clairement lorsque tu ne connais pas une information. Privilégie des réponses concises et concrètes.";
const PROVIDERS: Record<string,{label:string;models:string[]}> = {
  openai:{label:"OpenAI",models:["gpt-4.1-mini","gpt-4.1","o4-mini"]},
  anthropic:{label:"Anthropic",models:["claude-sonnet-4-20250514","claude-3-7-sonnet-latest","claude-3-5-haiku-latest"]},
  mistral:{label:"Mistral AI",models:["mistral-large-latest","mistral-small-latest","codestral-latest"]},
  ollama:{label:"Ollama (local, gratuit)",models:["qwen2.5:3b","llama3.2:3b","mistral:7b"]}
};
export default function AssistantSettingsPage(){
 const {id:projectId,assistantId}=useParams<{id:string;assistantId:string}>();
 const [item,setItem]=useState<Assistant|null>(null),[sources,setSources]=useState<Source[]>([]),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[success,setSuccess]=useState("");
 useEffect(()=>{let live=true;Promise.all([
 apiFetch(`${API}/api/v1/assistants/${assistantId}`,{cache:"no-store"}),
 apiFetch(`${API}/api/v1/projects/${projectId}/sources`,{cache:"no-store"})
]).then(async ([ar,sr])=>{if(!ar.ok)throw new Error("Assistant introuvable.");if(!sr.ok)throw new Error("Impossible de charger les sources.");return [await ar.json(),await sr.json()] as const}).then(([a,ss])=>{if(live){setItem({...a,source_ids:a.source_ids??[]});setSources(ss)}}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[assistantId,projectId]);
 function patch(values:Partial<Assistant>){setItem(current=>current?{...current,...values}:current)}
 function providerChange(provider:string){patch({provider,model:PROVIDERS[provider].models[0]})}
 async function save(e:FormEvent){e.preventDefault();if(!item)return;setSaving(true);setError("");setSuccess("");try{const r=await apiFetch(`${API}/api/v1/assistants/${assistantId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(item)});const body=await r.json().catch(()=>null);if(!r.ok)throw new Error(body?.detail??"Enregistrement impossible.");setItem(body);setSuccess("Configuration enregistrée.")}catch(e){setError(e instanceof Error?e.message:"Une erreur est survenue.")}finally{setSaving(false)}}
 return <main className="shell"><aside className="sidebar"><a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a><div className="nav-label">ESPACE DE TRAVAIL</div><a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a><a className="nav-item active" href="/projects">▦ <span>Mes projets</span></a><a className="nav-item" href="/assistants">◇ <span>Assistants IA</span></a><a className="nav-item" href="/settings/providers">⚡ <span>Fournisseurs IA</span></a><span className="nav-item disabled">▤ <span>Sources de données</span></span><a className="nav-item" href="/orchestra">◎ <span>Agent Orchestra</span></a><div className="sidebar-bottom"><span className="avatar">U</span><div><strong>Universal AI Platform</strong><small>Environnement local</small></div></div></aside>
 <section className="content"><header className="topbar"><span>Workspace <span className="crumb-separator">/</span> <a className="breadcrumb-link" href="/projects">Projets</a> <span className="crumb-separator">/</span> <a className="breadcrumb-link" href={`/projects/${projectId}/assistants`}>Assistants</a> <span className="crumb-separator">/</span> Configuration</span><span className="local-pill"><i/> Environnement local</span></header>
 <div className="assistants-hero"><div><a className="back-link" href={`/projects/${projectId}/assistants`}><ArrowLeft size={14}/> Retour aux assistants</a><p className="eyebrow">RÉGLAGES DE L&apos;ASSISTANT</p><h1>{item?.name??"Configuration"}</h1><p className="subtitle">Définissez le comportement, le niveau de personnalisation et le moteur de votre assistant.</p></div><div className="assistants-hero-mark"><SlidersHorizontal size={30}/></div></div>
 {error&&<p className="error detail-alert" role="alert">{error}</p>}{success&&<p className="success-message" role="status"><Check size={14}/> {success}</p>}
 {loading?<section className="panel">Chargement de la configuration…</section>:item&&<form className="panel assistant-form-panel settings-page-form" onSubmit={save}>
 <div className="panel-heading"><div><h3><Bot size={17}/> Identité de l&apos;assistant</h3><p>Les informations visibles par les utilisateurs.</p></div></div>
 <div className="assistant-form-grid"><div><label>Nom</label><input required minLength={2} maxLength={120} value={item.name} onChange={e=>patch({name:e.target.value})}/></div><div><label>Rôle / spécialité</label><input required value={item.role} onChange={e=>patch({role:e.target.value})}/></div></div><label>Description</label><input value={item.description} onChange={e=>patch({description:e.target.value})} maxLength={500}/>
 <div className="panel-heading settings-section-heading"><div><h3><Sparkles size={17}/> Mission &amp; responsabilités</h3><p>Le contrat de travail explicite de cet assistant.</p></div></div>
 <label>Mission principale</label><textarea rows={2} maxLength={2000} value={item.mission??""} onChange={e=>patch({mission:e.target.value})} placeholder="Quelle mission doit-il accomplir ?"/>
 <label>Responsabilités · une par ligne</label><textarea rows={4} value={(item.responsibilities??[]).join("\n")} onChange={e=>patch({responsibilities:e.target.value.split("\n").map(v=>v.trim()).filter(Boolean).slice(0,30)})} placeholder="Analyser les documents\nIdentifier les risques\nCiter les sources"/>
 <label>Limites et exclusions</label><textarea rows={2} maxLength={3000} value={item.boundaries??""} onChange={e=>patch({boundaries:e.target.value})} placeholder="Ce que l'assistant ne doit jamais faire…"/>
 <label>Livrables attendus · un par ligne</label><textarea rows={3} value={(item.deliverables??[]).join("\n")} onChange={e=>patch({deliverables:e.target.value.split("\n").map(v=>v.trim()).filter(Boolean).slice(0,30)})} placeholder="Rapport structuré\nSynthèse avec références"/>
 <label>Règles de transfert</label><textarea rows={2} maxLength={2000} value={item.handoff_rules??""} onChange={e=>patch({handoff_rules:e.target.value})} placeholder="Quand et vers quel assistant transmettre le travail…"/>
 <div className="panel-heading settings-section-heading"><div><h3><Sparkles size={17}/> Niveau de configuration</h3><p>Choisissez la simplicité ou le contrôle complet.</p></div></div>
 <div className="panel-heading settings-section-heading"><div><h3><SlidersHorizontal size={17}/> Sources autorisées</h3><p>L&apos;assistant ne recherchera que dans les documents sélectionnés.</p></div></div>
 <div className="source-permission-actions">
  <span className="field-hint">{(item.source_ids??[]).length} / {sources.length} source(s) autorisée(s) pour le RAG</span>
  {sources.length>0&&<button type="button" className="secondary-button" onClick={()=>patch({source_ids:(item.source_ids??[]).length===sources.length?[]:sources.map(source=>source.id)})}>{(item.source_ids??[]).length===sources.length?"Tout désélectionner":"Tout sélectionner"}</button>}
 </div>
 <div className="source-permission-list">{sources.length===0?<p className="default-config-note">Aucune source dans ce projet. Ajoutez des documents dans le Knowledge Hub.</p>:sources.map(source=><label className="source-permission-row" key={source.id}><input type="checkbox" checked={(item.source_ids??[]).includes(source.id)} onChange={e=>patch({source_ids:e.target.checked?[...(item.source_ids??[]),source.id]:(item.source_ids??[]).filter(id=>id!==source.id)})}/><span><strong>{source.name}</strong><small>{source.source_type} · {source.status}</small></span></label>)}</div>
 <p className="default-config-note">Seules les sources cochées sont transmises au moteur de recherche documentaire. Enregistrez la configuration avant de tester l&apos;assistant.</p>

 <div className="config-mode-switch"><button type="button" className={item.configuration_mode==="default"?"selected":""} onClick={()=>patch({configuration_mode:"default",system_prompt:DEFAULT_PROMPT,temperature:.3})}><span>✦</span><strong>Par défaut</strong><small>Réglages équilibrés, prêts à l&apos;emploi.</small></button><button type="button" className={item.configuration_mode==="custom"?"selected":""} onClick={()=>patch({configuration_mode:"custom"})}><span>⚙</span><strong>Personnalisé</strong><small>Instructions, modèle et créativité ajustables.</small></button></div>
 {item.configuration_mode==="custom"&&<><label>Instructions système</label><textarea rows={7} maxLength={12000} value={item.system_prompt} onChange={e=>patch({system_prompt:e.target.value})}/></>}
 <div className="assistant-form-grid assistant-model-grid"><div><label>Fournisseur IA</label><select value={item.provider} onChange={e=>providerChange(e.target.value)}>{Object.entries(PROVIDERS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></div><div><label>Modèle</label><input list="assistant-model-options" value={item.model} onChange={e=>patch({model:e.target.value})}/><datalist id="assistant-model-options">{(PROVIDERS[item.provider]?.models??[]).map(m=><option key={m} value={m}/>)}</datalist></div><div><label>Température · {item.temperature.toFixed(1)}</label><input type="range" min="0" max="2" step=".1" value={item.temperature} onChange={e=>patch({temperature:Number(e.target.value)})}/><small className="field-hint">0 : réponses stables · 2 : réponses créatives</small></div></div>
 {item.configuration_mode==="default"&&<p className="default-config-note">Réglages simplifiés. Le fournisseur et le modèle restent sélectionnables, même en configuration par défaut.</p>}
 <div className="form-actions"><button type="submit" disabled={saving}>{saving?"Enregistrement…":"Enregistrer la configuration"}</button><a className="secondary-button" href={`/projects/${projectId}/assistants/${assistantId}/chat`}>Tester l&apos;assistant →</a></div>
 </form>}
 </section></main>
}
