"""Evaluation routes serving Ragas benchmarks and comparative metrics."""

from fastapi import APIRouter
from typing import Dict, Any
from src.schemas.models import BenchmarkReport
from src.evals.ragas_evaluator import RagasEvaluator

router = APIRouter(tags=["Evals & Benchmarks"])


@router.get("/api/v1/benchmarks")
async def get_benchmarks() -> Dict[str, Any]:
    """Returns comparative retrieval and synthesis performance matrix."""
    from src.api.app import app_state

    evaluator = RagasEvaluator(app_state.engine, app_state.synthesizer)
    matrix = evaluator.run_comparative_matrix()
    return {
        "status": "success",
        "benchmark_dataset_size": 10,
        "metrics_evaluated": [
            "Context Recall",
            "Context Precision (Rank-Weighted)",
            "Faithfulness",
            "Answer Relevance",
        ],
        "performance_matrix": matrix,
    }


@router.post("/api/v1/benchmarks/run", response_model=BenchmarkReport)
async def run_live_benchmark(mode: str = "hybrid", use_reranker: bool = True):
    """Executes a live evaluation run across the 10 benchmark queries."""
    from src.api.app import app_state

    evaluator = RagasEvaluator(app_state.engine, app_state.synthesizer)
    report = evaluator.run_benchmark_suite(retrieval_mode=mode, use_reranker=use_reranker)
    return report
