from uuid import uuid4
import secrets

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.authorization import owned_project, owned_assistant
from app.modules.users import User
from app.modules.projects.models import Project
from app.modules.assistants.models import Assistant
from app.modules.sources.models import DataSource
from app.modules.assistants.schemas import AssistantCreate, AssistantRead, AssistantUpdate

router = APIRouter()


@router.get("/projects/{project_id}/assistants", response_model=list[AssistantRead])
def list_assistants(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_project(db, project_id, user)
    statement = select(Assistant).where(Assistant.project_id == project_id).order_by(Assistant.created_at.desc())
    return list(db.scalars(statement).all())


@router.post("/projects/{project_id}/assistants", response_model=AssistantRead, status_code=status.HTTP_201_CREATED)
def create_assistant(project_id: str, payload: AssistantCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    owned_project(db, project_id, user, write=True)
    values = payload.model_dump()
    requested_sources = set(values.get("source_ids") or [])
    if requested_sources:
        valid_sources = set(db.scalars(select(DataSource.id).where(
            DataSource.project_id == project_id, DataSource.id.in_(requested_sources)
        )).all())
        if valid_sources != requested_sources:
            raise HTTPException(status_code=422, detail="Une ou plusieurs sources n'appartiennent pas à ce projet.")
    values["name"] = values["name"].strip()
    values["description"] = values["description"].strip()
    values["role"] = values["role"].strip()
    assistant = Assistant(id=str(uuid4()), project_id=project_id, **values)
    db.add(assistant)
    db.commit()
    db.refresh(assistant)
    return assistant


@router.get("/assistants/{assistant_id}", response_model=AssistantRead)
def get_assistant(assistant_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    assistant = owned_assistant(db, assistant_id, user)
    return assistant


@router.patch("/assistants/{assistant_id}", response_model=AssistantRead)
def update_assistant(assistant_id: str, payload: AssistantUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    assistant = owned_assistant(db, assistant_id, user, write=True)
    changes = payload.model_dump(exclude_unset=True)
    if "source_ids" in changes and changes["source_ids"] is not None:
        requested_sources = set(changes["source_ids"])
        valid_sources = set(db.scalars(select(DataSource.id).where(
            DataSource.project_id == assistant.project_id, DataSource.id.in_(requested_sources)
        )).all()) if requested_sources else set()
        if valid_sources != requested_sources:
            raise HTTPException(status_code=422, detail="Une ou plusieurs sources n'appartiennent pas à ce projet.")
    for field, value in changes.items():
        if value is not None:
            setattr(assistant, field, value.strip() if isinstance(value, str) and field != "system_prompt" else value)
    db.commit()
    db.refresh(assistant)
    return assistant


@router.delete("/assistants/{assistant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assistant(assistant_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    assistant = owned_assistant(db, assistant_id, user, write=True)
    db.delete(assistant)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
