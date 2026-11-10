"""Universal AI Platform minimal, extensible API."""
from __future__ import annotations
import hashlib, hmac, json, os, secrets, time
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Field, Session, create_engine, select
import httpx

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./universal_ai.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SECRET = os.getenv("APP_SECRET", "local-development-secret-change-me")
app = FastAPI(title="Universal AI Platform", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS","http://localhost:3000").split(","), allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int = Field(index=True)
    name: str
class Assistant(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    project_id: int = Field(index=True)
    name: str
    system_prompt: str = "You are a helpful assistant."
    provider: str = "mock"
    model: str = "mock"
class Document(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assistant_id: int = Field(index=True)
    name: str
    text: str
class Deployment(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    assistant_id: int = Field(index=True)
    slug: str = Field(index=True, unique=True)
    access: str = "public"
    invite_code: str = ""
    identity_secret: str = ""

def init_db():
    SQLModel.metadata.create_all(engine)
init_db()
def db():
    with Session(engine) as session: yield session

def token_for(user_id: int, expires: int) -> str:
    payload=f"{user_id}.{expires}"
    sig=hmac.new(SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return payload+"."+sig
def current_user(authorization: str|None=Header(default=None), session: Session=Depends(db)):
    if not authorization or not authorization.startswith("Bearer "): raise HTTPException(401,"Bearer token required")
    try:
        uid, exp, sig=authorization[7:].split(".")
        payload=f"{uid}.{exp}"
        if int(exp)<int(time.time()) or not hmac.compare_digest(sig,hmac.new(SECRET.encode(),payload.encode(),hashlib.sha256).hexdigest()): raise ValueError()
        user=session.get(User,int(uid))
        if not user: raise ValueError()
        return user
    except Exception: raise HTTPException(401,"Invalid or expired token")

@app.get("/health")
def health(): return {"status":"ok"}
@app.post("/auth/register")
def register(email: str, session: Session=Depends(db)):
    email=email.strip().lower()
    if "@" not in email: raise HTTPException(422,"Valid email required")
    if session.exec(select(User).where(User.email==email)).first(): raise HTTPException(409,"Email already registered")
    user=User(email=email); session.add(user); session.commit(); session.refresh(user)
    return {"user_id":user.id,"access_token":token_for(user.id,int(time.time())+86400),"token_type":"bearer"}
@app.post("/projects")
def create_project(name: str, user: User=Depends(current_user), session: Session=Depends(db)):
    p=Project(name=name.strip(),owner_id=user.id); session.add(p); session.commit(); session.refresh(p); return p
@app.get("/projects")
def projects(user: User=Depends(current_user), session: Session=Depends(db)):
    return session.exec(select(Project).where(Project.owner_id==user.id)).all()
def owned_assistant(aid:int,user:User,session:Session):
    a=session.get(Assistant,aid); p=session.get(Project,a.project_id) if a else None
    if not a or not p or p.owner_id!=user.id: raise HTTPException(404,"Assistant not found")
    return a
@app.post("/projects/{project_id}/assistants")
def create_assistant(project_id:int,name:str,system_prompt:str="You are a helpful assistant.",provider:str="mock",model:str="mock",user:User=Depends(current_user),session:Session=Depends(db)):
    p=session.get(Project,project_id)
    if not p or p.owner_id!=user.id: raise HTTPException(404,"Project not found")
    a=Assistant(project_id=project_id,name=name,system_prompt=system_prompt,provider=provider,model=model); session.add(a); session.commit(); session.refresh(a); return a
@app.get("/projects/{project_id}/assistants")
def assistants(project_id:int,user:User=Depends(current_user),session:Session=Depends(db)):
    p=session.get(Project,project_id)
    if not p or p.owner_id!=user.id: raise HTTPException(404,"Project not found")
    return session.exec(select(Assistant).where(Assistant.project_id==project_id)).all()
@app.post("/assistants/{assistant_id}/documents")
async def upload_document(assistant_id:int,file:UploadFile=File(...),user:User=Depends(current_user),session:Session=Depends(db)):
    owned_assistant(assistant_id,user,session)
    if file.size and file.size>2_000_000: raise HTTPException(413,"Document exceeds 2 MB")
    if file.filename and not file.filename.lower().endswith((".txt",".md",".csv")): raise HTTPException(415,"Only text, Markdown, and CSV files are supported")
    content=(await file.read(2_000_001)).decode("utf-8",errors="replace")
    if len(content)>2_000_000: raise HTTPException(413,"Document exceeds 2 MB")
    d=Document(assistant_id=assistant_id,name=file.filename or "document",text=content); session.add(d); session.commit(); session.refresh(d); return {"id":d.id,"name":d.name,"characters":len(content)}
def retrieve(question:str, docs:list[Document]):
    terms=set(question.lower().split())
    ranked=sorted(docs,key=lambda d:sum(d.text.lower().count(t) for t in terms),reverse=True)
    chunks=[]
    for d in ranked[:3]:
        chunks.extend([f"[{d.name}] {d.text[i:i+1200]}" for i in range(0,len(d.text),1200)][:2])
    return "\n".join(chunks)
async def answer(a:Assistant, question:str, context:str):
    if a.provider=="openai":
        key=os.getenv("OPENAI_API_KEY")
        if not key: raise HTTPException(503,"OPENAI_API_KEY is not configured")
        async with httpx.AsyncClient(timeout=45) as client:
            r=await client.post(os.getenv("OPENAI_BASE_URL","https://api.openai.com/v1")+"/chat/completions",headers={"Authorization":f"Bearer {key}"},json={"model":a.model,"messages":[{"role":"system","content":a.system_prompt+"\nUse this retrieved context when relevant:\n"+context},{"role":"user","content":question}]})
            if r.is_error: raise HTTPException(502,"AI provider request failed")
            return r.json()["choices"][0]["message"]["content"]
    return (f"Réponse de démonstration. Question : {question}\n\n" + (f"Contexte retrouvé :\n{context[:1800]}" if context else "Aucun document pertinent n'est indexé. Configurez un fournisseur pour des réponses génératives."))
@app.post("/assistants/{assistant_id}/chat")
async def chat(assistant_id:int,payload:dict,user:User=Depends(current_user),session:Session=Depends(db)):
    a=owned_assistant(assistant_id,user,session); q=str(payload.get("message","")).strip()
    if not q: raise HTTPException(422,"message is required")
    docs=session.exec(select(Document).where(Document.assistant_id==assistant_id)).all()
    return {"answer":await answer(a,q,retrieve(q,docs))}
@app.post("/assistants/{assistant_id}/deployments")
def deploy(assistant_id:int,access:str="public",user:User=Depends(current_user),session:Session=Depends(db)):
    owned_assistant(assistant_id,user,session)
    if access not in {"public","authenticated","invitation","signed"}: raise HTTPException(422,"Unsupported access mode")
    d=Deployment(assistant_id=assistant_id,slug=secrets.token_urlsafe(9),access=access,invite_code=secrets.token_urlsafe(16) if access=="invitation" else "",identity_secret=secrets.token_urlsafe(32) if access=="signed" else "")
    session.add(d); session.commit(); session.refresh(d)
    result={"slug":d.slug,"url":f"/b/{d.slug}","access":d.access}
    if d.invite_code: result["invite_code"]=d.invite_code
    if d.identity_secret: result["identity_secret"]=d.identity_secret
    return result
@app.post("/b/{slug}/chat")
async def deployed_chat(slug:str,payload:dict,x_invite_code:str|None=Header(default=None),x_identity:str|None=Header(default=None),x_signature:str|None=Header(default=None),authorization:str|None=Header(default=None),session:Session=Depends(db)):
    d=session.exec(select(Deployment).where(Deployment.slug==slug)).first()
    if not d: raise HTTPException(404,"Deployment not found")
    if d.access=="authenticated" and not authorization: raise HTTPException(401,"Authentication required")
    if d.access=="invitation" and not hmac.compare_digest(x_invite_code or "",d.invite_code): raise HTTPException(403,"Valid invitation required")
    if d.access=="signed":
        if not x_identity or not x_signature or not hmac.compare_digest(x_signature,hmac.new(d.identity_secret.encode(),x_identity.encode(),hashlib.sha256).hexdigest()): raise HTTPException(403,"Valid signed identity required")
    a=session.get(Assistant,d.assistant_id); docs=session.exec(select(Document).where(Document.assistant_id==a.id)).all()
    return {"answer":await answer(a,str(payload.get("message","")),retrieve(str(payload.get("message","")),docs))}
@app.post("/assistants/{assistant_id}/workflows/run")
async def run_workflow(assistant_id:int,payload:dict,user:User=Depends(current_user),session:Session=Depends(db)):
    a=owned_assistant(assistant_id,user,session); steps=payload.get("steps",[])
    if len(steps)>10: raise HTTPException(422,"At most 10 steps")
    output=str(payload.get("input",""))
    for step in steps:
        if step.get("type")=="prompt": output=(await answer(a,str(step.get("template","")),output))[:4000]
        elif step.get("type")=="uppercase": output=output.upper()
        elif step.get("type")=="append": output+=str(step.get("value",""))
        else: raise HTTPException(422,"Unknown workflow step")
    return {"output":output,"steps_executed":len(steps)}
@app.get("/b/{slug}")
def bot_page(slug:str,session:Session=Depends(db)):
    d=session.exec(select(Deployment).where(Deployment.slug==slug)).first()
    if not d: raise HTTPException(404,"Deployment not found")
    return {"assistant_id":d.assistant_id,"slug":d.slug,"access":d.access}
