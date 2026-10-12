"""Document loading, domain classification, and dynamic query suggestion utilities."""

import re
from pathlib import Path
from typing import List, Tuple, Optional
from datetime import datetime
from src.schemas.models import DocumentMetadata, DocumentChunk
from src.ingestion.chunker import ContextualChunker


PRESET_SUGGESTED_QUERIES = {
    "cve_2024_8192_kernel_security_advisory": [
        "What is the memory offset and vulnerable function in CVE-2024-8192?",
        "Which upstream Git commit fixed CVE-2024-8192 and which distros are patched?",
        "What sysctl workaround hardens against CVE-2024-8192 without rebooting?",
        "Which Linux kernel versions are affected by the po->rollover race condition?",
    ],
    "q3_enterprise_cloud_infrastructure_financials": [
        "What was total consolidated revenue, operating margin, and AI Cloud growth in Q3?",
        "Compare Q3 revenue and gross margin across Compute, Storage, and AI Cloud segments.",
        "What was Q3 capital expenditure (CAPEX) and which GPU models were procured?",
        "What was the Datacenter Power Usage Effectiveness (PUE) and ending cash liquidity?",
    ],
    "distributed_raft_consensus_architecture_spec": [
        "What is the heartbeat interval and randomized follower election timeout in Raft?",
        "When do nodes trigger log compaction and memory snapshots in Raft?",
        "How does the Raft leader serve linearizable reads via Leader Lease Protocol?",
        "What are the 5 core safety invariants of the Distributed Raft Consensus Engine?",
    ],
    "enterprise_msa_gdpr_compliance_sla": [
        "What is the maximum GDPR breach notification window and encryption standard under Section 3?",
        "What are the standard liability cap vs Data Protection super-cap dollar limits?",
        "What service credit percentages apply when monthly uptime drops below 99.99%?",
        "Which governing law, arbitration forum, and EEA data residency regions apply?",
    ],
    "fda_phase3_oncology_clinical_protocol": [
        "What was the median Progression-Free Survival (PFS) and Hazard Ratio in Cohort A vs Cohort B?",
        "What are the CTCAE v5.0 dosage modification rules for Grade 2 vs Grade 3/4 pneumonitis?",
        "What are the mandatory inclusion criteria and absolute checkpoint inhibitor exclusions?",
        "What was the 12-month Overall Survival (OS) rate and PD-L1 TPS >= 50% subgroup PFS?",
    ],
    "sev1_global_payment_gateway_postmortem": [
        "What caused the 47-minute SEV-1 payment gateway outage and PgBouncer pool exhaustion?",
        "What emergency kubectl, psql, and redis-cli commands mitigated INC-2024-1004?",
        "What were the peak P99 checkout latency and failed transaction counts during the outage?",
        "What are the 3 mandatory P0 remediation action items and assigned SRE team owners?",
    ],
}


class DocumentLoader:
    """Loads documents from directory or raw text strings into structured chunks."""

    def __init__(self, chunker: Optional[ContextualChunker] = None):
        self.chunker = chunker or ContextualChunker()

    def load_file(self, file_path: Path) -> Tuple[DocumentMetadata, List[DocumentChunk]]:
        """Reads a file and converts it into metadata and chunks."""
        text = file_path.read_text(encoding="utf-8")
        title = self._extract_title(text, file_path.stem)
        doc_id = file_path.stem.replace("-", "_").lower()

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

        domain = self._infer_domain(doc_id, text)
        suggested = PRESET_SUGGESTED_QUERIES.get(
            doc_id,
            self.generate_suggested_queries(title, chunks),
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
            domain=domain,
            suggested_queries=suggested,
        )

        return metadata, chunks

    def load_directory(self, dir_path: Path) -> List[Tuple[DocumentMetadata, List[DocumentChunk]]]:
        """Scans a directory for markdown and text files in canonical enterprise order."""
        results = []
        if not dir_path.exists():
            return results

        preferred_order = [
            "cve_2024_8192_kernel_security_advisory",
            "q3_enterprise_cloud_infrastructure_financials",
            "distributed_raft_consensus_architecture_spec",
            "enterprise_msa_gdpr_compliance_sla",
            "fda_phase3_oncology_clinical_protocol",
            "sev1_global_payment_gateway_postmortem",
        ]

        all_files = [
            p for p in dir_path.glob("*.*")
            if p.suffix.lower() in [".md", ".markdown", ".txt"]
        ]

        def sort_key(p: Path):
            stem = p.stem.replace("-", "_").lower()
            if stem in preferred_order:
                return (0, preferred_order.index(stem))
            return (1, stem)

        for path in sorted(all_files, key=sort_key):
            results.append(self.load_file(path))
        return results

    @staticmethod
    def generate_suggested_queries(title: str, chunks: List[DocumentChunk]) -> List[str]:
        """Dynamically generates 4 high-signal questions from a document's chunks and sections."""
        queries: List[str] = []
        seen_sections = []
        for chunk in chunks:
            sec = chunk.section_title.replace("(Table Data)", "").strip()
            if sec and sec.lower() != "overview" and sec not in seen_sections:
                seen_sections.append(sec)

        for sec in seen_sections[:3]:
            queries.append(f"What are the exact specifications and key metrics in '{sec}'?")

        if len(queries) < 4:
            queries.append(f"Summarize the primary technical findings and numerical thresholds in {title}.")
        if len(queries) < 4:
            queries.append(f"What compliance requirements, action items, or SLA limits are defined in {title}?")
        if len(queries) < 4:
            queries.append(f"Extract all verbatim tables, code blocks, and critical identifiers from {title}.")

        return queries[:4]

    def _extract_title(self, text: str, fallback: str) -> str:
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("# "):
                return line.lstrip("# ").strip()
        return fallback.replace("_", " ").title()

    def _infer_domain(self, doc_id: str, text: str) -> str:
        lower = f"{doc_id} {text[:400]}".lower()
        if "cve" in lower or "kernel" in lower or "vulnerability" in lower:
            return "security"
        if "financial" in lower or "q3" in lower or "revenue" in lower or "capex" in lower:
            return "financials"
        if "raft" in lower or "consensus" in lower or "quorum" in lower:
            return "distributed"
        if "msa" in lower or "gdpr" in lower or "liability" in lower or "indemnification" in lower:
            return "legal"
        if "clinical" in lower or "fda" in lower or "phase iii" in lower or "oncology" in lower:
            return "clinical"
        if "sev-1" in lower or "sev1" in lower or "post-mortem" in lower or "outage" in lower:
            return "sre"
        return "custom"

    def _infer_tags(self, filename: str, text: str) -> List[str]:
        tags = []
        name_lower = f"{filename} {text[:300]}".lower()
        if "cve" in name_lower or "security" in name_lower:
            tags.extend(["security", "cve-advisory", "kernel"])
        if "financial" in name_lower or "q3" in name_lower:
            tags.extend(["financial-10q", "earnings", "capex", "tables"])
        if "raft" in name_lower or "consensus" in name_lower:
            tags.extend(["distributed-rfc", "raft", "consensus"])
        if "msa" in name_lower or "gdpr" in name_lower:
            tags.extend(["legal-msa", "gdpr-dpa", "sla"])
        if "clinical" in name_lower or "fda" in name_lower:
            tags.extend(["fda-phase3", "clinical-trial", "oncology"])
        if "sev1" in name_lower or "outage" in name_lower or "post-mortem" in name_lower:
            tags.extend(["sre-postmortem", "sev-1", "incident-response"])
        return tags or ["enterprise-corpus"]
