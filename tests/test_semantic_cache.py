"""Tests for Redis Semantic Cache."""

import pytest
from src.cache.semantic_cache import SemanticCache
from src.schemas.models import GroundedResponse, Citation


def test_semantic_cache_hit_and_miss():
    cache = SemanticCache(similarity_threshold=0.90)

    # Initial query should be a miss
    miss = cache.check("What is CVE-2024-8192 memory offset?")
    assert miss is None

    # Store response
    resp = GroundedResponse(
        query="What is CVE-2024-8192 memory offset?",
        answer="The memory offset is 0x7fff90a4 [1].",
        citations=[
            Citation(
                citation_id=1,
                chunk_id="c1",
                document_title="CVE Advisory",
                section_title="Technical Analysis",
                page_number=2,
                exact_quote="memory offset 0x7fff90a4",
                relevance_score=0.98,
            )
        ],
        confidence_score=0.98,
        faithfulness_score=1.0,
        latency_ms=250.0,
        cache_hit=False,
        retrieval_mode="hybrid",
        retrieved_chunks=[],
        tokens_used=120,
    )
    cache.store("What is CVE-2024-8192 memory offset?", resp)

    # Subsequent identical query should be a CACHE HIT
    hit_result = cache.check("What is CVE-2024-8192 memory offset?")
    assert hit_result is not None
    cached_resp, sim = hit_result
    assert cached_resp.cache_hit is True
    assert cached_resp.latency_ms < 50.0  # Fast cache return
    assert sim >= 0.95

    # Check telemetry
    stats = cache.get_stats()
    assert stats.total_queries == 2
    assert stats.cache_hits == 1
    assert stats.cache_misses == 1
    assert stats.estimated_cost_saved_usd > 0.0
