import secrets
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Universal AI Platform"
    app_env: str = "local"
    deployment_mode: str = "self_hosted"  # saas | self_hosted | air_gapped
    llm_mode: str = "mock"  # mock | cloud | local
    allow_external_integrations: bool = False

    # Local development works without Docker. Set DATABASE_URL to PostgreSQL
    # in SaaS/On-Premise deployments.
    database_url: str = "sqlite:///./data/universal_ai.db"
    redis_url: str = "redis://localhost:6379/0"
    default_llm_provider: str = "mock"
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    mistral_api_key: str | None = None
    ollama_base_url: str = "http://localhost:11434"
    ollama_embedding_model: str = "nomic-embed-text"
    cors_origins: list[str] = ["http://localhost:3000"]
    jwt_secret: str = Field(default_factory=lambda: secrets.token_urlsafe(48))
    access_token_hours: int = 8

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
