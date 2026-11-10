"""Add assistant configuration mode.

Revision ID: 0004_assistant_configuration_mode
Revises: 0003_create_conversations
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_assistant_configuration_mode"
down_revision = "0003_create_conversations"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("assistants", sa.Column("configuration_mode", sa.String(length=20), nullable=False, server_default="default"))

def downgrade() -> None:
    op.drop_column("assistants", "configuration_mode")
