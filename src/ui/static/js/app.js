/**
 * Synapse // Enterprise Hybrid Search & Document Intelligence Engine
 * Modern ES Modules Frontend Controller with GSAP Transitions & 3D Spatial Physics
 */

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

// DOM References
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

// HUD Elements
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

// Modals
const settingsModal = document.getElementById("settingsModal");
const evalsModal = document.getElementById("evalsModal");
const inputGeminiKey = document.getElementById("inputGeminiKey");
const inputOpenAIKey = document.getElementById("inputOpenAIKey");
const selectModel = document.getElementById("selectModel");

// Initialize application
async function init() {
  bindEventListeners();
  init3DTilt();
  loadSettings();
  await loadDocuments();
  await updateCacheStats();
}

// Bind UI event listeners
function bindEventListeners() {
  searchForm.addEventListener("submit", handleSearchSubmit);

  // Scenario chips with GSAP micro-interaction
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

  // Accordion toggle
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

  // Modals
  document.getElementById("btnSettingsModal").addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
    if (window.gsap) gsap.from(".modal-dialog", { scale: 0.9, opacity: 0, duration: 0.25 });
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
      const btn = document.getElementById("btnCopyAnswer");
      btn.style.color = "var(--amber-bright)";
      setTimeout(() => { btn.style.color = ""; }, 1200);
    }
  });
}

// 3D Tilt physics for cards (ThreeUI pattern)
function init3DTilt() {
  const cards = document.querySelectorAll(".tilt-card");
  cards.forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = -(y / rect.height) * 10;
      const rotateY = (x / rect.width) * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
    });
  });
}

// Load document catalog
async function loadDocuments() {
  try {
    const res = await fetch("/api/v1/documents");
    if (!res.ok) return;
    state.documents = await res.json();

    document.getElementById("kbDocCount").textContent = `${state.documents.length} Docs`;

    docTabs.innerHTML = "";
    state.documents.forEach((doc, idx) => {
      const tab = document.createElement("button");
      tab.className = `doc-tab-pill ${idx === 0 ? "active" : ""}`;
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

// Select active document tab
async function selectDocumentTab(docId) {
  state.activeDocId = docId;
  document.querySelectorAll(".doc-tab-pill").forEach((tab) => {
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
    chunkDiv.className = "reader-chunk-item";
    chunkDiv.id = `chunk_${chunk.chunk_id}`;
    chunkDiv.dataset.chunkId = chunk.chunk_id;
    chunkDiv.style.marginBottom = "14px";
    chunkDiv.style.padding = "12px 16px";
    chunkDiv.style.borderRadius = "8px";
    chunkDiv.style.border = "1px solid rgba(255,255,255,0.06)";
    chunkDiv.style.background = "rgba(10, 13, 22, 0.45)";
    chunkDiv.style.transition = "all 0.3s ease";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.fontSize = "0.72rem";
    header.style.color = "var(--text-muted)";
    header.style.marginBottom = "8px";
    header.innerHTML = `<span><strong style="color: var(--amber-bright)">${chunk.section_title}</strong> &bull; Page ${chunk.page_number || 1}</span><span style="font-family: var(--font-mono)">${chunk.chunk_id}</span>`;

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
  if (query) handleSearch(query);
}

// Execute hybrid search
async function handleSearch(query, forceCache = null) {
  const activeModeBtn = document.querySelector(".segment-btn.active");
  const mode = activeModeBtn ? activeModeBtn.dataset.mode : "hybrid";
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
    answerContainer.innerHTML = `<p style="color: var(--rose-primary)">Error executing search: ${err.message}</p>`;
  } finally {
    answerLoading.classList.add("hidden");
    answerContainer.classList.remove("hidden");
  }
}

// Render answer & citations with GSAP cascade
function renderAnswer(data) {
  let formattedHtml = formatMarkdown(data.answer);

  // Replace [1], [2] with high-contrast amber citation buttons
  formattedHtml = formattedHtml.replace(/\[(\d+)\]/g, (match, num) => {
    return `<button class="citation-pill-ref" data-cit-num="${num}">[${num}]</button>`;
  });

  answerContainer.innerHTML = formattedHtml;

  // Animate answer paragraphs with GSAP
  if (window.gsap) {
    gsap.from("#answerContainer > *", {
      opacity: 0,
      y: 12,
      stagger: 0.06,
      duration: 0.4,
      ease: "power2.out",
    });
  }

  // Render citations list
  if (data.citations && data.citations.length > 0) {
    citationsSection.classList.remove("hidden");
    citationCountBadge.textContent = `${data.citations.length} Verified Sources`;
    citationsList.innerHTML = "";

    data.citations.forEach((cit) => {
      const card = document.createElement("div");
      card.className = "citation-ribbon-card";
      card.dataset.chunkId = cit.chunk_id;
      card.dataset.citNum = cit.citation_id;

      card.innerHTML = `
        <div class="citation-ribbon-top">
          <span class="citation-doc-title">${cit.document_title}</span>
          <span class="citation-pill-tag">[${cit.citation_id}] Page ${cit.page_number || 1}</span>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono)">${cit.section_title} &bull; ${cit.chunk_id}</div>
        <div class="citation-quote-box">"${cit.exact_quote}"</div>
      `;

      card.addEventListener("click", () => activateCitation(cit));
      citationsList.appendChild(card);
    });

    // GSAP cascade on citations deck
    if (window.gsap) {
      gsap.from(".citation-ribbon-card", {
        opacity: 0,
        x: -16,
        stagger: 0.08,
        duration: 0.45,
        ease: "power2.out",
      });
    }

    // Bind inline citation badges
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

// Activate citation in viewer
async function activateCitation(cit) {
  const docId = cit.chunk_id.split("_c")[0];

  if (state.activeDocId !== docId) {
    await selectDocumentTab(docId);
  }

  document.querySelectorAll(".citation-ribbon-card").forEach((c) => {
    c.classList.toggle("active", c.dataset.citNum === String(cit.citation_id));
  });

  const targetElement = document.getElementById(`chunk_${cit.chunk_id}`);
  if (targetElement) {
    document.querySelectorAll(".highlight-chunk").forEach((el) => el.classList.remove("highlight-chunk"));
    targetElement.classList.add("highlight-chunk");
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });

    if (window.gsap) {
      gsap.fromTo(targetElement, { scale: 0.98 }, { scale: 1, duration: 0.35, ease: "back.out(2)" });
    }
  }
}

// Update HUD cards with GSAP number tweening
function updateHUD(data) {
  // GSAP tween for latency counter
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

  hudLatencySub.textContent = data.cache_hit ? "⚡ Sub-25ms Redis Cache" : "Dual Fusion + Re-Ranking";
  indicatorLatency.textContent = data.cache_hit ? "CACHE" : "LIVE";

  if (data.cache_hit) {
    hudCacheStatus.textContent = "CACHE HIT";
    hudCacheStatus.style.color = "var(--amber-bright)";
    indicatorCache.textContent = "<25ms";
    indicatorCache.style.color = "var(--amber-bright)";
    hudCacheCost.textContent = `$${data.estimated_cost_saved_usd.toFixed(6)} saved`;
  } else {
    hudCacheStatus.textContent = "MISS (LIVE)";
    hudCacheStatus.style.color = "var(--iris-bright)";
    indicatorCache.textContent = "STORED";
    indicatorCache.style.color = "var(--iris-bright)";
    hudCacheCost.textContent = "Indexed in Redis";
  }

  hudFusion.textContent = data.retrieval_mode.toUpperCase();
  hudCandidates.textContent = `${data.retrieved_chunks.length} Top Grounded Chunks`;

  const faithPct = Math.round(data.faithfulness_score * 100);
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
  indicatorFaith.textContent = `${faithPct}%`;
  hudFaithSub.textContent = `${data.citations.length} Grounded Citations`;
}

// Fetch multi-stage pipeline details
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
      <div class="timing-chip">Dense ANN: <strong>${rawData.timings_ms.dense}ms</strong></div>
      <div class="timing-chip">BM25 Sparse: <strong>${rawData.timings_ms.bm25}ms</strong></div>
      <div class="timing-chip">RRF Fusion (k=60): <strong>${rawData.timings_ms.rrf}ms</strong></div>
      <div class="timing-chip">Cross-Encoder Re-Rank: <strong>${rawData.timings_ms.rerank}ms</strong></div>
      <div class="timing-chip" style="border-color: var(--amber-primary)">Total Pipeline: <strong>${rawData.timings_ms.total}ms</strong></div>
    `;

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
              <td><code style="color: var(--amber-bright)">${item.chunk_id}</code></td>
              <td>${item.document_title}</td>
              <td>${item.dense_rank !== null ? `#${item.dense_rank}` : "&mdash;"}</td>
              <td>${item.bm25_rank !== null ? `#${item.bm25_rank}` : "&mdash;"}</td>
              <td style="font-family: var(--font-mono); color: var(--iris-bright)">${item.rrf_score.toFixed(4)}</td>
              <td style="font-family: var(--font-mono); color: var(--amber-bright)"><strong>${item.score.toFixed(4)}</strong></td>
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

// Update cache stats
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

// Open Evals Modal
async function openEvalsModal() {
  evalsModal.classList.remove("hidden");
  const tbody = document.getElementById("matrixTableBody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">Querying Ragas empirical benchmark matrix...</td></tr>`;

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
            <td><strong>${item.name}</strong> ${isBest ? "⭐ (Synapse Standard)" : ""}</td>
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
    btn.textContent = "Re-Run 10-Query Live Benchmark";
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
}

function clearSettings() {
  localStorage.removeItem("SYNAPSE_GEMINI_KEY");
  localStorage.removeItem("SYNAPSE_OPENAI_KEY");
  inputGeminiKey.value = "";
  inputOpenAIKey.value = "";
  state.byok.geminiKey = "";
  state.byok.openAIKey = "";
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
