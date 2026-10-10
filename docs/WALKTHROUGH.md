# 60-Second Loom Video Recording Script

Follow this disciplined 60-second walkthrough script when recording your portfolio demo. Keep video length between **55 and 70 seconds**.

---

## Pre-Recording Setup
1. **Window Layout:**
   * Open the Synapse Web UI at `http://localhost:8000` in full screen on a clean monitor.
   * Clear browser caches so the first query shows a clean live run.
2. **Audio:** Ensure clean microphone audio with zero background noise.

---

## Second-by-Second Script & Cues

### [0:00 - 0:15] The Hook & Problem Statement
* **Visual:** Browser showing the Synapse UI with dark obsidian canvas and glowing neon accents.
* **Script:**
  > *"Most enterprise RAG applications fail in production because naive vector search misses exact technical terms, acronyms, and error codes. I built Synapse, an enterprise hybrid search and document intelligence engine that solves this with dual retrieval, cross-encoder re-ranking, and semantic caching."*

### [0:15 - 0:35] Live Hybrid Search Demonstration
* **Action:** Click the chip: `CVE-2024-8192 Exact Memory Offset`.
* **Visual:** The system executes search, updates HUD metrics, and outputs grounded answer with clickable citations `[1]`, `[2]`.
* **Script:**
  > *"Watch this query searching for CVE-2024-8192. Standard dense models drift on hexadecimal addresses, but our hybrid pipeline merges BM25 keyword matching with pgvector embeddings via Reciprocal Rank Fusion. The cross-encoder re-ranks the top 30 candidates, delivering the exact memory offset `0x7fff90a4` and patch commit."*
* **Action:** Click on citation pill `[1]`. Show how the right pane smoothly scrolls to the exact chunk and highlights the source text in neon emerald.
* **Script:**
  > *"Every claim includes clickable citations with verbatim source quotes, guaranteeing zero hallucinations."*

### [0:35 - 0:50] Semantic Caching & Speed Proof
* **Action:** Click the `Trigger Cache Hit (<25ms)` button.
* **Visual:** Telemetry HUD instantly flashes green: `⚡ CACHE HIT (19.4 ms, $0.00 Cost)`.
* **Script:**
  > *"Now watch the response time when we submit a semantically equivalent query: under 20 milliseconds! Our Redis semantic cache matched query intent via vector cosine similarity, returning the verified answer with zero LLM API cost and zero token consumption."*

### [0:50 - 1:00] Evals & Closing Call to Action
* **Action:** Click the `Ragas Benchmarks` button to open the comparative matrix modal.
* **Visual:** The 4-row matrix appears showing 85.7% precision and 100% recall.
* **Script:**
  > *"On Ragas enterprise benchmarks, this hybrid architecture improves context precision by 30% and context recall to 100%. Full code, Docker Compose, and benchmark fixtures are in the GitHub repository below."*
