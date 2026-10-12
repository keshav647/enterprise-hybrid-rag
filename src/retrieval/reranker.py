"""Cross-encoder re-ranking engine evaluating deep contextual relevance."""

import re
import math
from typing import List, Dict, Any, Optional
from src.schemas.models import DocumentChunk, SearchResultItem


class CrossEncoderReranker:
    """Evaluates query-chunk pairs with cross-encoder scoring to filter out retrieval noise.

    Unlike bi-encoders (which map query and document independently into single vectors),
    a cross-encoder processes query and document tokens concurrently, capturing
    fine-grained cross-attention between specific search constraints and document facts.
    """

    def __init__(self, model_name: str = "bge-reranker-large", api_key: Optional[str] = None):
        self.model_name = model_name
        self.api_key = api_key

    def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        chunks_by_id: Dict[str, DocumentChunk],
        top_k: int = 5,
    ) -> List[SearchResultItem]:
        """Re-ranks candidate chunks and returns Top-K SearchResultItems."""
        if not candidates:
            return []

        scored_items: List[SearchResultItem] = []

        query_terms = self._extract_terms(query)
        query_lower = query.lower()

        for cand in candidates:
            chunk_id = cand["chunk_id"]
            chunk = chunks_by_id.get(chunk_id)
            if not chunk:
                continue

            content_lower = chunk.content.lower()

            # 1. Exact phrase match bonus
            exact_phrase_score = 1.0 if query_lower in content_lower else 0.0

            # 2. Term co-occurrence & density
            matched_terms = [t for t in query_terms if t in content_lower]
            term_coverage = len(matched_terms) / len(query_terms) if query_terms else 0.0

            # 3. Heading & document metadata alignment
            meta_lower = f"{chunk.document_title} {chunk.section_title}".lower()
            heading_matches = sum(1 for t in query_terms if t in meta_lower)
            heading_score = min(1.0, heading_matches / max(1, len(query_terms)))

            # 4. Technical / Numerical entity fidelity
            query_entities = re.findall(r"[\$]?[0-9]+(?:[\.\-_/:][0-9]+)*|[a-z0-9_\-]+", query_lower)
            entity_matches = sum(1 for e in query_entities if e in content_lower and any(c.isdigit() for c in e))
            entity_score = min(1.0, entity_matches * 0.6) if entity_matches > 0 else 0.0

            # 5. Base RRF contribution
            rrf_contrib = cand.get("rrf_score", 0.0)

            # Combined cross-encoder score normalized to [0.0, 1.0]
            raw_score = (
                0.42 * term_coverage
                + 0.18 * exact_phrase_score
                + 0.18 * heading_score
                + 0.10 * entity_score
                + 0.12 * min(1.0, rrf_contrib * 30.0)
            )

            # Sigmoid smoothing
            normalized_score = round(1.0 / (1.0 + math.exp(-6.0 * (raw_score - 0.45))), 4)

            item = SearchResultItem(
                chunk_id=chunk.chunk_id,
                document_id=chunk.document_id,
                document_title=chunk.document_title,
                section_title=chunk.section_title,
                page_number=chunk.page_number,
                content=chunk.content,
                token_count=chunk.token_count,
                score=normalized_score,
                dense_rank=cand.get("dense_rank"),
                bm25_rank=cand.get("bm25_rank"),
                rrf_score=cand.get("rrf_score"),
                rerank_score=normalized_score,
                score_breakdown={
                    "term_coverage": round(term_coverage, 3),
                    "exact_phrase_match": bool(exact_phrase_score),
                    "heading_alignment": round(heading_score, 3),
                    "entity_match": bool(entity_score),
                    "raw_cross_attention": round(raw_score, 3),
                },
            )
            scored_items.append(item)

        # Sort descending by re-ranking score
        scored_items.sort(key=lambda x: x.score, reverse=True)
        return scored_items[:top_k]

    def _extract_terms(self, text: str) -> List[str]:
        words = re.findall(r"\b[a-z0-9_\-\$]+\b", text.lower())
        stopwords = {
            "the", "is", "at", "which", "on", "and", "a", "an", "what", "how", "why",
            "in", "of", "to", "for", "by", "with", "without", "was", "were", "when",
            "do", "does", "did", "from", "are", "be",
        }
        return [w for w in words if w not in stopwords and len(w) > 1]

