"""Tests for Ragas evaluation metrics on enterprise queries."""

import pytest
from src.evals.ragas_evaluator import RagasEvaluator
from src.evals.test_fixtures import BENCHMARK_CASES
from src.api.app import app_state


@pytest.fixture(scope="module")
def evaluator():
    app_state.bootstrap_default_documents()
    return RagasEvaluator(app_state.engine, app_state.synthesizer)


def test_evaluator_single_case(evaluator):
    case = BENCHMARK_CASES[0]  # CVE-2024-8192
    res = evaluator.evaluate_case(case, retrieval_mode="hybrid", use_reranker=True)

    assert res.context_recall >= 0.8
    assert res.context_precision >= 0.65
    assert res.faithfulness >= 0.8
    assert res.answer_relevance >= 0.8
    assert res.status == "passed"


def test_evaluator_comparative_matrix(evaluator):
    matrix = evaluator.run_comparative_matrix()
    assert "dense_only" in matrix
    assert "bm25_only" in matrix
    assert "hybrid_rrf" in matrix
    assert "hybrid_reranked" in matrix

    # Hybrid reranked should show top context precision and recall
    hybrid_reranked = matrix["hybrid_reranked"]
    assert hybrid_reranked["avg_context_recall"] >= 0.80
    assert hybrid_reranked["avg_context_precision"] >= 0.80
