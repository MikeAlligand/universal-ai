"""add assistant source access"""
from alembic import op
import sqlalchemy as sa

revision = "0006_assistant_sources"
down_revision = "0005_data_sources"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("assistants", sa.Column("source_ids", sa.JSON(), nullable=False, server_default="[]"))

def downgrade():
    op.drop_column("assistants", "source_ids")
