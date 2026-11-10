"""add project ownership for tenant isolation"""
from alembic import op
import sqlalchemy as sa

revision = "0008_project_owner"
down_revision = "0007_users_auth"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("projects", sa.Column("owner_id", sa.String(length=36), nullable=True))
    op.create_index("ix_projects_owner_id", "projects", ["owner_id"], unique=False)
    op.execute("UPDATE projects SET owner_id = (SELECT id FROM users ORDER BY created_at LIMIT 1) WHERE owner_id IS NULL AND EXISTS (SELECT 1 FROM users)")
    with op.batch_alter_table("projects") as batch_op:
        batch_op.create_foreign_key("fk_projects_owner_id_users", "users", ["owner_id"], ["id"], ondelete="CASCADE")

def downgrade():
    with op.batch_alter_table("projects") as batch_op:
        batch_op.drop_constraint("fk_projects_owner_id_users", type_="foreignkey")
    op.drop_index("ix_projects_owner_id", table_name="projects")
    op.drop_column("projects", "owner_id")
