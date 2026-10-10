"""Tests for CrossEncoderReranker."""

import pytest
from src.retrieval.reranker import CrossEncoderReranker
from src.schemas.models import DocumentChunk


def test_cross_encoder_reranking_accuracy():
    reranker = CrossEncoderReranker()

    c1 = DocumentChunk(
        chunk_id="c1",
        document_id="doc1",
        document_title="Advisory",
        section_title="Remediation Protocol",
        page_number=3,
        content="Apply mitigation sysctl -w net.core.bpf_jit_harden=2 to harden BPF JIT offsets.",
    )
    c2 = DocumentChunk(
        chunk_id="c2",
        document_id="doc1",
        document_title="Advisory",
        section_title="General Info",
        page_number=1,
        content="General linux networking overview without specific sysctl commands.",
    )

    chunks_map = {"c1": c1, "c2": c2}
    candidates = [
        {"chunk_id": "c2", "rrf_score": 0.030, "dense_rank": 1, "bm25_rank": 2},
        {"chunk_id": "c1", "rrf_score": 0.028, "dense_rank": 2, "bm25_rank": 1},
    ]

    results = reranker.rerank(
        query="What sysctl command hardens BPF JIT?",
        candidates=candidates,
        chunks_by_id=chunks_map,
        top_k=2,
    )

    # c1 has exact phrase and command match, so it should be promoted to #1
    assert len(results) == 2
    assert results[0].chunk_id == "c1"
    assert results[0].score > results[1].score
    assert 0.0 <= results[0].score <= 1.0
