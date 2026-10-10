import { updateHeaderCacheBadge, formatMarkdown } from "/static/js/shared.js";

const state = {
  lastResponse: null,
};

// DOM references
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

function initSearchPage() {
  updateHeaderCacheBadge();
  bindEvents();
}

function bindEvents() {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = queryInput.value.trim();
    if (q) executeSearch(q);
  });

  // Example scenario cards
  document.querySelectorAll(".scenario-card[data-query]").forEach((card) => {
    card.addEventListener("click", () => {
      queryInput.value = card.dataset.query;
      executeSearch(card.dataset.query);
    });
  });

  // Test cache hit button
  const btnTestCacheHit = document.getElementById("btnTestCacheHit");
  if (btnTestCacheHit) {
    btnTestCacheHit.addEventListener("click", async () => {
      const q = "What is the memory offset and vulnerable function in CVE-2024-8192?";
      queryInput.value = q;
      await executeSearch(q, true);
      setTimeout(async () => {
        await executeSearch(q, true);
      }, 180);
    });
  }

  // Segmented control mode selector
  document.querySelectorAll(".segment-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".segment-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Copy button
  const btnCopyAnswer = document.getElementById("btnCopyAnswer");
  if (btnCopyAnswer) {
    btnCopyAnswer.addEventListener("click", () => {
      if (state.lastResponse) {
        navigator.clipboard.writeText(state.lastResponse.answer);
        btnCopyAnswer.style.color = "var(--yellow-solar)";
        setTimeout(() => { btnCopyAnswer.style.color = ""; }, 1200);
      }
    });
  }
}

async function executeSearch(query, forceCache = null) {
  const activeModeBtn = document.querySelector(".segment-btn.active");
  const mode = activeModeBtn ? activeModeBtn.dataset.mode : "hybrid";
  const useCache = forceCache !== null ? forceCache : cacheToggle.checked;

  answerLoading.classList.remove("hidden");
  answerContainer.classList.add("hidden");

  // Read configured settings from localStorage
  const savedModel = localStorage.getItem("SYNAPSE_MODEL") || "auto";
  const claudeKey = localStorage.getItem("SYNAPSE_CLAUDE_KEY") || null;
  const geminiKey = localStorage.getItem("SYNAPSE_GEMINI_KEY") || null;
  const openAIKey = localStorage.getItem("SYNAPSE_OPENAI_KEY") || null;

  let provider = "auto";
  let model = "claude-3-5-sonnet-20241022";
  let customApiKey = null;

  if (savedModel === "claude-3-5-sonnet") {
    provider = "anthropic";
    model = "claude-3-5-sonnet-20241022";
    customApiKey = claudeKey;
  } else if (savedModel.includes("gemini")) {
    provider = "gemini";
    model = savedModel;
    customApiKey = geminiKey;
  } else if (savedModel.includes("gpt")) {
    provider = "openai";
    model = "gpt-4o-mini";
    customApiKey = openAIKey;
  } else if (savedModel === "offline") {
    provider = "offline";
    model = "offline-zero-drain";
    customApiKey = null;
  } else {
    provider = "auto";
    model = "auto";
    customApiKey = claudeKey || geminiKey || openAIKey || null;
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
    state.lastResponse = data;

    renderAnswer(data);
    updateHeaderCacheBadge();
  } catch (err) {
    console.error("Search error:", err);
    answerContainer.innerHTML = `<p style="color: #f87171">Error executing search: ${err.message}</p>`;
  } finally {
    answerLoading.classList.add("hidden");
    answerContainer.classList.remove("hidden");
  }
}

function renderAnswer(data) {
  let formattedHtml = formatMarkdown(data.answer);

  // Update model badge
  if (answerModelBadge) {
    if (data.provider === "anthropic") answerModelBadge.textContent = "Claude 3.5 Sonnet";
    else if (data.provider === "gemini") answerModelBadge.textContent = "Gemini 2.5 Flash";
    else if (data.provider === "openai") answerModelBadge.textContent = "GPT-4o Mini";
    else answerModelBadge.textContent = "Built-In Local Engine ($0.00)";
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
      y: 10,
      stagger: 0.05,
      duration: 0.35,
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
      const docId = cit.chunk_id.split("_c")[0];

      card.innerHTML = `
        <div class="citation-focus-top">
          <span class="citation-focus-badge">[${cit.citation_id}] ${cit.document_title}</span>
          <a href="/documents?doc=${docId}&chunk=${cit.chunk_id}" class="citation-jump-link">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px; margin-right: 4px;">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            <span>Read Full Document &rarr;</span>
          </a>
        </div>
        <div style="font-size: 0.74rem; color: var(--text-muted); font-family: var(--font-mono)">
          Section: <strong>${cit.section_title}</strong> &bull; Page ${cit.page_number || 1}
        </div>
        <div class="citation-focus-quote">
          "${cit.exact_quote}"
        </div>
      `;

      citationsList.appendChild(card);
    });

    // Wire up inline pills in the answer text to navigate to document
    document.querySelectorAll(".citation-pill-ref").forEach((pill) => {
      pill.addEventListener("click", () => {
        const citNum = parseInt(pill.dataset.citNum, 10);
        const targetCit = data.citations.find((c) => c.citation_id === citNum);
        if (targetCit) {
          const docId = targetCit.chunk_id.split("_c")[0];
          window.location.href = `/documents?doc=${docId}&chunk=${targetCit.chunk_id}`;
        }
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

document.addEventListener("DOMContentLoaded", initSearchPage);
