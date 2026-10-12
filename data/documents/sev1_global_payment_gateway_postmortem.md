# Production SRE SEV-1 Post-Mortem: Global Payment Gateway Outage (INC-2024-1004)
<!-- page: 1 -->

## 1. Incident Executive Summary & Impact Telemetry
On **October 4, 2024, from 14:12 UTC to 14:59 UTC (47 minutes total duration)**, the Core Payment Authorization & Settlement Engine experienced a cascading multi-region SEV-1 outage across `us-east-1` and `eu-central-1`. During the incident window, **68.4% of checkout RPC transactions failed** with `HTTP 503 Service Unavailable` or `ERR_POOL_EXHAUSTED_504`.

| Telemetry Metric | Baseline Normal | Peak Incident Readout (14:28 UTC) | Recovery Post-Mitigation (15:02 UTC) |
| :--- | :--- | :--- | :--- |
| P99 Checkout API Latency | `18.4 ms` | **`14,200 ms` (Timeout)** | `21.1 ms` |
| PgBouncer Active Connections | `640 / 4,096` | **`4,096 / 4,096` (100% Saturated)** | `710 / 8,192` |
| Redis Sentinel Lock Contention | `0.02%` | **`94.8%` (Split-Brain Quorum Loss)** | `0.01%` |
| Failed Payment Transactions | `< 0.01%` | **`68.4%` (142,800 dropped txns)** | `0.00%` |

---

<!-- page: 2 -->
## 2. Root Cause Analysis: Connection Pool Exhaustion & Redis Split-Brain
The outage was triggered by a latent interaction between deployment **`release-v4.18.2`** and a transient network micro-burst in `us-east-1a`:

1. **Primary Trigger (Unbounded Retry Storm):** Release `v4.18.2` introduced an idempotency ledger check that wrapped a synchronous Redis distributed lock (`SETNX`) inside an open PostgreSQL `SERIALIZABLE` database transaction.
2. **Redis Sentinel Quorum Split-Brain:** At `14:11:48 UTC`, a top-of-rack switch firmware flap isolated the primary Redis node for 4.2 seconds. Because `min-replicas-to-write` was misconfigured to `0`, two Redis primaries simultaneously accepted lock writes, causing lock acquisition timeouts (`3,000ms` each).
3. **PgBouncer Connection Starvation:** While worker threads blocked waiting on Redis lock timeouts inside open SQL transactions, PgBouncer hit its hard ceiling of **`max_client_conn = 4096`** within 19 seconds. Health checks began failing, causing Envoy ingress gateways to eject healthy pods in a cascading domino effect.

---

<!-- page: 3 -->
## 3. Emergency Mitigation Commands & P0 Action Items

### Live Mitigation Sequence Executed by On-Call SRE
At `14:48 UTC`, Staff SRE engineers bypassed the wedged CI/CD pipeline and executed the following emergency remediation commands to restore quorum and drain stuck PostgreSQL backend sessions:

```bash
# 1. Roll back payment-gateway deployment to known-good v4.18.1
kubectl rollout undo deployment/payment-gateway-core -n prod-payments

# 2. Force-terminate idle-in-transaction PostgreSQL sessions older than 5 seconds
psql -h pg-primary.internal -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND state_change < now() - interval '5 seconds';"

# 3. Enforce strict Redis Sentinel quorum and double PgBouncer pool capacity
redis-cli -p 26379 SENTINEL set payment-lock-cluster min-replicas-to-write 2
helm upgrade pgbouncer-pool ./charts/pgbouncer --set maxClientConn=8192 --set queryWaitTimeout=3
```

### Mandatory P0 Remediation Action Items
- **P0-1 (Owner: `@sre-storage-team`, Due: Oct 8):** Decouple all external Redis/RPC network calls from active PostgreSQL transaction scopes (`statement_timeout = 2000ms` enforced at role level).
- **P0-2 (Owner: `@platform-networking`, Due: Oct 10):** Configure Redis `min-replicas-to-write = 2` and `min-replicas-max-lag = 5` across all 12 production clusters to prevent split-brain writes.
- **P0-3 (Owner: `@payments-core`, Due: Oct 12):** Implement adaptive circuit breaking with jittered exponential backoff in Envoy sidecars when PgBouncer pool utilization exceeds **80%**.
