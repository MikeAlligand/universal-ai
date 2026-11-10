from types import SimpleNamespace
import uuid
import asyncio

from app.core.config import settings
from app.providers.llm import retrieval


def test_split_into_chunks_keeps_document_text_and_bounds_size():
    text = "\n\n".join([f"Section {i}. " + ("Informations importantes sur les contrats et les délais. " * 8) for i in range(8)])
    chunks = retrieval.split_into_chunks(text, max_chars=500, overlap=80)
    assert len(chunks) > 1
    assert all(len(chunk) <= 500 for chunk in chunks)
    assert "Section 0" in chunks[0]
    assert "Section 7" in chunks[-1]


def test_lexical_retrieval_finds_relevant_document_passage():
    source = SimpleNamespace(id="src-1", name="Guide RH.pdf", origin="RH/Guide RH.pdf", content=(
        "Politique de congés.\n\nLes collaborateurs disposent de 25 jours de congés payés par an. "
        "Les demandes doivent être validées par le responsable hiérarchique."
    ))
    previous = settings.llm_mode
    settings.llm_mode = "cloud"
    try:
        chunks, method = asyncio.run(retrieval.retrieve_relevant_chunks("Combien de jours de congés payés ?", [source]))
    finally:
        settings.llm_mode = previous
    assert method == "lexical"
    assert chunks
    assert chunks[0].source_name == "Guide RH.pdf"
    assert "25 jours" in chunks[0].content


def test_hybrid_retrieval_uses_ollama_embeddings_when_available(monkeypatch):
    source = SimpleNamespace(id="src-2", name="Fiche société.txt", origin="Fiche société.txt", content="Le siège social est situé à Lyon. La société compte 42 collaborateurs.")
    monkeypatch.setattr(settings, "llm_mode", "local")
    monkeypatch.setattr(settings, "ollama_embedding_model", "fake-embed")
    async def fake_embeddings(texts):
        return [[1.0, 0.0] for _ in texts]
    monkeypatch.setattr(retrieval, "_ollama_embeddings", fake_embeddings)
    retrieval._EMBED_CACHE.clear()
    chunks, method = asyncio.run(retrieval.retrieve_relevant_chunks("Où se trouve le siège ?", [source]))
    assert method == "hybrid"
    assert chunks and chunks[0].source_id == "src-2"


def test_retrieval_does_not_return_unrelated_passages():
    source = SimpleNamespace(id="src-3", name="Cuisine.txt", origin="Cuisine.txt", content="Recette de tarte aux pommes avec cannelle et pâte feuilletée.")
    previous = settings.llm_mode
    settings.llm_mode = "cloud"
    try:
        chunks, _ = asyncio.run(retrieval.retrieve_relevant_chunks("Quel est le délai de réponse contractuel ?", [source]))
    finally:
        settings.llm_mode = previous
    assert chunks == []


def test_chat_injects_authorized_knowledge_and_persists_citations(monkeypatch):
    from fastapi.testclient import TestClient
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.pool import StaticPool
    from app.core.database import Base, get_db
    from app.core.security import get_current_user
    from app.main import app
    from app.modules.users import User
    from app.modules.projects.models import Project
    from app.modules.assistants.models import Assistant
    from app.modules.sources.models import DataSource
    from app.modules.organizations import Organization  # noqa: F401
    from app.modules.organizations import OrganizationMember  # noqa: F401
    from app.modules.conversations import models as conversation_models  # noqa: F401
    from app.api.v1.routes import chat as chat_routes

    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = Session()
    user = User(id="rag-user", email=f"rag-{uuid.uuid4().hex}@example.test", password_hash="test-fixture")
    project = Project(id="rag-project", owner_id=user.id, name="Projet RAG", description="")
    source = DataSource(
        id="rag-source", project_id=project.id, name="Fiche entreprise.txt", source_type="file",
        origin="RH/Fiche entreprise.txt", status="indexed",
        content="La société compte 42 collaborateurs. Son siège social est situé à Lyon.", size_bytes=80,
    )
    assistant = Assistant(
        id="rag-assistant", project_id=project.id, name="Assistant RH", description="", role="RH",
        configuration_mode="default", system_prompt="Tu réponds à partir des sources.", provider="ollama",
        model="qwen2.5:3b", temperature=0.2, source_ids=[source.id], status="active",
    )
    db.add_all([user, project, source, assistant]); db.commit(); db.close()

    def override_db():
        session = Session()
        try:
            yield session
        finally:
            session.close()

    previous_db = app.dependency_overrides.get(get_db)
    previous_user = app.dependency_overrides.get(get_current_user)
    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id="rag-user")
    captured = {}

    async def fake_generate_reply(**kwargs):
        captured["system_prompt"] = kwargs["system_prompt"]
        return "La société compte 42 collaborateurs et son siège est à Lyon."

    monkeypatch.setattr(chat_routes, "generate_reply", fake_generate_reply)
    previous_mode = settings.llm_mode
    settings.llm_mode = "cloud"
    try:
        with TestClient(app) as client:
            response = client.post("/api/v1/assistants/rag-assistant/chat", json={"message": "Combien de collaborateurs compte la société ?"})
        assert response.status_code == 200, response.text
        body = response.json()
        assert "42 collaborateurs" in captured["system_prompt"]
        assert "RÈGLES RAG OBLIGATOIRES" in captured["system_prompt"]
        assert "Sources consultées" in body["assistant_message"]["content"]
        assert "Fiche entreprise.txt" in body["assistant_message"]["content"]
    finally:
        settings.llm_mode = previous_mode
        if previous_db is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_db
        if previous_user is None:
            app.dependency_overrides.pop(get_current_user, None)
        else:
            app.dependency_overrides[get_current_user] = previous_user
        Base.metadata.drop_all(engine)
        engine.dispose()
