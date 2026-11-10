"""add mission and responsibility metadata to assistants"""
from alembic import op
import sqlalchemy as sa

revision = "0011_assistant_roles"
down_revision = "0010_project_orgs"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("assistants", sa.Column("mission", sa.Text(), nullable=False, server_default=""))
    op.add_column("assistants", sa.Column("responsibilities", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("assistants", sa.Column("boundaries", sa.Text(), nullable=False, server_default=""))
    op.add_column("assistants", sa.Column("deliverables", sa.JSON(), nullable=False, server_default="[]"))
    op.add_column("assistants", sa.Column("handoff_rules", sa.Text(), nullable=False, server_default=""))

def downgrade():
    op.drop_column("assistants", "handoff_rules")
    op.drop_column("assistants", "deliverables")
    op.drop_column("assistants", "boundaries")
    op.drop_column("assistants", "responsibilities")
    op.drop_column("assistants", "mission")
