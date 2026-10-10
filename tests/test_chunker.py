"""Tests for layout-aware contextual chunker."""

import pytest
from src.ingestion.chunker import ContextualChunker


def test_chunker_section_and_page_preservation():
    sample_text = """# Executive Summary
<!-- page: 1 -->
This is an overview of the vulnerability.

## Vulnerability Details
<!-- page: 2 -->
Memory corruption in kernel socket offset 0x7fff90a4.
"""
    chunker = ContextualChunker(target_chunk_size=200)
    chunks = chunker.chunk_document(
        document_id="test_doc",
        document_title="Kernel Advisory",
        text=sample_text,
    )

    assert len(chunks) >= 2
    # Verify section and page metadata in chunks
    c1 = chunks[0]
    assert "Kernel Advisory" in c1.content
    assert "Executive Summary" in c1.section_title or "Vulnerability" in c1.section_title
    assert c1.page_number in [1, 2]


def test_chunker_table_preservation():
    table_text = """## Financial Breakdown
<!-- page: 2 -->

| Segment | Revenue | YoY |
| :--- | :--- | :--- |
| Compute | $8.24B | +18% |
| Storage | $3.88B | +14% |
| AI Cloud | $2.70B | +84% |

Summary after table.
"""
    chunker = ContextualChunker()
    chunks = chunker.chunk_document(
        document_id="fin_doc",
        document_title="Q3 Financials",
        text=table_text,
    )

    # Verify table chunk was kept intact
    table_chunks = [c for c in chunks if c.metadata.get("is_table")]
    assert len(table_chunks) == 1
    assert "Compute" in table_chunks[0].content
    assert "AI Cloud" in table_chunks[0].content
    assert table_chunks[0].page_number == 2
