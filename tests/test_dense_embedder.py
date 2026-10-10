"""Tests for DenseEmbedder and cosine similarity."""

import pytest
import math
from src.retrieval.dense_embedder import DenseEmbedder


def test_dense_embedder_normalization():
    embedder = DenseEmbedder()
    vec = embedder.embed_text("High-performance distributed raft consensus state machine")

    assert len(vec) == embedder.DIMENSION
    # Check L2 norm equals 1.0
    norm = math.sqrt(sum(x * x for x in vec))
    assert abs(norm - 1.0) < 1e-4


def test_cosine_similarity_identity_and_orthogonality():
    embedder = DenseEmbedder()
    v1 = embedder.embed_text("enterprise cloud revenue $14.82B")
    v2 = embedder.embed_text("enterprise cloud revenue $14.82B")
    v3 = embedder.embed_text("kernel vulnerability memory offset 0x7fff90a4")

    sim_identical = embedder.cosine_similarity(v1, v2)
    assert abs(sim_identical - 1.0) < 1e-4

    sim_different = embedder.cosine_similarity(v1, v3)
    assert sim_different < sim_identical
    assert -1.0 <= sim_different <= 1.0
