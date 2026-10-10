"""Layout-aware contextual document chunker with table and hierarchy preservation."""

import re
import hashlib
from typing import List, Optional, Tuple, Dict, Any
from src.schemas.models import DocumentChunk


class ContextualChunker:
    """Intelligent chunker that preserves document layout, Markdown tables, and section context."""

    def __init__(self, target_chunk_size: int = 600, chunk_overlap: int = 100):
        self.target_chunk_size = target_chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_document(
        self,
        document_id: str,
        document_title: str,
        text: str,
        base_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[DocumentChunk]:
        """Splits document text into layout-aware contextual chunks."""
        base_metadata = base_metadata or {}
        lines = text.split("\n")

        chunks: List[DocumentChunk] = []
        current_page = 1
        current_section = "Overview"
        current_block: List[str] = []
        current_length = 0
        chunk_counter = 0

        # Regex patterns
        page_pattern = re.compile(r"<!--\s*page:\s*(\d+)\s*-->|\[Page\s*(\d+)\]", re.IGNORECASE)
        heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$")
        table_row_pattern = re.compile(r"^\s*\|.*\|\s*$")

        idx = 0
        while idx < len(lines):
            line = lines[idx]

            # Check page marker
            page_match = page_pattern.search(line)
            if page_match:
                page_val = page_match.group(1) or page_match.group(2)
                current_page = int(page_val)
                idx += 1
                continue

            # Check section heading
            heading_match = heading_pattern.match(line)
            if heading_match:
                # Flush previous block if non-empty
                if current_block:
                    chunk = self._create_chunk(
                        document_id=document_id,
                        document_title=document_title,
                        section_title=current_section,
                        page_number=current_page,
                        lines=current_block,
                        chunk_index=chunk_counter,
                        base_metadata=base_metadata,
                    )
                    chunks.append(chunk)
                    chunk_counter += 1
                    current_block = []
                    current_length = 0

                level = len(heading_match.group(1))
                heading_text = heading_match.group(2).strip()
                current_section = heading_text
                idx += 1
                continue

            # Check if this is the start of a Markdown table
            if table_row_pattern.match(line):
                # Slurp the entire table to preserve table integrity
                table_lines = []
                while idx < len(lines) and (table_row_pattern.match(lines[idx]) or lines[idx].strip() == ""):
                    if lines[idx].strip() != "":
                        table_lines.append(lines[idx])
                    idx += 1

                # If current block already has content, flush it first
                if current_block:
                    chunk = self._create_chunk(
                        document_id=document_id,
                        document_title=document_title,
                        section_title=current_section,
                        page_number=current_page,
                        lines=current_block,
                        chunk_index=chunk_counter,
                        base_metadata=base_metadata,
                    )
                    chunks.append(chunk)
                    chunk_counter += 1
                    current_block = []
                    current_length = 0

                # Create dedicated chunk for table
                table_chunk = self._create_chunk(
                    document_id=document_id,
                    document_title=document_title,
                    section_title=f"{current_section} (Table Data)",
                    page_number=current_page,
                    lines=table_lines,
                    chunk_index=chunk_counter,
                    base_metadata={**base_metadata, "is_table": True},
                )
                chunks.append(table_chunk)
                chunk_counter += 1
                continue

            # Standard paragraph or line
            current_block.append(line)
            current_length += len(line) + 1

            # Flush when reaching target chunk size
            if current_length >= self.target_chunk_size and (line.strip() == "" or line.endswith(".")):
                chunk = self._create_chunk(
                    document_id=document_id,
                    document_title=document_title,
                    section_title=current_section,
                    page_number=current_page,
                    lines=current_block,
                    chunk_index=chunk_counter,
                    base_metadata=base_metadata,
                )
                chunks.append(chunk)
                chunk_counter += 1

                # Carry over overlap if enabled
                overlap_lines = self._get_overlap_lines(current_block, self.chunk_overlap)
                current_block = list(overlap_lines)
                current_length = sum(len(l) + 1 for l in current_block)

            idx += 1

        # Flush any remaining lines
        if current_block and any(l.strip() for l in current_block):
            chunk = self._create_chunk(
                document_id=document_id,
                document_title=document_title,
                section_title=current_section,
                page_number=current_page,
                lines=current_block,
                chunk_index=chunk_counter,
                base_metadata=base_metadata,
            )
            chunks.append(chunk)

        return chunks

    def _create_chunk(
        self,
        document_id: str,
        document_title: str,
        section_title: str,
        page_number: int,
        lines: List[str],
        chunk_index: int,
        base_metadata: Dict[str, Any],
    ) -> DocumentChunk:
        raw_text = "\n".join(lines).strip()
        # Clean multiple redundant blank lines
        cleaned_text = re.sub(r"\n{3,}", "\n\n", raw_text)

        # Contextual embedding preamble
        contextual_content = (
            f"[Document: {document_title} | Section: {section_title} | Page: {page_number}]\n"
            f"{cleaned_text}"
        )

        chunk_id = f"{document_id}_c{chunk_index:03d}"
        approx_tokens = max(1, len(cleaned_text.split()))

        return DocumentChunk(
            chunk_id=chunk_id,
            document_id=document_id,
            document_title=document_title,
            section_title=section_title,
            page_number=page_number,
            content=contextual_content,
            token_count=approx_tokens,
            metadata={
                **base_metadata,
                "raw_text": cleaned_text,
                "chunk_index": chunk_index,
            },
        )

    def _get_overlap_lines(self, lines: List[str], overlap_chars: int) -> List[str]:
        """Selects trailing lines from the block for sliding window overlap."""
        overlap: List[str] = []
        accumulated = 0
        for line in reversed(lines):
            if not line.strip():
                continue
            overlap.insert(0, line)
            accumulated += len(line) + 1
            if accumulated >= overlap_chars:
                break
        return overlap
