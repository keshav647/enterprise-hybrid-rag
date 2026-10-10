"""FastAPI application factory, state container, and startup lifecycle."""

import os
from pathlib import Path
from typing import Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from src.config import settings, DOCUMENTS_DIR, STATIC_DIR, UI_INDEX_PATH
from src.schemas.models import DocumentMetadata
from src.ingestion.chunker import ContextualChunker
from src.ingestion.document_loader import DocumentLoader
from src.retrieval.dense_embedder import DenseEmbedder
from src.retrieval.bm25_index import BM25Index
from src.retrieval.rrf_fusion import ReciprocalRankFusion
from src.retrieval.reranker import CrossEncoderReranker
from src.retrieval.vector_store import InMemoryVectorStore
from src.retrieval.hybrid_engine import HybridRetrievalEngine
from src.cache.semantic_cache import SemanticCache
from src.generation.llm_gateway import LLMGateway
from src.generation.synthesizer import GroundedSynthesizer
from src.api.routes import (
    health_router,
    search_router,
    documents_router,
    cache_router,
    evals_router,
)


class AppState:
    """Singleton application state container."""

    def __init__(self):
        self.embedder = DenseEmbedder(api_key=settings.gemini_api_key)
        self.vector_store = InMemoryVectorStore(self.embedder)
        self.bm25 = BM25Index(k1=settings.bm25_k1, b=settings.bm25_b)
        self.rrf = ReciprocalRankFusion(k=settings.rrf_k)
        self.reranker = CrossEncoderReranker()
        self.engine = HybridRetrievalEngine(
            embedder=self.embedder,
            bm25_index=self.bm25,
            rrf=self.rrf,
            reranker=self.reranker,
            vector_store=self.vector_store,
        )
        self.chunker = ContextualChunker()
        self.loader = DocumentLoader(self.chunker)
        self.cache = SemanticCache(
            embedder=self.embedder,
            similarity_threshold=settings.cache_similarity_threshold,
            redis_url=settings.redis_url,
        )
        self.gateway = LLMGateway(default_api_key=settings.gemini_api_key)
        self.synthesizer = GroundedSynthesizer(self.gateway)
        self.documents: Dict[str, DocumentMetadata] = {}

    def bootstrap_default_documents(self):
        """Loads and indexes the pre-packaged enterprise benchmark documents."""
        if DOCUMENTS_DIR.exists():
            loaded = self.loader.load_directory(DOCUMENTS_DIR)
            for meta, chunks in loaded:
                self.documents[meta.document_id] = meta
                self.engine.index_chunks(chunks)


# Global app state singleton
app_state = AppState()


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app_state.bootstrap_default_documents()
    yield


def create_app() -> FastAPI:
    """Builds and configures the FastAPI application."""
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Production Hybrid Search (Dense + BM25 + RRF) with Cross-Encoder Re-Ranking, Redis Semantic Caching & Grounded Citations",
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register API routers
    app.include_router(health_router)
    app.include_router(search_router)
    app.include_router(documents_router)
    app.include_router(cache_router)
    app.include_router(evals_router)

    # Mount UI static files if directory exists
    if STATIC_DIR.exists():
        app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

    # Serve UI at root and deep-linked page paths
    @app.get("/", include_in_schema=False)
    @app.get("/search", include_in_schema=False)
    @app.get("/documents", include_in_schema=False)
    @app.get("/analytics", include_in_schema=False)
    @app.get("/settings", include_in_schema=False)
    async def serve_ui():
        if UI_INDEX_PATH.exists():
            return FileResponse(str(UI_INDEX_PATH))
        return {
            "message": "Enterprise Hybrid Search API is running. UI not built yet. Access /docs for API documentation."
        }

    return app


# Root application instance
app = create_app()
