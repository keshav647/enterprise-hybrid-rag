"""Tests for GroundedSynthesizer and citation verification."""

import pytest
from src.generation.synthesizer import GroundedSynthesizer
from src.schemas.models import SearchResultItem


def test_synthesizer_grounding_and_citations():
    synth = GroundedSynthesizer()

    chunk1 = SearchResultItem(
        chunk_id="cve_doc_c001",
        document_id="cve_doc",
        document_title="Kernel Advisory",
        section_title="Technical Analysis",
        page_number=2,
        content="Faulting Function: packet_set_ring() at memory offset 0x7fff90a4.",
        score=0.98,
    )

    response = synth.synthesize(
        query="What is the memory offset of CVE-2024-8192?",
        retrieved_chunks=[chunk1],
        retrieval_mode="hybrid",
    )

    assert "0x7fff90a4" in response.answer
    assert "[1]" in response.answer
    assert len(response.citations) >= 1
    assert response.citations[0].chunk_id == "cve_doc_c001"
    assert "0x7fff90a4" in response.citations[0].exact_quote
    assert response.faithfulness_score == 1.0
