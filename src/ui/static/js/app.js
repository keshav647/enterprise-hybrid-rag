/**
 * Synapse // Enterprise Hybrid Search & Document Intelligence Engine
 * Modern ES Modules Frontend Controller
 */

// Application state
const state = {
  documents: [],
  activeDocId: null,
  activeDocumentData: null,
  lastSearchResponse: null,
  byok: {
    geminiKey: localStorage.getItem("SYNAPSE_GEMINI_KEY") || "",
    openAIKey: localStorage.getItem("SYNAPSE_OPENAI_KEY") || "",
    model: localStorage.getItem("SYNAPSE_MODEL") || "gemini-2.5-flash",
  },
};

// DOM Elements
const queryInput = document.getElementById("queryInput");
const searchForm = document.getElementById("searchForm");
const answerContainer = document.getElementById("answerContainer");
const answerLoading = document.getElementById("answerLoading");
const citationsSection = document.getElementById("citationsSection");
const citationsList = document.getElementById("citationsList");
const citationCountBadge = document.getElementById("citationCountBadge");
const docTabs = document.getElementById("docTabs");
const docContentContainer = document.getElementById("docContentContainer");
const docMetaTitle = document.getElementById("docMetaTitle");
const docPageBadge = document.getElementById("docPageBadge");
const cacheToggle = document.getElementById("cacheToggle");

// HUD elements
const hudLatency = document.getElementById("hudLatency");
const hudLatencySub = document.getElementById("hudLatencySub");
const hudCacheStatus = document.getElementById("hudCacheStatus");
const hudCacheCost = document.getElementById("hudCacheCost");
const hudFusion = document.getElementById("hudFusion");
const hudCandidates = document.getElementById("hudCandidates");
const hudFaithfulness = document.getElementById("hudFaithfulness");
const hudFaithSub = document.getElementById("hudFaithSub");

// Modals
const settingsModal = document.getElementById("settingsModal");
const evalsModal = document.getElementById("evalsModal");
const inputGeminiKey = document.getElementById("inputGeminiKey");
const inputOpenAIKey = document.getElementById("inputOpenAIKey");
const selectModel = document.getElementById("selectModel");

// Initialize application
async function init() {
  bindEventListeners();
  loadSettings();
  await loadDocuments();
  await updateCacheStats();
}

// Bind UI events
function bindEventListeners() {
  searchForm.addEventListener("submit", handleSearchSubmit);

  // Scenario chips
  document.querySelectorAll(".chip[data-query]").forEach((chip) => {
    chip.addEventListener("click", () => {
      queryInput.value = chip.dataset.query;
      handleSearch(chip.dataset.query);
    });
  });

  // 1-Click Cache Hit demonstration button
  const btnTestCacheHit = document.getElementById("btnTestCacheHit");
  if (btnTestCacheHit) {
    btnTestCacheHit.addEventListener("click", async () => {
      const q = "What is the memory offset and vulnerable function in CVE-2024-8192?";
      queryInput.value = q;
      // First ensure it is cached
      await handleSearch(q, true);
      // Wait 150ms and query again to demonstrate instant <25ms cache hit
      setTimeout(async () => {
        await handleSearch(q, true);
      }, 150);
    });
  }

  // Retrieval mode toggles
  document.querySelectorAll(".toggle-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".toggle-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
    });
  });

  // Accordion toggle
  const pipelineToggle = document.getElementById("pipelineToggle");
  const pipelineContent = document.getElementById("pipelineContent");
  if (pipelineToggle && pipelineContent) {
    pipelineToggle.addEventListener("click", () => {
      pipelineToggle.classList.toggle("open");
      pipelineContent.classList.toggle("hidden");
    });
  }

  // Modals
  document.getElementById("btnSettingsModal").addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
  });
  document.getElementById("btnCloseSettings").addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });
  document.getElementById("btnSaveSettings").addEventListener("click", saveSettings);
  document.getElementById("btnClearKeys").addEventListener("click", clearSettings);

  document.getElementById("btnEvalsModal").addEventListener("click", openEvalsModal);
  document.getElementById("btnCloseEvals").addEventListener("click", () => {
    evalsModal.classList.add("hidden");
  });
  document.getElementById("btnRunLiveEvals").addEventListener("click", runLiveEvals);

  // Copy answer
  document.getElementById("btnCopyAnswer").addEventListener("click", () => {
    if (state.lastSearchResponse) {
      navigator.clipboard.writeText(state.lastSearchResponse.answer);
      alert("Answer copied to clipboard!");
    }
  });
}

// Load documents list
async function loadDocuments() {
  try {
    const res = await fetch("/api/v1/documents");
    if (!res.ok) return;
    state.documents = await res.json();

    document.getElementById("kbDocCount").textContent = `${state.documents.length} Documents`;

    // Render tabs
    docTabs.innerHTML = "";
    state.documents.forEach((doc, idx) => {
      const tab = document.createElement("button");
      tab.className = `doc-tab ${idx === 0 ? "active" : ""}`;
      tab.textContent = doc.title;
      tab.dataset.docId = doc.document_id;
      tab.addEventListener("click", () => selectDocumentTab(doc.document_id));
      docTabs.appendChild(tab);
    });

    if (state.documents.length > 0) {
      await selectDocumentTab(state.documents[0].document_id);
    }
  } catch (err) {
    console.error("Failed to load documents:", err);
  }
}

// Select and render a document tab
async function selectDocumentTab(docId) {
  state.activeDocId = docId;
  document.querySelectorAll(".doc-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.docId === docId);
  });

  try {
    const res = await fetch(`/api/v1/documents/${docId}`);
    if (!res.ok) return;
    const data = await res.json();
    state.activeDocumentData = data;

    docMetaTitle.textContent = data.metadata.title;
    docPageBadge.textContent = `${data.metadata.total_pages} Pages`;

    renderDocumentContent(data);
  } catch (err) {
    console.error("Failed to fetch document detail:", err);
  }
}

// Render document chunks in viewer
function renderDocumentContent(data) {
  docContentContainer.innerHTML = "";

  data.chunks.forEach((chunk) => {
    const chunkDiv = document.createElement("div");
    chunkDiv.className = "doc-chunk-block";
    chunkDiv.id = `chunk_${chunk.chunk_id}`;
    chunkDiv.dataset.chunkId = chunk.chunk_id;
    chunkDiv.style.marginBottom = "14px";
    chunkDiv.style.padding = "10px 14px";
    chunkDiv.style.borderRadius = "6px";
    chunkDiv.style.border = "1px solid rgba(255,255,255,0.06)";
    chunkDiv.style.background = "rgba(0,0,0,0.2)";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.fontSize = "0.72rem";
    header.style.color = "var(--text-muted)";
    header.style.marginBottom = "6px";
    header.innerHTML = `<span><strong>${chunk.section_title}</strong> &bull; Page ${chunk.page_number || 1}</span><span style="font-family: var(--font-mono)">${chunk.chunk_id}</span>`;

    const body = document.createElement("div");
    body.innerHTML = formatMarkdown(chunk.metadata.raw_text || chunk.content);

    chunkDiv.appendChild(header);
    chunkDiv.appendChild(body);
    docContentContainer.appendChild(chunkDiv);
  });
}

// Handle search submission
function handleSearchSubmit(e) {
  e.preventDefault();
  const query = queryInput.value.trim();
  if (query) {
    handleSearch(query);
  }
}

// Execute search
async function handleSearch(query, forceCache = null) {
  const activeModePill = document.querySelector(".toggle-pill.active");
  const mode = activeModePill ? activeModePill.dataset.mode : "hybrid";
  const useCache = forceCache !== null ? forceCache : cacheToggle.checked;

  answerLoading.classList.remove("hidden");
  answerContainer.classList.add("hidden");

  try {
    const res = await fetch("/api/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query,
        mode: mode,
        use_cache: useCache,
        custom_api_key: state.byok.geminiKey || null,
        provider: state.byok.geminiKey ? "gemini" : "offline",
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
    answerContainer.innerHTML = `<p style="color: var(--accent-crimson)">Error executing search: ${err.message}</p>`;
  } finally {
    answerLoading.classList.add("hidden");
    answerContainer.classList.remove("hidden");
  }
}

// Render synthesized answer and citations
function renderAnswer(data) {
  // Format markdown with interactive citation pill replacements
  let formattedHtml = formatMarkdown(data.answer);

  // Replace [1], [2] with clickable buttons
  formattedHtml = formattedHtml.replace(/\[(\d+)\]/g, (match, num) => {
    return `<button class="citation-pill-ref" data-cit-num="${num}">[${num}]</button>`;
  });

  answerContainer.innerHTML = formattedHtml;

  // Render citations list
  if (data.citations && data.citations.length > 0) {
    citationsSection.classList.remove("hidden");
    citationCountBadge.textContent = `${data.citations.length} Verified Sources`;
    citationsList.innerHTML = "";

    data.citations.forEach((cit) => {
      const card = document.createElement("div");
      card.className = "citation-card";
      card.dataset.chunkId = cit.chunk_id;
      card.dataset.citNum = cit.citation_id;

      card.innerHTML = `
        <div class="citation-card-header">
          <span class="citation-card-title">${cit.document_title}</span>
          <span class="citation-badge-pill">[${cit.citation_id}] Page ${cit.page_number || 1}</span>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono)">${cit.section_title} &bull; ${cit.chunk_id}</div>
        <div class="citation-quote">"${cit.exact_quote}"</div>
      `;

      card.addEventListener("click", () => activateCitation(cit));
      citationsList.appendChild(card);
    });

    // Bind inline citation pill clicks
    document.querySelectorAll(".citation-pill-ref").forEach((pill) => {
      pill.addEventListener("click", (e) => {
        e.stopPropagation();
        const citNum = parseInt(pill.dataset.citNum, 10);
        const targetCit = data.citations.find((c) => c.citation_id === citNum);
        if (targetCit) activateCitation(targetCit);
      });
    });
  } else {
    citationsSection.classList.add("hidden");
  }
}

// Highlight citation and jump in viewer
async function activateCitation(cit) {
  // Find which document this chunk belongs to
  const docId = cit.chunk_id.split("_c")[0];

  if (state.activeDocId !== docId) {
    await selectDocumentTab(docId);
  }

  // Highlight card in left drawer
  document.querySelectorAll(".citation-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.citNum === String(cit.citation_id));
  });

  // Scroll to and highlight chunk in document viewer
  const targetElement = document.getElementById(`chunk_${cit.chunk_id}`);
  if (targetElement) {
    document.querySelectorAll(".highlight-chunk").forEach((el) => el.classList.remove("highlight-chunk"));
    targetElement.classList.add("highlight-chunk");
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Update HUD cards
function updateHUD(data) {
  hudLatency.textContent = `${data.latency_ms} ms`;
  hudLatencySub.textContent = data.cache_hit ? "⚡ Instant Redis Cache" : "Live Hybrid Execution";

  if (data.cache_hit) {
    hudCacheStatus.textContent = "⚡ CACHE HIT";
    hudCacheStatus.style.color = "var(--accent-emerald)";
    hudCacheCost.textContent = `$${data.estimated_cost_saved_usd.toFixed(6)} saved`;
  } else {
    hudCacheStatus.textContent = "MISS (LIVE)";
    hudCacheStatus.style.color = "var(--accent-cyan)";
    hudCacheCost.textContent = "Stored in Redis";
  }

  hudFusion.textContent = data.retrieval_mode.toUpperCase();
  hudCandidates.textContent = `${data.retrieved_chunks.length} Top Chunks Grounded`;

  const faithPct = Math.round(data.faithfulness_score * 100);
  hudFaithfulness.textContent = `${faithPct}%`;
  hudFaithfulness.style.color = faithPct >= 90 ? "var(--accent-emerald)" : "var(--accent-amber)";
  hudFaithSub.textContent = `${data.citations.length} Grounded Citations`;
}

// Fetch multi-stage retrieval internals
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

    pipelineTimings.innerHTML = `
      <div class="timing-badge">Dense: <strong>${rawData.timings_ms.dense}ms</strong></div>
      <div class="timing-badge">BM25: <strong>${rawData.timings_ms.bm25}ms</strong></div>
      <div class="timing-badge">RRF: <strong>${rawData.timings_ms.rrf}ms</strong></div>
      <div class="timing-badge">Re-Rank: <strong>${rawData.timings_ms.rerank}ms</strong></div>
      <div class="timing-badge">Total Pipeline: <strong>${rawData.timings_ms.total}ms</strong></div>
    `;

    pipelineTables.innerHTML = `
      <table class="matrix-table" style="font-size: 0.74rem">
        <thead>
          <tr>
            <th>CHUNK ID</th>
            <th>DOCUMENT</th>
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
              <td><code>${item.chunk_id}</code></td>
              <td>${item.document_title}</td>
              <td>${item.dense_rank !== null ? `#${item.dense_rank}` : "&mdash;"}</td>
              <td>${item.bm25_rank !== null ? `#${item.bm25_rank}` : "&mdash;"}</td>
              <td style="font-family: var(--font-mono); color: var(--accent-cyan)">${item.rrf_score.toFixed(4)}</td>
              <td style="font-family: var(--font-mono); color: var(--accent-emerald)"><strong>${item.score.toFixed(4)}</strong></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } catch (err) {
    console.error("Failed to fetch pipeline inspection:", err);
  }
}

// Update cache statistics
async function updateCacheStats() {
  try {
    const res = await fetch("/api/v1/cache/stats");
    if (!res.ok) return;
    const stats = await res.json();

    const badge = document.getElementById("cacheStatusBadge");
    if (badge) {
      badge.innerHTML = `
        <span class="redis-icon">⚡</span>
        <span>Redis Cache: ${stats.cache_hits} Hits &bull; $${stats.estimated_cost_saved_usd.toFixed(4)} Saved</span>
      `;
    }
  } catch (err) {
    console.error("Failed to load cache stats:", err);
  }
}

// Open Evals Modal
async function openEvalsModal() {
  evalsModal.classList.remove("hidden");
  const tbody = document.getElementById("matrixTableBody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center">Loading Ragas benchmark metrics...</td></tr>`;

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
          <tr style="${isBest ? "background: rgba(63, 185, 80, 0.08)" : ""}">
            <td><strong>${item.name}</strong> ${isBest ? "⭐ (Production)" : ""}</td>
            <td class="${isBest ? "matrix-highlight" : ""}">${(item.avg_context_precision * 100).toFixed(1)}%</td>
            <td class="${isBest ? "matrix-highlight" : ""}">${(item.avg_context_recall * 100).toFixed(1)}%</td>
            <td class="${isBest ? "matrix-highlight" : ""}">${(item.avg_faithfulness * 100).toFixed(1)}%</td>
            <td class="${isBest ? "matrix-highlight" : ""}">${(item.avg_answer_relevance * 100).toFixed(1)}%</td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color: var(--accent-crimson)">Failed to load benchmarks.</td></tr>`;
  }
}

// Run live evals
async function runLiveEvals() {
  const btn = document.getElementById("btnRunLiveEvals");
  btn.textContent = "Executing 10 Benchmark Queries...";
  btn.disabled = true;

  try {
    await fetch("/api/v1/benchmarks/run", { method: "POST" });
    await openEvalsModal();
  } catch (err) {
    console.error("Live evals error:", err);
  } finally {
    btn.textContent = "Re-run Live Benchmark";
    btn.disabled = false;
  }
}

// Settings management
function loadSettings() {
  inputGeminiKey.value = state.byok.geminiKey;
  inputOpenAIKey.value = state.byok.openAIKey;
  selectModel.value = state.byok.model;
}

function saveSettings() {
  state.byok.geminiKey = inputGeminiKey.value.trim();
  state.byok.openAIKey = inputOpenAIKey.value.trim();
  state.byok.model = selectModel.value;

  localStorage.setItem("SYNAPSE_GEMINI_KEY", state.byok.geminiKey);
  localStorage.setItem("SYNAPSE_OPENAI_KEY", state.byok.openAIKey);
  localStorage.setItem("SYNAPSE_MODEL", state.byok.model);

  settingsModal.classList.add("hidden");
  alert("API settings successfully saved to client localStorage!");
}

function clearSettings() {
  localStorage.removeItem("SYNAPSE_GEMINI_KEY");
  localStorage.removeItem("SYNAPSE_OPENAI_KEY");
  inputGeminiKey.value = "";
  inputOpenAIKey.value = "";
  state.byok.geminiKey = "";
  state.byok.openAIKey = "";
  alert("Client API keys cleared.");
}

// Markdown formatter helper
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

  // Wrap lists
  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/gms, "<ul>$1</ul>");
  }

  return html;
}

// Bootstrap
document.addEventListener("DOMContentLoaded", init);
