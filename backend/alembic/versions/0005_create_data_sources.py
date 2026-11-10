"""create data sources"""
from alembic import op
import sqlalchemy as sa
revision = "0005_data_sources"
down_revision = "0004_assistant_configuration_mode"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("data_sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("source_type", sa.String(30), nullable=False),
        sa.Column("origin", sa.String(1000), nullable=False, server_default=""),
        sa.Column("status", sa.String(30), nullable=False, server_default="ready"),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_data_sources_project_id", "data_sources", ["project_id"])

def downgrade():
    op.drop_index("ix_data_sources_project_id", table_name="data_sources")
    op.drop_table("data_sources")
