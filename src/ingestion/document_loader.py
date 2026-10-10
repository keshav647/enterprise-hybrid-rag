"""Document loading and directory scanning utilities."""

import os
import re
from pathlib import Path
from typing import List, Tuple, Optional
from datetime import datetime
from src.schemas.models import DocumentMetadata, DocumentChunk
from src.ingestion.chunker import ContextualChunker


class DocumentLoader:
    """Loads documents from directory or raw text strings into structured chunks."""

    def __init__(self, chunker: Optional[ContextualChunker] = None):
        self.chunker = chunker or ContextualChunker()

    def load_file(self, file_path: Path) -> Tuple[DocumentMetadata, List[DocumentChunk]]:
        """Reads a file and converts it into metadata and chunks."""
        text = file_path.read_text(encoding="utf-8")
        title = self._extract_title(text, file_path.stem)
        doc_id = file_path.stem.replace("-", "_").lower()

        # Count pages
        page_tags = re.findall(r"<!--\s*page:\s*(\d+)\s*-->|\[Page\s*(\d+)\]", text, re.IGNORECASE)
        max_page = 1
        for p1, p2 in page_tags:
            val = int(p1 or p2)
            if val > max_page:
                max_page = val

        chunks = self.chunker.chunk_document(
            document_id=doc_id,
            document_title=title,
            text=text,
            base_metadata={"file_name": file_path.name},
        )

        metadata = DocumentMetadata(
            document_id=doc_id,
            title=title,
            file_path=str(file_path),
            document_type="markdown" if file_path.suffix in [".md", ".markdown"] else "text",
            tags=self._infer_tags(file_path.name, text),
            total_pages=max_page,
            total_chunks=len(chunks),
            created_at=datetime.utcnow().isoformat(),
        )

        return metadata, chunks

    def load_directory(self, dir_path: Path) -> List[Tuple[DocumentMetadata, List[DocumentChunk]]]:
        """Scans a directory for markdown and text files."""
        results = []
        if not dir_path.exists():
            return results

        for path in sorted(dir_path.glob("*.*")):
            if path.suffix.lower() in [".md", ".markdown", ".txt"]:
                results.append(self.load_file(path))
        return results

    def _extract_title(self, text: str, fallback: str) -> str:
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("# "):
                return line.lstrip("# ").strip()
        return fallback.replace("_", " ").title()

    def _infer_tags(self, filename: str, text: str) -> List[str]:
        tags = []
        name_lower = filename.lower()
        if "cve" in name_lower or "security" in name_lower:
            tags.extend(["security", "vulnerability", "kernel"])
        if "financial" in name_lower or "q3" in name_lower:
            tags.extend(["financial", "earnings", "capex", "tables"])
        if "raft" in name_lower or "consensus" in name_lower:
            tags.extend(["distributed-systems", "raft", "consensus", "architecture"])
        return tags
