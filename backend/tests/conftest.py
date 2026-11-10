import secrets
import uuid

TEST_ADMIN_EMAIL = f"admin-{uuid.uuid4().hex}@example.test"
TEST_ADMIN_PASSWORD = secrets.token_urlsafe(32)
