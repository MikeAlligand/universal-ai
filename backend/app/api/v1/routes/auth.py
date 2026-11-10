from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import create_access_token, get_current_user, register_first_user, verify_password
from app.modules.users import User

router = APIRouter()

class Credentials(BaseModel):
    email: str = Field(min_length=5, max_length=320)
    password: str = Field(min_length=12, max_length=256)

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str

@router.get("/setup-status")
def setup_status(db: Session = Depends(get_db)):
    return {"setup_required": not bool(db.scalar(select(func.count()).select_from(User)))}

@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: Credentials, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(422, "Adresse e-mail invalide")
    user = register_first_user(db, email, payload.password)
    return AuthResponse(access_token=create_access_token(user.id), email=user.email)

@router.post("/login", response_model=AuthResponse)
def login(payload: Credentials, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email.strip().lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(401, "Adresse e-mail ou mot de passe incorrect")
    return AuthResponse(access_token=create_access_token(user.id), email=user.email)

@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "created_at": user.created_at}
