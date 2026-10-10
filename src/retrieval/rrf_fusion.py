"""Reciprocal Rank Fusion (RRF) algorithm combining dense and sparse rankings."""

from typing import List, Tuple, Dict, Any, Optional
from collections import defaultdict


class ReciprocalRankFusion:
    """Merges disparate search ranking lists using Reciprocal Rank Fusion (RRF).

    Formula:
        RRF_Score(d) = sum(1.0 / (k + rank_m(d))) for each retrieval modality m
    where k is a smoothing hyperparameter (typically k=60) that prevents top-ranked
    results from disproportionately dominating lower-ranked items.
    """

    def __init__(self, k: int = 60):
        self.k = k

    def fuse(
        self,
        dense_results: List[Tuple[str, float]],
        bm25_results: List[Tuple[str, float]],
        top_k: int = 30,
    ) -> List[Dict[str, Any]]:
        """Merges ranked lists from Dense Vector and BM25 retrievers.

        Args:
            dense_results: List of (chunk_id, cosine_score) sorted descending
            bm25_results: List of (chunk_id, bm25_score) sorted descending
            top_k: Number of fused candidates to return

        Returns:
            List of dictionaries containing:
                - chunk_id: str
                - rrf_score: float
                - dense_rank: Optional[int] (1-indexed)
                - bm25_rank: Optional[int] (1-indexed)
                - dense_score: Optional[float]
                - bm25_score: Optional[float]
                - score_breakdown: Dict[str, float]
        """
        all_chunk_ids = set()
        dense_ranks: Dict[str, int] = {}
        dense_scores: Dict[str, float] = {}

        for rank, (chunk_id, score) in enumerate(dense_results, start=1):
            dense_ranks[chunk_id] = rank
            dense_scores[chunk_id] = score
            all_chunk_ids.add(chunk_id)

        bm25_ranks: Dict[str, int] = {}
        bm25_scores: Dict[str, float] = {}

        for rank, (chunk_id, score) in enumerate(bm25_results, start=1):
            bm25_ranks[chunk_id] = rank
            bm25_scores[chunk_id] = score
            all_chunk_ids.add(chunk_id)

        fused_items: List[Dict[str, Any]] = []

        for chunk_id in all_chunk_ids:
            d_rank = dense_ranks.get(chunk_id)
            b_rank = bm25_ranks.get(chunk_id)

            d_comp = (1.0 / (self.k + d_rank)) if d_rank is not None else 0.0
            b_comp = (1.0 / (self.k + b_rank)) if b_rank is not None else 0.0
            total_rrf = d_comp + b_comp

            fused_items.append({
                "chunk_id": chunk_id,
                "rrf_score": total_rrf,
                "dense_rank": d_rank,
                "bm25_rank": b_rank,
                "dense_score": dense_scores.get(chunk_id),
                "bm25_score": bm25_scores.get(chunk_id),
                "score_breakdown": {
                    "dense_component": d_comp,
                    "bm25_component": b_comp,
                    "k": self.k,
                },
            })

        # Sort descending by fused RRF score
        fused_items.sort(key=lambda x: x["rrf_score"], reverse=True)
        return fused_items[:top_k]
