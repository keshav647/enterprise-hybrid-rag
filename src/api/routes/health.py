"""Health and system status routes."""

from fastapi import APIRouter
from pydantic import BaseModel
from src.config import settings

router = APIRouter(tags=["Health"])


class HealthResponse(BaseModel):
    status: str
    app_name: str
    version: str
    total_documents: int
    total_chunks: int
    semantic_cache_entries: int
    default_provider: str


@router.get("/api/v1/health", response_model=HealthResponse)
async def get_health():
    from src.api.app import app_state

    return HealthResponse(
        status="healthy",
        app_name=settings.app_name,
        version=settings.app_version,
        total_documents=len(app_state.documents),
        total_chunks=app_state.engine.vector_store.total_count(),
        semantic_cache_entries=len(app_state.cache.entries),
        default_provider=settings.default_provider,
    )
