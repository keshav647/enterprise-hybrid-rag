/**
 * Shared utilities across all Synapse pages
 */

export async function updateHeaderCacheBadge() {
  const cacheHitStat = document.getElementById("cacheHitStat");
  if (!cacheHitStat) return;
  try {
    const res = await fetch("/api/v1/cache/stats");
    if (!res.ok) return;
    const stats = await res.json();
    cacheHitStat.textContent = `${stats.cache_hits} Hits ($${stats.estimated_cost_saved_usd.toFixed(4)})`;
  } catch (err) {
    console.warn("Could not load header cache stats:", err);
  }
}

export function formatMarkdown(text) {
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

export function showToast(message, type = "success", duration = 3200) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast-message toast-${type}`;

  let icon = "✓";
  if (type === "error") icon = "✕";
  else if (type === "info") icon = "⚡";

  toast.innerHTML = `
    <div class="toast-icon">${icon}</div>
    <div class="toast-text">${message}</div>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
