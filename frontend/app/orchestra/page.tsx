"use client";
import { useEffect, useMemo, useRef, useState, type PointerEvent, type DragEvent } from "react";
import { apiFetch } from "@/lib/api";
import styles from "./orchestra.module.css";
import {
  Activity, ArrowDownRight, Bot, Braces, Check, ChevronDown, CircleHelp,
  Clock3, Cloud, Code2, Database, FileSearch, FileText, GitBranch, Globe,
  GripVertical, Layers3, Loader2, MousePointer2, Play, Plus, Save, Search,
  Settings2, Sparkles, Trash2, Webhook, Workflow, X, ZoomIn, ZoomOut
} from "lucide-react";

type Project={id:string;name:string};
type Assistant={id:string;project_id:string;name:string;role:string;mission:string;provider:string;model:string;temperature?:number;source_ids?:string[]};
type SavedWorkflow={id:string;project_id:string;name:string;assistant_ids:string[]};
type RunStep={assistant_id:string;assistant_name:string;status:string;input:string;output?:string;error?:string;provider?:string;model?:string;documents_used?:{name:string;origin?:string;passage:number}[]};
type Node={id:string;kind:"trigger"|"assistant"|"tool"|"action";x:number;y:number;assistantId?:string;title:string;subtitle:string;color:string};
const W=920,H=680;
const initialTrigger:Node={id:"trigger",kind:"trigger",x:90,y:110,title:"Webhook",subtitle:"New incoming request",color:"teal"};
const colors:Record<string,string>={teal:"#39d6b4",purple:"#9875ff",yellow:"#f3bf45",orange:"#ff875e",blue:"#55a7ff"};
export default function OrchestraPage(){
 const [projects,setProjects]=useState<Project[]>([]),[assistants,setAssistants]=useState<Assistant[]>([]);
 const [projectId,setProjectId]=useState(""),[chain,setChain]=useState<string[]>([]);
 const [name,setName]=useState("Lead qualifier"),[saved,setSaved]=useState<SavedWorkflow[]>([]);
 const [workflowId,setWorkflowId]=useState(""),[nodes,setNodes]=useState<Node[]>([initialTrigger]);
 const [selected,setSelected]=useState("trigger"),[query,setQuery]=useState(""),[message,setMessage]=useState("Analyse la demande et les documents autorisés, puis fournis une réponse structurée.");
 const [steps,setSteps]=useState<RunStep[]>([]),[finalOutput,setFinalOutput]=useState("");
 const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[running,setRunning]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState(""),[zoom,setZoom]=useState(1),[expanded,setExpanded]=useState<number[]>([]);
 const canvasRef=useRef<HTMLDivElement>(null),drag=useRef<{id:string;dx:number;dy:number}|null>(null);
 const selectedNode=nodes.find(n=>n.id===selected)||nodes[0];
 const available=useMemo(()=>assistants.filter(a=>a.project_id===projectId&&!chain.includes(a.id)),[assistants,projectId,chain]);
 const ordered=useMemo(()=>chain.map(id=>assistants.find(a=>a.id===id)).filter(Boolean) as Assistant[],[chain,assistants]);
 const activeAssistant=selectedNode?.assistantId?assistants.find(a=>a.id===selectedNode.assistantId):undefined;
 async function load(){
  setLoading(true);setError("");
  try{
   const p=await apiFetch("/api/v1/projects");if(!p.ok)throw new Error("Impossible de charger les projets.");
   const ps:Project[]=await p.json();setProjects(ps);
   const all=await Promise.all(ps.map(async x=>{const r=await apiFetch(`/api/v1/projects/${x.id}/assistants`);if(!r.ok)throw new Error("Impossible de charger les assistants.");return (await r.json()).map((a:Assistant)=>({...a,project_id:x.id}));}));
   setAssistants(all.flat());if(ps.length)setProjectId(v=>v||ps[0].id);
  }catch(e){setError(e instanceof Error?e.message:"Erreur de chargement.");}finally{setLoading(false);}
 }
 useEffect(()=>{load();},[]);
 useEffect(()=>{if(!projectId)return;(async()=>{const r=await apiFetch(`/api/v1/projects/${projectId}/workflows`);if(r.ok)setSaved(await r.json());setChain([]);setWorkflowId("");setNodes([initialTrigger]);setSelected("trigger");setSteps([]);setFinalOutput("");})();},[projectId]);
 useEffect(()=>{if(!workflowId)return;try{const raw=localStorage.getItem(`uai-orchestra-layout-${workflowId}`);if(raw){const parsed=JSON.parse(raw);if(Array.isArray(parsed)&&parsed.length)setNodes(parsed);}}catch{}},[workflowId]);
 function addAssistant(id:string,dropX?:number,dropY?:number){
  const a=assistants.find(x=>x.id===id);if(!a||chain.includes(id)||chain.length>=8)return;
  const next=[...chain,id];setChain(next);
  setNodes(v=>[...v,{id:`agent-${id}`,kind:"assistant",assistantId:id,x:dropX??(180+(next.length-1)*180),y:dropY??(260+(next.length%2?0:140)),title:a.name,subtitle:`${a.provider} / ${a.model}`,color:"purple"}]);
  setSelected(`agent-${id}`);setSteps([]);setFinalOutput("");setWorkflowId("");
 }
 function handleCanvasDrop(e:DragEvent<HTMLDivElement>){
  e.preventDefault();
  const id=e.dataTransfer.getData("application/uai-assistant");
  if(!id||!canvasRef.current)return;
  const rect=canvasRef.current.getBoundingClientRect();
  const x=Math.max(12,Math.min(W-190,(e.clientX-rect.left)/zoom));
  const y=Math.max(12,Math.min(H-100,(e.clientY-rect.top)/zoom));
  addAssistant(id,x,y);
 }
 function removeAssistant(id:string){
  setChain(v=>v.filter(x=>x!==id));setNodes(v=>v.filter(n=>n.assistantId!==id));setSelected("trigger");setWorkflowId("");setSteps([]);setFinalOutput("");
 }
 function startDrag(e:PointerEvent,id:string){
  if((e.target as HTMLElement).closest("button"))return;
  const node=nodes.find(n=>n.id===id);if(!node)return;
  const rect=canvasRef.current?.getBoundingClientRect();if(!rect)return;
  drag.current={id,dx:(e.clientX-rect.left)/zoom-node.x,dy:(e.clientY-rect.top)/zoom-node.y};
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);setSelected(id);
 }
 function moveDrag(e:PointerEvent){
  if(!drag.current||!canvasRef.current)return;
  const rect=canvasRef.current.getBoundingClientRect(),d=drag.current;
  const x=Math.max(12,Math.min(W-190,(e.clientX-rect.left)/zoom-d.dx));
  const y=Math.max(12,Math.min(H-100,(e.clientY-rect.top)/zoom-d.dy));
  setNodes(v=>v.map(n=>n.id===d.id?{...n,x,y}:n));
 }
 function stopDrag(){drag.current=null;}
 function syncAssistant(a:Assistant,field:"name"|"mission"|"model"|"provider",value:string){
  setAssistants(v=>v.map(x=>x.id===a.id?{...x,[field]:value}:x));
  setNodes(v=>v.map(n=>n.assistantId===a.id?{...n,title:field==="name"?value:n.title,subtitle:field==="model"||field==="provider"?`${field==="provider"?value:a.provider} / ${field==="model"?value:a.model}`:n.subtitle}:n));
 }
 async function save(){
  setError("");setNotice("");if(!projectId||chain.length<2){setError("Ajoute au moins deux agents pour enregistrer le workflow.");return;}
  setSaving(true);try{
   const r=await apiFetch(`/api/v1/projects/${projectId}/workflows`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,assistant_ids:chain})});
   const d=await r.json();if(!r.ok)throw new Error(d.detail||"Enregistrement impossible.");
   setWorkflowId(d.id);setSaved(v=>[d,...v]);localStorage.setItem(`uai-orchestra-layout-${d.id}`,JSON.stringify(nodes));setNotice("Workflow enregistré.");
  }catch(e){setError(e instanceof Error?e.message:"Erreur d'enregistrement.");}finally{setSaving(false);}
 }
 async function run(){
  setError("");setNotice("");setSteps([]);setFinalOutput("");if(!workflowId){setError("Enregistre le workflow avant de le tester.");return;}
  setRunning(true);try{const r=await apiFetch(`/api/v1/workflows/${workflowId}/run`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message})});const d=await r.json();setSteps(d.steps||[]);setFinalOutput(d.final_output||"");if(!r.ok)throw new Error(d.detail||"Échec du test.");if(d.status!=="completed")setError("Le workflow s'est arrêté sur une erreur.");else setNotice("Test terminé.");}catch(e){setError(e instanceof Error?e.message:"Erreur d'exécution.");}finally{setRunning(false);}
 }
 function loadSaved(w:SavedWorkflow){
  setName(w.name);setChain(w.assistant_ids);setWorkflowId(w.id);
  const built:Node[]=[initialTrigger,...w.assistant_ids.map((id,i)=>{const a=assistants.find(x=>x.id===id);return {id:`agent-${id}`,kind:"assistant" as const,assistantId:id,x:180+i*180,y:245+(i%2)*125,title:a?.name||"Agent",subtitle:`${a?.provider||""} / ${a?.model||""}`,color:"purple"};})];
  setNodes(built);setSelected(built[1]?.id||"trigger");setSteps([]);setFinalOutput("");
 }
 const filtered=available.filter(a=>`${a.name} ${a.role}`.toLowerCase().includes(query.toLowerCase()));
 return <main className={`${styles.root} shell`}><aside className="sidebar"><a className="brand" href="/"><span className="brand-mark">✦</span><span>Universal AI</span></a><div className="nav-label">ESPACE DE TRAVAIL</div><a className="nav-item" href="/">◫ <span>Vue d&apos;ensemble</span></a><a className="nav-item" href="/projects">▦ <span>Mes projets</span></a><a className="nav-item" href="/assistants">◇ <span>Assistants IA</span></a><a className="nav-item" href="/settings/providers">⚡ <span>Fournisseurs IA</span></a><a className="nav-item active" href="/orchestra">◎ <span>Agent Orchestra</span></a><div className="sidebar-bottom"><span className="avatar">U</span><div><strong>Universal AI Platform</strong><small>Environnement local</small></div></div></aside>
 <section className="content orchestra-studio-content"><header className="topbar"><span>Workspace <span className="crumb-separator">/</span> Agent Orchestra</span><span className="local-pill"><i/> Visual workflow builder</span></header>
 <div className="studio-heading"><div><p className="eyebrow">ORCHESTRATION STUDIO</p><h1>Agent Orchestra</h1></div><div className="studio-heading-actions"><button className="studio-button ghost" onClick={save} disabled={saving||chain.length<2}><Save size={14}/> Save workflow</button><button className="studio-button primary" onClick={run} disabled={running||!workflowId}>{running?<Loader2 size={14} className="spin"/>:<Play size={14}/>} Test run</button><button className="studio-button deploy" onClick={()=>setNotice("Le déploiement sera activé dans une prochaine étape.")}>Deploy</button></div></div>
 <div className="studio-meta"><label>Projet <select value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Workflow <input value={name} onChange={e=>setName(e.target.value)} maxLength={120}/></label><span>{chain.length} nodes · {chain.length+1} blocks</span></div>
 <div className="studio-frame">
  <aside className="studio-library">
   <div className="studio-library-title">NODE LIBRARY <span>+</span></div>
   <div className="studio-search"><Search size={13}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search nodes..."/></div>
   <div className="studio-group-label">TRIGGERS</div>
   <button className="studio-library-item" onClick={()=>setSelected("trigger")}><span className="node-dot teal"><Webhook size={13}/></span> Webhook <small>01</small></button>
   <button className="studio-library-item" onClick={()=>setSelected("trigger")}><span className="node-dot teal"><Clock3 size={13}/></span> Schedule <small>02</small></button>
   <div className="studio-group-label">AI AGENTS</div>
   {filtered.map(a=><button className="studio-library-item" key={a.id} draggable onDragStart={e=>e.dataTransfer.setData("application/uai-assistant",a.id)} onClick={()=>addAssistant(a.id)}><span className="node-dot purple"><Bot size={13}/></span><span className="node-item-text">{a.name}</span><Plus size={12}/></button>)}
   {filtered.length===0&&<p className="studio-empty">Aucun agent disponible</p>}
   <div className="studio-group-label">MODELS</div>
   <div className="studio-library-item muted"><span className="node-dot purple"><Sparkles size={13}/></span> Cloud / Ollama</div>
   <div className="studio-group-label">TOOLS</div>
   <div className="studio-library-item muted"><span className="node-dot yellow"><FileSearch size={13}/></span> Search documents</div>
   <div className="studio-library-item muted"><span className="node-dot yellow"><Database size={13}/></span> Postgres query</div>
   <div className="studio-library-hint"><Plus size={12}/> Drag agents to canvas or click to add</div>
  </aside>
  <section className="studio-canvas-area">
   <div className="studio-canvas-toolbar"><div><span>CANVAS</span><strong>{name || "Untitled workflow"}</strong></div><div><button onClick={()=>setZoom(z=>Math.max(.65,z-.1))} title="Zoom out"><ZoomOut size={14}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(1.4,z+.1))} title="Zoom in"><ZoomIn size={14}/></button><button onClick={()=>{setZoom(1);setNodes(v=>v.map((n,i)=>({...n,x:n.kind==="trigger"?90:180+(i-1)*180,y:n.kind==="trigger"?110:245+((i-1)%2)*125})));}} title="Fit canvas"><MousePointer2 size={14}/></button></div></div>
   <div className="studio-canvas-viewport" ref={canvasRef} onDragOver={e=>e.preventDefault()} onDrop={handleCanvasDrop}>
    <div className="studio-canvas" style={{width:W,height:H,transform:`scale(${zoom})`}}>
     <svg className="studio-edges" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {nodes.slice(1).map((n,i)=>{const prev=nodes[i];const x1=prev.x+150,y1=prev.y+66,x2=n.x,y2=n.y+34;const mid=(x1+x2)/2;return <g key={`${prev.id}-${n.id}`}><path d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} stroke="#35c9ae" strokeWidth="1.6" fill="none" opacity=".8"/><circle cx={x1} cy={y1} r="3" fill="#35c9ae"/><circle cx={x2} cy={y2} r="3" fill="#35c9ae"/></g>;})}
     </svg>
     {nodes.map(n=><article key={n.id} className={`studio-node ${n.kind} ${n.color} ${selected===n.id?"selected":""}`} style={{left:n.x,top:n.y}} onPointerDown={e=>startDrag(e,n.id)} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag} onClick={()=>setSelected(n.id)}>
      <div className="studio-node-head"><span>{n.kind==="trigger"?"TRIGGER":n.kind==="assistant"?"AI · "+(assistants.find(a=>a.id===n.assistantId)?.provider||"ASSISTANT"):"TOOL"}</span><b>{String(nodes.indexOf(n)+1).padStart(2,"0")}</b></div>
      <div className="studio-node-body"><span className={`node-dot ${n.color}`}>{n.kind==="trigger"?<Webhook size={15}/>:n.kind==="assistant"?<Bot size={15}/>:<FileSearch size={15}/>}</span><div><strong>{n.title}</strong><small>{n.kind==="assistant"?n.subtitle:n.subtitle}</small></div></div>
      {n.kind==="assistant"&&<span className="studio-node-port left"/>}<span className="studio-node-port right"/>
     </article>)}
    </div>
   </div>
   <div className="studio-canvas-footer"><span><GripVertical size={12}/> Drag to move nodes · Select to inspect</span><span>{nodes.length} nodes · Last run {steps.length? "completed":"—"}</span></div>
  </section>
  <aside className="studio-inspector">
   <div className="studio-inspector-title">INSPECTOR <span>NODE {String(nodes.indexOf(selectedNode!)+1).padStart(2,"0")}</span></div>
   {selectedNode?.kind==="assistant"&&activeAssistant?<><div className="inspector-node-title"><span className="node-dot purple"><Bot size={14}/></span><div><strong>{activeAssistant.name}</strong><small>{activeAssistant.role}</small></div></div><label className="inspector-label">SYSTEM PROMPT / MISSION<textarea value={activeAssistant.mission||""} onChange={e=>syncAssistant(activeAssistant,"mission",e.target.value)} rows={5}/></label><div className="studio-group-label">MODEL SETTINGS</div><label className="inspector-label">Provider<input value={activeAssistant.provider} onChange={e=>syncAssistant(activeAssistant,"provider",e.target.value)}/></label><label className="inspector-label">Model<input value={activeAssistant.model} onChange={e=>syncAssistant(activeAssistant,"model",e.target.value)}/></label><div className="studio-group-label">TOOLS ENABLED</div><div className="inspector-tool"><FileSearch size={13}/> Knowledge Hub <span>{(activeAssistant.source_ids||[]).length} sources</span></div><div className="inspector-tool"><Database size={13}/> Project context <span>ENABLED</span></div><button className="inspector-remove" onClick={()=>removeAssistant(activeAssistant.id)}><Trash2 size={13}/> Remove node</button></>:<><div className="inspector-node-title"><span className="node-dot teal"><Webhook size={14}/></span><div><strong>{selectedNode?.title||"Webhook"}</strong><small>Trigger · Entry point</small></div></div><div className="inspector-description">The workflow starts when a new request is received. The initial message is passed to the first AI agent.</div><div className="studio-group-label">INPUT SETTINGS</div><label className="inspector-label">Test message<textarea value={message} onChange={e=>setMessage(e.target.value)} rows={5}/></label></>}
   <div className="inspector-bottom"><div className="inspector-run-cost"><span>LAST RUN</span><strong>{steps.length?`${steps.length} steps completed`:"No runs yet"}</strong></div><button onClick={save} disabled={saving||chain.length<2}>{saving?"Saving…":"SAVE WORKFLOW"}</button></div>
  </aside>
 </div>
 {error&&<div className="workflow-alert error">{error}</div>}{notice&&<div className="workflow-alert success">{notice}</div>}
 {steps.length>0&&<section className="studio-run-results"><h2>Last run · {steps.length} steps</h2>{steps.map((s,i)=><article key={s.assistant_id}><button onClick={()=>setExpanded(v=>v.includes(i)?v.filter(x=>x!==i):[...v,i])}><strong>{s.assistant_name}</strong><span>{s.status}</span><ChevronDown size={14}/></button>{expanded.includes(i)&&<div><h4>Input</h4><pre>{s.input}</pre><h4>Output</h4><pre>{s.output||s.error}</pre>{s.documents_used?.length?<><h4>Documents retrieved</h4>{s.documents_used.map((d,j)=><p key={j}>{d.name} · passage {d.passage}</p>)}</>:null}</div>}</article>)}{finalOutput&&<pre className="studio-final-output">{finalOutput}</pre>}</section>}
 <footer>Universal AI Platform <span>·</span> Orchestra Studio</footer></section></main>
}
