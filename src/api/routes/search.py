"""Search and retrieval routes for Hybrid RAG and telemetry inspection."""

import time
from fastapi import APIRouter
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
from src.schemas.models import SearchRequest, GroundedResponse

router = APIRouter(tags=["Search"])


def _engine_scope(req: SearchRequest, app_state) -> str:
    """Cache partition: offline answers must never be served to a live-LLM request (and vice versa)."""
    import os
    from src.generation.llm_gateway import LLMGateway

    prov = (req.provider or "auto").lower()
    if prov == "offline":
        return "offline"
    has_key = bool(
        (req.custom_api_key or "").strip()
        or (app_state.gateway.default_api_key or "").strip()
        or LLMGateway.detect_available_provider().get("has_key")
    )
    if not has_key:
        return "offline"
    return f"{prov}:{req.model or ''}"


@router.post("/api/v1/search", response_model=GroundedResponse)
async def execute_search(req: SearchRequest):
    """Executes full search pipeline with Semantic Caching and Grounded Synthesis."""
    from src.api.app import app_state

    scope = _engine_scope(req, app_state)

    # 1. Check Semantic Cache (scoped by mode, document_id and engine)
    if req.use_cache:
        cached_result = app_state.cache.check(
            req.query,
            threshold=req.similarity_threshold,
            mode=req.mode,
            document_id=req.document_id,
            engine=scope,
        )
        if cached_result is not None:
            cached_response, _similarity = cached_result
            return cached_response

    # 2. Live Retrieval Pipeline (Dense + BM25 -> RRF -> Re-rank)
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
            answer="No relevant passages were found in your documents for this question.",
            citations=[],
            confidence_score=0.0,
            faithfulness_score=1.0,
            latency_ms=round(t_retrieval_ms, 2),
            cache_hit=False,
            retrieval_mode=req.mode,
            retrieved_chunks=[],
            tokens_used=0,
            estimated_cost_saved_usd=0.0,
            provider="offline",
            model="none",
            timings_ms=dict(app_state.engine.last_timings_ms),
        )

    # 3. Grounded Synthesis with strict Pydantic Citations
    t_synth_start = time.perf_counter()
    active_prov = (req.provider or "auto").lower()
    active_mod = req.model
    if active_prov == "auto" and getattr(app_state, "active_provider", None) not in (None, "", "offline"):
        active_prov = app_state.active_provider
        active_mod = active_mod or getattr(app_state, "active_model", None)
    response = app_state.synthesizer.synthesize(
        query=req.query,
        retrieved_chunks=retrieved_chunks,
        provider=active_prov,
        model=active_mod,
        custom_api_key=req.custom_api_key,
        retrieval_mode=req.mode,
    )
    t_synth_ms = (time.perf_counter() - t_synth_start) * 1000
    total_ms = round((time.perf_counter() - t0) * 1000, 2)

    stage_timings = dict(app_state.engine.last_timings_ms)
    stage_timings["synthesis"] = round(t_synth_ms, 2)
    stage_timings["total"] = total_ms
    response.latency_ms = total_ms
    response.timings_ms = stage_timings

    # 4. Cache only successful answers (never a failed-live-call fallback)
    if req.use_cache and not response.fallback_reason:
        app_state.cache.store(
            req.query,
            response,
            mode=req.mode,
            document_id=req.document_id,
            engine=scope,
        )

    return response


class KeyTestRequest(BaseModel):
    provider: str
    api_key: str
    model: Optional[str] = None


@router.post("/api/v1/auth/test_key")
async def test_key_connection(req: KeyTestRequest) -> Dict[str, Any]:
    """Tests if a provided API key is valid with auto-detection across Google Gemini, OpenAI, Claude, Groq, and OpenRouter."""
    from src.generation.llm_gateway import LLMGateway
    key = req.api_key.strip()
    if not key:
        return {"success": False, "message": "API key cannot be empty"}

    # Determine candidate providers to test (auto-detect primary guess, fallback to others)
    detected = LLMGateway.auto_detect_provider(key, req.provider, req.model)
    primary_provider = detected["provider"]

    providers_to_test = [primary_provider]  # never send a key to a provider the user did not choose

    last_err = None
    for prov in providers_to_test:
        try:
            if prov == "gemini":
                from google import genai
                client = genai.Client(api_key=key)

                available_models: List[str] = []
                try:
                    for m in client.models.list():
                        m_name = m.name.replace("models/", "")
                        actions = getattr(m, "supported_actions", None) or []
                        if not actions or "generateContent" in actions:
                            available_models.append(m_name)
                except Exception as auth_err:
                    last_err = auth_err
                    continue

                priority_order = [
                    "gemini-2.5-flash",
                    "gemini-2.5-flash-lite",
                    "gemini-2.0-flash",
                ]
                candidate_models: List[str] = []
                if req.model and prov == primary_provider:
                    clean_req = req.model.replace("models/", "").strip()
                    if clean_req and not clean_req.startswith("gemma"):
                        candidate_models.append(clean_req)

                for p in priority_order:
                    if p in available_models and p not in candidate_models:
                        candidate_models.append(p)

                for m in available_models:
                    if not m.startswith("gemma") and m not in candidate_models:
                        candidate_models.append(m)
                for m in available_models:
                    if m.startswith("gemma") and m not in candidate_models:
                        candidate_models.append(m)

                if not candidate_models:
                    candidate_models = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"]

                for m in candidate_models:
                    try:
                        client.models.generate_content(
                            model=m,
                            contents="Respond with the word 'OK'",
                        )
                        import os
                        from src.api.app import app_state
                        os.environ["GEMINI_API_KEY"] = key
                        app_state.gateway.default_api_key = key
                        app_state.active_provider = "gemini"
                        app_state.active_model = m

                        return {
                            "success": True,
                            "provider": "gemini",
                            "model": m,
                            "available_models": available_models[:12],
                            "message": f"Google Gemini API key verified & active ({m}).",
                        }
                    except Exception as gen_err:
                        last_err = gen_err
                        continue

            elif prov == "openai":
                import httpx
                headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
                m = req.model or "gpt-4o-mini"
                payload = {"model": m, "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}
                with httpx.Client(timeout=10.0) as client:
                    res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                    res.raise_for_status()

                import os
                from src.api.app import app_state
                os.environ["OPENAI_API_KEY"] = key
                app_state.gateway.default_api_key = key
                app_state.active_provider = "openai"
                app_state.active_model = m

                return {
                    "success": True,
                    "provider": "openai",
                    "model": m,
                    "message": f"OpenAI API key verified & active ({m}).",
                }

            elif prov in ("anthropic", "claude"):
                import httpx
                headers = {"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"}
                m = req.model or "claude-sonnet-4-5"
                payload = {"model": m, "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}
                with httpx.Client(timeout=10.0) as client:
                    res = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                    res.raise_for_status()

                import os
                from src.api.app import app_state
                os.environ["ANTHROPIC_API_KEY"] = key
                app_state.gateway.default_api_key = key
                app_state.active_provider = "anthropic"
                app_state.active_model = m

                return {
                    "success": True,
                    "provider": "anthropic",
                    "model": m,
                    "message": f"Anthropic Claude API key verified & active ({m}).",
                }

            elif prov == "groq":
                import httpx
                headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
                m = req.model or "llama-3.3-70b-versatile"
                payload = {"model": m, "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}
                with httpx.Client(timeout=10.0) as client:
                    res = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                    res.raise_for_status()

                import os
                from src.api.app import app_state
                os.environ["GROQ_API_KEY"] = key
                app_state.gateway.default_api_key = key
                app_state.active_provider = "groq"
                app_state.active_model = m

                return {
                    "success": True,
                    "provider": "groq",
                    "model": m,
                    "message": f"Groq Cloud API key verified & active ({m}).",
                }

            elif prov == "openrouter":
                import httpx
                headers = {
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:8001",
                    "X-Title": "Synapse RAG",
                }
                m = req.model or "google/gemini-2.0-flash-001"
                payload = {"model": m, "max_tokens": 10, "messages": [{"role": "user", "content": "Hi"}]}
                with httpx.Client(timeout=10.0) as client:
                    res = client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
                    res.raise_for_status()

                import os
                from src.api.app import app_state
                os.environ["OPENROUTER_API_KEY"] = key
                app_state.gateway.default_api_key = key
                app_state.active_provider = "openrouter"
                app_state.active_model = m

                return {
                    "success": True,
                    "provider": "openrouter",
                    "model": m,
                    "message": f"OpenRouter API key verified & active ({m}).",
                }

        except Exception as prov_err:
            last_err = prov_err
            continue

    from src.generation.llm_gateway import LLMGateway as _GW
    reason = _GW._describe_error(last_err) if last_err else "unknown error"
    return {"success": False, "message": f"Key check failed for {primary_provider}: {reason}"}


@router.post("/api/v1/auth/set_key")
async def save_active_key(req: KeyTestRequest) -> Dict[str, Any]:
    """Saves and activates an API key in the backend gateway state with auto-detection."""
    from src.api.app import app_state
    from src.generation.llm_gateway import LLMGateway
    import os

    key = req.api_key.strip()
    if not key:
        return {"success": False, "message": "API key cannot be empty"}

    det = LLMGateway.auto_detect_provider(key, req.provider, req.model)
    provider = det["provider"]
    model = det["model"]

    if provider == "gemini":
        os.environ["GEMINI_API_KEY"] = key
    elif provider == "openai":
        os.environ["OPENAI_API_KEY"] = key
    elif provider in ("anthropic", "claude"):
        os.environ["ANTHROPIC_API_KEY"] = key
    elif provider == "groq":
        os.environ["GROQ_API_KEY"] = key
    elif provider == "openrouter":
        os.environ["OPENROUTER_API_KEY"] = key

    app_state.gateway.default_api_key = key
    app_state.active_provider = provider
    app_state.active_model = model

    return {
        "success": True,
        "provider": provider,
        "model": model,
        "message": f"Successfully activated {det['label']} ({model}) in backend gateway.",
    }


@router.post("/api/v1/auth/disconnect")
async def disconnect_key() -> Dict[str, Any]:
    """Disconnects the active API key and returns backend to offline mode."""
    from src.api.app import app_state
    import os

    os.environ.pop("GEMINI_API_KEY", None)
    os.environ.pop("OPENAI_API_KEY", None)
    os.environ.pop("ANTHROPIC_API_KEY", None)
    os.environ.pop("GROQ_API_KEY", None)
    os.environ.pop("OPENROUTER_API_KEY", None)

    app_state.gateway.default_api_key = None
    app_state.active_provider = "offline"
    app_state.active_model = "offline-zero-drain"

    return {
        "success": True,
        "provider": "offline",
        "model": "offline-zero-drain",
        "message": "Gateway disconnected. Reverted to offline deterministic mode.",
    }


@router.get("/api/v1/auth/key_status")
async def get_key_status() -> Dict[str, Any]:
    """Returns the live status of the AI Gateway in the backend."""
    from src.api.app import app_state
    import os

    active_p = getattr(app_state, "active_provider", None) or "offline"
    active_m = getattr(app_state, "active_model", None) or "offline-zero-drain"
    active_key = app_state.gateway.default_api_key or ""

    env_map = {
        "gemini": os.environ.get("GEMINI_API_KEY", "").strip(),
        "openai": os.environ.get("OPENAI_API_KEY", "").strip(),
        "anthropic": os.environ.get("ANTHROPIC_API_KEY", "").strip(),
        "groq": os.environ.get("GROQ_API_KEY", "").strip(),
        "openrouter": os.environ.get("OPENROUTER_API_KEY", "").strip(),
    }
    if not active_key and active_p in env_map:
        active_key = env_map[active_p]

    if not active_key:
        for p_name, k_val in env_map.items():
            if k_val:
                active_key = k_val
                active_p = p_name
                break

    if active_key and active_p != "offline":
        masked = active_key[:6] + "..." + active_key[-4:] if len(active_key) > 10 else "***"
        label_map = {
            "gemini": f"Google Gemini ({active_m})",
            "openai": f"OpenAI ({active_m})",
            "anthropic": f"Anthropic Claude ({active_m})",
            "groq": f"Groq Cloud ({active_m})",
            "openrouter": f"OpenRouter ({active_m})",
        }
        return {
            "has_key": True,
            "provider": active_p,
            "model": active_m,
            "label": label_map.get(active_p, f"{active_p.title()} ({active_m})"),
            "masked_key": masked,
            "status": "connected",
        }

    return {
        "has_key": False,
        "provider": "offline",
        "model": "offline-zero-drain",
        "label": "Offline Deterministic Mode",
        "masked_key": "",
        "status": "offline",
    }


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
