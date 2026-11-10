from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.authorization import owned_project
from app.modules.users import User
from app.modules.organizations import Organization, OrganizationMember
from app.modules.projects.models import Project
from app.modules.projects.schemas import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter()

def _ensure_personal_org(db: Session, user: User) -> Organization:
    membership = db.scalar(select(OrganizationMember).where(OrganizationMember.user_id == user.id).order_by(OrganizationMember.joined_at))
    if membership:
        org = db.get(Organization, membership.organization_id)
        if org:
            return org
    org = Organization(id=str(uuid4()), name="Mon espace", created_by=user.id)
    db.add(org); db.flush()
    db.add(OrganizationMember(id=str(uuid4()), organization_id=org.id, user_id=user.id, role="admin"))
    db.flush()
    return org

@router.get("", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    statement = select(Project).outerjoin(OrganizationMember, OrganizationMember.organization_id == Project.organization_id).where(
        or_((Project.organization_id.is_(None) & (Project.owner_id == user.id)), OrganizationMember.user_id == user.id)
    ).distinct().order_by(Project.created_at.desc())
    return list(db.scalars(statement).all())

@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if payload.organization_id:
        membership = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == payload.organization_id, OrganizationMember.user_id == user.id))
        if membership is None or membership.role not in {"admin", "member"}:
            raise HTTPException(404, "Organisation introuvable")
        organization = db.get(Organization, payload.organization_id)
    else:
        organization = _ensure_personal_org(db, user)
    project = Project(id=str(uuid4()), owner_id=user.id, organization_id=organization.id, name=payload.name.strip(), description=payload.description.strip())
    db.add(project); db.commit(); db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return owned_project(db, project_id, user)

@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: str, payload: ProjectUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = owned_project(db, project_id, user, write=True)
    changes = payload.model_dump(exclude_unset=True)
    for field, value in changes.items():
        if value is not None:
            setattr(project, field, value.strip() if isinstance(value, str) else value)
    db.commit(); db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    project = owned_project(db, project_id, user, write=True)
    # Only the original owner or an organization admin may delete a project.
    if project.organization_id:
        role = db.scalar(select(OrganizationMember.role).where(OrganizationMember.organization_id == project.organization_id, OrganizationMember.user_id == user.id))
        if role != "admin":
            raise HTTPException(403, "Seul un administrateur de l’organisation peut supprimer ce projet")
    elif project.owner_id != user.id:
        raise HTTPException(404, "Projet introuvable")
    db.delete(project); db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
