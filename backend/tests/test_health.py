from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_provider_status_never_exposes_secrets():
    response = client.get("/system/providers")
    assert response.status_code == 200
    payload = response.json()
    assert "providers" in payload
    assert "openai" in payload["providers"]
    assert "api_key" not in str(payload).lower()
