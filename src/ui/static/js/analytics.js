import { updateHeaderCacheBadge } from "/static/js/shared.js";

async function initAnalyticsPage() {
  updateHeaderCacheBadge();
  loadTelemetry();
  loadBenchmarkMatrix();
  bindEvents();
}

function bindEvents() {
  const btnRunLiveEvals = document.getElementById("btnRunLiveEvals");
  if (btnRunLiveEvals) {
    btnRunLiveEvals.addEventListener("click", runLiveBenchmark);
  }

  const inspectorForm = document.getElementById("inspectorForm");
  if (inspectorForm) {
    inspectorForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = document.getElementById("inspectorQueryInput").value.trim();
      if (q) runInspectorQuery(q);
    });
  }
}

async function loadTelemetry() {
  try {
    const res = await fetch("/api/v1/cache/stats");
    if (!res.ok) return;
    const stats = await res.json();

    const hudQueries = document.getElementById("hudTotalQueries");
    const hudHits = document.getElementById("hudCacheHits");
    const hudSaved = document.getElementById("hudMoneySaved");
    const hudSpeedup = document.getElementById("hudSpeedup");

    if (hudQueries) hudQueries.textContent = stats.total_queries;
    if (hudHits) hudHits.textContent = `${stats.cache_hits} (${(stats.hit_ratio * 100).toFixed(0)}%)`;
    if (hudSaved) hudSaved.textContent = `$${stats.estimated_cost_saved_usd.toFixed(4)}`;
    if (hudSpeedup) hudSpeedup.textContent = `${stats.avg_cache_latency_ms < 1 ? "<25ms" : stats.avg_cache_latency_ms.toFixed(1) + "ms"}`;
  } catch (err) {
    console.error("Telemetry error:", err);
  }
}

async function loadBenchmarkMatrix() {
  const tbody = document.getElementById("matrixTableBody");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted)">Loading empirical benchmarks...</td></tr>`;

  try {
    const res = await fetch("/api/v1/benchmarks");
    if (!res.ok) throw new Error("Failed to fetch benchmarks");
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
    tbody.innerHTML = `<tr><td colspan="5" style="color: #f87171">Failed to load benchmarks: ${err.message}</td></tr>`;
  }
}

async function runLiveBenchmark() {
  const btn = document.getElementById("btnRunLiveEvals");
  btn.textContent = "Executing 10 Benchmark Queries...";
  btn.disabled = true;

  try {
    await fetch("/api/v1/benchmarks/run", { method: "POST" });
    await loadBenchmarkMatrix();
  } catch (err) {
    alert("Live benchmark error: " + err.message);
  } finally {
    btn.textContent = "Re-Run Accuracy Test (10 Queries)";
    btn.disabled = false;
  }
}

async function runInspectorQuery(query) {
  const timingsDiv = document.getElementById("pipelineTimings");
  const tablesDiv = document.getElementById("pipelineTables");

  timingsDiv.innerHTML = `<span style="color: var(--text-muted)">Analyzing query...</span>`;

  try {
    const res = await fetch("/api/v1/search/raw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query, top_k: 5 }),
    });
    if (!res.ok) throw new Error("Inspector query failed");
    const rawData = await res.json();

    timingsDiv.innerHTML = `
      <div class="timing-chip">Dense ANN: <strong>${rawData.timings_ms.dense}ms</strong></div>
      <div class="timing-chip">BM25 Sparse: <strong>${rawData.timings_ms.bm25}ms</strong></div>
      <div class="timing-chip">RRF Fusion (k=60): <strong>${rawData.timings_ms.rrf}ms</strong></div>
      <div class="timing-chip">Cross-Encoder: <strong>${rawData.timings_ms.rerank}ms</strong></div>
      <div class="timing-chip" style="border-color: var(--yellow-solar)">Total Pipeline: <strong>${rawData.timings_ms.total}ms</strong></div>
    `;

    tablesDiv.innerHTML = `
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
  } catch (err) {
    timingsDiv.innerHTML = `<span style="color: #f87171">Error: ${err.message}</span>`;
  }
}

document.addEventListener("DOMContentLoaded", initAnalyticsPage);
