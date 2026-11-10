from fastapi.testclient import TestClient

from app.main import app
from app.modules import users  # noqa: F401

client = TestClient(app)


def test_assistant_crud_flow():
    project_response = client.post("/api/v1/projects", json={"name": "Projet assistants", "description": "Test"})
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]

    create_response = client.post(f"/api/v1/projects/{project_id}/assistants", json={
        "name": "Assistant support", "description": "Répond aux clients", "role": "support",
        "system_prompt": "Tu es un assistant de support.", "provider": "openai",
        "model": "gpt-4.1-mini", "temperature": 0.2
    })
    assert create_response.status_code == 201
    assistant = create_response.json()
    assert assistant["project_id"] == project_id
    assistant_id = assistant["id"]

    list_response = client.get(f"/api/v1/projects/{project_id}/assistants")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1

    update_response = client.patch(f"/api/v1/assistants/{assistant_id}", json={"name": "Assistant support V2"})
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Assistant support V2"

    delete_response = client.delete(f"/api/v1/assistants/{assistant_id}")
    assert delete_response.status_code == 204
    assert client.get(f"/api/v1/projects/{project_id}/assistants").json() == []


def test_chat_persists_conversation_and_messages(monkeypatch):
    from app.core.config import settings
    from app.modules.conversations import models as conversation_models  # noqa: F401
    from app.modules.projects import models as project_models  # noqa: F401

    monkeypatch.setattr(settings, "llm_mode", "mock")
    project_response = client.post("/api/v1/projects", json={"name": "Projet chat", "description": "Test conversation"})
    assert project_response.status_code == 201
    project_id = project_response.json()["id"]
    assistant_response = client.post(f"/api/v1/projects/{project_id}/assistants", json={
        "name": "Assistant chat", "role": "support", "provider": "openai", "model": "gpt-4.1-mini"
    })
    assert assistant_response.status_code == 201
    assistant_id = assistant_response.json()["id"]

    response = client.post(f"/api/v1/assistants/{assistant_id}/chat", json={"message": "Bonjour"})
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "mock"
    conversation_id = data["conversation"]["id"]
    assert data["user_message"]["content"] == "Bonjour"
    assert "prêt à vous aider" in data["assistant_message"]["content"].lower()

    history = client.get(f"/api/v1/conversations/{conversation_id}/messages")
    assert history.status_code == 200
    assert [item["role"] for item in history.json()] == ["user", "assistant"]

    deleted = client.delete(f"/api/v1/assistants/{assistant_id}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/conversations/{conversation_id}/messages").status_code == 404


def test_demo_mode_is_context_aware_and_does_not_call_external_provider(monkeypatch):
    from app.core.config import settings
    from app.providers.llm.service import generate_reply

    monkeypatch.setattr(settings, "llm_mode", "mock")

    async def run():
        first = await generate_reply(
            provider="openai", model="gpt-4.1-mini", system_prompt="Tu es un assistant support.",
            temperature=0.2, messages=[{"role": "user", "content": "Bonjour"}],
        )
        follow_up = await generate_reply(
            provider="openai", model="gpt-4.1-mini", system_prompt="Tu es un assistant support.",
            temperature=0.2, messages=[
                {"role": "user", "content": "Je prépare un projet"},
                {"role": "assistant", "content": first},
                {"role": "user", "content": "Comment organiser les prochaines étapes ?"},
            ],
        )
        return first, follow_up

    import asyncio
    first, follow_up = asyncio.run(run())
    assert "Bonjour" in first
    assert "demonstration" not in first.lower()  # greeting remains natural in the demo
    assert "aucun modèle ia externe" in follow_up.lower()
    assert "Je prépare un projet" in follow_up


def test_ollama_provider_uses_local_openai_compatible_endpoint(monkeypatch):
    import asyncio
    from app.core.config import settings
    from app.providers.llm import service

    monkeypatch.setattr(settings, "llm_mode", "local")
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            return None
        def json(self):
            return {"choices": [{"message": {"content": "Réponse locale réelle simulée par le test."}}]}

    class FakeClient:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, *args):
            return False
        async def post(self, url, json, headers):
            captured["url"] = url
            captured["payload"] = json
            captured["headers"] = headers
            return FakeResponse()

    monkeypatch.setattr(service.httpx, "AsyncClient", FakeClient)
    result = asyncio.run(service.generate_reply(
        provider="ollama", model="qwen2.5:3b", system_prompt="Réponds en français.",
        temperature=0.2, messages=[{"role": "user", "content": "Bonjour"}],
    ))
    assert result == "Réponse locale réelle simulée par le test."
    assert captured["url"].endswith("/v1/chat/completions")
    assert captured["payload"]["model"] == "qwen2.5:3b"
    assert captured["headers"]["Authorization"] == "Bearer ollama"
