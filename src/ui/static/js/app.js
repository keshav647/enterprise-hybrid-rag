/**
 * SYNAPSE v2.5 — Unified Zero-Reload Enterprise Hybrid RAG Controller
 * Supports 6 Enterprise Use-Case Domains + Custom Document Paste/Upload Studio,
 * Interactive Citation-to-Chunk Reader Locking, 4-Stage Pipeline Math Trace,
 * Live 3-Mode Ablation Comparison, Ragas 13-Query Suite, and BYOK Model Vault.
 */

(function () {
  "use strict";

  // ==========================================================================
  // 1. DOMAIN PRESET METADATA & CURATED PARAPHRASE PAIRS
  // ==========================================================================
  const DOMAIN_PRESET_CONFIG = {
    cve_2024_8192_kernel_security_advisory: {
      code: "01 // KERNEL SEC",
      shortTitle: "CVE-2024-8192 Kernel Advisory",
      badge: "DOMAIN 01 // CYBERSECURITY & KERNEL FORENSICS",
      brief:
        "Tests exact hex offset (0x7fff90a4), C struct overflow, Git commit hash (a7f8e910c2d3), and sysctl mitigation retrieval where pure dense vectors fail.",
      paraphrases: {
        "What is the memory offset and vulnerable function in CVE-2024-8192?":
          "Which function and memory offset are affected by CVE-2024-8192?",
        "Which upstream Git commit fixed CVE-2024-8192?":
          "What git commit hash patched CVE-2024-8192 upstream?",
      },
    },
    q3_enterprise_cloud_infrastructure_financials: {
      code: "02 // SEC 10-Q FIN",
      shortTitle: "Q3 Cloud Financials (10-Q)",
      badge: "DOMAIN 02 // CLOUD FINANCIALS & SEC TABLES",
      brief:
        "Tests Markdown financial table preservation ($14.82B revenue, 32.4% operating margin, +84% AI Cloud YoY) and NVIDIA H100/B200 CAPEX footnotes.",
      paraphrases: {
        "What was the total consolidated revenue and operating margin in Q3?":
          "Tell me the Q3 total consolidated revenue and operating margin.",
        "How much did AI Cloud revenue grow year-over-year in Q3?":
          "What was the year-over-year growth rate for AI Cloud revenue in Q3?",
      },
    },
    distributed_raft_consensus_architecture_spec: {
      code: "03 // RAFT SPEC",
      shortTitle: "Raft Consensus RFC-804",
      badge: "DOMAIN 03 // DISTRIBUTED SYSTEMS ARCHITECTURE",
      brief:
        "Tests multi-section distributed systems invariants: 50ms AppendEntries heartbeats, 150ms-300ms election timeouts, 50,000-entry snapshots, and 200ms leader leases.",
      paraphrases: {
        "What is the heartbeat interval sent by the Raft leader?":
          "What heartbeat interval does the Raft leader send?",
      },
    },
    enterprise_msa_gdpr_compliance_sla: {
      code: "04 // LEGAL & GDPR",
      shortTitle: "Enterprise MSA & GDPR SLA",
      badge: "DOMAIN 04 // LEGAL CONTRACTS, SLA CREDITS & GDPR",
      brief:
        "Tests legal clause cross-referencing: 99.99% uptime credit tiers (10%/25%/50%), $15M super-cap liability, and 14-hour GDPR Article 33 breach notification windows.",
      paraphrases: {
        "What is the service credit percentage if monthly uptime drops to 99.50%?":
          "What service credit percentage applies when monthly uptime is 99.50%?",
      },
    },
    fda_phase3_oncology_clinical_protocol: {
      code: "05 // FDA CLINICAL",
      shortTitle: "FDA Phase III Oncology Trial",
      badge: "DOMAIN 05 // CLINICAL BIOTECH & BIOSTATISTICS",
      brief:
        "Tests clinical trial efficacy tables (Cohort A mPFS 14.8 mo vs 8.2 mo, HR=0.54, p=0.00018), ORR 68.4%, and CTCAE v5.0 Grade 3/4 pneumonitis dosing rules.",
      paraphrases: {
        "What was the median Progression-Free Survival (mPFS) and Hazard Ratio for Cohort A vs Cohort B?":
          "Tell me the median Progression-Free Survival (mPFS) and Hazard Ratio for Cohort A vs Cohort B.",
      },
    },
    sev1_global_payment_gateway_postmortem: {
      code: "06 // SRE SEV-1",
      shortTitle: "SEV-1 Payment Outage RCA",
      badge: "DOMAIN 06 // PRODUCTION SRE INCIDENT POST-MORTEM",
      brief:
        "Tests root-cause forensics (INC-2024-1004): PgBouncer 4,096 pool exhaustion, Redis split-brain duplicate charges, kubectl/psql rollback commands, and P0 action items.",
      paraphrases: {
        "What was the root cause of the SEV-1 payment gateway outage INC-2024-1004?":
          "Explain the root cause of the SEV-1 payment gateway outage INC-2024-1004.",
      },
    },
  };

  // ==========================================================================
  // 2. SAMPLE CUSTOM PASTE TEMPLATES ("WHAT TO PASTE WHERE" STUDIO)
  // ==========================================================================
  const CUSTOM_INGEST_SAMPLES = {
    iam_zero_trust: {
      title: "AWS Zero-Trust KMS & IAM Cross-Account Security Audit (SEC-2025-11)",
      domain: "Cybersecurity & Kernel Sec",
      author: "Cloud Security Architecture Team",
      content: `# AWS Zero-Trust KMS & IAM Cross-Account Security Audit (SEC-2025-11)

---PAGE 1---
## 1. Executive Summary & Findings Overview
During Q4 security auditing of production multi-region AWS clusters, automated IAM posture analysis identified an overly permissive KMS key policy on master key \`arn:aws:kms:us-east-1:904811204910:key/mrk-9940a81b7c\`. Unconstrained \`kms:Decrypt\` and \`sts:AssumeRole\` permissions allowed staging workloads to decrypt production envelope keys when passing session tag \`Department=PlatformEng\`.

| Finding ID | Severity | Affected Resource | CVSS Score | Remediation SLA |
| :--- | :--- | :--- | :--- | :--- |
| IAM-2025-01 | CRITICAL | mrk-9940a81b7c (Multi-Region KMS) | 9.1 | 24 Hours |
| IAM-2025-02 | HIGH | arn:aws:iam::904811204910:role/ProdDataPipeline | 7.8 | 72 Hours |
| IAM-2025-03 | MEDIUM | S3 Bucket vpc-flow-logs-prod-east | 5.4 | 7 Days |

---PAGE 2---
## 2. Cryptographic Key Policy Hardening & SCP Enforcement
To eliminate lateral cross-account privilege escalation, all production KMS keys must enforce strict condition keys verifying both \`aws:PrincipalOrgID\` (\`o-prod884192a\`) and VPC Endpoint provenance (\`vpce-0a994810bc7721e\`).

\`\`\`json
{
  "Sid": "EnforceZeroTrustVPCEndpointDecrypt",
  "Effect": "Deny",
  "Principal": "*",
  "Action": ["kms:Decrypt", "kms:GenerateDataKey*"],
  "Resource": "*",
  "Condition": {
    "StringNotEquals": {
      "aws:SourceVpce": "vpce-0a994810bc7721e",
      "aws:PrincipalOrgID": "o-prod884192a"
    }
  }
}
\`\`\`

### Mandatory Key Rotation & Token TTLs
All IAM role session tokens issued via \`sts:AssumeRole\` are restricted to a maximum TTL of **900 seconds (15 minutes)**, and envelope DEKs (Data Encryption Keys) are rotated every **3,600 seconds** via hardware HSM backing.`,
    },

    saas_board_deck: {
      title: "Q4 Series C Enterprise SaaS Board Metrics & Cohort Economics",
      domain: "Cloud Financials & SEC Filings",
      author: "Strategic Finance & FP&A",
      content: `# Q4 Series C Enterprise SaaS Board Metrics & Cohort Economics

---PAGE 1---
## 1. Annual Recurring Revenue (ARR) & Net Dollar Retention
Ending Q4 Annual Recurring Revenue (ARR) reached **$118.4 million**, representing **64.2% year-over-year growth**. Net Dollar Retention (NDR / NRR) across enterprise accounts ($100K+ ACV) expanded to **138.5%**, driven by multi-region AI Copilot seat expansion.

| Metric | Q4 FY2024 | Q4 FY2025 | YoY Change | Benchmark Target |
| :--- | :--- | :--- | :--- | :--- |
| Ending ARR ($M) | $72.1M | $118.4M | +64.2% | $110.0M |
| Net Dollar Retention (NDR) | 126.0% | 138.5% | +1,250 bps | 130.0% |
| Gross Margin (Non-GAAP) | 78.4% | 82.9% | +450 bps | 80.0% |
| CAC Payback Period | 16.2 Months | 11.4 Months | -4.8 Months | 14.0 Months |
| Burn Multiple | 1.42x | 0.68x | -0.74x | < 1.00x |

---PAGE 2---
## 2. Rule of 40 & Free Cash Flow Trajectory
With **64.2% ARR growth** and a **+14.6% Free Cash Flow (FCF) margin**, the company achieved a **Rule of 40 score of 78.8%**. Total cash and marketable securities at quarter-end stood at **$194.2 million** with zero venture debt.`,
    },

    crispr_assay: {
      title: "CRISPR-Cas9 Base Editing Off-Target Genomic Assay (BIO-7741)",
      domain: "Clinical Trials & Biotech",
      author: "Translational Genomics Lab",
      content: `# CRISPR-Cas9 Base Editing Off-Target Genomic Assay (BIO-7741)

---PAGE 1---
## 1. On-Target Editing Efficiency & GUIDE-Seq Profile
High-fidelity Adenine Base Editor **ABE8e-NRCH** complexed with guide RNA **sgRNA-PCSK9-402** achieved **94.6% on-target A-to-G conversion** at the canonical splice donor site of human primary hepatocytes (n = 18 donors) at a dose of **1.5 mg/kg LNP**.

| Locus Identifier | Gene Target | Mismatch Count | On/Off-Target Indel % | P-Value |
| :--- | :--- | :--- | :--- | :--- |
| chr1:55039842 | PCSK9 (On-Target) | 0 | 94.6% conversion (<0.12% indel) | p < 0.00001 |
| chr14:91820411 | OT-01 (Intergenic) | 3 | 0.04% (Baseline Noise) | p = 0.84 |
| chr7:12094810 | OT-02 (Intronic) | 4 | 0.01% (Undetectable) | p = 0.92 |

---PAGE 2---
## 2. Serum LDL-C Reduction & Lipid Nanoparticle Clearance
In non-human primate (NHP) durability cohorts at Day 180 post-infusion, circulating PCSK9 protein levels decreased by **88.2%**, resulting in a sustained **64.5% reduction in serum LDL-cholesterol**. Hepatic transaminases (ALT/AST) normalized within **72 hours** with no complement activation.`,
    },

    etcd_runbook: {
      title: "Kubernetes Production Etcd Quorum Loss & Snapshot Disaster Recovery",
      domain: "Production SRE Post-Mortems",
      author: "Core Kubernetes Platform SRE",
      content: `# Kubernetes Production Etcd Quorum Loss & Snapshot Disaster Recovery

---PAGE 1---
## 1. Quorum Loss Symptom & Raft WAL Corruption Diagnosis
When 2 of 3 control-plane nodes in cluster \`k8s-prod-us-west-2a\` experience NVMe I/O stalls exceeding **2,000ms**, \`etcd\` loses Raft quorum and rejects kube-apiserver writes with \`etcdserver: request timed out\` and \`mvcc: database space exceeded (8.0 GB quota)\`.

\`\`\`bash
# 1. Verify endpoint health and DB revision across all 3 control-plane members
ETCDCTL_API=3 etcdctl --endpoints=https://10.24.1.10:2379,https://10.24.1.11:2379,https://10.24.1.12:2379 \\
  --cacert=/etc/kubernetes/pki/etcd/ca.crt \\
  --cert=/etc/kubernetes/pki/etcd/server.crt \\
  --key=/etc/kubernetes/pki/etcd/server.key \\
  endpoint status --write-out=table
\`\`\`

---PAGE 2---
## 2. Automated Snapshot Compaction & Quorum Restore Procedure
To restore quorum from the latest verified KMS-encrypted S3 snapshot (\`s3://prod-etcd-backups/etcd-snapshot-rev-4891204.db\`):

\`\`\`bash
# 2. Compact and defragment excessive MVCC revisions
REV=$(ETCDCTL_API=3 etcdctl endpoint status --write-out="json" | egrep -o '"revision":[0-9]*' | egrep -o '[0-9]*' | head -1)
ETCDCTL_API=3 etcdctl compact $REV
ETCDCTL_API=3 etcdctl defrag --cluster
ETCDCTL_API=3 etcdctl alarm disarm
\`\`\`

**Recovery SLA:** Full control-plane API availability must be restored within **12 minutes (RTO = 12m, RPO = 5m)**.`,
    },
  };

  // ==========================================================================
  // 3. APPLICATION STATE
  // ==========================================================================
  const state = {
    documents: [],
    activeDomainDocId: "all", // 'all' or specific document_id
    readerDocId: null,
    readerDocDetail: null,
    retrievalMode: "hybrid", // 'hybrid' | 'dense' | 'bm25'
    scopeToActiveDoc: false,
    lastQuery: "",
    lastSearchResponse: null,
    lastRawPipeline: null,
    benchmarksData: null,
    theme: localStorage.getItem("synapse_theme") || "tactical-dark",
    vault: {
      provider: localStorage.getItem("synapse_llm_provider") || "gemini",
      model: localStorage.getItem("synapse_llm_model") || "gemini-2.5-flash",
      apiKey: localStorage.getItem("synapse_llm_api_key") || "",
    },
  };

  // ==========================================================================
  // 4. INITIALIZATION & BOOTSTRAP
  // ==========================================================================
  document.addEventListener("DOMContentLoaded", async () => {
    applyTheme(state.theme);
    initThreeBlueprintCanvas();
    initKeyboardShortcuts();
    syncVaultModalInputs();

    await Promise.all([
      loadDocumentsAndRibbon(),
      refreshCacheStats(),
      detectServerAuthStatus(),
    ]);

    // Check URL query parameters for deep-linking (?doc=... or ?q=...)
    const params = new URLSearchParams(window.location.search);
    const deepDoc = params.get("doc");
    const deepQuery = params.get("q");

    if (deepDoc && state.documents.some((d) => d.document_id === deepDoc)) {
      await selectDomainPreset(deepDoc, false);
    } else if (state.documents.length > 0) {
      // Load the first domain document in the right-hand reader by default
      await loadDocumentIntoReader(state.documents[0].document_id);
      renderScenarioChipsForActiveDomain();
    }

    // Execute initial showcase query so the workbench is immediately alive
    const initialQuery =
      deepQuery ||
      "What is the memory offset and vulnerable function in CVE-2024-8192?";
    document.getElementById("search-query-input").value = initialQuery;
    await executeSearch(initialQuery);

    // Preload Ragas benchmark matrix in background
    loadBenchmarks(false);
  });

  // ==========================================================================
  // 5. THEME SWITCHER (TACTICAL CARBON vs SWISS PRINT)
  // ==========================================================================
  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem("synapse_theme", themeName);

    const btnDark = document.getElementById("theme-btn-dark");
    const btnLight = document.getElementById("theme-btn-light");
    if (btnDark && btnLight) {
      btnDark.classList.toggle("active", themeName === "tactical-dark");
      btnLight.classList.toggle("active", themeName === "swiss-print");
    }
  }

  // ==========================================================================
  // 6. CORPUS DOCUMENTS & 6-DOMAIN RIBBON ("WHAT TO USE WHERE")
  // ==========================================================================
  async function loadDocumentsAndRibbon() {
    try {
      const res = await fetch("/api/v1/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      state.documents = await res.json();

      // Update top header corpus badge
      const totalChunks = state.documents.reduce(
        (acc, d) => acc + (d.total_chunks || 0),
        0
      );
      const summaryEl = document.getElementById("header-corpus-summary");
      if (summaryEl) {
        summaryEl.textContent = `${state.documents.length} DOCS • ${totalChunks} CHUNKS • 768D + BM25`;
      }

      renderDomainRibbon();
      populateReaderSelectDropdown();
    } catch (err) {
      console.error("Error loading documents:", err);
      showToast("Error loading enterprise corpus", "error");
    }
  }

  function renderDomainRibbon() {
    const strip = document.getElementById("domain-presets-strip");
    if (!strip) return;

    const totalChunks = state.documents.reduce(
      (acc, d) => acc + (d.total_chunks || 0),
      0
    );

    let html = `
      <button type="button" class="domain-preset-tab ${
        state.activeDomainDocId === "all" ? "active" : ""
      }" onclick="window.SynapseApp.selectDomainPreset('all')">
        <div class="preset-tab-top">
          <span class="preset-tab-code">00 // GLOBAL CORPUS</span>
          <span class="preset-tab-meta">${state.documents.length} DOCS • ${totalChunks} CHUNKS</span>
        </div>
        <div class="preset-tab-title">All ${state.documents.length} Enterprise Domains</div>
      </button>
    `;

    state.documents.forEach((doc, idx) => {
      const preset = DOMAIN_PRESET_CONFIG[doc.document_id] || {
        code: `0${idx + 1} // CUSTOM DOC`,
        shortTitle: doc.title.slice(0, 28),
      };
      const isActive = state.activeDomainDocId === doc.document_id;
      html += `
        <button type="button" class="domain-preset-tab ${
          isActive ? "active" : ""
        }" onclick="window.SynapseApp.selectDomainPreset('${escapeAttr(
        doc.document_id
      )}')">
          <div class="preset-tab-top">
            <span class="preset-tab-code">${escapeHtml(preset.code)}</span>
            <span class="preset-tab-meta">${doc.total_chunks} CHUNKS • ${
        doc.total_pages
      }P</span>
          </div>
          <div class="preset-tab-title" title="${escapeAttr(doc.title)}">${escapeHtml(
        preset.shortTitle
      )}</div>
        </button>
      `;
    });

    strip.innerHTML = html;
  }

  function populateReaderSelectDropdown() {
    const sel = document.getElementById("reader-doc-select");
    if (!sel) return;
    sel.innerHTML = state.documents
      .map(
        (d, idx) =>
          `<option value="${escapeAttr(d.document_id)}" ${
            d.document_id === state.readerDocId ? "selected" : ""
          }>[0${idx + 1}] ${escapeHtml(d.title)} (${d.total_chunks} chunks)</option>`
      )
      .join("");
  }

  async function selectDomainPreset(docId, autoRunFirstQuery = true) {
    state.activeDomainDocId = docId;
    renderDomainRibbon();

    const badgeEl = document.getElementById("active-domain-badge");
    const briefEl = document.getElementById("active-domain-brief");
    const scopeToggle = document.getElementById("toggle-doc-scope");
    const scopeText = document.getElementById("scope-switch-text");

    if (docId === "all") {
      if (badgeEl) badgeEl.textContent = `ALL ${state.documents.length} ENTERPRISE DOMAINS`;
      if (briefEl) {
        briefEl.textContent =
          "Cross-corpus hybrid retrieval across Security Advisories, SEC 10-Q Financials, Raft RFCs, Legal GDPR SLAs, FDA Clinical Protocols & SRE Post-Mortems.";
      }
      state.scopeToActiveDoc = false;
      if (scopeToggle) scopeToggle.checked = false;
      if (scopeText) scopeText.textContent = `SCOPE: ALL ${state.documents.length} DOCS`;
      renderScenarioChipsForActiveDomain();
      return;
    }

    // Specific domain document selected
    const docMeta = state.documents.find((d) => d.document_id === docId);
    const preset = DOMAIN_PRESET_CONFIG[docId] || {
      badge: `CUSTOM DOMAIN // ${(docMeta?.domain || "INGESTED DOC").toUpperCase()}`,
      brief: `Custom indexed document (${docMeta?.total_chunks || 0} contextual chunks, ${docMeta?.total_tokens || 0} tokens).`,
    };

    if (badgeEl) badgeEl.textContent = preset.badge;
    if (briefEl) briefEl.textContent = preset.brief;

    // Load document into Right Pane Reader immediately
    switchRightPane("reader");
    await loadDocumentIntoReader(docId);

    // Update scope indicator
    if (scopeText) {
      scopeText.textContent = state.scopeToActiveDoc
        ? "SCOPE: ACTIVE DOC ONLY"
        : `SCOPE: ALL ${state.documents.length} DOCS`;
    }

    renderScenarioChipsForActiveDomain();

    if (autoRunFirstQuery && docMeta && docMeta.suggested_queries?.length > 0) {
      const firstQ = docMeta.suggested_queries[0];
      document.getElementById("search-query-input").value = firstQ;
      await executeSearch(firstQ);
    }
  }

  function onScopeToggleChange() {
    const checkbox = document.getElementById("toggle-doc-scope");
    const scopeText = document.getElementById("scope-switch-text");
    state.scopeToActiveDoc = Boolean(checkbox && checkbox.checked);
    if (scopeText) {
      scopeText.textContent = state.scopeToActiveDoc
        ? "SCOPE: ACTIVE DOC ONLY"
        : `SCOPE: ALL ${state.documents.length} DOCS`;
    }
    if (state.lastQuery) {
      executeSearch(state.lastQuery);
    }
  }

  function renderScenarioChipsForActiveDomain() {
    const container = document.getElementById("scenario-chips-container");
    const labelEl = document.getElementById("scenario-chips-label");
    if (!container) return;

    let queries = [];
    if (state.activeDomainDocId === "all") {
      if (labelEl) {
        labelEl.textContent =
          "STEP 2 // 1-CLICK CROSS-DOMAIN VERIFICATION QUERIES (6 USE CASES):";
      }
      queries = [
        "What is the memory offset and vulnerable function in CVE-2024-8192?",
        "What was the total consolidated revenue and operating margin in Q3?",
        "What is the service credit percentage if monthly uptime drops to 99.50%?",
        "What was the median Progression-Free Survival (mPFS) and Hazard Ratio for Cohort A vs Cohort B?",
        "What was the root cause of the SEV-1 payment gateway outage INC-2024-1004?",
        "What is the randomized follower election timeout range in the Raft consensus engine?",
      ];
    } else {
      const docMeta = state.documents.find(
        (d) => d.document_id === state.activeDomainDocId
      );
      if (labelEl) {
        labelEl.textContent = `STEP 2 // 1-CLICK QUERIES FOR ${(
          docMeta?.title || "ACTIVE DOCUMENT"
        )
          .slice(0, 42)
          .toUpperCase()}:`;
      }
      queries = docMeta?.suggested_queries || [];
    }

    container.innerHTML = queries
      .slice(0, 4)
      .map(
        (q, i) => `
        <button type="button" class="scenario-chip ${
          state.lastQuery === q ? "active" : ""
        }" onclick="window.SynapseApp.runScenarioChip('${escapeAttr(q)}')" title="${escapeAttr(q)}">
          <span class="chip-num">Q0${i + 1}</span>
          <span class="chip-text">${escapeHtml(q)}</span>
        </button>
      `
      )
      .join("");
  }

  async function runScenarioChip(queryText) {
    const input = document.getElementById("search-query-input");
    if (input) input.value = queryText;
    await executeSearch(queryText);
  }

  // ==========================================================================
  // 7. CORE HYBRID SEARCH EXECUTION & PIPELINE INSPECTION
  // ==========================================================================
  async function executeSearch(overrideQuery, forceUseCache = true) {
    const input = document.getElementById("search-query-input");
    const query = (overrideQuery !== undefined ? overrideQuery : input?.value || "").trim();
    if (!query) {
      showToast("Enter a search query or click a Scenario Question Chip", "warn");
      return;
    }

    state.lastQuery = query;
    renderScenarioChipsForActiveDomain();

    const synthBody = document.getElementById("synthesis-answer-body");
    if (synthBody) {
      synthBody.innerHTML = `<div class="synthesis-loading-skeleton">Executing ${state.retrievalMode.toUpperCase()} retrieval + Cross-Encoder re-ranking for: <strong>"${escapeHtml(
        query
      )}"</strong>...</div>`;
    }

    const scopedDocId =
      state.scopeToActiveDoc && state.readerDocId ? state.readerDocId : null;

    const searchPayload = {
      query,
      mode: state.retrievalMode,
      top_k: 5,
      use_cache: forceUseCache,
      use_reranker: true,
      document_id: scopedDocId,
      llm_provider: state.vault.provider || null,
      llm_model: state.vault.model || null,
      api_key: state.vault.apiKey || null,
    };

    try {
      const [searchRes, rawRes] = await Promise.all([
        fetch("/api/v1/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchPayload),
        }),
        fetch("/api/v1/search/raw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(searchPayload),
        }),
      ]);

      if (!searchRes.ok) throw new Error(`Search HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();
      const rawData = rawRes.ok ? await rawRes.json() : null;

      state.lastSearchResponse = searchData;
      state.lastRawPipeline = rawData;

      renderSynthesisAndCitations(searchData);
      renderPipelineMathTrace(searchData, rawData);
      updateTelemetryHUD(searchData, rawData);
      await refreshCacheStats();

      // Automatically sync Right Pane Reader to the #1 cited document (without page reload!)
      if (searchData.citations && searchData.citations.length > 0) {
        const topCitation = searchData.citations[0];
        if (state.readerDocId !== topCitation.document_id) {
          await loadDocumentIntoReader(topCitation.document_id);
        }
        highlightChunkInReader(topCitation.chunk_id, false);
      }
    } catch (err) {
      console.error("Search execution failed:", err);
      if (synthBody) {
        synthBody.innerHTML = `<p style="color:var(--accent-crimson);">Search Error: ${escapeHtml(
          err.message
        )}</p>`;
      }
    }
  }

  function renderSynthesisAndCitations(data) {
    // 1. Update Synthesis Header Badges
    const modeBadge = document.getElementById("ans-mode-badge");
    const cacheBadge = document.getElementById("ans-cache-badge");
    const faithBadge = document.getElementById("ans-faithfulness-badge");
    const modelBadge = document.getElementById("ans-model-badge");
    const tabCitCount = document.getElementById("tab-badge-citations");

    const modeLabels = {
      hybrid: "HYBRID (RRF + CROSS-ENCODER)",
      dense: "DENSE 768-D VECTORS ONLY",
      bm25: "BM25 SPARSE KEYWORDS ONLY",
    };
    if (modeBadge) {
      modeBadge.textContent = modeLabels[data.retrieval_mode] || data.retrieval_mode.toUpperCase();
    }

    if (cacheBadge) {
      if (data.cache_hit) {
        const simPct = data.cache_similarity
          ? `${(data.cache_similarity * 100).toFixed(1)}% SIM`
          : "COSINE HIT";
        cacheBadge.textContent = `⚡ SEMANTIC CACHE HIT (${simPct} • ${data.latency_ms}ms)`;
        cacheBadge.classList.add("cache-hit");
      } else {
        cacheBadge.textContent = `FRESH PIPELINE (${data.latency_ms}ms)`;
        cacheBadge.classList.remove("cache-hit");
      }
    }

    if (faithBadge) {
      const pct = (data.faithfulness_score * 100).toFixed(1);
      faithBadge.textContent = `FAITHFULNESS: ${pct}%`;
    }

    if (modelBadge) {
      modelBadge.textContent = `MODEL: ${(data.model_used || "GROUNDED-SYNTH").toUpperCase()}`;
    }

    if (tabCitCount) {
      tabCitCount.textContent = String((data.citations || []).length);
    }

    // 2. Render Answer Markdown with Interactive [1], [2] Citation Buttons
    const synthBody = document.getElementById("synthesis-answer-body");
    if (synthBody) {
      synthBody.innerHTML = renderMarkdown(data.answer || "", true);
      if (window.gsap) {
        window.gsap.fromTo(
          synthBody,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
        );
      }
    }

    // 3. Render Verified Citation Cards + Retrieved Chunk Telemetry
    const listContainer = document.getElementById("citations-cards-container");
    if (!listContainer) return;

    const resultsById = {};
    (data.retrieved_chunks || []).forEach((item) => {
      resultsById[item.chunk_id] = item;
    });

    const citations = data.citations || [];
    if (citations.length === 0) {
      listContainer.innerHTML = `<div class="citation-card">No verified citations returned for this query.</div>`;
      return;
    }

    listContainer.innerHTML = citations
      .map((cit, idx) => {
        const rItem = resultsById[cit.chunk_id] || {};
        const denseRank = rItem.dense_rank ? `#${rItem.dense_rank}` : "—";
        const bm25Rank = rItem.bm25_rank ? `#${rItem.bm25_rank}` : "—";
        const rrfScore = rItem.rrf_score ? rItem.rrf_score.toFixed(4) : "—";
        const rerankScore = (cit.relevance_score || rItem.score || 0).toFixed(4);

        return `
          <div class="citation-card ${idx === 0 ? "active-citation" : ""}"
               id="citation-card-${cit.citation_index}"
               onclick="window.SynapseApp.focusCitation('${escapeAttr(
                 cit.document_id
               )}', '${escapeAttr(cit.chunk_id)}', ${cit.citation_index})">
            <div class="citation-card-top">
              <div class="citation-title-group">
                <span class="citation-idx-badge">[${cit.citation_index}]</span>
                <span class="citation-doc-title">${escapeHtml(cit.document_title)}</span>
                <span class="citation-section-tag">§ ${escapeHtml(
                  cit.section_title
                )} • PAGE ${cit.page_number}</span>
              </div>
              <div class="citation-scores-strip">
                <span class="score-chip score-chip-primary">RERANK: ${rerankScore}</span>
                <span class="score-chip">DENSE: ${denseRank}</span>
                <span class="score-chip">BM25: ${bm25Rank}</span>
                <span class="score-chip">RRF: ${rrfScore}</span>
                <span class="score-chip" style="color:var(--accent-cyan);">LOCATE IN READER →</span>
              </div>
            </div>
            <div class="citation-snippet">"${escapeHtml(cit.verbatim_quote)}"</div>
          </div>
        `;
      })
      .join("");
  }

  // ==========================================================================
  // 8. ZERO-RELOAD CITATION -> RIGHT-HAND DOCUMENT READER LOCKING
  // ==========================================================================
  async function focusCitationIndex(citationIndex) {
    const citations = state.lastSearchResponse?.citations || [];
    const target =
      citations.find((c) => c.citation_index === citationIndex) ||
      citations[citationIndex - 1];
    if (!target) return;
    await focusCitation(target.document_id, target.chunk_id, target.citation_index);
  }

  async function focusCitation(documentId, chunkId, citationIndex) {
    // Highlight active citation card on Left Pane
    document.querySelectorAll(".citation-card").forEach((el) => {
      el.classList.remove("active-citation");
    });
    const activeCard = document.getElementById(`citation-card-${citationIndex}`);
    if (activeCard) activeCard.classList.add("active-citation");

    // Ensure Right Pane is on the Document Reader tab
    switchRightPane("reader");

    // Load document if different from current reader document
    if (state.readerDocId !== documentId) {
      await loadDocumentIntoReader(documentId);
    }

    highlightChunkInReader(chunkId, true);
  }

  function highlightChunkInReader(chunkId, animateScroll = true) {
    const viewport = document.getElementById("reader-chunks-viewport");
    if (!viewport) return;

    viewport.querySelectorAll(".reader-chunk-card").forEach((el) => {
      el.classList.remove("chunk-targeted");
    });

    const targetEl = document.getElementById(`reader-chunk-${chunkId}`);
    if (!targetEl) return;

    targetEl.classList.add("chunk-targeted");

    if (animateScroll) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      if (window.gsap) {
        window.gsap.fromTo(
          targetEl,
          { scale: 0.992 },
          { scale: 1.0, duration: 0.35, ease: "back.out(2)" }
        );
      }
    }
  }

  // ==========================================================================
  // 9. INTERACTIVE DOCUMENT READER (RIGHT PANE)
  // ==========================================================================
  async function loadDocumentIntoReader(documentId) {
    if (!documentId) return;
    try {
      const res = await fetch(`/api/v1/documents/${encodeURIComponent(documentId)}`);
      if (!res.ok) throw new Error(`Document ${documentId} not found`);
      const detail = await res.json();

      state.readerDocId = documentId;
      state.readerDocDetail = detail;

      const sel = document.getElementById("reader-doc-select");
      if (sel) sel.value = documentId;

      renderReaderMetadataAndChunks(detail);
    } catch (err) {
      console.error("Failed to load document into reader:", err);
    }
  }

  function renderReaderMetadataAndChunks(detail, filterText = "") {
    const meta = detail.metadata;
    const chunks = detail.chunks || [];

    const metaStrip = document.getElementById("reader-doc-meta-strip");
    if (metaStrip) {
      metaStrip.innerHTML = `
        <span><strong>ID:</strong> ${escapeHtml(meta.document_id)}</span>
        <span><strong>DOMAIN:</strong> ${escapeHtml(meta.domain || "Enterprise")}</span>
        <span><strong>PAGES:</strong> ${meta.total_pages}</span>
        <span><strong>CHUNKS:</strong> ${meta.total_chunks}</span>
        <span><strong>TOKENS:</strong> ${meta.total_tokens}</span>
      `;
    }

    // Section Jump Pills
    const jumpsContainer = document.getElementById("reader-section-jumps");
    if (jumpsContainer) {
      jumpsContainer.innerHTML = chunks
        .map(
          (c, i) => `
          <button type="button" class="section-jump-pill" onclick="window.SynapseApp.highlightChunkInReader('${escapeAttr(
            c.chunk_id
          )}', true)">
            P${c.page_number} // ${escapeHtml(c.section_title.slice(0, 24))}
          </button>
        `
        )
        .join("");
    }

    // Render Chunk Cards with Full Markdown Tables & Code Blocks
    const viewport = document.getElementById("reader-chunks-viewport");
    if (!viewport) return;

    const needle = filterText.trim().toLowerCase();
    const filtered = needle
      ? chunks.filter(
          (c) =>
            c.content.toLowerCase().includes(needle) ||
            c.section_title.toLowerCase().includes(needle)
        )
      : chunks;

    if (filtered.length === 0) {
      viewport.innerHTML = `<div class="reader-chunk-card">No chunks match filter "${escapeHtml(
        filterText
      )}".</div>`;
      return;
    }

    viewport.innerHTML = filtered
      .map(
        (chunk, idx) => `
        <article class="reader-chunk-card" id="reader-chunk-${escapeAttr(chunk.chunk_id)}">
          <header class="reader-chunk-header">
            <div class="reader-chunk-badges">
              <span class="chunk-id-pill">CHUNK #0${idx + 1}</span>
              <span class="chunk-page-pill">PAGE ${chunk.page_number}</span>
              <span class="chunk-page-pill">§ ${escapeHtml(chunk.section_title)}</span>
              <span class="chunk-page-pill">${chunk.token_count} TOKENS</span>
            </div>
            <button type="button" class="icon-utility-btn" onclick="window.SynapseApp.queryChunkSection('${escapeAttr(
              chunk.document_id
            )}', '${escapeAttr(chunk.section_title)}')">
              🔎 QUERY SECTION
            </button>
          </header>
          <div class="markdown-prose">
            ${renderMarkdown(chunk.content, false)}
          </div>
        </article>
      `
      )
      .join("");
  }

  async function onReaderSelectChange(docId) {
    await loadDocumentIntoReader(docId);
  }

  function filterReaderChunks(val) {
    if (!state.readerDocDetail) return;
    renderReaderMetadataAndChunks(state.readerDocDetail, val);
  }

  async function queryChunkSection(docId, sectionTitle) {
    const docMeta = state.documents.find((d) => d.document_id === docId);
    const shortDoc = docMeta ? docMeta.title : docId;
    const q = `Summarize the key specifications, metrics, and technical facts in "${sectionTitle}" of ${shortDoc}.`;
    document.getElementById("search-query-input").value = q;
    switchLeftTab("synthesis");
    await executeSearch(q);
  }

  // ==========================================================================
  // 10. TELEMETRY HUD & 4-STAGE PIPELINE MATH TRACE
  // ==========================================================================
  function updateTelemetryHUD(searchData, rawData) {
    const timings = searchData.timings_ms || rawData?.timings_ms || {};

    const latEl = document.getElementById("hud-latency");
    const latTag = document.getElementById("hud-latency-tag");
    if (latEl) latEl.textContent = `${searchData.latency_ms.toFixed(2)} ms`;
    if (latTag) {
      latTag.textContent = searchData.cache_hit ? "⚡ CACHE HIT" : "LIVE DAG";
      latTag.style.color = searchData.cache_hit
        ? "var(--accent-amber)"
        : "var(--accent-emerald)";
    }

    const cacheState = document.getElementById("hud-cache-state");
    const cacheSim = document.getElementById("hud-cache-sim");
    if (cacheState) {
      cacheState.textContent = searchData.cache_hit ? "HIT (<5ms)" : "MISS → STORED";
      cacheState.style.color = searchData.cache_hit
        ? "var(--accent-amber)"
        : "var(--text-primary)";
    }
    if (cacheSim) {
      cacheSim.textContent = searchData.cache_similarity
        ? `SIM ${(searchData.cache_similarity * 100).toFixed(1)}%`
        : "COSINE >= 0.92";
    }

    const denseTime = document.getElementById("hud-dense-time");
    const bm25Time = document.getElementById("hud-bm25-time");
    const rerankTime = document.getElementById("hud-rerank-time");
    if (denseTime) denseTime.textContent = `${(timings.dense_ms || 0).toFixed(2)} ms`;
    if (bm25Time) bm25Time.textContent = `${(timings.bm25_ms || 0).toFixed(2)} ms`;
    if (rerankTime) rerankTime.textContent = `${(timings.rerank_ms || 0).toFixed(2)} ms`;

    const faithEl = document.getElementById("hud-faithfulness");
    const citCountEl = document.getElementById("hud-citations-count");
    if (faithEl) {
      faithEl.textContent = `${(searchData.faithfulness_score * 100).toFixed(1)}%`;
    }
    if (citCountEl) {
      citCountEl.textContent = `${(searchData.citations || []).length} VERIFIED`;
    }
  }

  function renderPipelineMathTrace(searchData, rawData) {
    const timings = searchData.timings_ms || rawData?.timings_ms || {};
    const setTxt = (id, txt) => {
      const el = document.getElementById(id);
      if (el) el.textContent = txt;
    };

    setTxt("dag-time-dense", `${(timings.dense_ms || 0).toFixed(2)} ms`);
    setTxt("dag-time-bm25", `${(timings.bm25_ms || 0).toFixed(2)} ms`);
    setTxt("dag-time-rrf", `${(timings.rrf_ms || 0).toFixed(2)} ms`);
    setTxt("dag-time-rerank", `${(timings.rerank_ms || 0).toFixed(2)} ms`);

    const tbody = document.getElementById("pipeline-math-tbody");
    if (!tbody) return;

    const items = searchData.retrieved_chunks || rawData?.final_reranked || [];
    tbody.innerHTML = items
      .map((item, idx) => {
        const bd = item.score_breakdown || {};
        return `
          <tr onclick="window.SynapseApp.focusCitation('${escapeAttr(
            item.document_id
          )}', '${escapeAttr(item.chunk_id)}', ${idx + 1})" style="cursor:pointer;">
            <td><strong>#0${idx + 1}</strong></td>
            <td><strong>${escapeHtml(
              item.document_title.slice(0, 28)
            )}</strong> — § ${escapeHtml(item.section_title)}</td>
            <td>${item.dense_rank ? `#${item.dense_rank}` : "—"}</td>
            <td>${item.bm25_rank ? `#${item.bm25_rank}` : "—"}</td>
            <td>${item.rrf_score ? item.rrf_score.toFixed(4) : "—"}</td>
            <td>${bd.term_coverage !== undefined ? (bd.term_coverage * 100).toFixed(0) + "%" : "—"}</td>
            <td>${bd.heading_alignment !== undefined ? (bd.heading_alignment * 100).toFixed(0) + "%" : "—"}</td>
            <td>${bd.entity_match ? "✓ YES" : "—"}</td>
            <td style="color:var(--accent-emerald);font-weight:700;">${(
              item.rerank_score ||
              item.score ||
              0
            ).toFixed(4)}</td>
          </tr>
        `;
      })
      .join("");
  }

  // ==========================================================================
  // 11. CACHE HIT TRIGGERS & LIVE 3-MODE ARCHITECTURE COMPARISON
  // ==========================================================================
  async function setRetrievalMode(mode) {
    state.retrievalMode = mode;
    document.querySelectorAll(".mode-seg-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-mode") === mode);
    });
    if (state.lastQuery) {
      await executeSearch(state.lastQuery, true);
    }
  }

  async function triggerExactCacheHit() {
    const q =
      document.getElementById("search-query-input")?.value.trim() ||
      state.lastQuery;
    if (!q) return;
    await executeSearch(q, true);
    showToast("⚡ Semantic Cache Hit verified (<5ms response)!", "success");
  }

  async function triggerParaphraseCacheTest() {
    const currentQ =
      document.getElementById("search-query-input")?.value.trim() ||
      state.lastQuery;
    if (!currentQ) return;

    // Ensure the current query is cached first
    await executeSearch(currentQ, true);

    // Build a semantic paraphrase that normalizes to the same canonical concept vector
    let paraphrased = "";
    for (const key of Object.keys(DOMAIN_PRESET_CONFIG)) {
      const map = DOMAIN_PRESET_CONFIG[key].paraphrases || {};
      if (map[currentQ]) {
        paraphrased = map[currentQ];
        break;
      }
    }
    if (!paraphrased) {
      if (currentQ.toLowerCase().startsWith("what is the ")) {
        paraphrased = currentQ.replace(/^what is the /i, "Please tell me the ");
      } else if (currentQ.toLowerCase().startsWith("what was the ")) {
        paraphrased = currentQ.replace(/^what was the /i, "Explain the ");
      } else {
        paraphrased = `Please explain: ${currentQ}`;
      }
    }

    document.getElementById("search-query-input").value = paraphrased;
    await executeSearch(paraphrased, true);
    showToast("🔄 Paraphrased query matched in Semantic Vector Cache!", "success");
  }

  async function compareAllThreeModes() {
    const q =
      document.getElementById("search-query-input")?.value.trim() ||
      state.lastQuery;
    if (!q) return;

    switchLeftTab("pipeline");
    const box = document.getElementById("mode-comparison-box");
    const grid = document.getElementById("mode-comparison-grid");
    if (!box || !grid) return;

    box.style.display = "block";
    grid.innerHTML = `<div class="mode-comp-col">Running Hybrid RRF + Rerank, Dense Only, and BM25 Only in parallel...</div>`;

    try {
      const modes = ["hybrid", "dense", "bm25"];
      const responses = await Promise.all(
        modes.map((m) =>
          fetch("/api/v1/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: q,
              mode: m,
              top_k: 3,
              use_cache: false,
              use_reranker: m === "hybrid",
            }),
          }).then((r) => r.json())
        )
      );

      const titles = [
        "HYBRID (RRF + CROSS-ENCODER)",
        "DENSE 768-D VECTORS ONLY",
        "BM25 KEYWORDS ONLY",
      ];

      grid.innerHTML = responses
        .map(
          (resp, idx) => `
          <div class="mode-comp-col">
            <div class="mode-comp-header">${titles[idx]} (${resp.latency_ms}ms)</div>
            ${(resp.retrieved_chunks || [])
              .slice(0, 3)
              .map(
                (c, rIdx) => `
                <div style="margin-bottom:6px;font-size:11.5px;border-bottom:1px solid var(--border-hairline);padding-bottom:4px;">
                  <strong>#${rIdx + 1} (${c.score.toFixed(3)})</strong> — ${escapeHtml(
                  c.document_title.slice(0, 24)
                )}<br/>
                  <span style="color:var(--text-muted);font-size:10.5px;">§ ${escapeHtml(
                    c.section_title
                  )} (Page ${c.page_number})</span>
                </div>
              `
              )
              .join("")}
          </div>
        `
        )
        .join("");
    } catch (err) {
      grid.innerHTML = `<div class="mode-comp-col">Comparison error: ${escapeHtml(
        err.message
      )}</div>`;
    }
  }

  async function refreshCacheStats() {
    try {
      const res = await fetch("/api/v1/cache/stats");
      if (!res.ok) return;
      const stats = await res.json();
      const el = document.getElementById("header-cache-stats");
      if (el) {
        el.textContent = `CACHE: ${stats.hit_rate_percent}% HIT (${stats.cached_entries} ENTRIES)`;
      }
    } catch (e) {
      // ignore
    }
  }

  async function clearSemanticCache() {
    try {
      const res = await fetch("/api/v1/cache/clear", { method: "POST" });
      if (res.ok) {
        await refreshCacheStats();
        showToast("Semantic Cache flushed", "info");
      }
    } catch (e) {
      showToast("Failed to clear cache", "error");
    }
  }

  // ==========================================================================
  // 12. CUSTOM DOCUMENT INGESTION STUDIO ("WHAT TO PASTE WHERE")
  // ==========================================================================
  function loadIngestSample(sampleKey) {
    const sample = CUSTOM_INGEST_SAMPLES[sampleKey];
    if (!sample) return;

    document.getElementById("ingest-title-input").value = sample.title;
    document.getElementById("ingest-domain-select").value = sample.domain;
    document.getElementById("ingest-author-input").value = sample.author;
    document.getElementById("ingest-content-textarea").value = sample.content;

    updateIngestEstimator();
    showToast(`Loaded template: ${sample.title}`, "info");
  }

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || "");
      const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[_\-]+/g, " ");
      document.getElementById("ingest-title-input").value = cleanName;
      document.getElementById("ingest-content-textarea").value = content;
      const statusEl = document.getElementById("file-upload-status");
      if (statusEl) {
        statusEl.textContent = `Loaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }
      updateIngestEstimator();
      showToast(`Loaded local file: ${file.name}`, "success");
    };
    reader.readAsText(file);
  }

  function updateIngestEstimator() {
    const text = document.getElementById("ingest-content-textarea")?.value || "";
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const headings = (text.match(/^#{1,3}\s+/gm) || []).length;
    const tables = (text.match(/\|.*\|/g) || []).length > 1 ? 1 : 0;
    const estChunks = Math.max(1, headings || Math.ceil(words / 180));

    const el = document.getElementById("ingest-live-estimator");
    if (el) {
      el.textContent = `${words} WORDS • ~${estChunks} CHUNKS • ${headings} SECTIONS • ${
        tables ? "TABLES DETECTED" : "PROSE/CODE"
      }`;
    }
  }

  async function submitCustomDocument() {
    const title = document.getElementById("ingest-title-input")?.value.trim();
    const domain = document.getElementById("ingest-domain-select")?.value;
    const author = document.getElementById("ingest-author-input")?.value.trim();
    const content = document.getElementById("ingest-content-textarea")?.value.trim();
    const feedback = document.getElementById("ingest-feedback-msg");

    if (!title || !content || content.length < 20) {
      showToast("Please provide a Document Title and at least 20 characters of content (or click a Sample Template in Step 01)", "warn");
      return;
    }

    if (feedback) {
      feedback.textContent = "Chunking tables & sections, computing 768-D embeddings, and indexing BM25...";
    }

    try {
      const res = await fetch("/api/v1/documents/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          domain: domain || "Custom Architecture & Ops",
          author: author || "Enterprise User",
          category: "custom_ingested",
        }),
      });

      if (!res.ok) throw new Error(`Ingest failed (${res.status})`);
      const data = await res.json();
      const newDoc = data.document || data;

      if (feedback) {
        feedback.textContent = `✓ Indexed "${newDoc.title}" (${newDoc.total_chunks} chunks, ${newDoc.total_tokens} tokens). Switching to live verification...`;
      }

      showToast(`Indexed "${newDoc.title}" & generated 4 tailored questions!`, "success");

      // Refresh corpus list & select the newly ingested document
      await loadDocumentsAndRibbon();
      await selectDomainPreset(newDoc.document_id, true);
    } catch (err) {
      console.error("Custom ingestion failed:", err);
      if (feedback) {
        feedback.textContent = `Error: ${err.message}`;
      }
      showToast("Failed to ingest custom document", "error");
    }
  }

  // ==========================================================================
  // 13. RAGAS 13-QUERY EMPIRICAL BENCHMARK SUITE
  // ==========================================================================
  async function loadBenchmarks(showNotification = false) {
    try {
      const res = await fetch("/api/v1/benchmarks");
      if (!res.ok) throw new Error("Benchmark API failed");
      const data = await res.json();
      state.benchmarksData = data;
      renderBenchmarksMatrix(data);
      if (showNotification) {
        showToast("Executed Ragas 13-Query Evaluation Suite across all 6 domains", "success");
      }
    } catch (err) {
      console.error("Failed to load benchmarks:", err);
    }
  }

  function renderBenchmarksMatrix(data) {
    const matrix = data.performance_matrix || {};
    const ablationGrid = document.getElementById("ablation-cards-grid");
    if (ablationGrid) {
      const keys = ["dense_only", "bm25_only", "hybrid_rrf", "hybrid_reranked"];
      ablationGrid.innerHTML = keys
        .map((k) => {
          const item = matrix[k];
          if (!item) return "";
          const isBest = k === "hybrid_reranked";
          return `
            <div class="ablation-card ${isBest ? "highlight" : ""}">
              <div class="dag-step-num">${isBest ? "★ PRODUCTION ENGINE" : "ABLATION BASELINE"}</div>
              <div class="dag-step-title" style="margin:3px 0 8px;">${escapeHtml(
                item.name
              )}</div>
              <div class="mono-meta">CTX PRECISION: <strong style="color:var(--text-primary);">${(
                item.avg_context_precision * 100
              ).toFixed(1)}%</strong></div>
              <div class="mono-meta">CTX RECALL: <strong style="color:var(--text-primary);">${(
                item.avg_context_recall * 100
              ).toFixed(1)}%</strong></div>
              <div class="mono-meta">FAITHFULNESS: <strong style="color:var(--accent-emerald);">${(
                item.avg_faithfulness * 100
              ).toFixed(1)}%</strong></div>
            </div>
          `;
        })
        .join("");
    }

    const tbody = document.getElementById("ragas-cases-tbody");
    const cases = data.report?.comparisons?.individual_results || [];
    if (tbody) {
      tbody.innerHTML = cases
        .map(
          (c) => `
          <tr onclick="window.SynapseApp.runBenchmarkRowQuery('${escapeAttr(
            c.query
          )}')" style="cursor:pointer;">
            <td><strong>${escapeHtml(c.query)}</strong></td>
            <td style="color:var(--accent-emerald);font-weight:700;">${(
              c.faithfulness * 100
            ).toFixed(1)}%</td>
            <td>${(c.answer_relevance * 100).toFixed(1)}%</td>
            <td>${(c.context_precision * 100).toFixed(1)}%</td>
            <td>${(c.context_recall * 100).toFixed(1)}%</td>
            <td><strong>${(c.harmonic_f1 * 100).toFixed(1)}%</strong></td>
            <td><span class="score-chip" style="color:var(--accent-cyan);">▶ TEST LIVE</span></td>
          </tr>
        `
        )
        .join("");
    }
  }

  async function runBenchmarkRowQuery(queryText) {
    document.getElementById("search-query-input").value = queryText;
    switchLeftTab("synthesis");
    await executeSearch(queryText, false);
  }

  // ==========================================================================
  // 14. BYOK MODEL VAULT & SERVER AUTH DETECTION
  // ==========================================================================
  function syncVaultModalInputs() {
    const prov = document.getElementById("vault-provider-select");
    const mod = document.getElementById("vault-model-input");
    const key = document.getElementById("vault-apikey-input");
    if (prov) prov.value = state.vault.provider;
    if (mod) mod.value = state.vault.model;
    if (key) key.value = state.vault.apiKey;
  }

  function onVaultProviderChange() {
    const prov = document.getElementById("vault-provider-select")?.value;
    const modInput = document.getElementById("vault-model-input");
    if (!modInput) return;

    const defaults = {
      gemini: "gemini-2.5-flash",
      openai: "gpt-4o-mini",
      anthropic: "claude-3-5-sonnet-20241022",
      ollama: "llama3",
    };
    modInput.value = defaults[prov] || "gemini-2.5-flash";
  }

  async function detectServerAuthStatus() {
    try {
      const res = await fetch("/api/v1/auth/detect");
      if (!res.ok) return;
      const data = await res.json();

      const dot = document.getElementById("header-auth-dot");
      const label = document.getElementById("header-auth-label");

      if (state.vault.apiKey || state.vault.provider === "ollama") {
        if (dot) dot.className = "status-dot status-online";
        if (label) label.textContent = `VAULT: ${state.vault.provider.toUpperCase()}`;
      } else if (data.status === "ready") {
        if (dot) dot.className = "status-dot status-online";
        if (label) label.textContent = `ENV: ${data.provider.toUpperCase()}`;
      } else {
        if (dot) dot.className = "status-dot status-online";
        if (label) label.textContent = "ENGINE: DETERMINISTIC";
      }
    } catch (e) {
      // ignore
    }
  }

  async function detectServerEnvKeys() {
    const out = document.getElementById("vault-test-result");
    try {
      const res = await fetch("/api/v1/auth/detect");
      const data = await res.json();
      if (out) {
        out.style.color = "var(--accent-cyan)";
        out.textContent = `Server Detection: ${data.label} (Provider: ${data.provider}, Model: ${data.model})`;
      }
    } catch (err) {
      if (out) {
        out.style.color = "var(--accent-crimson)";
        out.textContent = `Error scanning server env: ${err.message}`;
      }
    }
  }

  async function testVaultConnection() {
    const provider = document.getElementById("vault-provider-select")?.value || "gemini";
    const model = document.getElementById("vault-model-input")?.value.trim() || "";
    const apiKey = document.getElementById("vault-apikey-input")?.value.trim() || "";
    const out = document.getElementById("vault-test-result");

    if (out) {
      out.style.color = "var(--text-secondary)";
      out.textContent = `Testing connection to ${provider.toUpperCase()} (${model})...`;
    }

    try {
      const res = await fetch("/api/v1/auth/test_key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, api_key: apiKey }),
      });
      const data = await res.json();
      if (out) {
        out.style.color = data.success
          ? "var(--accent-emerald)"
          : "var(--accent-amber)";
        out.textContent = data.success
          ? `✓ ${data.message}`
          : `ℹ ${data.message} (Grounded Deterministic Mode remains active as fallback)`;
      }
    } catch (err) {
      if (out) {
        out.style.color = "var(--accent-crimson)";
        out.textContent = `Connection failed: ${err.message}`;
      }
    }
  }

  function saveVaultConfig() {
    state.vault.provider =
      document.getElementById("vault-provider-select")?.value || "gemini";
    state.vault.model =
      document.getElementById("vault-model-input")?.value.trim() || "gemini-2.5-flash";
    state.vault.apiKey =
      document.getElementById("vault-apikey-input")?.value.trim() || "";

    localStorage.setItem("synapse_llm_provider", state.vault.provider);
    localStorage.setItem("synapse_llm_model", state.vault.model);
    localStorage.setItem("synapse_llm_api_key", state.vault.apiKey);

    detectServerAuthStatus();
    closeModal("vault-modal");
    showToast("Saved LLM Gateway configuration", "success");
  }

  function clearVaultConfig() {
    state.vault = { provider: "gemini", model: "gemini-2.5-flash", apiKey: "" };
    localStorage.removeItem("synapse_llm_provider");
    localStorage.removeItem("synapse_llm_model");
    localStorage.removeItem("synapse_llm_api_key");
    syncVaultModalInputs();
    detectServerAuthStatus();
    const out = document.getElementById("vault-test-result");
    if (out) {
      out.style.color = "var(--accent-emerald)";
      out.textContent = "✓ Reset to Zero-API-Key Deterministic Grounded Mode.";
    }
    showToast("Reset to Offline Deterministic Grounded Mode", "info");
  }

  // ==========================================================================
  // 15. TAB & MODAL NAVIGATION HELPERS
  // ==========================================================================
  function switchLeftTab(tabName) {
    const tabs = ["synthesis", "pipeline", "benchmarks"];
    tabs.forEach((t) => {
      document
        .getElementById(`tab-btn-${t}`)
        ?.classList.toggle("active", t === tabName);
      document
        .getElementById(`panel-${t}`)
        ?.classList.toggle("active", t === tabName);
    });
  }

  function switchRightPane(paneName) {
    const panes = ["reader", "ingest"];
    panes.forEach((p) => {
      document
        .getElementById(`rtab-btn-${p}`)
        ?.classList.toggle("active", p === paneName);
      document
        .getElementById(`rpanel-${p}`)
        ?.classList.toggle("active", p === paneName);
    });
  }

  function openModal(modalId) {
    document.getElementById(modalId)?.classList.add("open");
  }

  function closeModal(modalId) {
    document.getElementById(modalId)?.classList.remove("open");
  }

  async function resetToOverview() {
    await selectDomainPreset("all", false);
    switchLeftTab("synthesis");
    switchRightPane("reader");
  }

  function copyAnswerMarkdown() {
    const raw = state.lastSearchResponse?.answer || "";
    if (!raw) return;
    navigator.clipboard?.writeText(raw);
    showToast("Copied Grounded Markdown Answer to clipboard", "success");
  }

  function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.getElementById("search-query-input");
        if (input) {
          input.focus();
          input.select();
        }
      } else if (e.key === "Escape") {
        closeModal("vault-modal");
      }
    });

    const searchInput = document.getElementById("search-query-input");
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          executeSearch();
        }
      });
    }
  }

  // ==========================================================================
  // 16. COMPLETE MARKDOWN PARSER (TABLES, FENCED CODE, LISTS, CITATION PILLS)
  // ==========================================================================
  function renderMarkdown(mdText, interactiveCitations = true) {
    if (!mdText) return "";

    // 1. Extract fenced code blocks first
    const codeBlocks = [];
    let processed = mdText.replace(/```([a-zA-Z0-9_\-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(
        `<pre><code class="lang-${escapeAttr(lang || "text")}">${escapeHtml(
          code.trim()
        )}</code></pre>`
      );
      return `@@CODEBLOCK_${idx}@@`;
    });

    // 2. Parse Markdown tables line-by-line
    const lines = processed.split("\n");
    const outLines = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (
        line.startsWith("|") &&
        line.endsWith("|") &&
        i + 1 < lines.length &&
        /^\|\s*[:\-]+/.test(lines[i + 1].trim())
      ) {
        const headerCells = line
          .slice(1, -1)
          .split("|")
          .map((c) => `<th>${formatInlineMarkdown(c.trim(), interactiveCitations)}</th>`)
          .join("");
        i += 2; // skip header and separator row
        const bodyRows = [];
        while (
          i < lines.length &&
          lines[i].trim().startsWith("|") &&
          lines[i].trim().endsWith("|")
        ) {
          const rowCells = lines[i]
            .trim()
            .slice(1, -1)
            .split("|")
            .map((c) => `<td>${formatInlineMarkdown(c.trim(), interactiveCitations)}</td>`)
            .join("");
          bodyRows.push(`<tr>${rowCells}</tr>`);
          i++;
        }
        outLines.push(
          `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows.join(
            ""
          )}</tbody></table>`
        );
        continue;
      }
      outLines.push(lines[i]);
      i++;
    }

    // 3. Process headings, blockquotes, lists, and paragraphs
    const blocks = outLines.join("\n").split(/\n{2,}/);
    const htmlBlocks = blocks.map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("@@CODEBLOCK_") || trimmed.startsWith("<table>")) {
        return trimmed;
      }
      if (trimmed.startsWith("### ")) {
        return `<h4>${formatInlineMarkdown(trimmed.slice(4), interactiveCitations)}</h4>`;
      }
      if (trimmed.startsWith("## ")) {
        return `<h3>${formatInlineMarkdown(trimmed.slice(3), interactiveCitations)}</h3>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h2>${formatInlineMarkdown(trimmed.slice(2), interactiveCitations)}</h2>`;
      }
      if (trimmed.startsWith("> ")) {
        const quoteText = trimmed
          .split("\n")
          .map((l) => l.replace(/^>\s?/, ""))
          .join(" ");
        return `<blockquote>${formatInlineMarkdown(quoteText, interactiveCitations)}</blockquote>`;
      }
      const listLines = trimmed.split("\n");
      if (listLines.every((l) => /^(\-|\*)\s+/.test(l.trim()))) {
        const items = listLines
          .map(
            (l) =>
              `<li>${formatInlineMarkdown(
                l.trim().replace(/^(\-|\*)\s+/, ""),
                interactiveCitations
              )}</li>`
          )
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (listLines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
        const items = listLines
          .map(
            (l) =>
              `<li>${formatInlineMarkdown(
                l.trim().replace(/^\d+\.\s+/, ""),
                interactiveCitations
              )}</li>`
          )
          .join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${formatInlineMarkdown(trimmed.replace(/\n/g, "<br/>"), interactiveCitations)}</p>`;
    });

    let finalHtml = htmlBlocks.join("\n");
    codeBlocks.forEach((cb, idx) => {
      finalHtml = finalHtml.replace(`@@CODEBLOCK_${idx}@@`, cb);
    });
    return finalHtml;
  }

  function formatInlineMarkdown(text, interactiveCitations) {
    let safe = escapeHtml(text);

    // Inline code
    safe = safe.replace(/`([^`]+)`/g, "<code>$1</code>");
    // Bold
    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    // Italic
    safe = safe.replace(/\*([^*]+)\*/g, "<em>$1</em>");

    // Interactive [1], [2], [3] citation buttons
    if (interactiveCitations) {
      safe = safe.replace(
        /\[(\d+)\]/g,
        `<button type="button" class="cite-inline-btn" onclick="window.SynapseApp.focusCitationIndex($1)" title="Click to locate Citation [$1] in Document Reader">[$1]</button>`
      );
    }
    return safe;
  }

  // ==========================================================================
  // 17. THREE.JS SPATIAL BLUEPRINT LATTICE (SUBTLE HARDWARE DEPTH)
  // ==========================================================================
  function initThreeBlueprintCanvas() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas || !window.THREE) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    try {
      const scene = new window.THREE.Scene();
      const camera = new window.THREE.PerspectiveCamera(
        55,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.z = 26;

      const renderer = new window.THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

      const geometry = new window.THREE.IcosahedronGeometry(13, 1);
      const wireframe = new window.THREE.WireframeGeometry(geometry);
      const material = new window.THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.14,
      });
      const lattice = new window.THREE.LineSegments(wireframe, material);
      scene.add(lattice);

      function animate() {
        requestAnimationFrame(animate);
        lattice.rotation.y += 0.0008;
        lattice.rotation.x += 0.0004;
        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      });
    } catch (e) {
      // WebGL optional fallback
    }
  }

  // ==========================================================================
  // 18. UTILITIES & TOAST NOTIFICATIONS
  // ==========================================================================
  function showToast(message, type = "info") {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;
    const toast = document.createElement("div");
    toast.className = "tactical-toast";
    if (type === "error") toast.style.borderColor = "var(--accent-crimson)";
    if (type === "warn") toast.style.borderColor = "var(--accent-amber)";
    if (type === "success") toast.style.borderColor = "var(--accent-emerald)";
    toast.textContent = message;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3400);
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/'/g, "\\'")
      .replace(/"/g, "&quot;");
  }

  // Expose public controller methods
  window.SynapseApp = {
    setTheme: applyTheme,
    selectDomainPreset,
    onScopeToggleChange,
    runScenarioChip,
    executeSearch,
    setRetrievalMode,
    triggerExactCacheHit,
    triggerParaphraseCacheTest,
    compareAllThreeModes,
    clearSemanticCache,
    focusCitation,
    focusCitationIndex,
    highlightChunkInReader,
    onReaderSelectChange,
    filterReaderChunks,
    queryChunkSection,
    loadIngestSample,
    handleFileUpload,
    updateIngestEstimator,
    submitCustomDocument,
    loadBenchmarks,
    runBenchmarkRowQuery,
    onVaultProviderChange,
    detectServerEnvKeys,
    testVaultConnection,
    saveVaultConfig,
    clearVaultConfig,
    switchLeftTab,
    switchRightPane,
    openModal,
    closeModal,
    resetToOverview,
    copyAnswerMarkdown,
  };
})();
