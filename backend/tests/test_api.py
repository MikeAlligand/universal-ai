from fastapi.testclient import TestClient
from app.main import app
client=TestClient(app)
def setup_user():
    r=client.post("/auth/register",params={"email":"test-"+__import__("uuid").uuid4().hex+"@example.com"})
    assert r.status_code==200
    return {"Authorization":"Bearer "+r.json()["access_token"]}
def test_health(): assert client.get("/health").json()=={"status":"ok"}
def test_project_assistant_deploy_chat():
    h=setup_user()
    p=client.post("/projects",params={"name":"Demo"},headers=h).json()
    a=client.post(f"/projects/{p['id']}/assistants",params={"name":"Helper"},headers=h).json()
    d=client.post(f"/assistants/{a['id']}/deployments",params={"access":"public"},headers=h).json()
    r=client.post(d["url"]+"/chat",json={"message":"hello"})
    assert r.status_code==200 and "answer" in r.json()
def test_private_route_requires_auth(): assert client.get("/projects").status_code==401
