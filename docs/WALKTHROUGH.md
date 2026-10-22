# 60-Second Loom Video Recording Script (Synapse v2.4)

Follow this disciplined 60-second walkthrough script when recording your portfolio demo. Keep video length between **55 and 70 seconds**.

---

## Pre-Recording Setup
1. **Launch the Engine:**
   * From `/Users/keshavbudhiraja/AI`, run `./start_project_2.sh` (starts on **`http://127.0.0.1:8001`**) or `python -m src.api.server` (starts on **`http://localhost:8000`** with `8080` fallback).
2. **Window Layout:**
   * Open the **Synapse 7-Page Web UI** at `http://127.0.0.1:8001/overview` (Page 01) in full screen on a clean monitor.
   * Clear the semantic cache via **Page 07 (`/settings`) -> Purge Cache** so the first query demonstrates a live hybrid pipeline run before the cache hit.
3. **Audio:** Ensure clean microphone audio with zero background noise.

---

## Second-by-Second Script & Cues

### [0:00 - 0:15] The Hook & 3D Topology Hub (Page 01 `/overview`)
* **Visual:** Browser showing **Page 01 (`01 // Overview`)** with the Three.js WebGL GLSL Simplex Noise & floating Fresnel glass spheres, the **Floating "Fluid Island" 7-Page Pill Navbar**, and the **6 Enterprise Domain Cards** (`6 Docs · 42 Chunks`).
* **Action:** Toggle the 3D Shader Field pill (`Indigo` -> `Cyan`) and click **"Query in Workbench"** on `01 // Security Advisory (CVE-2024-8192)`.
* **Script:**
  > *"Most enterprise RAG systems fail in production because naive vector search misses exact hex offsets, CVE IDs, and financial table figures. I engineered Synapse—a 7-page Enterprise Hybrid Search and Document Intelligence Engine spanning 6 production domains: Kernel Security, Q3 10-Q Financials, Raft Consensus, GDPR SLAs, FDA Phase III Clinical Trials, and SRE SEV-1 Post-Mortems."*

### [0:15 - 0:35] Live Hybrid Search, Citation Locking & Custom Data (Page 02 `/search`)
* **Visual:** **Page 02 (`02 // Search`)** executes the `CVE-2024-8192` query, updates the 5 telemetry cards, and renders the grounded answer with clickable `[1]`, `[2]` citations alongside the sticky **Right-Hand Live Source Inspector**.
* **Action:** Click inline citation pill `[1]` inside the synthesized answer. Show how the right-hand hardware reader smoothly scrolls to `CHUNK #1` and pulses with `TARGET LOCKED`. Briefly point to the **`+ Add Your Own Document`** button (Quick Ingest Modal).
* **Script:**
  > *"Watch this query on CVE-2024-8192. Standard dense embeddings drift on hexadecimal addresses, but Synapse fuses 768-D dense vectors with BM25 Okapi keyword search via Reciprocal Rank Fusion and Cross-Encoder Re-Ranking—extracting the exact offset `0x7fff90a4` and commit `a7f8e910c2d3`. Clicking any `[1]` citation locks onto the verbatim chunk in the source inspector, and you can also upload or paste your own Markdown documents live."*

### [0:35 - 0:48] Sub-25ms Semantic Cache Hit & 3-Mode DAG Ablation (Page 02 `/search` & Page 03 `/pipeline`)
* **Action:** Click the **`Test <25ms Cache Hit`** button on Page 02, then click **Page 03 (`Pipeline`)** in the top Floating Island navbar.
* **Visual:** On Page 02, the Semantic Cache card flashes green: `CACHE HIT (1.000)` with latency dropping to `<15 ms` and `$0.00` token cost. On Page 03, the 3D isometric canvases and 3-column ablation table (`Smart Hybrid` vs `Dense Only` vs `BM25 Only`) appear.
* **Script:**
  > *"When a repeat or paraphrased query arrives, our Cosine ≥ 0.95 Semantic Cache returns the verified answer in under 20 milliseconds at zero LLM token cost. And on Page 03, we can inspect the 4-stage mathematical RRF and Cross-Encoder trace side-by-side."*

### [0:48 - 1:00] Brushed-Metal Ragas Gauges & Close (Page 06 `/analytics`)
* **Action:** Click **Page 06 (`Benchmarks`)** in the top dock to reveal the 4 brushed-metal circular SVG dials (`Precision@5: 92.4%`, `Recall@10: 100%`) and the **13-Query Enterprise Benchmark Suite**.
* **Script:**
  > *"Across our 13-query Ragas benchmark suite spanning all 6 enterprise domains, Synapse boosts Context Precision to 85.7%—and 92.4% Precision@5—with 100% Context Recall and zero hallucinations. Full FastAPI source code, Docker Compose, and live benchmarks are in the GitHub repo below."*
