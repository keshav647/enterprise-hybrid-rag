"""Tests for BM25Okapi inverted index."""

import pytest
from src.retrieval.bm25_index import BM25Index
from src.schemas.models import DocumentChunk


def test_bm25_tokenizer_technical_tokens():
    bm25 = BM25Index()
    tokens = bm25.tokenize("Vulnerability CVE-2024-8192 located at offset 0x7fff90a4 in af_packet.c")
    assert "cve-2024-8192" in tokens
    assert "0x7fff90a4" in tokens
    assert "af_packet.c" in tokens


def test_bm25_scoring_exact_match():
    bm25 = BM25Index()
    c1 = DocumentChunk(
        chunk_id="c1",
        document_id="doc1",
        document_title="Advisory",
        section_title="Security",
        page_number=1,
        content="Linux kernel memory offset 0x7fff90a4 patched in commit a7f8e910c2d3.",
    )
    c2 = DocumentChunk(
        chunk_id="c2",
        document_id="doc2",
        document_title="Financials",
        section_title="Revenue",
        page_number=1,
        content="Q3 cloud infrastructure generated $14.82 billion in consolidated revenue.",
    )

    bm25.index_chunks([c1, c2])

    results = bm25.search("0x7fff90a4", top_k=2)
    assert len(results) > 0
    assert results[0][0] == "c1"
    assert results[0][1] > 0.0

    fin_results = bm25.search("revenue $14.82", top_k=2)
    assert len(fin_results) > 0
    assert fin_results[0][0] == "c2"
