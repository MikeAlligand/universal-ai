from fastapi import HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.modules.projects.models import Project
from app.modules.assistants.models import Assistant
from app.modules.users import User
from app.modules.organizations import OrganizationMember

READ_ROLES = {"admin", "member", "viewer"}
WRITE_ROLES = {"admin", "member"}

def project_membership(db: Session, project: Project, user: User) -> str | None:
    # Keep legacy personal projects accessible to their original owner.
    if not project.organization_id:
        return "admin" if project.owner_id == user.id else None
    return db.scalar(select(OrganizationMember.role).where(
        OrganizationMember.organization_id == project.organization_id,
        OrganizationMember.user_id == user.id,
    ))

def owned_project(db: Session, project_id: str, user: User, write: bool = False) -> Project:
    project = db.get(Project, project_id)
    role = project_membership(db, project, user) if project else None
    allowed = WRITE_ROLES if write else READ_ROLES
    if project is None or role not in allowed:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    return project

def owned_assistant(db: Session, assistant_id: str, user: User, write: bool = False) -> Assistant:
    assistant = db.get(Assistant, assistant_id)
    if assistant is None:
        raise HTTPException(status_code=404, detail="Assistant introuvable")
    owned_project(db, assistant.project_id, user, write=write)
    return assistant
