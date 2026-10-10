import { updateHeaderCacheBadge, formatMarkdown } from "/static/js/shared.js";

const state = {
  documents: [],
  activeDocId: null,
};

const docLibraryList = document.getElementById("docLibraryList");
const docTabs = document.getElementById("docTabs");
const docMetaTitle = document.getElementById("docMetaTitle");
const docChunkCountBadge = document.getElementById("docChunkCountBadge");
const docContentContainer = document.getElementById("docContentContainer");

// Ingest Modal Elements
const ingestModal = document.getElementById("ingestModal");
const btnOpenIngestModal = document.getElementById("btnOpenIngestModal");
const btnCloseIngestModal = document.getElementById("btnCloseIngestModal");
const btnCancelIngest = document.getElementById("btnCancelIngest");
const btnSubmitIngest = document.getElementById("btnSubmitIngest");
const ingestTitle = document.getElementById("ingestTitle");
const ingestContent = document.getElementById("ingestContent");

async function initDocumentsPage() {
  updateHeaderCacheBadge();
  bindEvents();
  await loadDocuments();

  // Check URL params for deep-link citation jumps
  const params = new URLSearchParams(window.location.search);
  const targetDoc = params.get("doc");
  const targetChunk = params.get("chunk");

  if (targetDoc) {
    await selectDocument(targetDoc);
    if (targetChunk) {
      setTimeout(() => {
        const el = document.getElementById(`chunk_${targetChunk}`);
        if (el) {
          el.classList.add("highlight-chunk");
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 250);
    }
  }
}

function bindEvents() {
  if (btnOpenIngestModal) btnOpenIngestModal.addEventListener("click", () => ingestModal.classList.remove("hidden"));
  if (btnCloseIngestModal) btnCloseIngestModal.addEventListener("click", () => ingestModal.classList.add("hidden"));
  if (btnCancelIngest) btnCancelIngest.addEventListener("click", () => ingestModal.classList.add("hidden"));
  if (btnSubmitIngest) btnSubmitIngest.addEventListener("click", handleIngest);
}

async function loadDocuments() {
  try {
    const res = await fetch("/api/v1/documents");
    if (!res.ok) throw new Error("Failed to load documents");
    state.documents = await res.json();

    renderSidebarList();
    renderTabs();

    if (state.documents.length > 0 && !state.activeDocId) {
      await selectDocument(state.documents[0].document_id);
    }
  } catch (err) {
    console.error("Load docs error:", err);
  }
}

function renderSidebarList() {
  if (!docLibraryList) return;
  docLibraryList.innerHTML = "";

  state.documents.forEach((doc) => {
    const item = document.createElement("div");
    item.className = `doc-list-item ${doc.document_id === state.activeDocId ? "active" : ""}`;
    item.innerHTML = `
      <div class="doc-item-title">${doc.title}</div>
      <div class="doc-item-meta">${doc.total_chunks} Sections &bull; ${doc.document_id}</div>
    `;
    item.addEventListener("click", () => selectDocument(doc.document_id));
    docLibraryList.appendChild(item);
  });
}

function renderTabs() {
  if (!docTabs) return;
  docTabs.innerHTML = "";

  state.documents.forEach((doc) => {
    const tab = document.createElement("button");
    tab.className = `doc-tab-pill ${doc.document_id === state.activeDocId ? "active" : ""}`;
    tab.textContent = doc.title;
    tab.addEventListener("click", () => selectDocument(doc.document_id));
    docTabs.appendChild(tab);
  });
}

async function selectDocument(docId) {
  state.activeDocId = docId;
  renderSidebarList();
  renderTabs();

  try {
    const res = await fetch(`/api/v1/documents/${docId}`);
    if (!res.ok) throw new Error("Failed to fetch document content");
    const data = await res.json();

    if (docMetaTitle) docMetaTitle.textContent = data.metadata.title;
    if (docChunkCountBadge) docChunkCountBadge.textContent = `${data.chunks.length} Sections`;
    renderChunks(data.chunks);
  } catch (err) {
    console.error("Fetch document error:", err);
  }
}

function renderChunks(chunks) {
  if (!docContentContainer) return;
  docContentContainer.innerHTML = "";

  chunks.forEach((chunk) => {
    const card = document.createElement("div");
    card.className = "reader-chunk-card";
    card.id = `chunk_${chunk.chunk_id}`;

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.fontSize = "0.74rem";
    header.style.color = "var(--text-muted)";
    header.style.marginBottom = "8px";
    header.innerHTML = `<span><strong style="color: var(--yellow-solar)">${chunk.section_title}</strong> &bull; Page ${chunk.page_number || 1}</span><span style="font-family: var(--font-mono)">${chunk.chunk_id}</span>`;

    const body = document.createElement("div");
    body.innerHTML = formatMarkdown(chunk.metadata.raw_text || chunk.content);

    card.appendChild(header);
    card.appendChild(body);
    docContentContainer.appendChild(card);
  });
}

async function handleIngest() {
  const title = ingestTitle.value.trim();
  const content = ingestContent.value.trim();

  if (!title || !content) {
    alert("Please enter title and content.");
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
    await selectDocument(result.document_id);
    alert(`Successfully added "${title}"!`);
  } catch (err) {
    alert(`Error: ${err.message}`);
  } finally {
    btnSubmitIngest.disabled = false;
    btnSubmitIngest.textContent = "Ingest & Index";
  }
}

document.addEventListener("DOMContentLoaded", initDocumentsPage);
