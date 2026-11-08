# Approved Requirements Baseline (Phase 1)

**Authority:** Approved user decisions during the design conversation, consolidated for AI agents. This is not an implementation-complete claim. Older brainstorm docs may include now-superseded control proposals.

## Functional requirements

| ID | Requirement | Phase 1 acceptance |
|---|---|---|
| REQ-001 | Single shared dashboard UI in LabVIEW WebView and separate browser | Same project layout renders in both; embed integration unverified until real test |
| REQ-002 | Unified Design, Preview, Validate, Publish, Runtime workflow | Read-only runtime with permission-gated designer |
| REQ-003 | Grid and free-position HMI layout modes | Responsive Grid, geometry-preserving HMI canvas, page reference resolutions |
| REQ-004 | Intuitive professional editor | Searchable palette, live inspector, inline properties, advanced dialogs, undo/redo, snap/group/multiselect |
| REQ-005 | Installable and editable UI plugins | Built-in and sandboxed custom HTML/CSS/JS, version-pinned project use |
| REQ-006 | Hybrid tag binding | Automatic discovery, manual tags, JSON/CSV offline imports |
| REQ-007 | Authoritative typed signal registry | LabVIEW authoritative live; gateway synced catalog; conflicts marked |
| REQ-008 | Universal signal schema | Boolean, integer, float, string, enum, arrays, XY, waveform and structured data |
| REQ-009 | Industrial indicator set | Motor, shaft, profile, general details, numeric group, Boolean, result group, popup display, page/subpage, trends, XY, waveform, FFT |
| REQ-010 | Gear indicators | Model-specific H-pattern + G1800 AMT; raw-code lookup or direct ID; only verified gear codes authoritative |
| REQ-011 | Hybrid FFT | LabVIEW spectrum default live; browser analysis optional for replay |
| REQ-012 | Local gateway and dual browser support | WebSocket to web UI; candidate Python/Node runtimes not selected |
| REQ-013 | Hybrid TCP wire format | Framed JSON for structure; binary for high-rate numeric payloads |
| REQ-014 | Hybrid priority publishing | Critical status/event snapshots; subscription-based scalar/batch telemetry |
| REQ-015 | Communication loss behavior | Dashboard/gateway failure does not stop independent LabVIEW execution; resync, no replay |
| REQ-016 | Hybrid logging and replay | LabVIEW permanent logs; gateway bounded temporary history and replay access |
| REQ-017 | Hybrid alarm distribution | LabVIEW authoritative; gateway distributes current alarms; Phase 1 display only |
| REQ-018 | Quality awareness | Good/Stale/Disconnected/Invalid, configurable stale display/timeout |
| REQ-019 | Dual timestamps | Preserve source acquisition and gateway receipt timestamp + sequence/sample timing |
| REQ-020 | Offline deployment | Portable app or optional Windows service; browser & embedded WebView; offline assets |
| REQ-021 | Optional remote LAN | Localhost only by default; authenticated/TLS-protected optional LAN viewing |
| REQ-022 | Hybrid identity architecture | Offline local users; optional Windows/AD authentication and role model |
| REQ-023 | Multi-viewer model | Any number of authorized read-only Phase 1 viewers; single active controller reserved for Phase 2 |
| REQ-024 | Scalable telemetry rendering | Batching, bounded queues, dynamic display rates, graph efficiency; actual limits benchmarked |
| REQ-025 | Quality checkpoints and AI rules | Requirements/test trace, no invented verification, independent security checks |
| REQ-026 | Mock LabVIEW simulator | Same protocol and signals; scenarios for states, performance and reconnect; cannot prove native VI integration |
| REQ-027 | Version-controlled plugins | Pinned versions, preview before migration, rollback of compatible layouts and metadata |
| REQ-028 | Hybrid plugin security | Built-in verified vs isolated custom; permission-controlled binding API, no raw native access |

## Non-functional requirements
- Industrial readability, offline operation, accessible and responsive UI.
- No unsafe animation for stale/invalid source data; units, timestamps and state text visible.
- No unwanted control widgets in Phase 1; no command or acknowledgement pathway from GUI.
- Require signed-off acceptance and repeatable real/mock evidence before release claims.
- Container/runtime/service technology selected only after evidence; do not invent results.

## Explicitly DEFERRED
Phase 2: start/stop/pause/resume/setpoints, operator action/ACK, single-controller arbitration for commands, alarm acknowledgement, safety-authorized write interfaces. **Phase 1 cannot activate these via configuration or third-party plugins.** H-pattern and AMT gear widgets remain read-only.

## Open technical validations
- Python versus Node.js performance/packaging comparison.
- Exact LabVIEW 2025/2026 WebView toolkit and native messaging compatibility.
- Benchmark-driven maximum tags, graph rates, memory/CPU and connection-recovery limits.
- G1800 model-specific TCU codes and confirmed selector semantics.
- Licensing review before distributing third-party skill content with proprietary artifacts.
