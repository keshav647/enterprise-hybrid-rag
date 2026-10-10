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
