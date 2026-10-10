"""Document management and ingestion routes."""

from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from datetime import datetime
from src.schemas.models import DocumentMetadata, IngestRequest, DocumentChunk

router = APIRouter(tags=["Documents"])


@router.get("/api/v1/documents", response_model=List[DocumentMetadata])
async def list_documents():
    """Lists all indexed documents and chunk statistics."""
    from src.api.app import app_state
    return list(app_state.documents.values())


@router.get("/api/v1/documents/{doc_id}")
async def get_document(doc_id: str) -> Dict[str, Any]:
    """Retrieves document metadata, original content, and all parsed chunks."""
    from src.api.app import app_state

    metadata = app_state.documents.get(doc_id)
    if not metadata:
        raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found")

    chunks = [
        chunk for chunk in app_state.engine.vector_store.get_all_chunks()
        if chunk.document_id == doc_id
    ]

    return {
        "metadata": metadata.model_dump(),
        "total_chunks": len(chunks),
        "chunks": [c.model_dump() for c in chunks],
    }


@router.post("/api/v1/ingest", response_model=DocumentMetadata)
async def ingest_document(req: IngestRequest):
    """Dynamically parses, chunks, and indexes a new document into both Dense and BM25 systems."""
    from src.api.app import app_state

    doc_id = req.title.lower().replace(" ", "_").replace("-", "_")
    chunks = app_state.chunker.chunk_document(
        document_id=doc_id,
        document_title=req.title,
        text=req.content,
        base_metadata=req.metadata,
    )

    metadata = DocumentMetadata(
        document_id=doc_id,
        title=req.title,
        file_path=None,
        document_type=req.document_type,
        tags=["user-ingested"],
        total_pages=max([c.page_number or 1 for c in chunks]) if chunks else 1,
        total_chunks=len(chunks),
        created_at=datetime.utcnow().isoformat(),
    )

    app_state.documents[doc_id] = metadata
    app_state.engine.index_chunks(chunks)

    return metadata
