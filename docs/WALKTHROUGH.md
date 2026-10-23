# Synapse // Live Video Walkthrough & Technical Evaluation Guide

<div align="center">

[![Loom Walkthrough](https://img.shields.io/badge/Loom_Walkthrough-1080p_HD-625DF5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/0fb293b4fb314d2aa3f7c1bc6f9215e3)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.128-009688.svg?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![pgvector](https://img.shields.io/badge/pgvector-HNSW%20768D-336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)](https://github.com/pgvector/pgvector)
[![Redis](https://img.shields.io/badge/Redis-Semantic%20Cache%20(%3C25ms)-DC382D.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Python 3.9+](https://img.shields.io/badge/Python-3.9+-3776AB.svg?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)

</div>

This document provides engineering leads, hiring managers, and technical reviewers with a complete guide to evaluating **Synapse // Enterprise Hybrid Search & Document Intelligence Engine**, featuring the full HD Loom architecture walkthrough and a step-by-step local verification checklist.

---

## 🎬 1. Full HD Video Walkthrough

Watch the full architecture walkthrough and live 7-page system demonstration on Loom:

👉 **[Watch Synapse Architecture & Live Walkthrough on Loom](https://www.loom.com/share/0fb293b4fb314d2aa3f7c1bc6f9215e3)**  
*(Direct URL: `https://www.loom.com/share/0fb293b4fb314d2aa3f7c1bc6f9215e3`)*

### Walkthrough Demonstrates:
1. **The 7-Page Three.js WebGL Interface & Fluid Island Dock:** Live GLSL Simplex Noise and Fresnel glass spheres with dynamic theme switching (`Indigo`, `Cyan`, `Coral`).
2. **The 6 Pre-Loaded Enterprise Domains:** Kernel Security (`CVE-2024-8192`), SEC 10-Q Financials, Distributed Raft Consensus, GDPR SLAs, FDA Phase III Oncology (`NCT-09482110`), and SEV-1 Post-Mortems (`INC-2024-1004`).
3. **Hybrid Search vs Dense-Only Failure Mode:** Why naive vector search drifts on exact hex offsets (`0x7fff90a4`) and how combining 768-D Dense vectors with BM25 Okapi keyword search solves exact-match precision.
4. **Reciprocal Rank Fusion ($k=60$) & Cross-Encoder Re-Ranking:** Mathematical candidate rank fusion traced side-by-side on the 3D Isometric DAG Canvas.
5. **Clickable Citation Grounding (`[1]`, `[2]`):** Instant lock onto verbatim source chunks in the sticky Right-Hand Hardware Reader.
6. **Sub-25ms Redis Semantic Caching:** Instant cache hits ($\text{Cosine} \ge 0.95$) returning grounded answers in `<15ms` with zero token consumption and `$0.00` API cost.
7. **Custom Ingestion Studio:** Drag-and-drop `.md/.txt/.json` ingestion with live chunk preview and real-time dual indexing.
8. **13-Query Ragas Benchmark Suite:** Live brushed-metal gauge telemetry showing 85.7% Precision (92.4% P@5) and 100% Recall.

---

## 🏛️ 2. Core Architectural Signals

* **Hybrid Dense + Sparse Retrieval:** Fuses semantic embedding similarity (Google `text-embedding-004` / 768-D) with exact BM25Okapi lexical matching ($k_1=1.5, b=0.75$).
* **Scale-Invariant Reciprocal Rank Fusion:**
  $$\text{RRF\_Score}(d) = \sum_{m \in \{\text{dense}, \text{bm25}\}} \frac{1}{60 + r_m(d)}$$
* **Neural Cross-Encoder Re-Ranking:** Joint query-document attention scoring filters false positives prior to synthesis.
* **Cosine $\ge 0.95$ Semantic Caching:** Slashes production LLM API costs by up to 60% with `<25ms` responses.
* **Strict Citation Contracts:** Every answer is guaranteed grounded against retrieved chunks with clickable line anchors.

---

## 🧪 3. Step-by-Step Local Evaluation Guide

Reviewers can launch and verify Synapse locally in under 60 seconds:

### Step 1: Start the Service
```bash
# Option A: From workspace root (port 8001 - runs concurrently alongside Project 1)
/Users/keshavbudhiraja/AI/start_project_2.sh

# Option B: Direct module execution (port 8000 default, 8080 fallback)
cd /Users/keshavbudhiraja/AI/project-2-enterprise-rag
source .venv/bin/activate
python -m src.api.server
```

### Step 2: Open the 7-Page WebGL Console
Navigate to `http://127.0.0.1:8001` (or `http://localhost:8000`).

### Step 3: Test Hybrid Search & Citation Locking (Page 02 `/search`)
1. On **Page 01 (`Overview`)**, click **"Query in Workbench"** on `01 // Security Advisory (CVE-2024-8192)`.
2. Notice how Synapse executes the hybrid query, extracts the exact memory offset `0x7fff90a4` and commit `a7f8e910c2d3`, and renders inline citation pills `[1]`, `[2]`.
3. Click citation pill `[1]`: the right-hand hardware source reader smoothly scrolls to `CHUNK #1` with a `TARGET LOCKED` visual pulse.

### Step 4: Verify Sub-25ms Semantic Cache Hit
1. On **Page 02 (`Search`)**, click the **`Test <25ms Cache Hit`** button.
2. The Semantic Cache indicator flashes green: `CACHE HIT (1.000)` with response latency dropping to `<15ms` and `$0.00` token cost.

### Step 5: Inspect 3-Mode DAG Ablation (Page 03 `/pipeline`)
Navigate to **Page 03 (`Pipeline`)** to view the live 3-column ablation matrix (`Smart Hybrid` vs `Dense Only` vs `BM25 Only`) and the mathematical candidate fusion trace.

### Step 6: Run Automated Tests & 13-Query Benchmark
```bash
cd /Users/keshavbudhiraja/AI/project-2-enterprise-rag
source .venv/bin/activate

# Run pytest unit test suite
python -m pytest tests -v

# Run 13-query Ragas evaluation benchmark
python -m src.cli evals
```

---

## 📊 4. Empirical Benchmark Matrix (13-Query Ragas Suite)

| Retrieval Architecture | Context Precision | Context Recall | Faithfulness | Answer Relevance |
| :--- | :---: | :---: | :---: | :---: |
| **Dense Only (768-D Cosine)** | 55.0% | 65.0% | 100.0% | 62.0% |
| **BM25 Only (Okapi TF-IDF)** | 25.0% | 30.0% | 100.0% | 44.0% |
| **Hybrid (RRF $k=60$)** | 56.7% | 75.0% | 100.0% | 78.0% |
| **Hybrid + Cross-Encoder (Synapse)** | **85.7% (92.4% P@5)** | **100.0%** | **100.0%** | **84.7%** |

---

## 👤 Author & Maintainer

**Keshav Budhiraja**
* Systems & AI Engineer
* **GitHub:** [@keshav647](https://github.com/keshav647)
* **Portfolio:** [keshavbudhiraja.com](https://keshavbudhiraja.com)
* **Email:** [keshavbudhiraja4321@gmail.com](mailto:keshavbudhiraja4321@gmail.com)
