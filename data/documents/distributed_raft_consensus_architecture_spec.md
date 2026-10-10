# Distributed Raft Consensus Engine: Architecture & Replication Specification
<!-- page: 1 -->

## 1. System Overview & Consensus Guarantees
The Distributed Raft Consensus Engine is designed to maintain a consistent, replicated state machine across an odd-numbered quorum of cluster nodes (typically 3, 5, or 7 members). It ensures linearizable read and write semantics under arbitrary network partitions, asynchronous message delays, and single-node fail-stop faults, satisfying the FLP impossibility constraints through randomized timer backoff.

### Core Safety Invariants:
1. **Election Safety:** At most one leader can be elected in a given term $\tau$.
2. **Leader Append-Only:** A leader never overwrites or truncates its own log entries; it only appends new entries.
3. **Log Matching Property:** If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.
4. **Leader Completeness:** If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.
5. **State Machine Safety:** If a server has applied a log entry at a given index to its state machine, no other server will ever apply a different log entry for the same index.

---

<!-- page: 2 -->
## 2. Leader Election & Heartbeat Timing

To avoid split votes in split-brain scenarios, nodes maintain independent randomized election timers:
- **Heartbeat Interval:** The elected leader broadcasts empty `AppendEntries` RPCs every **50 milliseconds** to all active followers.
- **Election Timeout Range:** Follower nodes reset their election timer to a randomized duration between **150 milliseconds and 300 milliseconds**.
- **Term Transition:** If a follower receives no heartbeat before the timer elapses, it transitions to the **Candidate** state, increments `currentTerm`, votes for itself, and dispatches parallel `RequestVote` RPCs.

A candidate wins an election upon receiving affirmative votes from a strict majority ($\lfloor N/2 \rfloor + 1$) of nodes in the cluster configuration.

---

<!-- page: 3 -->
## 3. Log Replication & Commit Protocol

When a client submits a state machine command to the leader:
1. The leader assigns the next monotonic log index and appends the entry to its local Write-Ahead Log (WAL).
2. The leader issues `AppendEntries(term, leaderId, prevLogIndex, prevLogTerm, entries[], leaderCommit)` to each follower.
3. Once an entry is securely acknowledged by a majority of peers, the leader advances its `commitIndex` and applies the entry to its local state machine.
4. The leader informs followers of the newly committed index on the subsequent heartbeat RPC, prompting followers to apply pending log entries in monotonic sequence.

### Linearizable Read Leases
To execute high-throughput reads without incurring disk round-trips or full Raft quorum rounds on every query, the leader utilizes a **Leader Lease Protocol**. The leader verifies its lease validity by maintaining sub-50ms heartbeat acknowledgments with a majority of nodes. If heartbeat consensus is maintained within the lease window (200ms), reads are served directly from local memory state with zero network latency.

---

<!-- page: 4 -->
## 4. Log Compaction & Snapshotting Triggers
To prevent unbounded log expansion on persistent storage:
- **Snapshot Trigger:** Nodes trigger an asynchronous memory snapshot once uncompacted log entries exceed **50,000 entries** or disk consumption surpasses **2.5 GB**.
- **Compaction Mechanism:** The state machine serializes its current state to an immutable snapshot file, discarding all preceding log entries up to `lastIncludedIndex` and `lastIncludedTerm`.
- **Catching Up Lagging Followers:** If a follower falls behind the leader's compaction boundary, the leader transmits the snapshot via chunked `InstallSnapshot` RPCs instead of sequential `AppendEntries`.
