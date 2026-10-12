"""Configuration management for Enterprise Hybrid Search & Document Intelligence Engine."""

import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
STATIC_DIR = BASE_DIR / "src" / "ui" / "static"
UI_DIR = BASE_DIR / "src" / "ui"
UI_OVERVIEW_PATH = UI_DIR / "overview.html"
UI_INDEX_PATH = UI_DIR / "index.html"
UI_PIPELINE_PATH = UI_DIR / "pipeline.html"
UI_DOCUMENTS_PATH = UI_DIR / "documents.html"
UI_INGEST_PATH = UI_DIR / "ingest.html"
UI_ANALYTICS_PATH = UI_DIR / "analytics.html"
UI_SETTINGS_PATH = UI_DIR / "settings.html"


class Settings(BaseModel):
    """Application settings with environment variable support."""

    app_name: str = "Enterprise Hybrid Search & Document Intelligence Engine"
    app_version: str = "1.0.0"
    debug: bool = Field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")

    # Server configuration
    host: str = Field(default_factory=lambda: os.getenv("HOST", "0.0.0.0"))
    port: int = Field(default_factory=lambda: int(os.getenv("PORT", "8000")))
    fallback_port: int = Field(default_factory=lambda: int(os.getenv("FALLBACK_PORT", "8080")))

    # AI & Model Providers
    gemini_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("GEMINI_API_KEY"))
    openai_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    anthropic_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("ANTHROPIC_API_KEY"))
    groq_api_key: Optional[str] = Field(default_factory=lambda: os.getenv("GROQ_API_KEY"))

    default_provider: str = Field(default_factory=lambda: os.getenv("DEFAULT_PROVIDER", "gemini"))
    default_llm_model: str = Field(default_factory=lambda: os.getenv("DEFAULT_LLM_MODEL", "gemini-2.5-flash"))
    default_embedding_model: str = Field(
        default_factory=lambda: os.getenv("DEFAULT_EMBEDDING_MODEL", "text-embedding-004")
    )

    # Retrieval hyperparameters
    rrf_k: int = Field(default_factory=lambda: int(os.getenv("RRF_K", "60")))
    rrf_candidate_count: int = Field(default_factory=lambda: int(os.getenv("RRF_CANDIDATE_COUNT", "30")))
    default_top_k: int = Field(default_factory=lambda: int(os.getenv("DEFAULT_TOP_K", "5")))
    bm25_k1: float = Field(default_factory=lambda: float(os.getenv("BM25_K1", "1.5")))
    bm25_b: float = Field(default_factory=lambda: float(os.getenv("BM25_B", "0.75")))

    # Semantic Caching
    cache_similarity_threshold: float = Field(
        default_factory=lambda: float(os.getenv("CACHE_SIMILARITY_THRESHOLD", "0.95"))
    )
    redis_url: Optional[str] = Field(default_factory=lambda: os.getenv("REDIS_URL"))
    enable_redis: bool = Field(default_factory=lambda: os.getenv("ENABLE_REDIS", "false").lower() == "true")

    # Vector Storage (Postgres pgvector)
    postgres_url: Optional[str] = Field(default_factory=lambda: os.getenv("DATABASE_URL"))
    enable_pgvector: bool = Field(
        default_factory=lambda: os.getenv("ENABLE_PGVECTOR", "false").lower() == "true"
    )

    # Token cost estimation ($ / 1000 tokens)
    input_token_cost_usd_per_k: float = 0.00015
    output_token_cost_usd_per_k: float = 0.00060


# Global settings singleton
settings = Settings()
