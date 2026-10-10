"""Pydantic v2 domain schemas and data transfer objects."""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class DocumentMetadata(BaseModel):
    """Metadata describing an ingested document."""

    document_id: str = Field(..., description="Unique alphanumeric identifier for document")
    title: str = Field(..., description="Human-readable title")
    file_path: Optional[str] = Field(None, description="Original source file path")
    document_type: str = Field("markdown", description="MIME or format type: markdown, pdf, text")
    tags: List[str] = Field(default_factory=list, description="Categorical tags")
    total_pages: int = Field(1, description="Total page count")
    total_chunks: int = Field(0, description="Number of parsed chunks")
    created_at: str = Field(..., description="ISO timestamp")


class DocumentChunk(BaseModel):
    """A contextual, layout-aware chunk extracted from a document."""

    chunk_id: str = Field(..., description="Deterministic chunk ID (e.g. doc1_c001)")
    document_id: str = Field(..., description="Parent document identifier")
    document_title: str = Field(..., description="Parent document title for contextual embeddings")
    section_title: str = Field(..., description="Heading or section context breadcrumb")
    page_number: Optional[int] = Field(None, description="Physical page number")
    content: str = Field(..., description="Extracted chunk text with layout context")
    token_count: int = Field(0, description="Approximate token count")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Custom metadata attributes")
    embedding: Optional[List[float]] = Field(None, description="Dense vector embedding")


class SearchResultItem(BaseModel):
    """Individual chunk result returned during retrieval."""

    chunk_id: str
    document_id: str
    document_title: str
    section_title: str
    page_number: Optional[int] = None
    content: str
    token_count: int = Field(0, description="Approximate token count")
    score: float = Field(..., description="Unified final score after fusion / re-ranking")
    dense_rank: Optional[int] = Field(None, description="1-indexed rank in dense retrieval")
    bm25_rank: Optional[int] = Field(None, description="1-indexed rank in BM25 retrieval")
    rrf_score: Optional[float] = Field(None, description="Reciprocal Rank Fusion score")
    rerank_score: Optional[float] = Field(None, description="Cross-encoder relevance score [0.0 - 1.0]")
    score_breakdown: Optional[Dict[str, Any]] = Field(default_factory=dict)


class Citation(BaseModel):
    """Verifiable source citation grounding an LLM answer."""

    citation_id: int = Field(..., description="1-indexed citation badge number [1], [2]")
    chunk_id: str = Field(..., description="Underlying chunk ID")
    document_title: str = Field(..., description="Document source name")
    section_title: str = Field(..., description="Section or chapter name")
    page_number: Optional[int] = Field(None, description="Page number reference")
    exact_quote: str = Field(..., description="Verbatim text quote from source document")
    relevance_score: float = Field(..., description="Confidence relevance score [0.0 - 1.0]")


class GroundedResponse(BaseModel):
    """Complete grounded answer with verifiable citations and telemetry."""

    query: str
    answer: str = Field(..., description="Synthesized Markdown answer containing [1], [2] citations")
    citations: List[Citation] = Field(default_factory=list, description="Grounding source citations")
    confidence_score: float = Field(0.95, description="Synthesis confidence score [0.0 - 1.0]")
    faithfulness_score: float = Field(1.0, description="Factuality grounding score against chunks")
    latency_ms: float = Field(..., description="End-to-end execution latency in milliseconds")
    cache_hit: bool = Field(False, description="Whether query was served from Redis Semantic Cache")
    retrieval_mode: str = Field("hybrid", description="Retrieval mode: hybrid, dense, bm25")
    retrieved_chunks: List[SearchResultItem] = Field(default_factory=list)
    tokens_used: int = Field(0, description="Total tokens consumed")
    estimated_cost_saved_usd: float = Field(0.0, description="Cost saved via cache or zero-drain tier")
    provider: str = Field("gemini", description="LLM provider name")
    model: str = Field("gemini-2.5-flash", description="Model identifier")


class SearchRequest(BaseModel):
    """User query request payload."""

    query: str = Field(..., description="Search query string")
    mode: Literal["hybrid", "dense", "bm25"] = Field("hybrid", description="Retrieval pipeline mode")
    top_k: int = Field(5, ge=1, le=20, description="Number of final chunks to return")
    rrf_k: int = Field(60, ge=1, le=200, description="RRF smoothing constant (default: 60)")
    use_reranker: bool = Field(True, description="Whether to apply cross-encoder re-ranking")
    use_cache: bool = Field(True, description="Whether to check semantic cache first")
    similarity_threshold: float = Field(
        0.95, ge=0.5, le=1.0, description="Cosine similarity threshold for semantic cache hit"
    )
    custom_api_key: Optional[str] = Field(None, description="BYOK user API key")
    provider: Optional[str] = Field(None, description="Provider: gemini, openai, anthropic, groq, offline")


class IngestRequest(BaseModel):
    """Payload to ingest a new document."""

    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Markdown or plaintext body")
    document_type: str = Field("markdown", description="Document type")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CacheStats(BaseModel):
    """Telemetry metrics from the Redis semantic cache."""

    total_queries: int = 0
    cache_hits: int = 0
    cache_misses: int = 0
    hit_ratio: float = 0.0
    estimated_cost_saved_usd: float = 0.0
    avg_cache_latency_ms: float = 0.0
    avg_live_latency_ms: float = 0.0


class EvalMetricResult(BaseModel):
    """Individual query evaluation metric."""

    query: str
    faithfulness: float
    answer_relevance: float
    context_precision: float
    context_recall: float
    harmonic_f1: float
    status: str = "passed"


class BenchmarkReport(BaseModel):
    """Overall benchmark and Ragas evaluation report."""

    total_queries: int
    avg_faithfulness: float
    avg_answer_relevance: float
    avg_context_precision: float
    avg_context_recall: float
    comparisons: Dict[str, Any] = Field(default_factory=dict)
