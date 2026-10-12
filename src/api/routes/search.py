"""Search and retrieval routes for Hybrid RAG and telemetry inspection."""

import time
from fastapi import APIRouter
from typing import Dict, Any
from pydantic import BaseModel
from src.schemas.models import SearchRequest, GroundedResponse

router = APIRouter(tags=["Search"])


@router.post("/api/v1/search", response_model=GroundedResponse)
async def execute_search(req: SearchRequest):
    """Executes full search pipeline with Redis Semantic Caching and Grounded Synthesis."""
    from src.api.app import app_state

    # 1. Check Semantic Cache (scoped by mode and document_id)
    if req.use_cache:
        cached_result = app_state.cache.check(
            req.query,
            threshold=req.similarity_threshold,
            mode=req.mode,
            document_id=req.document_id,
        )
        if cached_result is not None:
            cached_response, _similarity = cached_result
            return cached_response

    # 2. Live Retrieval Pipeline (Dual -> RRF -> Cross-Encoder)
    t0 = time.perf_counter()
    retrieved_chunks = app_state.engine.retrieve(
        query=req.query,
        mode=req.mode,
        top_k=req.top_k,
        rrf_k=req.rrf_k,
        use_reranker=req.use_reranker,
        document_id=req.document_id,
    )
    t_retrieval_ms = (time.perf_counter() - t0) * 1000

    if not retrieved_chunks:
        return GroundedResponse(
            query=req.query,
            answer="No relevant documents or chunks were matched in the knowledge base.",
            citations=[],
            confidence_score=0.0,
            faithfulness_score=1.0,
            latency_ms=round(t_retrieval_ms, 2),
            cache_hit=False,
            retrieval_mode=req.mode,
            retrieved_chunks=[],
            tokens_used=0,
            estimated_cost_saved_usd=0.0,
            provider=req.provider or "auto",
            model=req.model or "auto-detected",
            timings_ms=app_state.engine.last_timings_ms,
        )

    # 3. Grounded Synthesis with strict Pydantic Citations
    t_synth_start = time.perf_counter()
    response = app_state.synthesizer.synthesize(
        query=req.query,
        retrieved_chunks=retrieved_chunks,
        provider=req.provider or "auto",
        model=req.model or "claude-3-5-sonnet-20241022",
        custom_api_key=req.custom_api_key,
        retrieval_mode=req.mode,
    )
    t_synth_ms = (time.perf_counter() - t_synth_start) * 1000
    total_ms = round((time.perf_counter() - t0) * 1000, 2)

    stage_timings = dict(app_state.engine.last_timings_ms)
    stage_timings["cache_probe"] = 0.2
    stage_timings["synthesis"] = round(t_synth_ms, 2)
    stage_timings["total"] = total_ms
    response.latency_ms = total_ms
    response.timings_ms = stage_timings

    # 4. Store synthesized response in Semantic Cache
    if req.use_cache:
        app_state.cache.store(
            req.query,
            response,
            mode=req.mode,
            document_id=req.document_id,
        )

    return response


class KeyTestRequest(BaseModel):
    provider: str
    api_key: str


@router.post("/api/v1/auth/test_key")
async def test_key_connection(req: KeyTestRequest) -> Dict[str, Any]:
    """Tests if a provided API key is valid with a live minimal ping."""
    key = req.api_key.strip()
    if not key:
        return {"success": False, "message": "API key cannot be empty"}

    try:
        if req.provider == "gemini":
            from google import genai
            client = genai.Client(api_key=key)
            models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
            last_err = None
            for m in models_to_try:
                try:
                    client.models.generate_content(
                        model=m,
                        contents="Respond with the word 'OK'",
                    )
                    return {"success": True, "provider": "gemini", "model": m, "message": f"Gemini API key is active and connected ({m})."}
                except Exception as e:
                    last_err = e
            return {"success": False, "message": f"Gemini error: {str(last_err)}"}

        elif req.provider in ("anthropic", "claude"):
            import httpx
            headers = {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
            payload = {"model": "claude-3-5-sonnet-20241022", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}
            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                res.raise_for_status()
            return {"success": True, "provider": "anthropic", "message": "Anthropic Claude API key is active and connected."}

        elif req.provider == "openai":
            import httpx
            headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
            payload = {"model": "gpt-4o-mini", "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}
            with httpx.Client(timeout=10.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                res.raise_for_status()
            return {"success": True, "provider": "openai", "message": "OpenAI API key is active and connected."}

        return {"success": False, "message": f"Unsupported provider: {req.provider}"}
    except Exception as e:
        return {"success": False, "message": f"Verification error: {str(e)}"}


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
