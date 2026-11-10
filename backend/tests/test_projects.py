from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.modules import users  # noqa: F401
from app.modules.projects import models  # noqa: F401
from app.modules.assistants import models as assistant_models  # noqa: F401
from app.modules.conversations import models as conversation_models  # noqa: F401
from app.modules.sources import models as source_models  # noqa: F401

test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)


def override_get_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
from app.core.security import get_current_user
from types import SimpleNamespace
app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="test-user")
client = TestClient(app)


def test_create_list_update_and_delete_project():
    created = client.post(
        "/api/v1/projects",
        json={"name": "Demo project", "description": "Test"},
    )
    assert created.status_code == 201
    project_id = created.json()["id"]

    fetched = client.get(f"/api/v1/projects/{project_id}")
    assert fetched.status_code == 200
    assert fetched.json()["name"] == "Demo project"

    listed = client.get("/api/v1/projects")
    assert listed.status_code == 200
    assert any(project["id"] == project_id for project in listed.json())

    updated = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Demo project updated"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Demo project updated"

    deleted = client.delete(f"/api/v1/projects/{project_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/projects/{project_id}").status_code == 404


def test_project_isolation_between_users():
    from types import SimpleNamespace
    from app.core.security import get_current_user
    created = client.post("/api/v1/projects", json={"name": "Projet privé", "description": ""})
    assert created.status_code == 201
    project_id = created.json()["id"]
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="another-user")
    assert client.get(f"/api/v1/projects/{project_id}").status_code == 404
    assert client.patch(f"/api/v1/projects/{project_id}", json={"name": "Volé"}).status_code == 404
    assert client.delete(f"/api/v1/projects/{project_id}").status_code == 404
    assert client.get("/api/v1/projects").json() == []
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="test-user")
