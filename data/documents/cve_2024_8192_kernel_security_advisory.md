# Security Advisory: CVE-2024-8192
<!-- page: 1 -->

## Executive Summary
A critical use-after-free vulnerability designated **CVE-2024-8192** was identified in the Linux kernel packet socket implementation (`net/packet/af_packet.c`). Under specific race conditions during socket closure while BPF filters are concurrently attached, a race window allows local unprivileged users to execute arbitrary code with kernel privileges or trigger a kernel panic (`BUG_ON` crash).

The vulnerability has been assigned a CVSS v3.1 base score of **8.8 (High)**: `CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H`.

---

<!-- page: 2 -->
## Vulnerability Details & Technical Analysis
The issue resides in `packet_set_ring()` within `net/packet/af_packet.c`. When an application unbinds a packet socket while a packet fanout structure is linked, the reference count decrement on `pg_vec` memory descriptors is not properly serialized with `packet_release()`.

- **Vulnerable Subsystem:** Linux Kernel Networking (`net/packet/af_packet.c`)
- **Faulting Function:** `packet_set_ring()` at memory offset `0x7fff90a4`
- **Root Cause:** Missing mutex acquisition around `po->rollover` pointer dereference during socket teardown.
- **Affected Kernel Versions:** Linux 6.1.0 LTS through 6.6.42. Kernels prior to 6.1 lack the rollover lock optimization and are not affected.
- **Exploit Status:** Proof-of-concept (PoC) public; observed active exploitation in targeted container escape attempts.

---

<!-- page: 3 -->
## Remediation & Mitigation Protocols

### Official Kernel Patch
The upstream Linux networking team published the official fix under Git commit **`a7f8e910c2d3`** ("net: packet: serialize rollover struct deallocation under pg_vec_lock"). Distributions have released updated packages:
- Ubuntu 22.04 LTS: `linux-image-5.15.0-117-generic` (backport patch `deb-8192-v2`)
- RHEL 9: `kernel-5.14.0-427.28.1.el9_4`
- Debian 12: `linux-image-6.1.0-23-amd64`

### Immediate Zero-Day Workaround (Non-Reboot)
For enterprise clusters where an immediate node reboot is prohibitive, systems engineers should restrict unprivileged user namespace access and harden BPF JIT compiler settings:

```bash
# Disable unprivileged user namespace creation
sysctl -w kernel.unprivileged_userns_clone=0

# Harden BPF JIT compiler and randomize memory offsets
sysctl -w net.core.bpf_jit_harden=2

# Restrict raw socket creation via SELinux/AppArmor
setsebool -P deny_raw_sockets 1
```

Enterprise infrastructure teams running Kubernetes or Nomad should ensure daemonsets enforce seccomp profile `RuntimeDefault` which drops `CAP_NET_RAW` capabilities.
