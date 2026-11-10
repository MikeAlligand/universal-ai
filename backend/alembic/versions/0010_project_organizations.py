"""attach projects to organizations and backfill personal workspaces"""
from alembic import op
import sqlalchemy as sa
from uuid import uuid4

revision = "0010_project_orgs"
down_revision = "0009_organizations"
branch_labels = None
depends_on = None

def upgrade():
    op.add_column("projects", sa.Column("organization_id", sa.String(length=36), nullable=True))
    op.create_index("ix_projects_organization_id", "projects", ["organization_id"], unique=False)
    bind = op.get_bind()
    users = bind.execute(sa.text("SELECT DISTINCT owner_id FROM projects WHERE owner_id IS NOT NULL")).fetchall()
    for row in users:
        owner_id = row[0]
        membership = bind.execute(sa.text("SELECT organization_id FROM organization_members WHERE user_id=:uid ORDER BY joined_at LIMIT 1"), {"uid": owner_id}).first()
        if membership:
            org_id = membership[0]
        else:
            org_id = str(uuid4())
            bind.execute(sa.text("INSERT INTO organizations (id, name, created_by, created_at) VALUES (:id, :name, :uid, CURRENT_TIMESTAMP)"), {"id": org_id, "name": "Mon espace", "uid": owner_id})
            bind.execute(sa.text("INSERT INTO organization_members (id, organization_id, user_id, role, joined_at) VALUES (:id, :org, :uid, 'admin', CURRENT_TIMESTAMP)"), {"id": str(uuid4()), "org": org_id, "uid": owner_id})
        bind.execute(sa.text("UPDATE projects SET organization_id=:org WHERE owner_id=:uid AND organization_id IS NULL"), {"org": org_id, "uid": owner_id})
    with op.batch_alter_table("projects") as batch_op:
        batch_op.create_foreign_key("fk_projects_organization_id_organizations", "organizations", ["organization_id"], ["id"], ondelete="CASCADE")

def downgrade():
    with op.batch_alter_table("projects") as batch_op:
        batch_op.drop_constraint("fk_projects_organization_id_organizations", type_="foreignkey")
    op.drop_index("ix_projects_organization_id", table_name="projects")
    op.drop_column("projects", "organization_id")
