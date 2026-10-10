"""Tests for Reciprocal Rank Fusion (RRF) algorithm."""

import pytest
from src.retrieval.rrf_fusion import ReciprocalRankFusion


def test_rrf_fusion_rank_calculation():
    rrf = ReciprocalRankFusion(k=60)

    # d1 is #1 in dense, #2 in BM25
    # d2 is #2 in dense, not in BM25
    # d3 is not in dense, #1 in BM25
    dense_results = [("d1", 0.95), ("d2", 0.85)]
    bm25_results = [("d3", 12.4), ("d1", 8.2)]

    fused = rrf.fuse(dense_results, bm25_results, top_k=3)

    assert len(fused) == 3
    # d1 should be top since it appears high in both modalities
    assert fused[0]["chunk_id"] == "d1"

    # Verify score calculation: 1/(60+1) + 1/(60+2)
    expected_d1_rrf = (1.0 / 61.0) + (1.0 / 62.0)
    assert abs(fused[0]["rrf_score"] - expected_d1_rrf) < 1e-5
    assert fused[0]["dense_rank"] == 1
    assert fused[0]["bm25_rank"] == 2


def test_rrf_fusion_empty_inputs():
    rrf = ReciprocalRankFusion(k=60)
    assert rrf.fuse([], [], top_k=5) == []
