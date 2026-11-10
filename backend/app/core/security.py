from datetime import datetime, timedelta, timezone
from uuid import uuid4
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.modules.users import User
from app.modules.projects.models import Project

_hasher = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError):
        return False


def create_access_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode({"sub": user_id, "iat": now, "exp": now + timedelta(hours=settings.access_token_hours)}, settings.jwt_secret, algorithm="HS256")


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer), db: Session = Depends(get_db)) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentification requise", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="Session invalide ou expirée", headers={"WWW-Authenticate": "Bearer"}) from exc
    user = db.get(User, user_id) if user_id else None
    if user is None:
        raise HTTPException(status_code=401, detail="Utilisateur introuvable", headers={"WWW-Authenticate": "Bearer"})
    return user


def register_first_user(db: Session, email: str, password: str) -> User:
    if db.scalar(select(func.count()).select_from(User)):
        raise HTTPException(status_code=403, detail="Le compte initial existe déjà. Connectez-vous.")
    user = User(id=str(uuid4()), email=email.strip().lower(), password_hash=hash_password(password))
    db.add(user)
    db.flush()
    # Attach pre-authentication local projects to the first administrator account.
    db.query(Project).filter(Project.owner_id.is_(None)).update({Project.owner_id: user.id})
    db.commit()
    db.refresh(user)
    return user
