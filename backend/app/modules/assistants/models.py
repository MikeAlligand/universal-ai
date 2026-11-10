from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Assistant(Base):
    __tablename__ = "assistants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    project_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    role: Mapped[str] = mapped_column(String(80), nullable=False, default="assistant")
    configuration_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="default")
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False, default="")
    mission: Mapped[str] = mapped_column(Text, nullable=False, default="")
    responsibilities: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    boundaries: Mapped[str] = mapped_column(Text, nullable=False, default="")
    deliverables: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    handoff_rules: Mapped[str] = mapped_column(Text, nullable=False, default="")
    provider: Mapped[str] = mapped_column(String(40), nullable=False, default="openai")
    model: Mapped[str] = mapped_column(String(120), nullable=False, default="gpt-4.1-mini")
    temperature: Mapped[float] = mapped_column(Float, nullable=False, default=0.3)
    source_ids: Mapped[list] = mapped_column(JSON, nullable=False, default=list)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    project = relationship("Project", back_populates="assistants")
    conversations = relationship("Conversation", back_populates="assistant", cascade="all, delete-orphan")
