import secrets
import uuid
from conftest import TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.database import Base, get_db
from app.main import app
from app.modules import users  # noqa: F401

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
def override_db():
    Base.metadata.create_all(bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()
app.dependency_overrides[get_db] = override_db
client = TestClient(app)

def test_initial_setup_login_and_protected_api():
    from app.core.security import get_current_user
    previous = app.dependency_overrides.pop(get_current_user, None)
    status = client.get("/api/v1/auth/setup-status")
    assert status.status_code == 200 and status.json()["setup_required"] is True
    protected = client.get("/api/v1/projects")
    assert protected.status_code == 401
    created = client.post("/api/v1/auth/register", json={"email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD})
    assert created.status_code == 201
    token = created.json()["access_token"]
    assert client.get("/api/v1/projects", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    assert client.post("/api/v1/auth/register", json={"email": f"second-{uuid.uuid4().hex}@example.test", "password": TEST_ADMIN_PASSWORD}).status_code == 403
    login = client.post("/api/v1/auth/login", json={"email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD})
    assert login.status_code == 200
    assert client.post("/api/v1/auth/login", json={"email": TEST_ADMIN_EMAIL, "password": secrets.token_urlsafe(24)}).status_code == 401

    if previous is not None:
        app.dependency_overrides[get_current_user] = previous
