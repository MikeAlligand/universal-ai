from fastapi import APIRouter, Depends
from app.core.security import get_current_user
from app.api.v1.routes.projects import router as projects_router
from app.api.v1.routes.assistants import router as assistants_router
from app.api.v1.routes.chat import router as chat_router
from app.api.v1.routes.sources import router as sources_router
from app.api.v1.routes.organizations import router as organizations_router
from app.api.v1.routes.workflows import router as workflows_router

api_router = APIRouter(dependencies=[Depends(get_current_user)])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(assistants_router, tags=["assistants"])
api_router.include_router(chat_router, tags=["conversations"])

api_router.include_router(sources_router, tags=["sources"])
api_router.include_router(organizations_router)
api_router.include_router(workflows_router, tags=["workflows"])
