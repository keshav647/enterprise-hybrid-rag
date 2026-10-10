import { updateHeaderCacheBadge } from "/static/js/shared.js";

const inputClaudeKey = document.getElementById("inputClaudeKey");
const inputGeminiKey = document.getElementById("inputGeminiKey");
const inputOpenAIKey = document.getElementById("inputOpenAIKey");
const selectModel = document.getElementById("selectModel");
const detectedStatusText = document.getElementById("detectedStatusText");
const btnAutoDetectNow = document.getElementById("btnAutoDetectNow");
const btnSaveSettings = document.getElementById("btnSaveSettings");
const btnClearKeys = document.getElementById("btnClearKeys");

function initSettingsPage() {
  updateHeaderCacheBadge();
  loadSavedSettings();
  detectActiveKeys();
  bindEvents();
}

function bindEvents() {
  if (btnAutoDetectNow) btnAutoDetectNow.addEventListener("click", detectActiveKeys);
  if (btnSaveSettings) btnSaveSettings.addEventListener("click", saveSettings);
  if (btnClearKeys) btnClearKeys.addEventListener("click", clearSettings);

  const btnTestGemini = document.getElementById("btnTestGeminiKey");
  if (btnTestGemini) {
    btnTestGemini.addEventListener("click", () => testKey("gemini", inputGeminiKey.value.trim(), "geminiKeyStatus", btnTestGemini));
  }

  const btnTestClaude = document.getElementById("btnTestClaudeKey");
  if (btnTestClaude) {
    btnTestClaude.addEventListener("click", () => testKey("anthropic", inputClaudeKey.value.trim(), "claudeKeyStatus", btnTestClaude));
  }

  const btnTestOpenAI = document.getElementById("btnTestOpenAIKey");
  if (btnTestOpenAI) {
    btnTestOpenAI.addEventListener("click", () => testKey("openai", inputOpenAIKey.value.trim(), "openAIKeyStatus", btnTestOpenAI));
  }
}

async function testKey(provider, key, statusElementId, buttonElement) {
  const statusEl = document.getElementById(statusElementId);
  if (!key) {
    if (statusEl) statusEl.innerHTML = `<span style="color: var(--yellow-solar)">Please enter a key first.</span>`;
    return;
  }

  const origText = buttonElement.textContent;
  buttonElement.disabled = true;
  buttonElement.textContent = "Testing...";
  if (statusEl) statusEl.innerHTML = `<span style="color: var(--text-muted)">Connecting to ${provider}...</span>`;

  try {
    const res = await fetch("/api/v1/auth/test_key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: provider, api_key: key }),
    });
    const data = await res.json();
    if (data.success) {
      if (statusEl) statusEl.innerHTML = `<span style="color: var(--emerald-bright)">✓ ${data.message}</span>`;
    } else {
      if (statusEl) statusEl.innerHTML = `<span style="color: #f87171">✗ ${data.message}</span>`;
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<span style="color: #f87171">✗ Network error: ${err.message}</span>`;
  } finally {
    buttonElement.disabled = false;
    buttonElement.textContent = origText;
  }
}

function loadSavedSettings() {
  if (inputClaudeKey) inputClaudeKey.value = localStorage.getItem("SYNAPSE_CLAUDE_KEY") || "";
  if (inputGeminiKey) inputGeminiKey.value = localStorage.getItem("SYNAPSE_GEMINI_KEY") || "";
  if (inputOpenAIKey) inputOpenAIKey.value = localStorage.getItem("SYNAPSE_OPENAI_KEY") || "";
  if (selectModel) selectModel.value = localStorage.getItem("SYNAPSE_MODEL") || "auto";
}

async function detectActiveKeys() {
  if (!detectedStatusText) return;
  detectedStatusText.textContent = "Scanning environment & system keys...";
  try {
    const res = await fetch("/api/v1/auth/detect");
    if (!res.ok) throw new Error("Detection failed");
    const info = await res.json();
    detectedStatusText.innerHTML = `<strong>${info.label}</strong> &bull; <span style="color: var(--emerald-bright)">${info.status}</span>`;
  } catch (err) {
    detectedStatusText.innerHTML = `<strong>Built-In Offline Engine</strong> &bull; <span style="color: var(--yellow-solar)">Ready ($0.00 Free)</span>`;
  }
}

function saveSettings() {
  const claudeKey = inputClaudeKey.value.trim();
  const geminiKey = inputGeminiKey.value.trim();
  const openAIKey = inputOpenAIKey.value.trim();
  const model = selectModel.value;

  localStorage.setItem("SYNAPSE_CLAUDE_KEY", claudeKey);
  localStorage.setItem("SYNAPSE_GEMINI_KEY", geminiKey);
  localStorage.setItem("SYNAPSE_OPENAI_KEY", openAIKey);
  localStorage.setItem("SYNAPSE_MODEL", model);

  alert("Settings saved successfully!");
}

function clearSettings() {
  localStorage.removeItem("SYNAPSE_CLAUDE_KEY");
  localStorage.removeItem("SYNAPSE_GEMINI_KEY");
  localStorage.removeItem("SYNAPSE_OPENAI_KEY");
  localStorage.removeItem("SYNAPSE_MODEL");

  inputClaudeKey.value = "";
  inputGeminiKey.value = "";
  inputOpenAIKey.value = "";
  selectModel.value = "auto";

  detectActiveKeys();
  alert("Settings reset to defaults.");
}

document.addEventListener("DOMContentLoaded", initSettingsPage);
