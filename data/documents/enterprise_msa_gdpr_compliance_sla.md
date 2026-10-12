# Enterprise Master Services Agreement (MSA) & GDPR Data Processing Addendum
<!-- page: 1 -->

## 1. Scope of Services & Uptime Service Level Agreement (SLA)
This Master Services Agreement ("Agreement") governs the provision of multi-region enterprise cloud infrastructure and managed AI intelligence services between **Synapse Cloud Systems, Inc.** ("Provider") and **Enterprise Customer** ("Subscriber").

Provider guarantees a monthly **System Availability SLA of 99.99%** across all production availability zones (excluding scheduled maintenance windows with at least 72 hours prior written notice). If monthly uptime falls below the guaranteed threshold, Subscriber is entitled to Service Credits applied against the next billing cycle according to the following schedule:

| Monthly Uptime Percentage | Allowed Monthly Downtime | Service Credit (% of Monthly Fee) | SLA Tier Classification |
| :--- | :--- | :--- | :--- |
| 99.95% to < 99.99% | 4.38m to 21.9m | 10% Service Credit | Tier 1 Minor Degradation |
| 99.00% to < 99.95% | 21.9m to 7h 18m | 25% Service Credit | Tier 2 Partial Outage |
| 95.00% to < 99.00% | 7h 18m to 36h 30m | 50% Service Credit | Tier 3 Major SLA Breach |
| Below 95.00% | > 36 hours 30 mins | 100% Service Credit + Termination Right | Tier 4 Critical Default |

---

<!-- page: 2 -->
## 2. Limitation of Liability & Indemnification Super-Caps
- **Standard Liability Cap:** Except for Excluded Claims and Data Protection Super-Cap Claims, each party's aggregate cumulative liability arising out of or related to this Agreement shall not exceed the total fees paid or payable by Subscriber during the **twenty-four (24) months** immediately preceding the incident giving rise to liability.
- **Data Protection & Confidentiality Super-Cap:** For claims arising from a breach of Section 3 (GDPR Data Processing Addendum), unauthorized disclosure of Customer Personal Data, or breach of security obligations, Provider's maximum aggregate liability is capped at **$15,000,000 USD ($15.0M)** or **three times (3x) the annual contract value (ACV)**, whichever is greater.
- **Uncapped Indemnification Obligations:** Liability limitations shall not apply to (a) third-party intellectual property infringement indemnification under Section 9.1, (b) gross negligence or willful misconduct, or (c) breach of sovereign data residency restrictions.

---

<!-- page: 3 -->
## 3. GDPR Data Processing Addendum (DPA) & Breach Notification
Under Article 28 and Article 33 of Regulation (EU) 2016/679 (General Data Protection Regulation) and SOC2 Type II compliance mandates:

- **Maximum Breach Notification Window:** In the event of a confirmed Personal Data Breach or unauthorized production credential access, Provider shall notify Subscriber's Chief Information Security Officer (CISO) without undue delay and in no event later than **14 hours** after confirmation of the security incident (exceeding the statutory 72-hour GDPR baseline).
- **Cryptographic Controls:** All Customer Data must be encrypted at rest using **AES-256-GCM** with customer-managed hardware security module (HSM) keys (AWS KMS / HashiCorp Vault) and in transit via **TLS 1.3** with Perfect Forward Secrecy (PFS).
- **Data Residency & Sub-processors:** Customer data originating in the European Economic Area (EEA) shall remain strictly pinned to `eu-central-1` (Frankfurt) and `eu-west-1` (Dublin) clusters. Zero Customer Data may be used to train foundation models.
- **Governing Law & Arbitration Forum:** This Agreement is governed by the laws of the **State of Delaware**, without regard to conflict-of-law principles. Any dispute not resolved within 30 days of executive escalation shall be settled by binding arbitration administered by **JAMS** in Wilmington, Delaware.
