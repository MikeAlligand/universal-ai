"""Create assistants table.

Revision ID: 0002_create_assistants
Revises: 0001_create_projects
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_create_assistants"
down_revision = "0001_create_projects"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "assistants",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("role", sa.String(length=80), nullable=False, server_default="assistant"),
        sa.Column("system_prompt", sa.Text(), nullable=False, server_default=""),
        sa.Column("provider", sa.String(length=40), nullable=False, server_default="openai"),
        sa.Column("model", sa.String(length=120), nullable=False, server_default="gpt-4.1-mini"),
        sa.Column("temperature", sa.Float(), nullable=False, server_default="0.3"),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_assistants_project_id", "assistants", ["project_id"])


def downgrade() -> None:
    op.drop_index("ix_assistants_project_id", table_name="assistants")
    op.drop_table("assistants")
