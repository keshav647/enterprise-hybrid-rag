/**
 * Synapse // Enterprise Document Intelligence Engine
 * Modular Multi-Page Controller with GSAP Physics & Instant Citation Jump
 */

const state = {
  activeTab: "search",
  documents: [],
  activeDocId: null,
  activeDocumentData: null,
  lastSearchResponse: null,
  byok: {
    claudeKey: localStorage.getItem("SYNAPSE_CLAUDE_KEY") || "",
    geminiKey: localStorage.getItem("SYNAPSE_GEMINI_KEY") || "",
    openAIKey: localStorage.getItem("SYNAPSE_OPENAI_KEY") || "",
    model: localStorage.getItem("SYNAPSE_MODEL") || "auto",
  },
};

// DOM References
const queryInput = document.getElementById("queryInput");
const searchForm = document.getElementById("searchForm");
const answerContainer = document.getElementById("answerContainer");
const answerLoading = document.getElementById("answerLoading");
const answerModelBadge = document.getElementById("answerModelBadge");
const citationsSection = document.getElementById("citationsSection");
const citationsList = document.getElementById("citationsList");
const citationCountBadge = document.getElementById("citationCountBadge");
const cacheToggle = document.getElementById("cacheToggle");
const statusFooterSpeed = document.getElementById("statusFooterSpeed");
const statusFooterAccuracy = document.getElementById("statusFooterAccuracy");

// Document Library Elements
const docTabs = document.getElementById("docTabs");
const docLibraryList = document.getElementById("docLibraryList");
const docContentContainer = document.getElementById("docContentContainer");
const docMetaTitle = document.getElementById("docMetaTitle");
const docPageBadge = document.getElementById("docPageBadge");
const docChunkCountBadge = document.getElementById("docChunkCountBadge");

// Telemetry & Analytics Elements
const hudLatency = document.getElementById("hudLatency");
const hudLatencySub = document.getElementById("hudLatencySub");
const hudCacheStatus = document.getElementById("hudCacheStatus");
const hudCacheCost = document.getElementById("hudCacheCost");
const hudFusion = document.getElementById("hudFusion");
const hudCandidates = document.getElementById("hudCandidates");
const hudFaithfulness = document.getElementById("hudFaithfulness");
const hudFaithSub = document.getElementById("hudFaithSub");
const indicatorLatency = document.getElementById("indicatorLatency");
const indicatorCache = document.getElementById("indicatorCache");
const indicatorFaith = document.getElementById("indicatorFaith");

// Settings Elements
const inputClaudeKey = document.getElementById("inputClaudeKey");
const inputGeminiKey = document.getElementById("inputGeminiKey");
const inputOpenAIKey = document.getElementById("inputOpenAIKey");
const selectModel = document.getElementById("selectModel");
const detectedStatusText = document.getElementById("detectedStatusText");
const btnAutoDetectNow = document.getElementById("btnAutoDetectNow");

// Ingest Modal Elements
const ingestModal = document.getElementById("ingestModal");
const btnOpenIngestModal = document.getElementById("btnOpenIngestModal");
const btnCloseIngestModal = document.getElementById("btnCloseIngestModal");
const btnCancelIngest = document.getElementById("btnCancelIngest");
const btnSubmitIngest = document.getElementById("btnSubmitIngest");
const ingestTitle = document.getElementById("ingestTitle");
const ingestContent = document.getElementById("ingestContent");

// Initialize application
async function init() {
  bindEventListeners();
  initRouting();
  loadSettings();
  detectActiveKeys();
  await loadDocuments();
  await updateCacheStats();
}

// Multi-Page Tab Routing
function initRouting() {
  const hash = window.location.hash.replace("#", "") || "search";
  const path = window.location.pathname.replace("/", "") || "search";
  const initialTab = ["search", "documents", "analytics", "settings"].includes(hash)
    ? hash
    : ["search", "documents", "analytics", "settings"].includes(path)
    ? path
    : "search";

  switchTab(initialTab);

  window.addEventListener("hashchange", () => {
    const newHash = window.location.hash.replace("#", "");
    if (newHash) switchTab(newHash);
  });
}

function switchTab(tabName) {
  state.activeTab = tabName;

  // Update nav buttons
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  // Toggle page views
  document.querySelectorAll(".page-view").forEach((view) => {
    const isTarget = view.id === `view${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
    view.classList.toggle("active", isTarget);
  });

  if (window.location.hash !== `#${tabName}`) {
    history.replaceState(null, "", `#${tabName}`);
  }

  // Trigger page-specific data refresh
  if (tabName === "analytics") {
    loadBenchmarks();
  } else if (tabName === "settings") {
    detectActiveKeys();
  }
}

// Bind UI event listeners
function bindEventListeners() {
  // Nav Tab clicks
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Search submission
  searchForm.addEventListener("submit", handleSearchSubmit);

  // Scenario chips
  document.querySelectorAll(".scenario-card[data-query]").forEach((card) => {
    card.addEventListener("click", () => {
      queryInput.value = card.dataset.query;
      if (window.gsap) {
        gsap.fromTo(card, { scale: 0.96 }, { scale: 1, duration: 0.3, ease: "back.out(2)" });
      }
      handleSearch(card.dataset.query);
    });
  });

  // 1-Click Cache Hit demonstration button
  const btnTestCacheHit = document.getElementById("btnTestCacheHit");
  if (btnTestCacheHit) {
    btnTestCacheHit.addEventListener("click", async () => {
      const q = "What is the memory offset and vulnerable function in CVE-2024-8192?";
      queryInput.value = q;
      await handleSearch(q, true);
      setTimeout(async () => {
        await handleSearch(q, true);
      }, 160);
    });
  }

  // Segmented control mode selector
  document.querySelectorAll(".segment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".segment-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Accordion toggle in Analytics
  const pipelineToggle = document.getElementById("pipelineToggle");
  const pipelineContent = document.getElementById("pipelineContent");
  if (pipelineToggle && pipelineContent) {
    pipelineToggle.addEventListener("click", () => {
      const isOpen = pipelineToggle.classList.toggle("open");
      pipelineContent.classList.toggle("hidden");
      if (isOpen && window.gsap) {
        gsap.from("#pipelineContent", { opacity: 0, y: -10, duration: 0.3 });
      }
    });
  }

  // Settings Actions
  document.getElementById("btnSaveSettings").addEventListener("click", saveSettings);
  document.getElementById("btnClearKeys").addEventListener("click", clearSettings);
  if (btnAutoDetectNow) {
    btnAutoDetectNow.addEventListener("click", detectActiveKeys);
  }

  // Evals live rerun in Analytics
  document.getElementById("btnRunLiveEvals").addEventListener("click", runLiveEvals);

  // Copy answer button
  document.getElementById("btnCopyAnswer").addEventListener("click", () => {
    if (state.lastSearchResponse) {
      navigator.clipboard.writeText(state.lastSearchResponse.answer);
      const btn = document.getElementById("btnCopyAnswer");
      btn.style.color = "var(--yellow-solar)";
      setTimeout(() => { btn.style.color = ""; }, 1200);
    }
  });

  // Ingest Document Modal
  if (btnOpenIngestModal) {
    btnOpenIngestModal.addEventListener("click", () => ingestModal.classList.remove("hidden"));
  }
  if (btnCloseIngestModal) {
    btnCloseIngestModal.addEventListener("click", () => ingestModal.classList.add("hidden"));
  }
  if (btnCancelIngest) {
    btnCancelIngest.addEventListener("click", () => ingestModal.classList.add("hidden"));
  }
  if (btnSubmitIngest) {
    btnSubmitIngest.addEventListener("click", handleIngestDocument);
  }
}

// Handle search submission
function handleSearchSubmit(e) {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (query) handleSearch(query);
}

// Execute hybrid search
async function handleSearch(query, forceCache = null) {
  const activeModeBtn = document.querySelector(".segment-btn.active");
  const mode = activeModeBtn ? activeModeBtn.dataset.mode : "hybrid";
  const useCache = forceCache !== null ? forceCache : cacheToggle.checked;

  answerLoading.classList.remove("hidden");
  answerContainer.classList.add("hidden");

  // Determine provider, model, and API key
  let provider = "auto";
  let model = "claude-3-5-sonnet-20241022";
  let customApiKey = null;

  if (state.byok.model === "claude-3-5-sonnet") {
    provider = "anthropic";
    model = "claude-3-5-sonnet-20241022";
    customApiKey = state.byok.claudeKey || null;
  } else if (state.byok.model === "gemini-2.5-flash" || state.byok.model === "gemini-1.5-flash") {
    provider = "gemini";
    model = state.byok.model;
    customApiKey = state.byok.geminiKey || null;
  } else if (state.byok.model === "gpt-4o-mini") {
    provider = "openai";
    model = "gpt-4o-mini";
    customApiKey = state.byok.openAIKey || null;
  } else if (state.byok.model === "offline") {
    provider = "offline";
    model = "offline-zero-drain";
    customApiKey = null;
  } else {
    provider = "auto";
    model = "auto";
    customApiKey = state.byok.claudeKey || state.byok.geminiKey || state.byok.openAIKey || null;
  }

  try {
    const res = await fetch("/api/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        mode: mode,
        use_cache: useCache,
        custom_api_key: customApiKey,
        provider: provider,
        model: model,
        top_k: 5,
        rrf_k: 60,
        use_reranker: true,
      }),
    });

    if (!res.ok) throw new Error("Search failed");
    const data = await res.json();
    state.lastSearchResponse = data;

    renderAnswer(data);
    updateHUD(data);
    fetchPipelineDetails(query);
    updateCacheStats();
  } catch (err) {
    console.error("Search error:", err);
    answerContainer.innerHTML = `<p style="color: var(--rose-primary)">Error executing search: ${err.message}</p>`;
  } finally {
    answerLoading.classList.add("hidden");
    answerContainer.classList.remove("hidden");
  }
}

// Render answer & citations with Prominent Highlight Cards
function renderAnswer(data) {
  let formattedHtml = formatMarkdown(data.answer);

  // Update model badge
  if (answerModelBadge) {
    if (data.provider === "anthropic") {
      answerModelBadge.textContent = "Claude 3.5 Sonnet";
    } else if (data.provider === "gemini") {
      answerModelBadge.textContent = "Gemini 2.5 Flash";
    } else if (data.provider === "openai") {
      answerModelBadge.textContent = "GPT-4o Mini";
    } else {
      answerModelBadge.textContent = "Free Built-In Engine ($0.00)";
    }
  }

  // Replace [1], [2] with high-contrast clickable citation pills
  formattedHtml = formattedHtml.replace(/\[(\d+)\]/g, (match, num) => {
    return `<button class="citation-pill-ref" data-cit-num="${num}">[${num}]</button>`;
  });

  answerContainer.innerHTML = formattedHtml;

  // Animate answer paragraphs
  if (window.gsap) {
    gsap.from("#answerContainer > *", {
      opacity: 0,
      y: 12,
      stagger: 0.06,
      duration: 0.4,
      ease: "power2.out",
    });
  }

  // Render citations into the dedicated breakdown list
  if (data.citations && data.citations.length > 0) {
    citationsSection.classList.remove("hidden");
    citationCountBadge.textContent = `${data.citations.length} Verified Sources Found`;
    citationsList.innerHTML = "";

    data.citations.forEach((cit) => {
      const card = document.createElement("div");
      card.className = "citation-focus-card";
      card.dataset.chunkId = cit.chunk_id;
      card.dataset.citNum = cit.citation_id;

      card.innerHTML = `
        <div class="citation-focus-top">
          <span class="citation-focus-badge">[${cit.citation_id}] ${cit.document_title}</span>
          <button type="button" class="citation-jump-link" data-chunk-id="${cit.chunk_id}">
            Read in Document Library &rarr;
          </button>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono)">
          Section: <strong>${cit.section_title}</strong> &bull; Page ${cit.page_number || 1}
        </div>
        <div class="citation-focus-quote">
          "${cit.exact_quote}"
        </div>
      `;

      // Jump to Document Library on button click
      const jumpBtn = card.querySelector(".citation-jump-link");
      if (jumpBtn) {
        jumpBtn.addEventListener("click", () => jumpToCitationInLibrary(cit));
      }

      citationsList.appendChild(card);
    });

    // Also wire up inline pills in the answer text [1], [2]
    document.querySelectorAll(".citation-pill-ref").forEach((pill) => {
      pill.addEventListener("click", (e) => {
        e.stopPropagation();
        const citNum = parseInt(pill.dataset.citNum, 10);
        const targetCit = data.citations.find((c) => c.citation_id === citNum);
        if (targetCit) jumpToCitationInLibrary(targetCit);
      });
    });
  } else {
    citationsSection.classList.add("hidden");
  }

  // Update Status Footer
  if (statusFooterSpeed) {
    statusFooterSpeed.textContent = data.cache_hit
      ? `Response: ${data.latency_ms.toFixed(1)}ms (Fast Cache Hit: $0.00 Cost)`
      : `Response: ${data.latency_ms.toFixed(1)}ms (Live Dual Search)`;
  }
}

// Seamless Jump from Citation directly to Document Library with glowing pulse
async function jumpToCitationInLibrary(cit) {
  // 1. Switch tab to Document Library
  switchTab("documents");

  const docId = cit.chunk_id.split("_c")[0];

  // 2. Select document in library
  if (state.activeDocId !== docId) {
    await selectDocumentTab(docId);
  }

  // 3. Locate target chunk in DOM and scroll with high-visibility highlight
  setTimeout(() => {
    const targetEl = document.getElementById(`chunk_${cit.chunk_id}`);
    if (targetEl) {
      document.querySelectorAll(".highlight-chunk").forEach((el) => el.classList.remove("highlight-chunk"));
      targetEl.classList.add("highlight-chunk");
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });

      if (window.gsap) {
        gsap.fromTo(targetEl, { scale: 0.97 }, { scale: 1, duration: 0.4, ease: "back.out(2)" });
      }
    }
  }, 100);
}

// Load Documents for Document Library
async function loadDocuments() {
  try {
    const res = await fetch("/api/v1/documents");
    if (!res.ok) throw new Error("Failed to load documents");
    state.documents = await res.json();

    renderDocLibraryList();
    renderDocTabs();

    if (state.documents.length > 0 && !state.activeDocId) {
      await selectDocumentTab(state.documents[0].document_id);
    }
  } catch (err) {
    console.error("Document loader error:", err);
  }
}

// Render sidebar document items in Document Library
function renderDocLibraryList() {
  if (!docLibraryList) return;
  docLibraryList.innerHTML = "";

  state.documents.forEach((doc) => {
    const item = document.createElement("div");
    item.className = `doc-list-item ${doc.document_id === state.activeDocId ? "active" : ""}`;
    item.innerHTML = `
      <div class="doc-item-title">${doc.title}</div>
      <div class="doc-item-meta">${doc.total_chunks} Chunks &bull; ${doc.document_id}</div>
    `;
    item.addEventListener("click", () => selectDocumentTab(doc.document_id));
    docLibraryList.appendChild(item);
  });
}

// Render document tabs in Reader
function renderDocTabs() {
  if (!docTabs) return;
  docTabs.innerHTML = "";

  state.documents.forEach((doc) => {
    const tab = document.createElement("button");
    tab.className = `doc-tab-pill ${doc.document_id === state.activeDocId ? "active" : ""}`;
    tab.textContent = doc.title;
    tab.addEventListener("click", () => selectDocumentTab(doc.document_id));
    docTabs.appendChild(tab);
  });
}

// Select and render a document in the reader
async function selectDocumentTab(docId) {
  state.activeDocId = docId;

  // Update tabs & sidebar active states
  renderDocTabs();
  renderDocLibraryList();

  try {
    const res = await fetch(`/api/v1/documents/${docId}`);
    if (!res.ok) throw new Error("Failed to fetch document content");
    const docData = await res.json();
    state.activeDocumentData = docData;

    if (docMetaTitle) docMetaTitle.textContent = docData.metadata.title;
    if (docChunkCountBadge) docChunkCountBadge.textContent = `${docData.chunks.length} Sections`;
    renderDocumentChunks(docData.chunks);
  } catch (err) {
    console.error("Document fetch error:", err);
  }
}

// Render document chunks in reader
function renderDocumentChunks(chunks) {
  if (!docContentContainer) return;
  docContentContainer.innerHTML = "";

  chunks.forEach((chunk) => {
    const chunkDiv = document.createElement("div");
    chunkDiv.className = "reader-chunk-card";
    chunkDiv.id = `chunk_${chunk.chunk_id}`;

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.fontSize = "0.72rem";
    header.style.color = "var(--text-muted)";
    header.style.marginBottom = "8px";
    header.innerHTML = `<span><strong style="color: var(--yellow-solar)">${chunk.section_title}</strong> &bull; Page ${chunk.page_number || 1}</span><span style="font-family: var(--font-mono)">${chunk.chunk_id}</span>`;

    const body = document.createElement("div");
    body.innerHTML = formatMarkdown(chunk.metadata.raw_text || chunk.content);

    chunkDiv.appendChild(header);
    chunkDiv.appendChild(body);
    docContentContainer.appendChild(chunkDiv);
  });
}

// Handle Ingest Document Submission
async function handleIngestDocument() {
  const title = ingestTitle.value.trim();
  const content = ingestContent.value.trim();

  if (!title || !content) {
    alert("Please enter both a title and document content.");
    return;
  }

  btnSubmitIngest.disabled = true;
  btnSubmitIngest.textContent = "Ingesting & Indexing...";

  try {
    const res = await fetch("/api/v1/documents/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title,
        content: content,
        document_type: "markdown",
      }),
    });

    if (!res.ok) throw new Error("Ingestion failed");
    const result = await res.json();

    ingestModal.classList.add("hidden");
    ingestTitle.value = "";
    ingestContent.value = "";

    await loadDocuments();
    await selectDocumentTab(result.document_id);
    alert(`Successfully ingested "${title}" into knowledge base!`);
  } catch (err) {
    alert(`Failed to ingest document: ${err.message}`);
  } finally {
    btnSubmitIngest.disabled = false;
    btnSubmitIngest.textContent = "Ingest & Index";
  }
}

// Update HUD cards in Analytics View
function updateHUD(data) {
  if (hudLatency) {
    if (window.gsap) {
      const latencyObj = { val: 0 };
      gsap.to(latencyObj, {
        val: data.latency_ms,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => { hudLatency.textContent = latencyObj.val.toFixed(1); },
      });
    } else {
      hudLatency.textContent = data.latency_ms.toFixed(1);
    }
  }

  if (hudLatencySub) {
    hudLatencySub.textContent = data.cache_hit
      ? "Instant Fast Cache (<25ms)"
      : "Live Dual Search (Meaning + Exact Words)";
  }
  if (indicatorLatency) indicatorLatency.textContent = data.cache_hit ? "FAST" : "LIVE";

  if (hudCacheStatus) {
    if (data.cache_hit) {
      hudCacheStatus.textContent = "CACHE HIT";
      hudCacheStatus.style.color = "var(--yellow-solar)";
      if (indicatorCache) {
        indicatorCache.textContent = "<25ms";
        indicatorCache.style.color = "var(--yellow-solar)";
      }
      if (hudCacheCost) hudCacheCost.textContent = `$${data.estimated_cost_saved_usd.toFixed(6)} Saved ($0 Cost)`;
    } else {
      hudCacheStatus.textContent = "LIVE SEARCH";
      hudCacheStatus.style.color = "var(--emerald-bright)";
      if (indicatorCache) {
        indicatorCache.textContent = "STORED";
        indicatorCache.style.color = "var(--emerald-bright)";
      }
      if (hudCacheCost) hudCacheCost.textContent = "Saved to Memory Cache";
    }
  }

  if (hudFusion) hudFusion.textContent = data.retrieval_mode.toUpperCase();
  if (hudCandidates) hudCandidates.textContent = `${data.retrieved_chunks.length} Relevant Sections`;

  const faithPct = Math.round(data.faithfulness_score * 100);
  if (hudFaithfulness) {
    if (window.gsap) {
      const faithObj = { val: 0 };
      gsap.to(faithObj, {
        val: faithPct,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => { hudFaithfulness.textContent = Math.round(faithObj.val); },
      });
    } else {
      hudFaithfulness.textContent = faithPct;
    }
  }
  if (indicatorFaith) indicatorFaith.textContent = `${faithPct}%`;
  if (hudFaithSub) hudFaithSub.textContent = `${data.citations.length} Verified Sources Found`;
}

// Fetch multi-stage pipeline details in Analytics
async function fetchPipelineDetails(query) {
  try {
    const res = await fetch("/api/v1/search/raw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, top_k: 5 }),
    });
    if (!res.ok) return;
    const rawData = await res.json();

    const pipelineTimings = document.getElementById("pipelineTimings");
    const pipelineTables = document.getElementById("pipelineTables");

    if (pipelineTimings) {
      pipelineTimings.innerHTML = `
        <div class="timing-chip">Dense ANN: <strong>${rawData.timings_ms.dense}ms</strong></div>
        <div class="timing-chip">BM25 Sparse: <strong>${rawData.timings_ms.bm25}ms</strong></div>
        <div class="timing-chip">RRF Fusion (k=60): <strong>${rawData.timings_ms.rrf}ms</strong></div>
        <div class="timing-chip">Cross-Encoder Re-Rank: <strong>${rawData.timings_ms.rerank}ms</strong></div>
        <div class="timing-chip" style="border-color: var(--yellow-solar)">Total Pipeline: <strong>${rawData.timings_ms.total}ms</strong></div>
      `;
    }

    if (pipelineTables) {
      pipelineTables.innerHTML = `
        <table class="benchmark-table" style="font-size: 0.74rem">
          <thead>
            <tr>
              <th>CHUNK ID</th>
              <th>SOURCE DOCUMENT</th>
              <th>DENSE RANK</th>
              <th>BM25 RANK</th>
              <th>RRF SCORE</th>
              <th>RE-RANK SCORE</th>
            </tr>
          </thead>
          <tbody>
            ${rawData.final_reranked
              .map(
                (item) => `
              <tr>
                <td><code style="color: var(--yellow-solar)">${item.chunk_id}</code></td>
                <td>${item.document_title}</td>
                <td>${item.dense_rank !== null ? `#${item.dense_rank}` : "&mdash;"}</td>
                <td>${item.bm25_rank !== null ? `#${item.bm25_rank}` : "&mdash;"}</td>
                <td style="font-family: var(--font-mono); color: var(--emerald-bright)">${item.rrf_score.toFixed(4)}</td>
                <td style="font-family: var(--font-mono); color: var(--yellow-solar)"><strong>${item.score.toFixed(4)}</strong></td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      `;
    }
  } catch (err) {
    console.error("Failed to fetch pipeline inspection:", err);
  }
}

// Update cache stats in header
async function updateCacheStats() {
  try {
    const res = await fetch("/api/v1/cache/stats");
    if (!res.ok) return;
    const stats = await res.json();

    const hitStat = document.getElementById("cacheHitStat");
    if (hitStat) {
      hitStat.textContent = `${stats.cache_hits} Hits ($${stats.estimated_cost_saved_usd.toFixed(4)})`;
    }
  } catch (err) {
    console.error("Failed to load cache stats:", err);
  }
}

// Load Benchmarks for Analytics View
async function loadBenchmarks() {
  const tbody = document.getElementById("matrixTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">Loading accuracy benchmark matrix...</td></tr>`;

  try {
    const res = await fetch("/api/v1/benchmarks");
    if (!res.ok) throw new Error("Failed to load evals");
    const data = await res.json();
    const matrix = data.performance_matrix;

    tbody.innerHTML = Object.keys(matrix)
      .map((key) => {
        const item = matrix[key];
        const isBest = key === "hybrid_reranked";
        return `
          <tr class="${isBest ? "highlight-row" : ""}">
            <td><strong>${item.name}</strong> ${isBest ? "(Synapse Standard)" : ""}</td>
            <td class="${isBest ? "highlight-metric" : ""}">${(item.avg_context_precision * 100).toFixed(1)}%</td>
            <td class="${isBest ? "highlight-metric" : ""}">${(item.avg_context_recall * 100).toFixed(1)}%</td>
            <td class="${isBest ? "highlight-metric" : ""}">${(item.avg_faithfulness * 100).toFixed(1)}%</td>
            <td class="${isBest ? "highlight-metric" : ""}">${(item.avg_answer_relevance * 100).toFixed(1)}%</td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: var(--rose-primary)">Failed to load benchmarks.</td></tr>`;
  }
}

// Run live evals in Analytics View
async function runLiveEvals() {
  const btn = document.getElementById("btnRunLiveEvals");
  btn.textContent = "Executing 10 Benchmark Queries...";
  btn.disabled = true;

  try {
    await fetch("/api/v1/benchmarks/run", { method: "POST" });
    await loadBenchmarks();
  } catch (err) {
    console.error("Live evals error:", err);
  } finally {
    btn.textContent = "Re-Run Accuracy Test (10 Queries)";
    btn.disabled = false;
  }
}

// Auto-detect active keys from backend
async function detectActiveKeys() {
  if (!detectedStatusText) return;
  detectedStatusText.textContent = "Scanning environment & system keys...";
  try {
    const res = await fetch("/api/v1/auth/detect");
    if (!res.ok) throw new Error("Detection failed");
    const info = await res.json();
    detectedStatusText.innerHTML = `<strong>${info.label}</strong> &bull; <span style="color: var(--emerald-bright)">${info.status}</span>`;
  } catch (err) {
    detectedStatusText.innerHTML = `<strong>Offline High-Precision Engine</strong> &bull; <span style="color: var(--yellow-solar)">Ready ($0.00 Free)</span>`;
  }
}

// Settings management
function loadSettings() {
  if (inputClaudeKey) inputClaudeKey.value = state.byok.claudeKey;
  if (inputGeminiKey) inputGeminiKey.value = state.byok.geminiKey;
  if (inputOpenAIKey) inputOpenAIKey.value = state.byok.openAIKey;
  if (selectModel) selectModel.value = state.byok.model;
}

function saveSettings() {
  if (inputClaudeKey) state.byok.claudeKey = inputClaudeKey.value.trim();
  if (inputGeminiKey) state.byok.geminiKey = inputGeminiKey.value.trim();
  if (inputOpenAIKey) state.byok.openAIKey = inputOpenAIKey.value.trim();
  if (selectModel) state.byok.model = selectModel.value;

  localStorage.setItem("SYNAPSE_CLAUDE_KEY", state.byok.claudeKey);
  localStorage.setItem("SYNAPSE_GEMINI_KEY", state.byok.geminiKey);
  localStorage.setItem("SYNAPSE_OPENAI_KEY", state.byok.openAIKey);
  localStorage.setItem("SYNAPSE_MODEL", state.byok.model);

  // Update answerModelBadge immediately
  if (answerModelBadge) {
    if (state.byok.model === "claude-3-5-sonnet") answerModelBadge.textContent = "Claude 3.5 Sonnet";
    else if (state.byok.model.includes("gemini")) answerModelBadge.textContent = "Gemini 2.5 Flash";
    else if (state.byok.model.includes("gpt")) answerModelBadge.textContent = "GPT-4o Mini";
    else if (state.byok.model === "offline") answerModelBadge.textContent = "Free Built-In Engine ($0.00)";
    else answerModelBadge.textContent = "Auto-Detect (Ready)";
  }

  alert("Settings saved successfully!");
}

function clearSettings() {
  localStorage.removeItem("SYNAPSE_CLAUDE_KEY");
  localStorage.removeItem("SYNAPSE_GEMINI_KEY");
  localStorage.removeItem("SYNAPSE_OPENAI_KEY");
  localStorage.removeItem("SYNAPSE_MODEL");
  if (inputClaudeKey) inputClaudeKey.value = "";
  if (inputGeminiKey) inputGeminiKey.value = "";
  if (inputOpenAIKey) inputOpenAIKey.value = "";
  if (selectModel) selectModel.value = "auto";
  state.byok.claudeKey = "";
  state.byok.geminiKey = "";
  state.byok.openAIKey = "";
  state.byok.model = "auto";
  detectActiveKeys();
  alert("Settings reset to defaults.");
}

// Markdown formatter
function formatMarkdown(text) {
  if (!text) return "";
  let html = text
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/gim, "<em>$1</em>")
    .replace(/`([^`]+)`/gim, "<code>$1</code>")
    .replace(/^\- (.*$)/gim, "<li>$1</li>")
    .replace(/\n\n/gim, "<p></p>");

  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/gms, "<ul>$1</ul>");
  }

  return html;
}

// Bootstrap
document.addEventListener("DOMContentLoaded", init);
