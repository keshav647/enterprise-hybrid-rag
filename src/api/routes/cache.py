"""Redis Semantic Cache management and telemetry routes."""

from fastapi import APIRouter
from src.schemas.models import CacheStats

router = APIRouter(tags=["Semantic Cache"])


@router.get("/api/v1/cache/stats", response_model=CacheStats)
async def get_cache_stats():
    """Returns telemetry metrics and cost savings from the Redis Semantic Cache."""
    from src.api.app import app_state
    return app_state.cache.get_stats()


@router.post("/api/v1/cache/clear")
async def clear_cache():
    """Clears all entries from the semantic cache and resets telemetry counters."""
    from src.api.app import app_state
    app_state.cache.clear()
    return {"message": "Semantic cache cleared successfully"}
