/**
 * SYNAPSE // 02 — Shared 7-Page Navigation Dock, 6-Domain Registry, Markdown Engine & Cross-Page State
 * Zero Emojis — 100% Precision Vector SVGs & ThreeUI Hardware/Dimensional Styling
 */

window.SynapseNav = (function () {
  const STORAGE_KEYS = {
    LAST_SEARCH: 'synapse_last_search_v2',
    ACTIVE_DOMAIN: 'synapse_active_domain_v2',
    ACTIVE_DOC: 'synapse_active_doc_v2',
    ACTIVE_CITATION: 'synapse_active_citation_v2',
    ACTIVE_QUERY: 'synapse_active_query_v2',
    BYOK_SETTINGS: 'synapse_byok_settings_v2',
    SHADER_THEME: 'synapse_shader_theme_v2',
    CUSTOM_DOCUMENTS: 'synapse_custom_documents_v2',
  };

  const PAGES = [
    {
      id: 'search',
      label: 'Ask',
      sub: 'Ask a question, get a cited answer',
      href: '/search',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="m11 8 0 6"/><path d="m8 11 6 0"/></svg>',
    },
    {
      id: 'ingest',
      label: 'Add Documents',
      sub: 'Upload or paste your own files',
      href: '/ingest',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>',
    },
    {
      id: 'documents',
      label: 'Library',
      sub: 'Everything that is indexed',
      href: '/documents',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    },
    {
      id: 'settings',
      label: 'Settings',
      sub: 'API key and model',
      href: '/settings',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    },
  ];

  const SECONDARY_PAGES = [
    {
      id: 'analytics',
      label: 'Accuracy Test',
      sub: 'Benchmark the search quality',
      href: '/analytics',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>',
    },
    {
      id: 'pipeline',
      label: 'How Search Works',
      sub: 'Pipeline explained step by step',
      href: '/pipeline',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><rect x="2" y="3" width="6" height="6" rx="1"/><rect x="16" y="3" width="6" height="6" rx="1"/><rect x="9" y="15" width="6" height="6" rx="1"/><path d="M5 9v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/></svg>',
    },
    {
      id: 'overview',
      label: 'Overview',
      sub: 'Architecture overview',
      href: '/overview',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-3.5 h-3.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    },
  ];

  const DOMAINS = [
    {
      id: 'security',
      docId: 'cve_2024_8192_kernel_security_advisory',
      code: 'Security Advisory',
      shortTitle: 'CVE-2024-8192 Kernel Security',
      title: 'CVE-2024-8192: Linux Kernel Netfilter / Packet Ring Privilege Escalation',
      category: 'security',
      accent: '#f43f5e',
      badgeClass: 'text-rose-300 border-rose-500/30 bg-rose-500/15 rounded-full px-3 py-0.5',
      summary: 'CVSS 9.8 vulnerability at offset 0x7fff90a4 in packet_set_ring (af_packet.c), commit a7f8e910c2d3 fix, and sysctl bpf_jit_harden=2 live workaround.',
      metrics: 'CVSS 9.8 · 0x7fff90a4 · bpf_jit_harden=2',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      queries: [
        {
          label: 'Memory Offset & Function (CVE-2024-8192)',
          query: 'What is the memory offset and vulnerable function in CVE-2024-8192?',
          modeHint: 'Combined Search (Exact keyword 0x7fff90a4 + AI meaning context)',
        },
        {
          label: 'Zero-Reboot Sysctl Workaround',
          query: 'What sysctl workaround hardens against CVE-2024-8192 without rebooting?',
          modeHint: 'Extracts bpf_jit_harden=2 and unprivileged_userns_clone=0',
        },
        {
          label: 'Upstream Git Commit Hash',
          query: 'Which upstream Git commit fixed CVE-2024-8192?',
          modeHint: 'Retrieves exact commit hash a7f8e910c2d3',
        },
      ],
    },
    {
      id: 'financial',
      docId: 'q3_enterprise_cloud_infrastructure_financials',
      code: 'Q3 10-Q Financials',
      shortTitle: 'Q3 Cloud Financials (10-Q)',
      title: 'Q3 Enterprise Cloud Infrastructure Financial Report & Segment Analysis',
      category: 'financial',
      accent: '#10b981',
      badgeClass: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15 rounded-full px-3 py-0.5',
      summary: '$14.82B consolidated Q3 revenue, 32.4% operating margin, +84.0% YoY AI Cloud growth ($2.70B), and $3.41B H100/B200 GPU CapEx.',
      metrics: '$14.82B Rev · 32.4% Margin · +84% AI Cloud',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      queries: [
        {
          label: 'Q3 Consolidated Revenue & Margin',
          query: 'What was the total consolidated revenue and operating margin in Q3?',
          modeHint: 'Extracts $14.82B revenue and 32.4% operating margin with [1] citations',
        },
        {
          label: 'AI Cloud YoY Revenue Growth',
          query: 'How much did AI Cloud revenue grow year-over-year in Q3?',
          modeHint: 'Extracts 84.0% YoY growth from $2.70B segment table',
        },
        {
          label: 'Q3 GPU CapEx & Hardware Fleet',
          query: 'What was Q3 capital expenditure (CAPEX) and which GPU models were procured?',
          modeHint: 'Retrieves $3.41B CapEx and 48,000 NVIDIA H100/B200 cluster notes',
        },
      ],
    },
    {
      id: 'architecture',
      docId: 'distributed_raft_consensus_architecture_spec',
      code: 'Distributed Systems',
      shortTitle: 'Distributed Raft Consensus RFC',
      title: 'Distributed Raft Consensus & Linearizable State Machine Architecture Spec',
      category: 'architecture',
      accent: '#6366f1',
      badgeClass: 'text-indigo-300 border-indigo-500/30 bg-indigo-500/15 rounded-full px-3 py-0.5',
      summary: '50ms AppendEntries leader heartbeat, 150-300ms randomized election timeout, 200ms Leader Lease linearizable reads, and 50,000-entry snapshot compaction.',
      metrics: '50ms Heartbeat · 150-300ms Election · 200ms Lease',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
      queries: [
        {
          label: 'Linearizable Leader Lease Reads',
          query: 'How does the Raft leader serve linearizable reads without disk round-trips?',
          modeHint: 'Semantic Meaning + Keyword search on 200ms Leader Lease Protocol',
        },
        {
          label: 'Leader Heartbeat & Election Timeout',
          query: 'What is the randomized follower election timeout range in the Raft consensus engine?',
          modeHint: 'Extracts 150ms - 300ms election timeout and 50ms AppendEntries interval',
        },
        {
          label: 'Log Compaction & Snapshot Trigger',
          query: 'When do nodes trigger log compaction and memory snapshots in Raft?',
          modeHint: 'Retrieves 50,000 log entries or 2.5 GB WAL threshold',
        },
      ],
    },
    {
      id: 'compliance',
      docId: 'enterprise_msa_gdpr_compliance_sla',
      code: 'Legal & GDPR SLA',
      shortTitle: 'Legal MSA & GDPR SLA',
      title: 'Enterprise Master Services Agreement (MSA) & GDPR Data Processing SLA',
      category: 'compliance',
      accent: '#a855f7',
      badgeClass: 'text-purple-300 border-purple-500/30 bg-purple-500/15 rounded-full px-3 py-0.5',
      summary: '99.99% uptime SLA (25% service credit at 99.50%), 14-hour GDPR Article 33 breach notification window, and $15,000,000 super-cap liability.',
      metrics: '25% Credit · 14h Breach Window · $15M Cap',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><path d="M12 3v18"/><rect x="4" y="6" width="16" height="12" rx="2"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>',
      queries: [
        {
          label: 'SLA Credits & 14h GDPR Breach Window',
          query: 'What is the service credit percentage if monthly uptime drops to 99.50% and what is the GDPR breach notification window?',
          modeHint: 'Retrieves 25% service credit tier and 14-hour breach window',
        },
        {
          label: 'Super-Cap Liability Limit',
          query: 'What is the service credit for 99.50% monthly uptime and the GDPR breach notification window?',
          modeHint: 'Extracts $15,000,000 liability cap and SLA credit table',
        },
      ],
    },
    {
      id: 'biomedical',
      docId: 'fda_phase3_oncology_clinical_protocol',
      code: 'Clinical Trial Phase III',
      shortTitle: 'FDA Phase III Clinical Trial',
      title: 'FDA Phase III Oncology Clinical Trial Protocol (NCT-09482110)',
      category: 'biomedical',
      accent: '#06b6d4',
      badgeClass: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/15 rounded-full px-3 py-0.5',
      summary: 'Phase III study NCT-09482110: Cohort A median Progression-Free Survival (mPFS) of 14.8 months, Hazard Ratio 0.54, and 68.4% Objective Response Rate.',
      metrics: 'mPFS 14.8m · HR 0.54 · ORR 68.4%',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/><line x1="5.52" y1="16" x2="18.48" y2="16"/></svg>',
      queries: [
        {
          label: 'Cohort A mPFS & Hazard Ratio (NCT-09482110)',
          query: 'What was the median Progression-Free Survival (mPFS) and Hazard Ratio for Cohort A in NCT-09482110?',
          modeHint: 'Extracts 14.8 months mPFS, HR 0.54, and 68.4% ORR',
        },
        {
          label: 'Grade 3+ Toxicity & Dose Protocol',
          query: 'What are the dose modification rules and efficacy endpoints in clinical trial NCT-09482110?',
          modeHint: 'Extracts clinical biostatistics & safety tables',
        },
      ],
    },
    {
      id: 'incident',
      docId: 'sev1_global_payment_gateway_postmortem',
      code: 'SRE Post-Mortem',
      shortTitle: 'SRE SEV-1 Outage Post-Mortem',
      title: 'Incident Post-Mortem INC-2024-1004: Global Payment Gateway SEV-1 Outage',
      category: 'incident',
      accent: '#f59e0b',
      badgeClass: 'text-amber-300 border-amber-500/30 bg-amber-500/15 rounded-full px-3 py-0.5',
      summary: 'SEV-1 outage INC-2024-1004 triggered by 4,096 connection pool exhaustion, mitigated via kubectl rollout undo deployment/payment-router-v4.',
      metrics: 'INC-2024-1004 · 4,096 Pool · kubectl rollout undo',
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
      queries: [
        {
          label: 'SEV-1 Root Cause & Rollback Command',
          query: 'What caused the SEV-1 payment gateway outage INC-2024-1004 and what was the exact rollback command?',
          modeHint: 'Extracts 4,096 max_connections saturation and kubectl rollout undo',
        },
        {
          label: 'Remediation & Circuit Breaker SLA',
          query: 'What post-mortem remediation steps were mandated after incident INC-2024-1004?',
          modeHint: 'Retrieves PgBouncer pooling and automated canary rollback policies',
        },
      ],
    },
  ];

  const SAMPLE_TEMPLATES = [
    {
      id: 'tpl-k8s-mesh',
      title: 'Zero-Trust Istio Service Mesh & mTLS Policy (SEC-2025-901)',
      category: 'security',
      summary: 'SPIFFE/SPIRE workload identity, strict mTLS enforcement, and CVE-2025-4410 Envoy WASM filter bypass rules.',
      suggestedQueries: [
        'What is the SPIFFE SVID rotation interval and strict mTLS policy in SEC-2025-901?',
        'How do we mitigate the CVE-2025-4410 Envoy WASM memory corruption vulnerability?',
      ],
      content: `# Zero-Trust Istio Service Mesh & mTLS Policy (SEC-2025-901)

## 1. Executive Mandate & SPIFFE Workload Identity
All production microservices deployed in Kubernetes clusters (\`eks-prod-us-east-1\`, \`eks-prod-eu-central-1\`) MUST enforce \`PeerAuthentication\` mode \`STRICT\` using Istio 1.24+ with SPIRE-backed X.509 workload certificates.

| Control Parameter | Production Requirement | Audit Verification Command |
| :--- | :--- | :--- |
| **mTLS Mode** | \`STRICT\` (Plaintext rejected at Envoy ingress) | \`istioctl x describe pod <pod>\` |
| **SVID TTL / Rotation** | 1 hour TTL, automatic rotation at 30 minutes | \`spire-agent api fetch x509\` |
| **Cipher Suites** | \`TLS_AES_256_GCM_SHA384\`, \`TLS_CHACHA20_POLY1305_SHA256\` | \`openssl s_client -tls1_3\` |
| **Egress Gateway** | Mandatory SNI allowlist via \`gateway-egress-prod\` | \`kubectl get serviceentries -A\` |

## 2. Mitigation for CVE-2025-4410 (Envoy WASM Filter Bypass)
A high-severity heap buffer overflow (**CVE-2025-4410**, CVSS 8.7) was identified in custom Wasmtime HTTP header parsers when processing malformed \`x-forwarded-client-cert\` headers exceeding 16 KB.

\`\`\`yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: block-oversized-xfcc-cve-2025-4410
  namespace: istio-system
spec:
  action: DENY
  rules:
  - when:
    - key: request.headers[x-forwarded-client-cert]
      values: ["*"]
\`\`\`

### Mandatory Remediation Steps
1. Upgrade Istio control plane and Envoy sidecar proxies to **v1.24.3-patch2** within 24 hours.
2. Enforce \`max_request_headers_kb: 8\` in the root \`EnvoyFilter\` configuration.`,
    },
    {
      id: 'tpl-saas-board',
      title: 'FY2025 Series C SaaS ARR & Cohort Economics Board Memo',
      category: 'financial',
      summary: 'Enterprise ARR waterfall, CAC payback period, Magic Number, and AI Copilot attach rate metrics.',
      suggestedQueries: [
        'What is the Ending ARR, Net New ARR, and CAC payback period in the FY2025 Board Memo?',
        'What is the AI Copilot attach rate and gross margin impact?',
      ],
      content: `# FY2025 Series C SaaS ARR & Cohort Economics Board Memo

## 1. ARR Waterfall & Unit Economics Summary
For Fiscal Quarter Q4 2025, Ending Annual Recurring Revenue (ARR) reached **$128.4M**, representing **48.6% year-over-year growth**.

| Metric | Q4 FY2024 | Q4 FY2025 | Benchmark Target |
| :--- | :--- | :--- | :--- |
| **Ending ARR** | $86.4M | **$128.4M** | $122.0M |
| **Net New ARR** | $9.2M | **$14.8M** | $12.5M |
| **Gross Revenue Retention (GRR)** | 93.4% | **95.8%** | >92.0% |
| **Net Dollar Retention (NDR)** | 124.0% | **136.5%** | >125.0% |
| **CAC Payback Period (Gross Margin Adjusted)** | 16.2 Months | **11.4 Months** | <15.0 Months |
| **SaaS Magic Number** | 0.94x | **1.32x** | >1.00x |

## 2. AI Copilot Expansion & Attach Rate
- **AI Copilot Attach Rate**: **64.2%** of new logos signed in Q4 FY2025 purchased the Enterprise AI Copilot tier (+$48,000 ACV uplift per customer).
- **Rule of 40 Score**: **54.8%** (48.6% ARR growth + 6.2% Free Cash Flow margin).`,
    },
    {
      id: 'tpl-kafka-rfc',
      title: 'RFC-108: Tiered Kafka Storage & Zero-Copy Consumer Architecture',
      category: 'architecture',
      summary: 'Apache Kafka 3.9 KRaft controller quorum, S3 Express One Zone tiered segments, and p99 consumer lag bounds.',
      suggestedQueries: [
        'How does RFC-108 reduce broker local NVMe storage costs and what is the S3 Express fetch latency?',
        'What are the KRaft controller quorum settings in RFC-108?',
      ],
      content: `# RFC-108: Tiered Kafka Storage & Zero-Copy Consumer Architecture

## 1. KRaft Consensus & Tiered Storage Overview
This RFC migrates our 1.8 GB/sec telemetry ingestion cluster from ZooKeeper to a 5-node **KRaft controller quorum** with **KIP-405 Tiered Storage** backed by AWS S3 Express One Zone.

| Tier | Retention Window | Backing Store | p99 Read Latency | Cost Reduction |
| :--- | :--- | :--- | :--- | :--- |
| **Hot Tier (Local)** | 4 Hours | AWS i4i.4xlarge Nitro NVMe | **2.1 ms** | Baseline |
| **Warm Tier (Remote)** | 30 Days | S3 Express One Zone (ZSTD) | **11.8 ms** | **-68.4% Storage Cost** |

## 2. Broker & Producer Configuration
\`\`\`properties
process.roles=broker,controller
controller.quorum.voters=1@kraft-1:9093,2@kraft-2:9093,3@kraft-3:9093,4@kraft-4:9093,5@kraft-5:9093
remote.log.storage.system.enable=true
log.local.retention.ms=14400000
compression.type=zstd
\`\`\``,
    },
    {
      id: 'tpl-hipaa-baa',
      title: 'HIPAA Business Associate Agreement (BAA-2025) & SOC2 Type II Controls',
      category: 'compliance',
      summary: 'Protected Health Information (PHI) encryption, 12-hour breach reporting, and FIPS 140-3 HSM key custody.',
      suggestedQueries: [
        'What is the HIPAA PHI breach reporting timeline and HSM FIPS standard in BAA-2025?',
        'How are audit logs retained and protected under BAA-2025?',
      ],
      content: `# HIPAA Business Associate Agreement (BAA-2025) & SOC2 Type II Controls

## 1. Permitted Uses & Zero-Persistence PHI Enclaves
All Electronic Protected Health Information (ePHI) processed by the Document Intelligence Engine is isolated inside **AWS Nitro Enclaves** with **FIPS 140-3 Level 3** Hardware Security Modules (HSMs).

| HIPAA Security Rule Ref | Control Implementation | Audit Cadence |
| :--- | :--- | :--- |
| **45 CFR 164.312(a)(1)** | Role-Based Access Control + WebAuthn Hardware MFA | Continuous |
| **45 CFR 164.312(b)** | Immutable WORM Audit Trail retained for **7 Years** | Daily SHA-256 Merkle Anchor |
| **45 CFR 164.410** | Unsecured ePHI breach notification within **12 Hours** | Annual Tabletop Drill |`,
    },
  ];

  // State Management
  function getState(key, fallback = null) {
    try {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function setState(key, val, persistLocal = false) {
    try {
      const str = JSON.stringify(val);
      sessionStorage.setItem(key, str);
      if (persistLocal) localStorage.setItem(key, str);
    } catch (_) {}
  }

  function getCustomDocuments() {
    return getState(STORAGE_KEYS.CUSTOM_DOCUMENTS, []);
  }

  function addCustomDocument(doc) {
    const list = getCustomDocuments();
    const docId = doc.document_id || doc.docId || doc.id || 'custom_doc';
    const title = doc.title || 'Custom Document';
    const category = doc.domain || doc.category || 'custom';
    const item = {
      id: docId,
      docId: docId,
      code: 'User Upload',
      shortTitle: title.length > 28 ? title.slice(0, 26) + '...' : title,
      title: title,
      category: category,
      accent: '#10b981',
      badgeClass: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/15 rounded-full px-3 py-0.5',
      summary: doc.summary || `User document indexed into Dense + BM25 engine with ${doc.total_chunks || 1} chunks.`,
      metrics: `${doc.total_chunks || 1} Chunks · User Data`,
      isCustom: true,
      svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" class="w-4 h-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      queries: (doc.suggested_queries && doc.suggested_queries.length ? doc.suggested_queries : [
        `What are the key points and summary of ${title}?`,
        `What specific requirements or technical metrics are specified in ${title}?`,
      ]).map((q) => {
        if (typeof q === 'string') {
          return {
            label: q.length > 35 ? q.slice(0, 32) + '...' : q,
            query: q,
            modeHint: 'Direct custom document query',
          };
        }
        return q;
      }),
    };
    const filtered = list.filter((d) => d.id !== item.id && d.docId !== item.docId);
    filtered.unshift(item);
    setState(STORAGE_KEYS.CUSTOM_DOCUMENTS, filtered, true);
    return item;
  }

  async function deleteCustomDocument(docId) {
    if (!docId) return;
    try {
      await fetch(`/api/v1/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' }).catch(() => {});
    } catch (_) {}

    const list = getCustomDocuments();
    const filtered = list.filter((d) => d.id !== docId && d.docId !== docId);
    setState(STORAGE_KEYS.CUSTOM_DOCUMENTS, filtered, true);

    if (getActiveDomainId() === docId) {
      setActiveDomainId('security');
    }
    if (getState(STORAGE_KEYS.ACTIVE_DOC) === docId) {
      setState(STORAGE_KEYS.ACTIVE_DOC, 'cve_2024_8192_kernel_security_advisory', true);
    }

    refreshTelemetryBadges();
    showToast('Document Deleted', `Custom document removed from Hybrid RAG index.`, 'info');

    if (typeof window.onCustomDocumentsChanged === 'function') {
      window.onCustomDocumentsChanged();
    }
    return filtered;
  }

  async function resetAllCustomDocuments() {
    try {
      await fetch('/api/v1/documents/reset', { method: 'POST' }).catch(() => {});
      await fetch('/api/v1/cache/clear', { method: 'POST' }).catch(() => {});
    } catch (_) {}

    setState(STORAGE_KEYS.CUSTOM_DOCUMENTS, [], true);
    setState(STORAGE_KEYS.LAST_SEARCH, null, true);
    setActiveDomainId('security');
    setState(STORAGE_KEYS.ACTIVE_DOC, 'cve_2024_8192_kernel_security_advisory', true);

    refreshTelemetryBadges();
    showToast('Platform Reset', 'All custom uploaded documents and cached queries cleared.', 'info');

    setTimeout(() => {
      window.location.reload();
    }, 400);
  }

  function getAllDomains() {
    const customs = getCustomDocuments();
    return [...customs, ...DOMAINS];
  }

  function getLastSearch() {
    return getState(STORAGE_KEYS.LAST_SEARCH, null);
  }

  function setLastSearch(data) {
    setState(STORAGE_KEYS.LAST_SEARCH, data, true);
  }

  function getActiveDomainId() {
    return getState(STORAGE_KEYS.ACTIVE_DOMAIN, 'security');
  }

  function setActiveDomainId(domainId) {
    setState(STORAGE_KEYS.ACTIVE_DOMAIN, domainId, true);
  }

  function getDomainById(idOrDocId) {
    const all = getAllDomains();
    return (
      all.find((d) => d.id === idOrDocId || d.docId === idOrDocId) || all[0]
    );
  }

  function getByokSettings() {
    return getState(STORAGE_KEYS.BYOK_SETTINGS, {
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      apiKey: '',
      bypassCache: false,
      topK: 5,
    });
  }

  function setByokSettings(cfg) {
    const merged = Object.assign({}, getByokSettings(), cfg);
    setState(STORAGE_KEYS.BYOK_SETTINGS, merged, true);
    if (merged.apiKey && merged.apiKey.trim()) {
      syncBackendKey(merged.apiKey.trim(), merged.provider || 'gemini', merged.model || 'gemini-2.0-flash').catch(() => {});
    }
    return merged;
  }

  async function checkBackendKeyStatus() {
    try {
      const res = await fetch('/api/v1/auth/key_status');
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return {
      has_key: false,
      status: 'offline',
      provider: 'offline',
      model: 'offline-zero-drain',
      label: 'Offline Deterministic Mode',
      masked_key: '',
    };
  }

  function detectProviderFromSyntax(key) {
    const k = String(key || '').trim();
    if (k.startsWith('sk-ant-')) return { provider: 'anthropic', model: 'claude-sonnet-4-5', label: 'Anthropic Claude' };
    if (k.startsWith('gsk_')) return { provider: 'groq', model: 'llama-3.3-70b-versatile', label: 'Groq Cloud (Llama 3.3)' };
    if (k.startsWith('sk-or-v1-')) return { provider: 'openrouter', model: 'google/gemini-2.0-flash-001', label: 'OpenRouter' };
    if (k.startsWith('sk-proj-') || (k.startsWith('sk-') && k.length > 35)) return { provider: 'openai', model: 'gpt-4o-mini', label: 'OpenAI GPT' };
    if (k.startsWith('AIzaSy') || k.startsWith('AQ.')) return { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Google Gemini' };
    if (k.length > 20) return { provider: 'gemini', model: 'gemini-2.5-flash', label: 'Google Gemini (or compatible)' };
    return null;
  }

  async function syncBackendKey(apiKey, provider = 'auto', model = null) {
    const cleanKey = String(apiKey || '').trim();
    if (!cleanKey) {
      return { success: false, message: 'API key cannot be empty' };
    }
    const det = detectProviderFromSyntax(cleanKey);
    const effProvider = (provider && provider !== 'auto') ? provider : (det ? det.provider : 'gemini');
    const effModel = model || (det ? det.model : 'gemini-2.5-flash');

    try {
      const res = await fetch('/api/v1/auth/set_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: cleanKey,
          provider: effProvider,
          model: effModel,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const current = getByokSettings();
        const updated = Object.assign({}, current, { apiKey: cleanKey, provider: data.provider || effProvider, model: data.model || effModel });
        setState(STORAGE_KEYS.BYOK_SETTINGS, updated, true);
        refreshTelemetryBadges();
        window.dispatchEvent(new CustomEvent('synapse:key_status_changed', {
          detail: {
            has_key: true,
            provider: data.provider || effProvider,
            model: data.model || effModel,
            label: data.message || `${effProvider.toUpperCase()} (${effModel})`,
            masked_key: cleanKey.slice(0, 6) + '...' + cleanKey.slice(-4),
          }
        }));
        return data;
      }
      return { success: false, message: `Server returned HTTP ${res.status}` };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  async function disconnectBackendKey() {
    try {
      const res = await fetch('/api/v1/auth/disconnect', { method: 'POST' });
      const current = getByokSettings();
      const updated = Object.assign({}, current, { apiKey: '' });
      setState(STORAGE_KEYS.BYOK_SETTINGS, updated, true);
      refreshTelemetryBadges();
      window.dispatchEvent(new CustomEvent('synapse:key_status_changed', {
        detail: { has_key: false, provider: 'offline', model: 'offline-zero-drain', status: 'offline' }
      }));
      if (res.ok) return await res.json();
    } catch (_) {}
    return { success: true };
  }

  function openQuickKeyModal() {
    let modal = document.getElementById('synapse-quick-key-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'synapse-quick-key-modal';
      modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all';
      modal.innerHTML = `
        <div class="relative w-full max-w-lg rounded-2xl bg-[#090b16] border border-indigo-500/30 p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-white/10">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </div>
              <div>
                <h3 class="text-sm font-mono font-bold text-white uppercase tracking-wider">Connect Cloud AI Model</h3>
                <p class="text-xs text-slate-400">Auto-detects Google Gemini, OpenAI, Claude, Groq &amp; OpenRouter</p>
              </div>
            </div>
            <button type="button" onclick="SynapseNav.closeQuickKeyModal()" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
              ✕
            </button>
          </div>

          <div id="quick-key-status-banner" class="p-3 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs font-mono">
            <span class="text-slate-400">Checking connection status...</span>
          </div>

          <!-- Provider Selector & Detection Indicator -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Cloud Provider Mode
              </label>
              <select id="quick-key-provider-select" onchange="SynapseNav.onProviderSelectChange()" class="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 focus:border-indigo-400 text-xs font-mono text-white outline-none cursor-pointer">
                <option value="auto">⚡ Auto-Detect Provider</option>
                <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                <option value="openai">OpenAI (GPT-4o / 4o-mini)</option>
                <option value="anthropic">Anthropic Claude (Sonnet 4.5)</option>
                <option value="groq">Groq Cloud (Llama 3.3 70B)</option>
                <option value="openrouter">OpenRouter Gateway</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Live Key Detection
              </label>
              <div id="quick-key-detection-badge" class="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 h-[38px]">
                <span id="quick-key-detection-dot" class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                <span id="quick-key-detection-text" class="truncate">Paste key to detect</span>
              </div>
            </div>
          </div>

          <!-- API Key Input -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label id="quick-key-label" class="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
                API Key (Any Cloud Provider)
              </label>
              <a id="quick-key-help-link" href="https://aistudio.google.com/apikey" target="_blank" class="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-mono">
                <span id="quick-key-help-text">Get Free Gemini Key &nearr;</span>
              </a>
            </div>
            <div class="relative">
              <input type="password" id="quick-key-input" oninput="SynapseNav.onKeyInputChanged()" placeholder="Paste AIzaSy..., sk-..., sk-ant-..., or gsk_..." class="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 focus:border-indigo-400 text-sm font-mono text-white outline-none" />
              <button type="button" id="toggle-quick-key-visibility" onclick="SynapseNav.toggleQuickKeyVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white cursor-pointer px-1 py-0.5">
                SHOW
              </button>
            </div>
            <p id="quick-key-hint-text" class="text-[11px] text-slate-400 leading-relaxed">
              Accepts Google Gemini (free 15 RPM), OpenAI, Anthropic Claude, Groq, or OpenRouter. Keys persist in backend session memory.
            </p>
          </div>

          <div id="quick-key-error-box" class="hidden p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono text-rose-300"></div>

          <div class="flex items-center justify-between pt-2 border-t border-white/10">
            <button type="button" onclick="SynapseNav.handleQuickKeyDisconnect()" id="quick-key-disconnect-btn" class="px-3 py-2 rounded-xl text-xs font-mono text-rose-300 hover:bg-rose-500/10 border border-rose-500/30 transition-all cursor-pointer hidden">
              Disconnect Key
            </button>
            <div class="flex items-center gap-2 ml-auto">
              <button type="button" onclick="SynapseNav.closeQuickKeyModal()" class="px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white border border-white/10 hover:bg-white/[0.05] transition-all cursor-pointer">
                Cancel
              </button>
              <button type="button" onclick="SynapseNav.handleQuickKeySubmit()" id="quick-key-submit-btn" class="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5">
                <span>Connect &amp; Save Key</span>
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');

    // Populate current status
    checkBackendKeyStatus().then((st) => {
      const banner = document.getElementById('quick-key-status-banner');
      const input = document.getElementById('quick-key-input');
      const disconnectBtn = document.getElementById('quick-key-disconnect-btn');
      const byok = getByokSettings();

      if (st.has_key) {
        banner.className = 'p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs font-mono';
        banner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-emerald-300 font-semibold">ACTIVE: ${escapeHtml(st.label || st.provider.toUpperCase())}</span>
          </div>
          <span class="text-emerald-400/80 font-mono text-[11px]">${escapeHtml(st.masked_key || '')}</span>
        `;
        if (byok.apiKey && input) {
          input.value = byok.apiKey;
          onKeyInputChanged();
        }
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');
      } else {
        banner.className = 'p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs font-mono';
        banner.innerHTML = `
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
            <span class="text-amber-300 font-semibold">OFFLINE FREE MODE (NO KEY REQUIRED)</span>
          </div>
          <span class="text-amber-400/80 text-[11px]">Free built-in engine active</span>
        `;
        if (byok.apiKey && input) {
          input.value = byok.apiKey;
          onKeyInputChanged();
        }
        if (disconnectBtn) disconnectBtn.classList.add('hidden');
      }
    });
  }

  function onKeyInputChanged() {
    const input = document.getElementById('quick-key-input');
    const badgeText = document.getElementById('quick-key-detection-text');
    const badgeDot = document.getElementById('quick-key-detection-dot');
    const helpLink = document.getElementById('quick-key-help-link');
    const helpText = document.getElementById('quick-key-help-text');
    const provSelect = document.getElementById('quick-key-provider-select');
    if (!input || !badgeText || !badgeDot) return;

    const val = input.value.trim();
    if (!val) {
      badgeText.textContent = 'Paste key to detect';
      badgeDot.className = 'w-1.5 h-1.5 rounded-full bg-slate-500';
      return;
    }

    const det = detectProviderFromSyntax(val);
    if (det) {
      badgeText.textContent = `⚡ Detected: ${det.label}`;
      badgeDot.className = 'w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse';

      if (provSelect && provSelect.value === 'auto') {
        // sync help link
        if (helpLink && helpText) {
          if (det.provider === 'gemini') {
            helpLink.href = 'https://aistudio.google.com/apikey';
            helpText.textContent = 'Get Free Gemini Key ↗';
          } else if (det.provider === 'openai') {
            helpLink.href = 'https://platform.openai.com/api-keys';
            helpText.textContent = 'Get OpenAI Key ↗';
          } else if (det.provider === 'anthropic') {
            helpLink.href = 'https://console.anthropic.com/settings/keys';
            helpText.textContent = 'Get Claude Key ↗';
          } else if (det.provider === 'groq') {
            helpLink.href = 'https://console.groq.com/keys';
            helpText.textContent = 'Get Groq Key ↗';
          }
        }
      }
    } else {
      badgeText.textContent = `Custom Key (${val.length} chars)`;
      badgeDot.className = 'w-1.5 h-1.5 rounded-full bg-sky-400';
    }
  }

  function onProviderSelectChange() {
    const provSelect = document.getElementById('quick-key-provider-select');
    const helpLink = document.getElementById('quick-key-help-link');
    const helpText = document.getElementById('quick-key-help-text');
    if (!provSelect || !helpLink || !helpText) return;

    const val = provSelect.value;
    const linkMap = {
      gemini: { url: 'https://aistudio.google.com/apikey', text: 'Get Free Gemini Key ↗' },
      openai: { url: 'https://platform.openai.com/api-keys', text: 'Get OpenAI Key ↗' },
      anthropic: { url: 'https://console.anthropic.com/settings/keys', text: 'Get Claude Key ↗' },
      groq: { url: 'https://console.groq.com/keys', text: 'Get Free Groq Key ↗' },
      openrouter: { url: 'https://openrouter.ai/keys', text: 'Get OpenRouter Key ↗' },
      auto: { url: 'https://aistudio.google.com/apikey', text: 'Get Free Gemini Key ↗' },
    };
    const item = linkMap[val] || linkMap.auto;
    helpLink.href = item.url;
    helpText.textContent = item.text;
  }

  function closeQuickKeyModal() {
    const modal = document.getElementById('synapse-quick-key-modal');
    if (modal) modal.classList.add('hidden');
    const errBox = document.getElementById('quick-key-error-box');
    if (errBox) errBox.classList.add('hidden');
  }

  function toggleQuickKeyVisibility() {
    const input = document.getElementById('quick-key-input');
    const btn = document.getElementById('toggle-quick-key-visibility');
    if (!input || !btn) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = 'HIDE';
    } else {
      input.type = 'password';
      btn.textContent = 'SHOW';
    }
  }

  async function handleQuickKeySubmit() {
    const input = document.getElementById('quick-key-input');
    const provSelect = document.getElementById('quick-key-provider-select');
    const errBox = document.getElementById('quick-key-error-box');
    const submitBtn = document.getElementById('quick-key-submit-btn');
    if (!input) return;
    const key = input.value.trim();
    if (!key) {
      if (errBox) {
        errBox.textContent = 'Please paste a valid cloud API key.';
        errBox.classList.remove('hidden');
      }
      return;
    }

    const selectedProv = provSelect ? provSelect.value : 'auto';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connecting & Verifying Key...';
    if (errBox) errBox.classList.add('hidden');

    try {
      // 1. Live ping test
      const testRes = await fetch('/api/v1/auth/test_key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: key, provider: selectedProv }),
      });
      const testData = await testRes.json();

      if (!testData.success) {
        if (errBox) {
          errBox.textContent = testData.message || 'Key verification failed. Please check your API key.';
          errBox.classList.remove('hidden');
        }
        return;
      }

      // 2. Persist validated key in backend
      const actRes = await syncBackendKey(key, testData.provider, testData.model);
      showToast('AI Model Connected', `Verified ${testData.provider.toUpperCase()} (${testData.model}) for AI answers.`, 'info');
      closeQuickKeyModal();
    } catch (e) {
      if (errBox) {
        errBox.textContent = e.message;
        errBox.classList.remove('hidden');
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>Connect &amp; Save Key</span>';
    }
  }

  async function handleQuickKeyDisconnect() {
    await disconnectBackendKey();
    showToast('AI Model Disconnected', 'Switched to offline free mode.', 'info');
    closeQuickKeyModal();
  }

  // Escape HTML safely
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Full Markdown Parser (Tables, Code Blocks, Headings, Lists, Inline Citations)
  function renderMarkdown(mdText, options = {}) {
    if (!mdText) return '';
    const onCitationClick = options.onCitationClick || 'SynapseNav.handleGlobalCitationClick';
    const lines = String(mdText).split('\n');
    let html = '';
    let inCodeBlock = false;
    let codeLang = '';
    let codeBuffer = [];
    let inTable = false;
    let tableRows = [];
    let inList = false;

    function flushList() {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    }

    function flushTable() {
      if (!inTable || tableRows.length === 0) return;
      inTable = false;
      const headerCells = tableRows[0]
        .split('|')
        .map((c) => c.trim())
        .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const bodyRows = tableRows.slice(2); // skip separator row
      html +=
        '<div class="my-4 overflow-x-auto rounded-lg border border-white/10 bg-[#070a12]/90 shadow-inner"><table class="w-full text-left border-collapse text-xs">';
      html += '<thead><tr class="border-b border-white/10 bg-white/[0.03] text-slate-300 font-mono uppercase tracking-wider text-[10px]">';
      headerCells.forEach((h) => {
        html += `<th class="py-2.5 px-3 font-semibold">${formatInline(h)}</th>`;
      });
      html += '</tr></thead><tbody class="divide-y divide-white/[0.06] text-slate-300">';
      bodyRows.forEach((r) => {
        const cells = r
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        if (cells.length > 0) {
          html += '<tr class="hover:bg-white/[0.02] transition-colors">';
          cells.forEach((c) => {
            html += `<td class="py-2 px-3 align-top leading-relaxed">${formatInline(c)}</td>`;
          });
          html += '</tr>';
        }
      });
      html += '</tbody></table></div>';
      tableRows = [];
    }

    function formatInline(text) {
      let s = escapeHtml(text);
      // Inline code
      s = s.replace(
        /`([^`]+)`/g,
        '<code class="px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-[11px]">$1</code>'
      );
      // Bold
      s = s.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
      // Italic
      s = s.replace(/\*([^*]+)\*/g, '<em class="text-slate-200 italic">$1</em>');
      // Citations [1], [2], etc.
      s = s.replace(
        /\[(\d+)\]/g,
        `<button type="button" onclick="${onCitationClick}($1)" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 font-mono text-[10px] font-semibold transition-all hover:scale-105 cursor-pointer shadow-sm" title="Inspect Verified Grounded Citation [$1]">[$1]</button>`
      );
      return s;
    }

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      if (trimmed.startsWith('```')) {
        flushList();
        flushTable();
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeLang = trimmed.slice(3).trim() || 'code';
          codeBuffer = [];
        } else {
          inCodeBlock = false;
          html += `<div class="my-3.5 rounded-lg border border-white/10 bg-[#05070d] overflow-hidden"><div class="flex items-center justify-between px-3 py-1.5 bg-white/[0.03] border-b border-white/10 text-[10px] font-mono uppercase tracking-widest text-slate-400"><span>${escapeHtml(
            codeLang
          )}</span><span class="text-emerald-400/80">VERIFIED SNIPPET</span></div><pre class="p-3.5 text-xs font-mono text-sky-200/90 overflow-x-auto leading-relaxed"><code>${escapeHtml(
            codeBuffer.join('\n')
          )}</code></pre></div>`;
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(rawLine);
        continue;
      }

      // Table detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushList();
        inTable = true;
        tableRows.push(trimmed);
        continue;
      } else if (inTable) {
        flushTable();
      }

      if (!trimmed) {
        flushList();
        continue;
      }

      if (trimmed.startsWith('# ')) {
        flushList();
        html += `<h1 class="text-lg font-semibold text-white tracking-tight mt-5 mb-2.5 pb-1.5 border-b border-white/10">${formatInline(
          trimmed.slice(2)
        )}</h1>`;
      } else if (trimmed.startsWith('## ')) {
        flushList();
        const headingText = trimmed.slice(3);
        const slug = headingText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        html += `<h2 id="sec-${slug}" data-section="${escapeHtml(
          headingText
        )}" class="text-sm font-semibold text-sky-300 uppercase tracking-wider font-mono mt-5 mb-2 flex items-center gap-2"><span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>${formatInline(
          headingText
        )}</h2>`;
      } else if (trimmed.startsWith('### ')) {
        flushList();
        html += `<h3 class="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono mt-3.5 mb-1.5">${formatInline(
          trimmed.slice(4)
        )}</h3>`;
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          html += '<ul class="my-2 space-y-1.5 pl-4 list-disc text-slate-300 text-xs leading-relaxed">';
          inList = true;
        }
        html += `<li>${formatInline(trimmed.slice(2))}</li>`;
      } else if (/^\d+\.\s+/.test(trimmed)) {
        if (!inList) {
          html += '<ul class="my-2 space-y-1.5 pl-4 list-decimal text-slate-300 text-xs leading-relaxed">';
          inList = true;
        }
        html += `<li>${formatInline(trimmed.replace(/^\d+\.\s+/, ''))}</li>`;
      } else {
        flushList();
        html += `<p class="my-2 text-slate-300 text-xs leading-relaxed">${formatInline(trimmed)}</p>`;
      }
    }

    flushList();
    flushTable();
    return html;
  }

  // Toast Notification
  function showToast(title, message, type = 'info') {
    let container = document.getElementById('synapse-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'synapse-toast-container';
      container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none';
      document.body.appendChild(container);
    }
    const accentMap = {
      success: 'border-emerald-500/40 bg-[#071310]/95 text-emerald-300',
      error: 'border-rose-500/40 bg-[#16080b]/95 text-rose-300',
      info: 'border-sky-500/40 bg-[#08101d]/95 text-sky-300',
    };
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 transform translate-y-2 opacity-0 ${
      accentMap[type] || accentMap.info
    }`;
    toast.innerHTML = `
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-[10px] font-mono uppercase tracking-widest font-semibold">${escapeHtml(title)}</div>
          <div class="text-xs text-slate-300 mt-0.5 leading-snug">${escapeHtml(message)}</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-slate-400 hover:text-white text-xs font-mono">X</button>
      </div>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    });
    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }

  // Global Citation Click Handler (navigates or opens citation in reader)
  function handleGlobalCitationClick(citationIndex) {
    const last = getLastSearch();
    if (last && last.citations) {
      const cit =
        last.citations.find((c) => (c.citation_id || c.citation_index) === Number(citationIndex)) ||
        last.citations[Number(citationIndex) - 1];
      if (cit) {
        const matchedChunk = (last.retrieved_chunks || []).find((rc) => rc.chunk_id === cit.chunk_id);
        const docId = cit.document_id || matchedChunk?.document_id || cit.chunk_id.replace(/_c\d+$/, '');
        const enrichedCit = Object.assign({}, cit, {
          document_id: docId,
          citation_index: cit.citation_id || cit.citation_index || Number(citationIndex),
        });
        setState(STORAGE_KEYS.ACTIVE_DOC, docId, true);
        setState(STORAGE_KEYS.ACTIVE_CITATION, enrichedCit, true);
        if (typeof window.onPageCitationClick === 'function') {
          window.onPageCitationClick(enrichedCit);
          return;
        }
        window.location.href = `/documents?doc=${encodeURIComponent(docId)}&chunk=${encodeURIComponent(cit.chunk_id)}&cite=${enrichedCit.citation_index}`;
        return;
      }
    }
    showToast('Citation Inspector', `Jumping to citation [${citationIndex}] in Corpus Reader...`, 'info');
  }

  const SHADER_PALETTES = {
    void: { c1: '#070709', c2: '#13132b', c3: '#6366f1', label: 'Indigo' },
    aurora: { c1: '#07080b', c2: '#0c232e', c3: '#06b6d4', label: 'Cyan' },
    crimson: { c1: '#09070a', c2: '#29111e', c3: '#f43f5e', label: 'Coral' },
  };

  let vanguardState = null;

  function getShaderTheme() {
    const saved = getState(STORAGE_KEYS.SHADER_THEME, 'crimson');
    return SHADER_PALETTES[saved] ? saved : 'crimson';
  }

  function updateShaderButtonsUI(activeTheme) {
    document.querySelectorAll('.shader-theme-btn').forEach((btn) => {
      const isMatch = btn.dataset.theme === activeTheme;
      if (btn.classList.contains('dock-shader-pill')) {
        const themeColor = activeTheme === 'aurora' ? 'cyan' : activeTheme === 'crimson' ? 'rose' : 'indigo';
        btn.className = isMatch
          ? `shader-theme-btn dock-shader-pill px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider font-semibold bg-${themeColor}-500/30 text-${themeColor}-200 border border-${themeColor}-400/50 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition-all cursor-pointer`
          : 'shader-theme-btn dock-shader-pill px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-white transition-all cursor-pointer';
      } else {
        btn.className = isMatch
          ? 'shader-theme-btn px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-white text-[#070709] shadow-md transition-all cursor-pointer'
          : 'shader-theme-btn px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide border border-white/10 bg-white/[0.04] text-zinc-400 hover:text-white transition-all cursor-pointer';
      }
    });
  }

  function setShaderTheme(themeKey) {
    const key = SHADER_PALETTES[themeKey] ? themeKey : 'void';
    setState(STORAGE_KEYS.SHADER_THEME, key, true);
    updateShaderButtonsUI(key);

    if (!vanguardState || typeof window.THREE === 'undefined') return;
    const pal = SHADER_PALETTES[key];
    const c1 = new window.THREE.Color(pal.c1);
    const c2 = new window.THREE.Color(pal.c2);
    const c3 = new window.THREE.Color(pal.c3);

    if (typeof window.gsap !== 'undefined') {
      window.gsap.to(vanguardState.uniforms.uColor1.value, { r: c1.r, g: c1.g, b: c1.b, duration: 1.0 });
      window.gsap.to(vanguardState.uniforms.uColor2.value, { r: c2.r, g: c2.g, b: c2.b, duration: 1.0 });
      window.gsap.to(vanguardState.uniforms.uColor3.value, { r: c3.r, g: c3.g, b: c3.b, duration: 1.0 });
      window.gsap.to(vanguardState.sphereMat.uniforms.uColor.value, { r: c3.r, g: c3.g, b: c3.b, duration: 1.0 });
    } else {
      vanguardState.uniforms.uColor1.value.copy(c1);
      vanguardState.uniforms.uColor2.value.copy(c2);
      vanguardState.uniforms.uColor3.value.copy(c3);
      vanguardState.sphereMat.uniforms.uColor.value.copy(c3);
    }
  }

  function ensureThreeJsLoaded(cb) {
    if (typeof window.THREE !== 'undefined') {
      cb();
      return;
    }
    const existing = document.getElementById('synapse-threejs-cdn');
    if (existing) {
      existing.addEventListener('load', cb);
      return;
    }
    const s = document.createElement('script');
    s.id = 'synapse-threejs-cdn';
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload = cb;
    document.head.appendChild(s);
  }

  // Universal ThreeUI Vanguard-Dimensional GLSL Simplex Noise + 4 Floating Fresnel Spheres
  function initUniversalVanguardBackground() {
    // Hide any legacy per-page full-screen background canvases so the Overview 3D shader shines everywhere
    ['bg-waves', 'void-dotmatrix', 'glcanvas-matrix', 'flow-canvas'].forEach((id) => {
      const legacyCanvas = document.getElementById(id);
      if (legacyCanvas) {
        legacyCanvas.style.display = 'none';
      }
    });

    let canvas = document.getElementById('webgl-vanguard');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'webgl-vanguard';
      canvas.className = 'fixed inset-0 w-full h-full pointer-events-none z-0';
      document.body.prepend(canvas);
    }

    if (!document.getElementById('vanguard-structural-grid')) {
      const grid = document.createElement('div');
      grid.id = 'vanguard-structural-grid';
      grid.className =
        'fixed inset-0 pointer-events-none z-[1] grid grid-cols-4 lg:grid-cols-6 max-w-[1600px] mx-auto px-4 lg:px-6 opacity-20';
      grid.innerHTML = `
        <div class="border-l border-white/[0.05] h-full"></div>
        <div class="border-l border-white/[0.05] h-full"></div>
        <div class="border-l border-white/[0.05] h-full"></div>
        <div class="border-l border-white/[0.05] h-full"></div>
        <div class="border-l border-white/[0.05] h-full hidden lg:block"></div>
        <div class="border-l border-r border-white/[0.05] h-full hidden lg:block"></div>
      `;
      canvas.insertAdjacentElement('afterend', grid);
    }

    // Bind any page-level shader buttons (e.g., on overview.html)
    document.querySelectorAll('.shader-theme-btn').forEach((btn) => {
      if (!btn.dataset.boundVanguard) {
        btn.dataset.boundVanguard = '1';
        btn.addEventListener('click', () => {
          setShaderTheme(btn.dataset.theme || 'void');
        });
      }
    });

    const activeTheme = getShaderTheme();
    updateShaderButtonsUI(activeTheme);

    if (canvas.dataset.vanguardInitialized === '1') {
      return;
    }
    canvas.dataset.vanguardInitialized = '1';

    ensureThreeJsLoaded(() => {
      const THREE = window.THREE;
      if (!THREE) return;

      const pal = SHADER_PALETTES[getShaderTheme()] || SHADER_PALETTES.void;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
      camera.position.z = 5;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uColor1: { value: new THREE.Color(pal.c1) },
        uColor2: { value: new THREE.Color(pal.c2) },
        uColor3: { value: new THREE.Color(pal.c3) },
      };

      const bgMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec2 uMouse;
          uniform vec2 uResolution;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          varying vec2 vUv;

          vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
          float snoise(vec2 v){
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy));
            vec2 x0 = v - i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m; m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }

          void main() {
            vec2 st = gl_FragCoord.xy / uResolution.xy;
            st.x *= uResolution.x / uResolution.y;
            vec2 mouse = uMouse;
            mouse.x *= uResolution.x / uResolution.y;
            float dist = distance(st, mouse);
            float mouseInteraction = smoothstep(0.65, 0.0, dist);
            vec2 pos = vec2(st * 1.6);
            float n1 = snoise(pos + uTime * 0.08 + mouseInteraction * 0.18);
            float n2 = snoise(pos * 2.0 - uTime * 0.12 - mouseInteraction * 0.25);
            float finalNoise = mix(n1, n2, 0.5);
            vec3 color = mix(uColor1, uColor2, smoothstep(-0.6, 0.6, finalNoise));
            color = mix(color, uColor3, smoothstep(0.25, 0.95, finalNoise) * 0.35 + mouseInteraction * 0.18);
            gl_FragColor = vec4(color, 1.0);
          }
        `,
        depthWrite: false,
      });

      const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
      scene.add(bgMesh);

      const spheresGroup = new THREE.Group();
      scene.add(spheresGroup);
      const sphereMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(pal.c3) },
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vViewPosition;
          void main() {
            float fresnel = dot(normalize(vViewPosition), vNormal);
            fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
            fresnel = pow(fresnel, 2.6);
            gl_FragColor = vec4(uColor * fresnel * 1.5, fresnel * 0.6);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
      const spherePositions = [
        { x: 2.4, y: 1.1, z: -1.2, s: 1.15, speed: 0.4, offset: 0 },
        { x: -2.6, y: -1.2, z: -2.2, s: 1.55, speed: 0.25, offset: 2 },
        { x: 1.2, y: -1.8, z: -0.8, s: 0.75, speed: 0.55, offset: 4 },
        { x: -1.6, y: 1.6, z: -1.6, s: 0.95, speed: 0.35, offset: 1 },
      ];
      const spheres = spherePositions.map((p) => {
        const mesh = new THREE.Mesh(sphereGeo, sphereMat);
        mesh.scale.set(p.s, p.s, p.s);
        mesh.position.set(p.x, p.y, p.z);
        mesh.userData = p;
        spheresGroup.add(mesh);
        return mesh;
      });

      vanguardState = { uniforms, sphereMat };

      let targetMouseX = 0.5;
      let targetMouseY = 0.5;

      window.addEventListener('mousemove', (e) => {
        targetMouseX = e.clientX / window.innerWidth;
        targetMouseY = 1.0 - e.clientY / window.innerHeight;
        const coordsEl = document.getElementById('coords-readout');
        if (coordsEl) {
          coordsEl.textContent = `Vector (${targetMouseX.toFixed(3)}, ${targetMouseY.toFixed(3)})`;
        }
      });

      const clock = new THREE.Clock();
      function animate() {
        requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        uniforms.uTime.value = t;
        uniforms.uMouse.value.x += (targetMouseX - uniforms.uMouse.value.x) * 0.06;
        uniforms.uMouse.value.y += (targetMouseY - uniforms.uMouse.value.y) * 0.06;

        spheres.forEach((m) => {
          const d = m.userData;
          m.position.y = d.y + Math.sin(t * d.speed + d.offset) * 0.35;
          m.position.x = d.x + Math.cos(t * d.speed * 0.8 + d.offset) * 0.22;
        });
        spheresGroup.rotation.y = (uniforms.uMouse.value.x - 0.5) * 0.25;
        spheresGroup.rotation.x = -(uniforms.uMouse.value.y - 0.5) * 0.25;

        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
      });
    });
  }

  // Render the Shared 3-Hub Tactical Cybernetic Command Deck
  function mountDock(activePageId) {
    const mount = document.getElementById('synapse-top-dock');
    if (!mount) return;
    const currentShader = getShaderTheme();

    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.href = '/static/logo.png';
      document.head.appendChild(link);
    }

    mount.innerHTML = `
      <div class="sticky top-3 z-50 px-3 sm:px-6 pt-2 pb-1 pointer-events-none">
        <header class="pointer-events-auto max-w-[1640px] mx-auto flex items-center justify-between gap-3">
          
          <!-- POD 1: System Core Node (Brand & Search Jump) -->
          <a href="/search" class="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#090b16]/92 backdrop-blur-2xl border border-indigo-500/30 shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-indigo-400/60 transition-all shrink-0 group">
            <div class="relative w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-400/40 p-1 flex items-center justify-center shadow-[0_0_16px_rgba(99,102,241,0.4)] group-hover:scale-105 group-hover:border-indigo-300 transition-all">
              <img src="/static/logo.png" alt="Synapse Logo" class="w-full h-full object-contain rounded" />
              <div class="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-ping"></div>
            </div>
            <div class="flex flex-col leading-none">
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-black tracking-wider text-white font-mono uppercase">Synapse</span>
                <span class="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/35">v1.0</span>
              </div>
              <span class="font-mono text-[9px] uppercase tracking-widest text-zinc-500 mt-1 hidden sm:block">Ask your documents</span>
            </div>
          </a>

          <!-- POD 2: 3-Hub Switchboard -->
          <nav class="flex items-center gap-1 p-1 rounded-xl bg-[#080914]/92 backdrop-blur-2xl border border-white/[0.09] shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.06)] overflow-visible" aria-label="Engine Navigation">
            ${PAGES.map((p) => {
              const isActive = p.id === activePageId;
              return `
                <a href="${p.href}"
                   class="group relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all shrink-0 ${
                     isActive
                       ? 'bg-gradient-to-r from-indigo-950/80 via-indigo-600/35 to-indigo-950/80 border border-indigo-400/60 text-white font-bold shadow-[0_0_16px_rgba(99,102,241,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                       : 'text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent font-medium'
                   }"
                   title="${p.label} — ${p.sub}">
                  ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-pulse"></span>' : ''}
                  <span class="${isActive ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'}">${p.svg}</span>
                  <span class="text-[11px] font-semibold">${p.label}</span>
                </a>
              `;
            }).join('')}

            <!-- Secondary Pages Dropdown -->
            <div class="relative group pl-1 border-l border-white/10">
              <button type="button" class="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
                <span>Under the hood</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3 h-3 group-hover:rotate-180 transition-transform"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div class="absolute left-0 top-full mt-1.5 w-52 rounded-xl bg-[#090b16] border border-white/15 p-1.5 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[90]">
                ${SECONDARY_PAGES.map((sp) => `
                  <a href="${sp.href}" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors ${sp.id === activePageId ? 'bg-indigo-500/20 text-indigo-300 font-bold' : ''}">
                    <span class="text-zinc-400">${sp.svg}</span>
                    <div class="flex flex-col">
                      <span class="leading-none">${sp.label}</span>
                      <span class="text-[9px] text-zinc-500 mt-0.5">${sp.sub}</span>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>
          </nav>

          <!-- POD 3: Hardware Vector Telemetry & Live Engine Switcher -->
          <div class="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#080914]/92 backdrop-blur-2xl border border-white/[0.09] shadow-[0_12px_32px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0">
            <!-- Indexed Corpus Counter -->
            <a href="/ingest" class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-mono text-emerald-300 transition-colors" title="Indexed Documents">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span id="nav-corpus-badge">… DOCS</span>
            </a>

            <!-- Live Engine Status & Connect Button -->
            <button type="button" onclick="SynapseNav.openQuickKeyModal()" id="nav-key-status-btn" class="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-mono text-amber-300 transition-all cursor-pointer shadow-sm group" title="Click to Connect AI Key">
              <span id="nav-key-dot" class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span id="nav-key-label" class="font-bold">NO AI KEY — ADD ONE</span>
            </button>
          </div>

        </header>
      </div>
    `;

    initUniversalVanguardBackground();
    refreshTelemetryBadges();
  }

  async function refreshTelemetryBadges() {
    try {
      const [docsRes, cacheRes, keyRes] = await Promise.all([
        fetch('/api/v1/documents').catch(() => null),
        fetch('/api/v1/cache/stats').catch(() => null),
        checkBackendKeyStatus().catch(() => null),
      ]);
      if (docsRes && docsRes.ok) {
        const docsData = await docsRes.json();
        const docs = Array.isArray(docsData) ? docsData : (docsData.documents || []);
        const totalChunks = docs.reduce((acc, d) => acc + (d.total_chunks || d.chunk_count || 0), 0);
        const el = document.getElementById('nav-corpus-badge');
        if (el) el.textContent = `${docs.length} DOCS · ${totalChunks} SECTIONS`;
      }
      if (cacheRes && cacheRes.ok) {
        const cacheData = await cacheRes.json();
        const ratio = cacheData.hit_ratio !== undefined ? cacheData.hit_ratio : (cacheData.hit_rate || 0);
        const hitRate = (ratio * 100).toFixed(0);
        const totalHits = cacheData.cache_hits !== undefined ? cacheData.cache_hits : ((cacheData.exact_hits || 0) + (cacheData.semantic_hits || 0));
        const el = document.getElementById('nav-cache-badge');
        if (el) el.textContent = `CACHE ${hitRate}% (${totalHits} HITS)`;
      }
      if (keyRes) {
        if (!keyRes.has_key) {
          const byok = getByokSettings();
          if (byok && byok.apiKey && byok.apiKey.trim()) {
            syncBackendKey(byok.apiKey, byok.provider || 'auto', byok.model).then((updated) => {
              if (updated) updateKeyUI(updated);
            });
            return;
          }
        }
        updateKeyUI(keyRes);
      }
    } catch (_) {}
  }

  function updateKeyUI(st) {
    const btn = document.getElementById('nav-key-status-btn');
    const dot = document.getElementById('nav-key-dot');
    const lbl = document.getElementById('nav-key-label');
    if (!btn || !dot || !lbl) return;

    if (st && st.has_key) {
      btn.className = 'flex items-center gap-1.5 px-3 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-[10px] font-mono text-emerald-300 transition-all cursor-pointer shadow-[0_0_12px_rgba(52,211,153,0.2)] group';
      dot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]';
      const prov = (st.provider || 'AI').toUpperCase();
      const mod = st.model ? ` (${st.model.replace(/^models\//, '').toUpperCase()})` : ' (LIVE AI)';
      lbl.textContent = `⚡ ${prov}${mod}`;
      btn.title = `Connected to ${st.provider || 'cloud'} (${st.model || 'live'}) - Click to manage`;
    } else {
      btn.className = 'flex items-center gap-1.5 px-3 py-1 rounded-lg border border-amber-500/35 bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-mono text-amber-300 transition-all cursor-pointer shadow-sm group';
      dot.className = 'w-2 h-2 rounded-full bg-amber-400 animate-pulse';
      lbl.textContent = 'NO AI KEY — ADD ONE';
      btn.title = 'Offline free mode - Click to connect cloud API key';
    }
  }

  return {
    STORAGE_KEYS,
    PAGES,
    SECONDARY_PAGES,
    DOMAINS,
    SAMPLE_TEMPLATES,
    getState,
    setState,
    getCustomDocuments,
    addCustomDocument,
    deleteCustomDocument,
    resetAllCustomDocuments,
    getAllDomains,
    getLastSearch,
    setLastSearch,
    getActiveDomainId,
    setActiveDomainId,
    getDomainById,
    getByokSettings,
    setByokSettings,
    checkBackendKeyStatus,
    syncBackendKey,
    disconnectBackendKey,
    detectProviderFromSyntax,
    onKeyInputChanged,
    onProviderSelectChange,
    openQuickKeyModal,
    closeQuickKeyModal,
    toggleQuickKeyVisibility,
    handleQuickKeySubmit,
    handleQuickKeyDisconnect,
    updateKeyUI,
    getShaderTheme,
    setShaderTheme,
    initUniversalVanguardBackground,
    escapeHtml,
    renderMarkdown,
    showToast,
    handleGlobalCitationClick,
    mountDock,
    refreshTelemetryBadges,
  };
})();
