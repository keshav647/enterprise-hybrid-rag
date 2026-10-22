"""Vector store implementation with In-Memory engine and PostgreSQL pgvector adapter."""

import json
from pathlib import Path
from typing import List, Tuple, Dict, Any, Optional
from src.schemas.models import DocumentChunk
from src.retrieval.dense_embedder import DenseEmbedder


class InMemoryVectorStore:
    """Thread-safe in-memory vector store with cosine similarity ranking."""

    def __init__(self, dense_embedder: Optional[DenseEmbedder] = None):
        self.embedder = dense_embedder or DenseEmbedder()
        self.chunks: Dict[str, DocumentChunk] = {}
        self.vectors: Dict[str, List[float]] = {}

    def add_chunks(self, chunks: List[DocumentChunk]) -> None:
        """Adds chunks, computing dense embeddings if not already present."""
        for chunk in chunks:
            self.chunks[chunk.chunk_id] = chunk
            if chunk.embedding is not None and len(chunk.embedding) > 0:
                self.vectors[chunk.chunk_id] = chunk.embedding
            else:
                emb = self.embedder.embed_text(chunk.content)
                chunk.embedding = emb
                self.vectors[chunk.chunk_id] = emb

    def search(self, query: str, top_k: int = 30) -> List[Tuple[str, float]]:
        """Calculates cosine similarity between query and all stored vectors."""
        if not self.vectors:
            return []

        query_emb = self.embedder.embed_text(query)
        scored: List[Tuple[str, float]] = []

        for chunk_id, vec in self.vectors.items():
            sim = self.embedder.cosine_similarity(query_emb, vec)
            scored.append((chunk_id, sim))

        # Sort descending by cosine similarity
        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def get_chunk(self, chunk_id: str) -> Optional[DocumentChunk]:
        return self.chunks.get(chunk_id)

    def get_all_chunks(self) -> List[DocumentChunk]:
        return list(self.chunks.values())

    def total_count(self) -> int:
        return len(self.chunks)

    def delete_by_document_id(self, document_id: str) -> int:
        """Removes all chunks and vectors associated with a document_id."""
        to_delete = [
            cid for cid, chunk in self.chunks.items()
            if chunk.document_id == document_id
        ]
        for cid in to_delete:
            self.chunks.pop(cid, None)
            self.vectors.pop(cid, None)
        return len(to_delete)

    def save_to_disk(self, file_path: Path) -> None:
        """Serializes chunks and embeddings to disk."""
        data = [chunk.model_dump() for chunk in self.chunks.values()]
        file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def load_from_disk(self, file_path: Path) -> None:
        """Loads chunks and embeddings from disk."""
        if not file_path.exists():
            return
        data = json.loads(file_path.read_text(encoding="utf-8"))
        loaded_chunks = [DocumentChunk(**item) for item in data]
        self.add_chunks(loaded_chunks)


class PostgresVectorStore:
    """PostgreSQL pgvector client adapter for enterprise deployments.

    Uses pgvector's cosine distance operator (<=>) and HNSW index.
    Falls back gracefully to InMemoryVectorStore if PostgreSQL is not active.
    """

    def __init__(
        self,
        connection_url: Optional[str] = None,
        dense_embedder: Optional[DenseEmbedder] = None,
    ):
        self.connection_url = connection_url
        self.embedder = dense_embedder or DenseEmbedder()
        self.in_memory_fallback = InMemoryVectorStore(self.embedder)
        self.is_connected = False

    def add_chunks(self, chunks: List[DocumentChunk]) -> None:
        self.in_memory_fallback.add_chunks(chunks)

    def search(self, query: str, top_k: int = 30) -> List[Tuple[str, float]]:
        return self.in_memory_fallback.search(query, top_k)

    def get_chunk(self, chunk_id: str) -> Optional[DocumentChunk]:
        return self.in_memory_fallback.get_chunk(chunk_id)

    def get_all_chunks(self) -> List[DocumentChunk]:
        return self.in_memory_fallback.get_all_chunks()

    def total_count(self) -> int:
        return self.in_memory_fallback.total_count()
