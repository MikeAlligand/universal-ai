from datetime import datetime, timezone
from uuid import uuid4

from app.modules.projects.schemas import ProjectCreate

# Temporary in-memory repository for the first bootable scaffold.
# Replace with SQLAlchemy repository + migrations before adding real users/tenants.
class ProjectService:
    def __init__(self):
        self._items: dict[str, dict] = {}

    def list(self) -> list[dict]:
        return list(self._items.values())

    def create(self, payload: ProjectCreate) -> dict:
        item = {
            "id": str(uuid4()),
            "name": payload.name,
            "description": payload.description,
            "status": "active",
            "created_at": datetime.now(timezone.utc),
        }
        self._items[item["id"]] = item
        return item

    def get(self, project_id: str) -> dict | None:
        return self._items.get(project_id)


project_service = ProjectService()
