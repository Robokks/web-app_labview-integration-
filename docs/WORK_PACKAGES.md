# Parallel Work Packages

All tasks initially **PLANNED**, not implemented. Team Lead assigns branches and owners. No software is in production. This file is the starting backlog; every completed work package must link actual commits and test evidence.

| WP | Owner | Workstream | Prerequisites | Required acceptance |
|---|---|---|---|---|
| WP-00 | LEAD + DOCS | Freeze SRS/schema/permissions in baseline | User-approved scope | CP-01/02; open unknowns explicitly |
| WP-01 | UX | Industrial UI design system and accessible widget appearance | WP-00 | Tokens, states, responsive grid/HMI mockups; human design review |
| WP-02 | EDITOR | Core designer: palette, canvas, inspector, interactions | WP-01 | Layout save/load and keyboard/touch mock tests |
| WP-03 | GATEWAY | Protocol specification and language-neutral fixtures | WP-00 | Framing, types, caps, timestamp/quality, negative contract tests |
| WP-04 | GATEWAY | Python versus Node.js spike/benchmarks (two implementations) | WP-03 | Reproducible results; Lead approves language choice before prod path |
| WP-05 | LV | Deterministic mock LabVIEW signal source | WP-03 | Normal/invalid/stale/disconnected, sample arrays, no control endpoints |
| WP-06 | PLUGINS | Base plugin registry and sandbox contract | WP-00 + WP-03 | Versioning and forbidden-capability tests |
| WP-07 | PLUGINS | Motor, shaft, profile, numeric, Boolean, details, results | WP-06 + WP-05 | Read-only states and mapping tests |
| WP-08 | PLUGINS | H-pattern and G1800 AMT indicators | WP-06 + WP-05 | Model-specific mapping; unverified code labeled as mock-only |
| WP-09 | PLUGINS | Trend/XY/waveform/FFT, replay | WP-06 + WP-05 | Data type, downsampling, refresh and replay tests |
| WP-10 | QA | Security/UX/performance automated checks | WP-03 through WP-09 | Independent CP-03/04/05 and SEC-01..09 evidence |
| WP-11 | LV | Native LabVIEW publisher + WebView proof | Real LabVIEW available | CP-06 real evidence or explicit blocked status |
| WP-12 | DOCS | Offline bundle, deployment, support and rollback guidance | Accepted components | Reproducible packaging review, license audit |
| WP-13 | LEAD | Integration and release candidate | All applicable work packages | Signed review; no High/Critical findings; real-vs-mock reporting |

## Recommended parallel order
Track A: UX → EDITOR. Track B: GATEWAY → LV mock. Track C: PLUGINS after schema/registry contract. Track D: QA begins threat model early, then reviews each track. DOCS updates trace/evidence continuously. Final merge requires the Team Lead.

## Branch discipline
- `agent/ux/*` layout/design
- `agent/editor/*` editor
- `agent/gateway/*` gateway/protocol
- `agent/lv/*` adapter/mock
- `agent/plugins/*` plugin registry/widgets
- `agent/qa/*` tests/security
- `agent/docs/*` docs/deployment

Before another worker changes a shared contract file, request Lead ownership transfer. No unsupervised merges and no false test claims.

## Checkpoint record template
```
Work package:
Requirement IDs:
Branch / commit:
Implemented paths:
Test commands actually executed:
Test results / logs:
Security scan results:
Verification tier: NOT_TESTED / VERIFIED_MOCK_ONLY / VERIFIED_REAL / FAILED
Open uncertainties:
Independent reviewer:
Decision: PASS / FAIL / BLOCKED
```
