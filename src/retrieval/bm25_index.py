"""BM25 (BM25Okapi) sparse keyword retrieval engine with inverted index."""

import re
import math
from typing import List, Dict, Tuple, Set, Optional
from collections import Counter, defaultdict
from src.schemas.models import DocumentChunk

STOPWORDS: Set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "cannot", "could", "did", "do", "does", "doing", "down", "during", "each",
    "few", "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers",
    "herself", "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "its",
    "itself", "me", "more", "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once",
    "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she",
    "should", "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves",
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until",
    "up", "very", "was", "wasn't", "we", "were", "what", "when", "where", "which", "while", "who",
    "whom", "why", "with", "would", "you", "your", "yours", "yourself", "yourselves"
}


class BM25Index:
    """Inverted index implementing BM25Okapi ranking for sparse keyword search."""

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.doc_count: int = 0
        self.avg_doc_len: float = 0.0
        self.doc_lengths: Dict[str, int] = {}
        self.inverted_index: Dict[str, List[Tuple[str, int]]] = defaultdict(list)
        self.doc_term_freqs: Dict[str, Dict[str, int]] = {}
        self.idf_cache: Dict[str, float] = {}
        self.chunks_by_id: Dict[str, DocumentChunk] = {}

    def tokenize(self, text: str) -> List[str]:
        """Tokenizes text preserving identifiers, technical acronyms, hex, and versions."""
        cleaned = text.lower()
        # Match tokens like cve-2024-8192, 0x7fff90a4, $14.82, 6.6.42, etc.
        raw_tokens = re.findall(r"[\$]?[a-z0-9]+(?:[\.\-_/:][a-z0-9]+)*", cleaned)
        tokens = [t for t in raw_tokens if t not in STOPWORDS and len(t) > 1]
        return tokens

    def index_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Builds or rebuilds the inverted index from document chunks."""
        self.doc_count = len(chunks)
        self.inverted_index.clear()
        self.doc_term_freqs.clear()
        self.doc_lengths.clear()
        self.idf_cache.clear()
        self.chunks_by_id.clear()

        if not chunks:
            self.avg_doc_len = 0.0
            return

        total_length = 0

        for chunk in chunks:
            self.chunks_by_id[chunk.chunk_id] = chunk
            tokens = self.tokenize(chunk.content)
            doc_len = len(tokens)
            self.doc_lengths[chunk.chunk_id] = doc_len
            total_length += doc_len

            term_counts = Counter(tokens)
            self.doc_term_freqs[chunk.chunk_id] = dict(term_counts)

            for term, count in term_counts.items():
                self.inverted_index[term].append((chunk.chunk_id, count))

        self.avg_doc_len = total_length / self.doc_count if self.doc_count > 0 else 0.0

        # Precompute IDF for all terms in vocabulary
        for term, postings in self.inverted_index.items():
            doc_freq = len(postings)
            # Standard Lucene / BM25Okapi IDF formula
            idf = math.log((self.doc_count - doc_freq + 0.5) / (doc_freq + 0.5) + 1.0)
            self.idf_cache[term] = max(0.0, idf)

    def search(self, query: str, top_k: int = 30) -> List[Tuple[str, float]]:
        """Searches index with BM25 scoring and returns (chunk_id, score) pairs."""
        query_tokens = self.tokenize(query)
        if not query_tokens or self.doc_count == 0:
            return []

        scores: Dict[str, float] = defaultdict(float)

        for token in query_tokens:
            if token not in self.inverted_index:
                continue

            idf = self.idf_cache.get(token, 0.0)
            postings = self.inverted_index[token]

            for chunk_id, tf in postings:
                doc_len = self.doc_lengths.get(chunk_id, 0)
                denom = tf + self.k1 * (1.0 - self.b + self.b * (doc_len / self.avg_doc_len))
                term_score = idf * ((tf * (self.k1 + 1.0)) / denom)
                scores[chunk_id] += term_score

        # Sort descending by score
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        return ranked[:top_k]
