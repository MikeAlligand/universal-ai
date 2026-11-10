from contextlib import asynccontextmanager
from pathlib import Path
import logging

from alembic import command
from alembic.config import Config

from fastapi import FastAPI
import httpx
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.api.v1.router import api_router
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.organizations import public_invitation_router


logger = logging.getLogger(__name__)


def upgrade_local_database() -> None:
    """Apply pending Alembic migrations automatically for local development.

    Production deployments must run migrations as an explicit deployment step.
    """
    backend_dir = Path(__file__).resolve().parents[1]
    alembic_ini = backend_dir / "alembic.ini"
    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(backend_dir / "alembic"))
    command.upgrade(config, "head")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Local SQLite installs should work immediately after starting Uvicorn.
    # Alembic is idempotent: already-applied revisions are not run again.
    if settings.app_env == "local":
        logger.info("Checking and applying local database migrations")
        upgrade_local_database()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.15.0",
    description="Provider-agnostic workspace for configuring and testing AI assistants.",
    lifespan=lifespan,
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        response.headers.setdefault("Cache-Control", "no-store")
        if request.url.scheme == "https":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


@app.get("/system/deployment", tags=["system"])
async def deployment_info() -> dict[str, str | bool]:
    return {
        "deployment_mode": settings.deployment_mode,
        "llm_mode": settings.llm_mode,
        "external_integrations_enabled": settings.allow_external_integrations,
    }


@app.get("/system/providers", tags=["system"])
async def provider_status() -> dict[str, object]:
    """Expose provider readiness without ever returning credentials."""
    ollama = {"configured": bool(settings.ollama_base_url), "enabled": True, "available": False, "models": [], "embedding_model": settings.ollama_embedding_model, "embedding_available": False}
    if settings.ollama_base_url:
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(3.5, connect=1.5)) as client:
                response = await client.get(f"{settings.ollama_base_url.rstrip('/')}/api/tags")
                response.raise_for_status()
                payload = response.json()
            if not isinstance(payload, dict):
                raise ValueError("Réponse Ollama invalide")
            ollama["available"] = True
            ollama["models"] = [item.get("name") for item in payload.get("models", []) if isinstance(item, dict) and item.get("name")]
            ollama["embedding_model"] = settings.ollama_embedding_model
            ollama["embedding_available"] = any(
                name == settings.ollama_embedding_model or name.startswith(settings.ollama_embedding_model + ":")
                for name in ollama["models"]
            )
        except (httpx.HTTPError, ValueError, TypeError, AttributeError):
            # An unavailable local provider must not prevent the rest of the app from starting.
            ollama["error"] = "Ollama ne répond pas. Vérifiez que l'application Ollama est démarrée."
    return {
        "mode": settings.llm_mode,
        "default_provider": settings.default_llm_provider,
        "providers": {
            "openai": {"configured": bool(settings.openai_api_key), "enabled": True},
            "anthropic": {"configured": bool(settings.anthropic_api_key), "enabled": True},
            "mistral": {"configured": bool(settings.mistral_api_key), "enabled": True},
            "ollama": ollama,
        },
    }


app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(public_invitation_router, prefix="/api/v1")
app.include_router(api_router, prefix="/api/v1")
