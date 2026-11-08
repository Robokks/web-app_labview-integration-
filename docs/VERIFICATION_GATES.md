# Verification Checkpoints and Security Gates

## Evidence format
For every work package supply: requirement IDs; git commit SHA; actual tool/version; host/OS; test case and input; result/log path; owner; independent reviewer; status `VERIFIED_REAL` / `VERIFIED_MOCK_ONLY` / `NOT_TESTED` / `FAILED`.

## Engineering gates
- **CP-01 Scope:** approved REQ mapping, no new requirements. Reject all Phase 1 write-capable paths.
- **CP-02 Design:** interface and architecture compatibility, UX preview and accessibility design.
- **CP-03 Contract:** typed schema, JSON framing, binary byte order, TCP partial reads, WebSocket subscriptions, malformed frames, mock compatibility.
- **CP-04 Functional:** widgets, layouts, versioning, sandbox permission checks, stale/invalid states, G1800 configurable gear mapping.
- **CP-05 Robustness:** bounded queues, load/latency, gateway restart, stale timeout, multi-client viewers, reconnection, no data corruption.
- **CP-06 Native:** actual LabVIEW 2025/2026 and WebView verification. This cannot pass with a mock simulator.

## Security gates
- **SEC-01** secret scanning, credential patterns and tracked artifacts.
- **SEC-02** source static analysis for each implemented language.
- **SEC-03** dependency lockfiles, CVE scan, SBOM/licenses, package integrity.
- **SEC-04** untrusted plugin sandbox, XSS/HTML injection, CSP, origin and message validation.
- **SEC-05** fuzz framed TCP and WebSocket data; size ceilings, rate limits and DoS resistance.
- **SEC-06** local/LAN authentication, TLS, allowed origins, session isolation, least privilege.
- **SEC-07** Mock LabVIEW isolation, no active control endpoints in Phase 1, no unintended access to live devices.
- **SEC-08** package/executable malware and checksum/signature verification where available.
- **SEC-09** regression evidence and independent release signoff.

## Gate logic
`NOT_TESTED` != `PASS`; `VERIFIED_MOCK_ONLY` != `VERIFIED_REAL`. Unknown or contradictory facts require a documented blocker, not inference. High/Critical unresolved security findings block release. Performance targets are targets until measured, not facts.

## Anti-hallucination checklist
1. Is the claimed behavior explicitly in the approved baseline?
2. Is the file/module/API actually present in the commit?
3. Is this statement extracted from source or inferred by Graphify/agent?
4. Was a test **actually executed**, or only drafted?
5. Does the test cover failure modes and not only successful mock data?
6. Are unknown TCU values and tool versions clearly unknown?
7. Is any dependency, installer or third-party code unreviewed?
8. Did an independent reviewer verify evidence?
