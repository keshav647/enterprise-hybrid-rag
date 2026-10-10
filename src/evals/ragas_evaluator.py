"""Ragas-inspired evaluation framework measuring Faithfulness, Answer Relevance, and Context Recall."""

from typing import List, Dict, Any, Optional
from src.schemas.models import EvalMetricResult, BenchmarkReport
from src.evals.test_fixtures import BENCHMARK_CASES
from src.retrieval.hybrid_engine import HybridRetrievalEngine
from src.generation.synthesizer import GroundedSynthesizer


class RagasEvaluator:
    """Computes Ragas evaluation metrics on enterprise retrieval and synthesis."""

    def __init__(
        self,
        engine: Optional[HybridRetrievalEngine] = None,
        synthesizer: Optional[GroundedSynthesizer] = None,
    ):
        self.engine = engine
        self.synthesizer = synthesizer

    def evaluate_case(
        self,
        case: Dict[str, Any],
        retrieval_mode: str = "hybrid",
        use_reranker: bool = True,
        top_k: int = 5,
    ) -> EvalMetricResult:
        """Evaluates a single benchmark case."""
        if not self.engine or not self.synthesizer:
            raise ValueError("Engine and Synthesizer must be initialized")

        query = case["query"]
        ground_truth_facts = case["ground_truth_facts"]

        # 1. Retrieve chunks
        retrieved_chunks = self.engine.retrieve(
            query=query,
            mode=retrieval_mode,
            top_k=top_k,
            use_reranker=use_reranker,
        )

        # 2. Compute Context Recall
        all_retrieved_text = " ".join(c.content.lower() for c in retrieved_chunks)
        matched_facts = 0
        for fact in ground_truth_facts:
            if fact.lower() in all_retrieved_text:
                matched_facts += 1
        context_recall = matched_facts / len(ground_truth_facts) if ground_truth_facts else 0.0

        # 3. Compute Context Precision (Rank-Weighted)
        precisions = []
        hits = 0
        for rank, chunk in enumerate(retrieved_chunks, start=1):
            c_text = chunk.content.lower()
            if any(fact.lower() in c_text for fact in ground_truth_facts):
                hits += 1
                precisions.append(hits / rank)
        context_precision = (sum(precisions) / hits) if hits > 0 else 0.0

        # 4. Synthesize Answer
        synth_resp = self.synthesizer.synthesize(
            query=query,
            retrieved_chunks=retrieved_chunks,
            retrieval_mode=retrieval_mode,
        )

        # 5. Compute Faithfulness & Answer Relevance
        faithfulness = synth_resp.faithfulness_score
        answer_lower = synth_resp.answer.lower()
        facts_in_answer = sum(1 for fact in ground_truth_facts if fact.lower() in answer_lower)
        answer_relevance = round(min(1.0, (facts_in_answer / len(ground_truth_facts)) + 0.2), 2) if ground_truth_facts else 0.8

        # 6. Harmonic F1
        denom = context_precision + context_recall
        f1 = (2 * context_precision * context_recall / denom) if denom > 0 else 0.0

        return EvalMetricResult(
            query=query,
            faithfulness=round(faithfulness, 3),
            answer_relevance=round(answer_relevance, 3),
            context_precision=round(context_precision, 3),
            context_recall=round(context_recall, 3),
            harmonic_f1=round(f1, 3),
            status="passed" if context_recall >= 0.5 else "degraded",
        )

    def run_benchmark_suite(
        self,
        retrieval_mode: str = "hybrid",
        use_reranker: bool = True,
        top_k: int = 5,
    ) -> BenchmarkReport:
        """Executes full benchmark suite across all 10 gold-standard enterprise queries."""
        results: List[EvalMetricResult] = []

        for case in BENCHMARK_CASES:
            res = self.evaluate_case(case, retrieval_mode=retrieval_mode, use_reranker=use_reranker, top_k=top_k)
            results.append(res)

        avg_faith = sum(r.faithfulness for r in results) / len(results)
        avg_rel = sum(r.answer_relevance for r in results) / len(results)
        avg_prec = sum(r.context_precision for r in results) / len(results)
        avg_rec = sum(r.context_recall for r in results) / len(results)

        return BenchmarkReport(
            total_queries=len(results),
            avg_faithfulness=round(avg_faith, 3),
            avg_answer_relevance=round(avg_rel, 3),
            avg_context_precision=round(avg_prec, 3),
            avg_context_recall=round(avg_rec, 3),
            comparisons={
                "retrieval_mode": retrieval_mode,
                "use_reranker": use_reranker,
                "top_k": top_k,
                "individual_results": [r.model_dump() for r in results],
            },
        )

    def run_comparative_matrix(self) -> Dict[str, Any]:
        """Runs all 4 retrieval modes to generate the comparative performance matrix."""
        modes = [
            ("dense_only", "dense", False),
            ("bm25_only", "bm25", False),
            ("hybrid_rrf", "hybrid", False),
            ("hybrid_reranked", "hybrid", True),
        ]

        matrix = {}
        for key, mode, rerank in modes:
            report = self.run_benchmark_suite(retrieval_mode=mode, use_reranker=rerank)
            matrix[key] = {
                "name": key.replace("_", " ").title(),
                "avg_context_precision": report.avg_context_precision,
                "avg_context_recall": report.avg_context_recall,
                "avg_faithfulness": report.avg_faithfulness,
                "avg_answer_relevance": report.avg_answer_relevance,
            }

        return matrix
