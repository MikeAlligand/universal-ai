import secrets
import uuid
from conftest import TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.core.database import Base, get_db
from app.modules import users, organizations  # noqa: F401

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(bind=engine)
def override_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()
app.dependency_overrides[get_db] = override_db
client = TestClient(app)

def _admin_token():
    credentials = {"email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD}
    response = client.post("/api/v1/auth/login", json=credentials)
    if response.status_code != 200:
        response = client.post("/api/v1/auth/register", json=credentials)
    assert response.status_code in (200, 201)
    return response.json()["access_token"]

def test_organization_invitation_lifecycle():
    from app.core.security import get_current_user
    previous = app.dependency_overrides.pop(get_current_user, None)
    token = _admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    created = client.post("/api/v1/organizations", json={"name": "Equipe pilote"}, headers=headers)
    assert created.status_code == 201
    org_id = created.json()["id"]
    project = client.post("/api/v1/projects", json={"name": "Projet partagé", "description": "", "organization_id": org_id}, headers=headers)
    assert project.status_code == 201
    project_id = project.json()["id"]
    invitation = client.post(f"/api/v1/organizations/{org_id}/invitations", json={"email": f"collab-{uuid.uuid4().hex}@example.test", "role": "member"}, headers=headers)
    assert invitation.status_code == 201
    invite_token = invitation.json()["invitation_token"]
    accepted = client.post("/api/v1/organizations/invitations/accept", json={"token": invite_token, "password": secrets.token_urlsafe(32)})
    assert accepted.status_code == 201
    member_token = accepted.json()["access_token"]
    member_headers = {"Authorization": f"Bearer {member_token}"}
    shared_projects = client.get("/api/v1/projects", headers=member_headers)
    assert shared_projects.status_code == 200
    assert project_id in {row["id"] for row in shared_projects.json()}
    shared_project = client.get(f"/api/v1/projects/{project_id}", headers=member_headers)
    assert shared_project.status_code == 200
    edited = client.patch(f"/api/v1/projects/{project_id}", json={"name": "Projet collaboratif"}, headers=member_headers)
    assert edited.status_code == 200
    member_project = client.post("/api/v1/projects", json={"name": "Projet du membre", "organization_id": org_id}, headers=member_headers)
    assert member_project.status_code == 201
    assert client.delete(f"/api/v1/projects/{project_id}", headers=member_headers).status_code == 403
    members = client.get(f"/api/v1/organizations/{org_id}/members", headers=member_headers)
    assert members.status_code == 200
    assert invitation.json()["email"] in {row["email"] for row in members.json()}
    forbidden = client.post(f"/api/v1/organizations/{org_id}/invitations", json={"email": f"third-{uuid.uuid4().hex}@example.test", "role": "viewer"}, headers=member_headers)
    assert forbidden.status_code == 403
    reused = client.post("/api/v1/organizations/invitations/accept", json={"token": invite_token, "password": secrets.token_urlsafe(32)})
    assert reused.status_code == 400
    if previous is not None:
        app.dependency_overrides[get_current_user] = previous


def test_organization_viewer_is_read_only_and_admin_cannot_be_removed_as_last_admin():
    from app.core.security import get_current_user
    previous = app.dependency_overrides.pop(get_current_user, None)
    token = _admin_token()
    headers = {"Authorization": f"Bearer {token}"}
    org = client.post("/api/v1/organizations", json={"name": "Lecture seule"}, headers=headers).json()
    org_id = org["id"]
    project = client.post("/api/v1/projects", json={"name": "Projet lecture", "organization_id": org_id}, headers=headers).json()
    invite = client.post(f"/api/v1/organizations/{org_id}/invitations", json={"email": f"reader-{uuid.uuid4().hex}@example.test", "role": "viewer"}, headers=headers)
    assert invite.status_code == 201
    accepted = client.post("/api/v1/organizations/invitations/accept", json={"token": invite.json()["invitation_token"], "password": secrets.token_urlsafe(32)})
    assert accepted.status_code == 201
    reader_headers = {"Authorization": f"Bearer {accepted.json()['access_token']}"}
    assert client.get(f"/api/v1/projects/{project['id']}", headers=reader_headers).status_code == 200
    assert client.patch(f"/api/v1/projects/{project['id']}", json={"name": "Tentative"}, headers=reader_headers).status_code == 404
    members = client.get(f"/api/v1/organizations/{org_id}/members", headers=headers).json()
    admin_id = next(row["user_id"] for row in members if row["role"] == "admin")
    blocked = client.patch(f"/api/v1/organizations/{org_id}/members/{admin_id}", json={"role": "member"}, headers=headers)
    assert blocked.status_code == 409
    if previous is not None:
        app.dependency_overrides[get_current_user] = previous
