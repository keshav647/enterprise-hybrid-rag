"""Routes package export."""

from src.api.routes.health import router as health_router
from src.api.routes.search import router as search_router
from src.api.routes.documents import router as documents_router
from src.api.routes.cache import router as cache_router
from src.api.routes.evals import router as evals_router

__all__ = [
    "health_router",
    "search_router",
    "documents_router",
    "cache_router",
    "evals_router",
]
