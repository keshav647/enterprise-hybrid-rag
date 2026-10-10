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
