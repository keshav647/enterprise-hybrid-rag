"""Gold-standard evaluation fixtures for enterprise RAG benchmarks."""

from typing import List, Dict, Any

BENCHMARK_CASES: List[Dict[str, Any]] = [
    {
        "id": "bench_01_cve_offset",
        "query": "What is the memory offset and vulnerable function in CVE-2024-8192?",
        "expected_doc_id": "cve_2024_8192_kernel_security_advisory",
        "ground_truth_facts": ["0x7fff90a4", "packet_set_ring", "af_packet.c"],
        "category": "exact_code_and_offset",
    },
    {
        "id": "bench_02_cve_patch_commit",
        "query": "Which upstream Git commit fixed CVE-2024-8192?",
        "expected_doc_id": "cve_2024_8192_kernel_security_advisory",
        "ground_truth_facts": ["a7f8e910c2d3", "commit"],
        "category": "exact_hash_retrieval",
    },
    {
        "id": "bench_03_cve_mitigation",
        "query": "What sysctl workaround hardens against CVE-2024-8192 without rebooting?",
        "expected_doc_id": "cve_2024_8192_kernel_security_advisory",
        "ground_truth_facts": ["bpf_jit_harden=2", "sysctl", "unprivileged_userns_clone"],
        "category": "command_line_exact_match",
    },
    {
        "id": "bench_04_q3_revenue",
        "query": "What was the total consolidated revenue and operating margin in Q3?",
        "expected_doc_id": "q3_enterprise_cloud_infrastructure_financials",
        "ground_truth_facts": ["14.82", "32.4%", "operating margin"],
        "category": "financial_metric_lookup",
    },
    {
        "id": "bench_05_q3_ai_cloud_growth",
        "query": "How much did AI Cloud revenue grow year-over-year in Q3?",
        "expected_doc_id": "q3_enterprise_cloud_infrastructure_financials",
        "ground_truth_facts": ["84.0%", "2.70", "AI Cloud"],
        "category": "table_segment_analysis",
    },
    {
        "id": "bench_06_q3_capex",
        "query": "What was Q3 capital expenditure (CAPEX) and which GPU models were procured?",
        "expected_doc_id": "q3_enterprise_cloud_infrastructure_financials",
        "ground_truth_facts": ["3.41", "H100", "B200", "48,000"],
        "category": "table_and_hardware_specs",
    },
    {
        "id": "bench_07_raft_heartbeat",
        "query": "What is the heartbeat interval sent by the Raft leader?",
        "expected_doc_id": "distributed_raft_consensus_architecture_spec",
        "ground_truth_facts": ["50 milliseconds", "AppendEntries"],
        "category": "distributed_protocol_specs",
    },
    {
        "id": "bench_08_raft_election_timeout",
        "query": "What is the randomized follower election timeout range in the Raft consensus engine?",
        "expected_doc_id": "distributed_raft_consensus_architecture_spec",
        "ground_truth_facts": ["150 milliseconds", "300 milliseconds"],
        "category": "protocol_timing_invariants",
    },
    {
        "id": "bench_09_raft_snapshot_trigger",
        "query": "When do nodes trigger log compaction and memory snapshots in Raft?",
        "expected_doc_id": "distributed_raft_consensus_architecture_spec",
        "ground_truth_facts": ["50,000 entries", "2.5 GB"],
        "category": "state_machine_thresholds",
    },
    {
        "id": "bench_10_raft_read_leases",
        "query": "How does the Raft leader serve linearizable reads without disk round-trips?",
        "expected_doc_id": "distributed_raft_consensus_architecture_spec",
        "ground_truth_facts": ["Leader Lease Protocol", "200ms", "heartbeat"],
        "category": "conceptual_architecture",
    },
]
