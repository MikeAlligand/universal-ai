"""persist sequential assistant workflows"""
from alembic import op
import sqlalchemy as sa

revision = "0012_workflows"
down_revision = "0011_assistant_roles"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        "workflows",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("project_id", sa.String(length=36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("assistant_ids", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_workflows_project_id", "workflows", ["project_id"], unique=False)

def downgrade():
    op.drop_index("ix_workflows_project_id", table_name="workflows")
    op.drop_table("workflows")
