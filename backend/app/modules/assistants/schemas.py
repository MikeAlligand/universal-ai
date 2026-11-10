from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Provider = Literal["openai", "anthropic", "mistral", "ollama"]
ConfigurationMode = Literal["default", "custom"]


class AssistantCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=500)
    role: str = Field(default="assistant", min_length=2, max_length=80)
    configuration_mode: ConfigurationMode = "default"
    system_prompt: str = Field(default="", max_length=12000)
    mission: str = Field(default="", max_length=2000)
    responsibilities: list[str] = Field(default_factory=list, max_length=30)
    boundaries: str = Field(default="", max_length=3000)
    deliverables: list[str] = Field(default_factory=list, max_length=30)
    handoff_rules: str = Field(default="", max_length=2000)
    provider: Provider = "openai"
    model: str = Field(default="gpt-4.1-mini", min_length=1, max_length=120)
    temperature: float = Field(default=0.3, ge=0, le=2)
    source_ids: list[str] = Field(default_factory=list, max_length=500)


class AssistantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    role: str | None = Field(default=None, min_length=2, max_length=80)
    configuration_mode: ConfigurationMode | None = None
    system_prompt: str | None = Field(default=None, max_length=12000)
    mission: str | None = Field(default=None, max_length=2000)
    responsibilities: list[str] | None = Field(default=None, max_length=30)
    boundaries: str | None = Field(default=None, max_length=3000)
    deliverables: list[str] | None = Field(default=None, max_length=30)
    handoff_rules: str | None = Field(default=None, max_length=2000)
    provider: Provider | None = None
    model: str | None = Field(default=None, min_length=1, max_length=120)
    temperature: float | None = Field(default=None, ge=0, le=2)
    source_ids: list[str] | None = Field(default=None, max_length=500)


class AssistantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    name: str
    description: str
    role: str
    configuration_mode: str
    system_prompt: str
    mission: str
    responsibilities: list[str]
    boundaries: str
    deliverables: list[str]
    handoff_rules: str
    provider: str
    model: str
    temperature: float
    source_ids: list[str]
    status: str
    created_at: datetime
    updated_at: datetime
