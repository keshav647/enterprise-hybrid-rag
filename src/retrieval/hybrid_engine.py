"""Master Hybrid Retrieval Engine coordinating Dense, Sparse BM25, RRF, and Re-ranking."""

import time
from typing import List, Dict, Any, Optional, Tuple, Literal
from src.schemas.models import DocumentChunk, SearchResultItem
from src.retrieval.dense_embedder import DenseEmbedder
from src.retrieval.bm25_index import BM25Index
from src.retrieval.rrf_fusion import ReciprocalRankFusion
from src.retrieval.reranker import CrossEncoderReranker
from src.retrieval.vector_store import InMemoryVectorStore


class HybridRetrievalEngine:
    """Orchestrates multi-stage retrieval:

    Stage 1: Dual Retrieval (Dense vector cosine search + BM25 sparse keyword inverted index).
    Stage 2: Reciprocal Rank Fusion (RRF) to merge ranks across modalities with smoothing constant k.
    Stage 3: Cross-Encoder Re-ranking to score deep cross-attention relevance and discard noise.
    """

    def __init__(
        self,
        embedder: Optional[DenseEmbedder] = None,
        bm25_index: Optional[BM25Index] = None,
        rrf: Optional[ReciprocalRankFusion] = None,
        reranker: Optional[CrossEncoderReranker] = None,
        vector_store: Optional[InMemoryVectorStore] = None,
    ):
        self.embedder = embedder or DenseEmbedder()
        self.vector_store = vector_store or InMemoryVectorStore(self.embedder)
        self.bm25 = bm25_index or BM25Index()
        self.rrf = rrf or ReciprocalRankFusion(k=60)
        self.reranker = reranker or CrossEncoderReranker()
        self.chunks_by_id: Dict[str, DocumentChunk] = {}
        self.last_timings_ms: Dict[str, float] = {}

    def index_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Indexes chunks into both the vector store and the BM25 inverted index."""
        for chunk in chunks:
            self.chunks_by_id[chunk.chunk_id] = chunk

        self.vector_store.add_chunks(chunks)
        self.bm25.index_chunks(chunks)

    def retrieve(
        self,
        query: str,
        mode: Literal["hybrid", "dense", "bm25"] = "hybrid",
        top_k: int = 5,
        rrf_k: int = 60,
        use_reranker: bool = True,
        candidate_count: int = 30,
        document_id: Optional[str] = None,
    ) -> List[SearchResultItem]:
        """Executes retrieval according to specified mode and optional document_id scope."""
        if not self.chunks_by_id:
            return []

        if mode == "dense":
            items = self._retrieve_dense_only(query, top_k=candidate_count if document_id else top_k)
        elif mode == "bm25":
            items = self._retrieve_bm25_only(query, top_k=candidate_count if document_id else top_k)
        else:
            items = self._retrieve_hybrid(query, top_k if not document_id else candidate_count, rrf_k, use_reranker, candidate_count)

        if document_id:
            items = [it for it in items if it.document_id == document_id][:top_k]

        return items[:top_k]

    def _retrieve_dense_only(self, query: str, top_k: int) -> List[SearchResultItem]:
        t0 = time.perf_counter()
        dense_results = self.vector_store.search(query, top_k=top_k)
        t_dense = (time.perf_counter() - t0) * 1000
        self.last_timings_ms = {
            "dense": round(t_dense, 2),
            "bm25": 0.0,
            "rrf": 0.0,
            "rerank": 0.0,
            "total": round(t_dense, 2),
        }
        items: List[SearchResultItem] = []
        for rank, (chunk_id, score) in enumerate(dense_results, start=1):
            chunk = self.chunks_by_id.get(chunk_id)
            if not chunk:
                continue
            items.append(SearchResultItem(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                section_title=chunk.section_title,
                page_number=chunk.page_number,
                content=chunk.content,
                token_count=chunk.token_count,
                score=round(score, 4),
                dense_rank=rank,
                bm25_rank=None,
                rrf_score=None,
                rerank_score=None,
                score_breakdown={"cosine_similarity": round(score, 4)},
            ))
        return items

    def _retrieve_bm25_only(self, query: str, top_k: int) -> List[SearchResultItem]:
        t0 = time.perf_counter()
        bm25_results = self.bm25.search(query, top_k=top_k)
        t_bm25 = (time.perf_counter() - t0) * 1000
        self.last_timings_ms = {
            "dense": 0.0,
            "bm25": round(t_bm25, 2),
            "rrf": 0.0,
            "rerank": 0.0,
            "total": round(t_bm25, 2),
        }
        items: List[SearchResultItem] = []
        for rank, (chunk_id, score) in enumerate(bm25_results, start=1):
            chunk = self.chunks_by_id.get(chunk_id)
            if not chunk:
                continue
            items.append(SearchResultItem(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                section_title=chunk.section_title,
                page_number=chunk.page_number,
                content=chunk.content,
                token_count=chunk.token_count,
                score=round(score, 4),
                dense_rank=None,
                bm25_rank=rank,
                rrf_score=None,
                rerank_score=None,
                score_breakdown={"bm25_score": round(score, 4)},
            ))
        return items

    def _retrieve_hybrid(
        self,
        query: str,
        top_k: int,
        rrf_k: int,
        use_reranker: bool,
        candidate_count: int,
    ) -> List[SearchResultItem]:
        # Stage 1: Dual Retrieval
        t0 = time.perf_counter()
        dense_candidates = self.vector_store.search(query, top_k=candidate_count)
        t_dense = (time.perf_counter() - t0) * 1000

        t1 = time.perf_counter()
        bm25_candidates = self.bm25.search(query, top_k=candidate_count)
        t_bm25 = (time.perf_counter() - t1) * 1000

        # Stage 2: Reciprocal Rank Fusion
        t2 = time.perf_counter()
        self.rrf.k = rrf_k
        fused = self.rrf.fuse(dense_candidates, bm25_candidates, top_k=candidate_count)
        t_rrf = (time.perf_counter() - t2) * 1000

        # Stage 3: Cross-Encoder Re-ranking
        if use_reranker:
            t3 = time.perf_counter()
            reranked = self.reranker.rerank(
                query=query,
                candidates=fused,
                chunks_by_id=self.chunks_by_id,
                top_k=top_k,
            )
            t_rerank = (time.perf_counter() - t3) * 1000
            self.last_timings_ms = {
                "dense": round(t_dense, 2),
                "bm25": round(t_bm25, 2),
                "rrf": round(t_rrf, 2),
                "rerank": round(t_rerank, 2),
                "total": round(t_dense + t_bm25 + t_rrf + t_rerank, 2),
            }
            return reranked
        else:
            self.last_timings_ms = {
                "dense": round(t_dense, 2),
                "bm25": round(t_bm25, 2),
                "rrf": round(t_rrf, 2),
                "rerank": 0.0,
                "total": round(t_dense + t_bm25 + t_rrf, 2),
            }
            items: List[SearchResultItem] = []
            for cand in fused[:top_k]:
                chunk = self.chunks_by_id.get(cand["chunk_id"])
                if not chunk:
                    continue
                items.append(SearchResultItem(
                    chunk_id=chunk.chunk_id,
                    document_id=chunk.document_id,
                    document_title=chunk.document_title,
                    section_title=chunk.section_title,
                    page_number=chunk.page_number,
                    content=chunk.content,
                    token_count=chunk.token_count,
                    score=round(cand["rrf_score"], 4),
                    dense_rank=cand.get("dense_rank"),
                    bm25_rank=cand.get("bm25_rank"),
                    rrf_score=round(cand["rrf_score"], 4),
                    rerank_score=None,
                    score_breakdown=cand.get("score_breakdown"),
                ))
            return items

    def inspect_pipeline(self, query: str, top_k: int = 5, candidate_count: int = 20) -> Dict[str, Any]:
        """Provides full multi-stage telemetry inspection for observability dashboards."""
        t0 = time.perf_counter()
        dense_candidates = self.vector_store.search(query, top_k=candidate_count)
        t_dense = (time.perf_counter() - t0) * 1000

        t1 = time.perf_counter()
        bm25_candidates = self.bm25.search(query, top_k=candidate_count)
        t_bm25 = (time.perf_counter() - t1) * 1000

        t2 = time.perf_counter()
        fused = self.rrf.fuse(dense_candidates, bm25_candidates, top_k=candidate_count)
        t_rrf = (time.perf_counter() - t2) * 1000

        t3 = time.perf_counter()
        reranked = self.reranker.rerank(query, fused, self.chunks_by_id, top_k=top_k)
        t_rerank = (time.perf_counter() - t3) * 1000

        return {
            "query": query,
            "timings_ms": {
                "dense": round(t_dense, 2),
                "bm25": round(t_bm25, 2),
                "rrf": round(t_rrf, 2),
                "rerank": round(t_rerank, 2),
                "total": round(t_dense + t_bm25 + t_rrf + t_rerank, 2),
            },
            "dense_top": dense_candidates[:5],
            "bm25_top": bm25_candidates[:5],
            "fused_top": fused[:5],
            "final_reranked": [item.model_dump() for item in reranked],
        }
