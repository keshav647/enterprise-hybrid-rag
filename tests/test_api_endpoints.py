"""Integration tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient
from src.api.app import app, app_state


@pytest.fixture(scope="module")
def client():
    # Bootstrap default benchmark documents
    app_state.bootstrap_default_documents()
    return TestClient(app)


def test_health_endpoint(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["total_documents"] >= 3
    assert data["total_chunks"] >= 5


def test_list_and_get_documents(client):
    res = client.get("/api/v1/documents")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) >= 3

    first_doc_id = docs[0]["document_id"]
    detail_res = client.get(f"/api/v1/documents/{first_doc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "metadata" in detail
    assert "chunks" in detail
    assert len(detail["chunks"]) > 0


def test_search_endpoint_hybrid_and_cache(client):
    # First search request
    payload = {
        "query": "What is the memory offset and vulnerable function in CVE-2024-8192?",
        "mode": "hybrid",
        "top_k": 5,
        "use_cache": True,
    }
    res1 = client.post("/api/v1/search", json=payload)
    assert res1.status_code == 200
    data1 = res1.json()
    assert "0x7fff90a4" in data1["answer"]
    assert len(data1["citations"]) >= 1
    assert data1["faithfulness_score"] >= 0.8
    assert data1["cache_hit"] is False

    # Second identical query should be CACHE HIT
    res2 = client.post("/api/v1/search", json=payload)
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["cache_hit"] is True
    assert data2["latency_ms"] < 50.0


def test_search_raw_inspection(client):
    payload = {
        "query": "Q3 consolidated revenue and AI cloud growth",
        "top_k": 5,
    }
    res = client.post("/api/v1/search/raw", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "timings_ms" in data
    assert "dense_top" in data
    assert "bm25_top" in data
    assert "fused_top" in data
    assert "final_reranked" in data


def test_cache_stats_and_clear(client):
    stats_res = client.get("/api/v1/cache/stats")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "total_queries" in stats

    clear_res = client.post("/api/v1/cache/clear")
    assert clear_res.status_code == 200
    assert "cleared" in clear_res.json()["message"]


def test_benchmarks_endpoint(client):
    res = client.get("/api/v1/benchmarks")
    assert res.status_code == 200
    data = res.json()
    assert "performance_matrix" in data
    matrix = data["performance_matrix"]
    assert "hybrid_reranked" in matrix
    assert matrix["hybrid_reranked"]["avg_context_recall"] > 0.8


def test_auth_detect_endpoint(client):
    res = client.get("/api/v1/auth/detect")
    assert res.status_code == 200
    data = res.json()
    assert "provider" in data
    assert "model" in data
    assert "label" in data
    assert "status" in data


def test_test_key_endpoint(client):
    # Empty key test
    res = client.post("/api/v1/auth/test_key", json={"provider": "gemini", "api_key": ""})
    assert res.status_code == 200
    assert res.json()["success"] is False

    # Unsupported provider
    res2 = client.post("/api/v1/auth/test_key", json={"provider": "unknown_ai", "api_key": "dummy"})
    assert res2.status_code == 200
    assert res2.json()["success"] is False
