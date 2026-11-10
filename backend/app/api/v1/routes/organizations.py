from datetime import datetime, timedelta, timezone
from hashlib import sha256
from secrets import token_urlsafe
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, hash_password, create_access_token
from app.modules.users import User
from app.modules.organizations import Organization, OrganizationMember, OrganizationInvitation

router = APIRouter(prefix="/organizations", tags=["organizations"])
public_invitation_router = APIRouter(prefix="/organizations/invitations", tags=["organizations"] )

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)

class InvitationCreate(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    role: str = Field(default="member", pattern="^(member|viewer)$")

class MemberRoleUpdate(BaseModel):
    role: str = Field(pattern="^(admin|member|viewer)$")

class InvitationAccept(BaseModel):
    token: str = Field(min_length=20, max_length=200)
    password: str = Field(min_length=12, max_length=256)


def _membership(db: Session, org_id: str, user: User) -> OrganizationMember:
    member = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == user.id))
    if member is None:
        raise HTTPException(404, "Organisation introuvable")
    return member

@router.get("")
def list_organizations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.execute(select(Organization, OrganizationMember.role).join(OrganizationMember, OrganizationMember.organization_id == Organization.id).where(OrganizationMember.user_id == user.id)).all()
    return [{"id": org.id, "name": org.name, "role": role, "created_at": org.created_at} for org, role in rows]

@router.post("", status_code=201)
def create_organization(payload: OrganizationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    org = Organization(id=str(uuid4()), name=payload.name.strip(), created_by=user.id)
    db.add(org)
    db.flush()
    db.add(OrganizationMember(id=str(uuid4()), organization_id=org.id, user_id=user.id, role="admin"))
    db.commit()
    return {"id": org.id, "name": org.name, "role": "admin", "created_at": org.created_at}

@router.get("/{org_id}/members")
def list_members(org_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    _membership(db, org_id, user)
    rows = db.execute(select(OrganizationMember, User.email).join(User, User.id == OrganizationMember.user_id).where(OrganizationMember.organization_id == org_id)).all()
    return [{"user_id": m.user_id, "email": email, "role": m.role, "joined_at": m.joined_at} for m, email in rows]


@router.patch("/{org_id}/members/{member_user_id}")
def update_member_role(org_id: str, member_user_id: str, payload: MemberRoleUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    actor = _membership(db, org_id, user)
    if actor.role != "admin":
        raise HTTPException(403, "Seul un administrateur peut modifier les rôles")
    target = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == member_user_id))
    if target is None:
        raise HTTPException(404, "Membre introuvable")
    if target.role == "admin" and payload.role != "admin":
        admin_count = db.query(OrganizationMember).filter(OrganizationMember.organization_id == org_id, OrganizationMember.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(409, "L'organisation doit conserver au moins un administrateur")
    target.role = payload.role
    db.commit()
    return {"user_id": target.user_id, "role": target.role}

@router.delete("/{org_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(org_id: str, member_user_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    actor = _membership(db, org_id, user)
    if actor.role != "admin" and user.id != member_user_id:
        raise HTTPException(403, "Seul un administrateur peut retirer un autre membre")
    target = db.scalar(select(OrganizationMember).where(OrganizationMember.organization_id == org_id, OrganizationMember.user_id == member_user_id))
    if target is None:
        raise HTTPException(404, "Membre introuvable")
    if target.role == "admin":
        admin_count = db.query(OrganizationMember).filter(OrganizationMember.organization_id == org_id, OrganizationMember.role == "admin").count()
        if admin_count <= 1:
            raise HTTPException(409, "Transférez le rôle administrateur avant de quitter l'organisation")
    db.delete(target)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{org_id}/invitations", status_code=201)
def create_invitation(org_id: str, payload: InvitationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    member = _membership(db, org_id, user)
    if member.role != "admin":
        raise HTTPException(403, "Seul un administrateur peut inviter des membres")
    email = payload.email.strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(422, "Adresse e-mail invalide")
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(409, "Un compte utilise déjà cette adresse e-mail")
    pending = db.scalar(select(OrganizationInvitation).where(OrganizationInvitation.organization_id == org_id, OrganizationInvitation.email == email, OrganizationInvitation.accepted_at.is_(None), OrganizationInvitation.expires_at > datetime.now(timezone.utc)))
    if pending:
        raise HTTPException(409, "Une invitation valide existe déjà")
    raw_token = token_urlsafe(32)
    invitation = OrganizationInvitation(id=str(uuid4()), organization_id=org_id, email=email, role=payload.role, token_hash=sha256(raw_token.encode()).hexdigest(), invited_by=user.id, expires_at=datetime.now(timezone.utc) + timedelta(days=7))
    db.add(invitation)
    db.commit()
    # Token is returned once for local/manual delivery; production email delivery comes later.
    return {"id": invitation.id, "email": email, "role": invitation.role, "expires_at": invitation.expires_at, "invitation_token": raw_token}

@public_invitation_router.post("/accept", status_code=201)
def accept_invitation(payload: InvitationAccept, db: Session = Depends(get_db)):
    digest = sha256(payload.token.encode()).hexdigest()
    invitation = db.scalar(select(OrganizationInvitation).where(OrganizationInvitation.token_hash == digest))
    now = datetime.now(timezone.utc)
    if invitation is None or invitation.accepted_at is not None or invitation.expires_at.replace(tzinfo=timezone.utc) <= now:
        raise HTTPException(400, "Invitation invalide ou expirée")
    if db.scalar(select(User).where(User.email == invitation.email)):
        raise HTTPException(409, "Un compte existe déjà pour cette adresse")
    user = User(id=str(uuid4()), email=invitation.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()
    db.add(OrganizationMember(id=str(uuid4()), organization_id=invitation.organization_id, user_id=user.id, role=invitation.role))
    invitation.accepted_at = now
    db.commit()
    return {"access_token": create_access_token(user.id), "token_type": "bearer", "email": user.email, "organization_id": invitation.organization_id, "role": invitation.role}
