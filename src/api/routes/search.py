"""Search and retrieval routes for Hybrid RAG and telemetry inspection."""

import time
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from src.schemas.models import SearchRequest, GroundedResponse
from src.config import settings

router = APIRouter(tags=["Search"])


@router.post("/api/v1/search", response_model=GroundedResponse)
async def execute_search(req: SearchRequest):
    """Executes full search pipeline with Redis Semantic Caching and Grounded Synthesis."""
    from src.api.app import app_state

    # 1. Check Semantic Cache
    if req.use_cache:
        cached_result = app_state.cache.check(req.query, threshold=req.similarity_threshold)
        if cached_result is not None:
            cached_response, similarity = cached_result
            return cached_response

    # 2. Live Retrieval Pipeline (Dual -> RRF -> Cross-Encoder)
    t0 = time.perf_counter()
    retrieved_chunks = app_state.engine.retrieve(
        query=req.query,
        mode=req.mode,
        top_k=req.top_k,
        rrf_k=req.rrf_k,
        use_reranker=req.use_reranker,
    )

    if not retrieved_chunks:
        elapsed_ms = (time.perf_counter() - t0) * 1000
        return GroundedResponse(
            query=req.query,
            answer="No relevant documents or chunks were matched in the knowledge base.",
            citations=[],
            confidence_score=0.0,
            faithfulness_score=1.0,
            latency_ms=round(elapsed_ms, 2),
            cache_hit=False,
            retrieval_mode=req.mode,
            retrieved_chunks=[],
            tokens_used=0,
            estimated_cost_saved_usd=0.0,
            provider=req.provider or "auto",
            model=req.model or "auto-detected",
        )

    # 3. Grounded Synthesis with strict Pydantic Citations
    response = app_state.synthesizer.synthesize(
        query=req.query,
        retrieved_chunks=retrieved_chunks,
        provider=req.provider or "auto",
        model=req.model or "claude-3-5-sonnet-20241022",
        custom_api_key=req.custom_api_key,
        retrieval_mode=req.mode,
    )

    # 4. Store synthesized response in Semantic Cache
    if req.use_cache:
        app_state.cache.store(req.query, response)

    return response


@router.get("/api/v1/auth/detect")
async def detect_auth_status() -> Dict[str, Any]:
    """Auto-detects active API keys from environment or system config."""
    from src.generation.llm_gateway import LLMGateway
    return LLMGateway.detect_available_provider()


@router.post("/api/v1/search/raw")
async def execute_raw_search(req: SearchRequest) -> Dict[str, Any]:
    """Inspects multi-stage retrieval pipeline internals (Dense, BM25, RRF, Re-ranker) for HUD telemetry."""
    from src.api.app import app_state

    pipeline_info = app_state.engine.inspect_pipeline(
        query=req.query,
        top_k=req.top_k,
    )
    return pipeline_info
