"""Create persistent conversations and messages.

Revision ID: 0003_create_conversations
Revises: 0002_create_assistants
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_create_conversations"
down_revision = "0002_create_assistants"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("assistant_id", sa.String(36), sa.ForeignKey("assistants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(160), nullable=False, server_default="Nouvelle conversation"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_conversations_assistant_id", "conversations", ["assistant_id"])
    op.create_table(
        "messages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("conversation_id", sa.String(36), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("provider", sa.String(40), nullable=False, server_default="mock"),
        sa.Column("model", sa.String(120), nullable=False, server_default="mock"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])


def downgrade() -> None:
    op.drop_index("ix_messages_conversation_id", table_name="messages")
    op.drop_table("messages")
    op.drop_index("ix_conversations_assistant_id", table_name="conversations")
    op.drop_table("conversations")
