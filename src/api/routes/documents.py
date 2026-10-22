"""Document management and ingestion routes."""

import re
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from datetime import datetime
from src.schemas.models import DocumentMetadata, IngestRequest
from src.ingestion.document_loader import DocumentLoader

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
@router.post("/api/v1/documents/ingest", response_model=DocumentMetadata)
async def ingest_document(req: IngestRequest):
    """Dynamically parses, chunks, and indexes a new document into both Dense and BM25 systems."""
    from src.api.app import app_state

    slug = re.sub(r"[^a-z0-9]+", "_", req.title.lower()).strip("_") or "custom_doc"
    doc_id = slug

    # If document already exists, remove old chunks first to cleanly update
    if doc_id in app_state.documents:
        app_state.engine.remove_document(doc_id)

    chunks = app_state.chunker.chunk_document(
        document_id=doc_id,
        document_title=req.title,
        text=req.content,
        base_metadata=req.metadata,
    )

    suggested = DocumentLoader.generate_suggested_queries(req.title, chunks)

    metadata = DocumentMetadata(
        document_id=doc_id,
        title=req.title,
        file_path=None,
        document_type=req.document_type,
        tags=["user-ingested", req.domain or "custom"],
        total_pages=max([c.page_number or 1 for c in chunks]) if chunks else 1,
        total_chunks=len(chunks),
        created_at=datetime.utcnow().isoformat(),
        domain=req.domain or "custom",
        suggested_queries=suggested,
    )

    app_state.documents[doc_id] = metadata
    app_state.engine.index_chunks(chunks)
    app_state.cache.invalidate()

    return metadata


@router.post("/api/v1/documents/upload", response_model=DocumentMetadata)
async def upload_document(
    file: UploadFile = File(...),
    domain: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
):
    """Uploads, parses, and indexes any supported file (.pdf, .docx, .csv, .json, .md, .txt) into the hybrid retrieval engine."""
    from src.api.app import app_state

    content_bytes = await file.read()
    filename = file.filename or "uploaded_document"

    metadata, chunks = app_state.loader.load_bytes(
        filename=filename,
        content=content_bytes,
        domain=domain,
        title=title,
    )

    # If document already exists, remove old chunks first to cleanly update
    if metadata.document_id in app_state.documents:
        app_state.engine.remove_document(metadata.document_id)

    app_state.documents[metadata.document_id] = metadata
    app_state.engine.index_chunks(chunks)
    app_state.cache.invalidate()

    return metadata


@router.post("/api/v1/documents/reset")
async def reset_documents() -> Dict[str, Any]:
    """Resets the corpus back to the initial 6 default enterprise documents, removing all custom uploads."""
    from src.api.app import app_state

    default_ids = {
        "cve_2024_8192_kernel_security_advisory",
        "q3_enterprise_cloud_infrastructure_financials",
        "distributed_raft_consensus_architecture_spec",
        "enterprise_msa_gdpr_compliance_sla",
        "fda_phase3_oncology_clinical_protocol",
        "sev1_global_payment_gateway_postmortem",
    }

    custom_ids = [doc_id for doc_id in list(app_state.documents.keys()) if doc_id not in default_ids]
    deleted_total_chunks = 0
    for doc_id in custom_ids:
        app_state.documents.pop(doc_id, None)
        deleted_total_chunks += app_state.engine.remove_document(doc_id)

    app_state.cache.invalidate()

    return {
        "status": "reset_complete",
        "removed_custom_docs": custom_ids,
        "deleted_chunks": deleted_total_chunks,
        "remaining_documents": len(app_state.documents),
    }


@router.delete("/api/v1/documents/{doc_id}")
async def delete_document(doc_id: str) -> Dict[str, Any]:
    """Deletes an ingested document and removes all its chunks from the hybrid retrieval engine."""
    from src.api.app import app_state

    if doc_id not in app_state.documents:
        slug = re.sub(r"[^a-z0-9]+", "_", doc_id.lower()).strip("_")
        if slug in app_state.documents:
            doc_id = slug
        else:
            raise HTTPException(status_code=404, detail=f"Document '{doc_id}' not found")

    metadata = app_state.documents.pop(doc_id)
    deleted_chunks = app_state.engine.remove_document(doc_id)

    app_state.cache.invalidate()

    return {
        "status": "deleted",
        "document_id": doc_id,
        "title": metadata.title,
        "deleted_chunks": deleted_chunks,
        "remaining_documents": len(app_state.documents),
    }
