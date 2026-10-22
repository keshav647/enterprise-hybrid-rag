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


def test_custom_key_reaches_provider(monkeypatch):
    from src.generation.llm_gateway import LLMGateway
    seen = {}

    def fake_openai(self, query, chunks, key, model):
        seen["key"], seen["model"] = key, model
        return {"answer": "30 days [1]", "citations": []}

    monkeypatch.setattr(LLMGateway, "_call_openai", fake_openai)
    out = LLMGateway().generate_synthesis(
        "refund?",
        [SearchResultItem(chunk_id="doc_c001", document_id="doc", document_title="Doc", section_title="S", content="The refund window is 30 days.", score=0.9)],
        provider="openai",
        model="auto",
        custom_api_key="sk-test",
    )
    assert seen == {"key": "sk-test", "model": "gpt-4o-mini"}
    assert out["provider"] == "openai" and "fallback_reason" not in out


def test_failed_call_reports_reason(monkeypatch):
    from src.generation.llm_gateway import LLMGateway

    def boom(self, *a, **k):
        raise RuntimeError("quota exhausted")

    monkeypatch.setattr(LLMGateway, "_call_groq", boom)
    out = LLMGateway().generate_synthesis(
        "refund?",
        [SearchResultItem(chunk_id="doc_c001", document_id="doc", document_title="Doc", section_title="S", content="The refund window is 30 days.", score=0.9)],
        provider="groq",
        custom_api_key="gsk_x",
    )
    assert out["provider"] == "offline"
    assert "quota exhausted" in out["fallback_reason"]


def test_offline_never_calls_network(monkeypatch):
    from src.generation.llm_gateway import LLMGateway

    def boom(self, *a, **k):
        raise AssertionError("network must not be used")

    for name in ("_call_gemini", "_call_openai", "_call_anthropic", "_call_groq", "_call_openrouter"):
        monkeypatch.setattr(LLMGateway, name, boom)
    out = LLMGateway().generate_synthesis(
        "refund?",
        [SearchResultItem(chunk_id="doc_c001", document_id="doc", document_title="Doc", section_title="S", content="The refund window is 30 days.", score=0.9)],
        provider="offline",
        custom_api_key="sk-test",
    )
    assert out["provider"] == "offline"

