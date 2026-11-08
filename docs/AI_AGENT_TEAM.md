# Multi-Agent Development Team — LabVIEW Web Front Panel

**Status:** Agent instructions and work assignments ready. This repository does **not** by itself start autonomous agents. An authorized coding-agent host, connected application or developer must launch each worker. No project code is considered implemented solely because its task is assigned.

## Authority and collaboration
- **Team Lead / Architect** is accountable for scope, work allocation, traceability, branch ownership, integration and release recommendation.
- **Workers** make scoped contributions on isolated task branches; no worker may modify live industrial controls or bypass quality gates.
- **Independent QA/Security** reviews outcomes and can block release; Team Lead cannot relabel failed or mock-only tests as real validation.
- **Human owner** approves scope changes, actual equipment access, production release and repository-wide architecture changes.

## Roster

| Agent ID | Role | Primary ownership | Definition of done |
|---|---|---|---|
| LEAD | Team Lead / Architect | `AGENTS.md`, baseline, integration, merge approvals | Requirement- and checkpoint-evidenced integration |
| UX | UI/UX Design System Specialist | Design tokens, UX research, accessibility acceptance | Reviewed visual specifications and accessible interactive states |
| EDITOR | Drag-and-Drop Editor Engineer | Canvas, inspector, layout modes, undo/redo | Mock-tested responsive editor, keyboard/touch checks |
| GATEWAY | Protocol and Gateway Engineer | Native TCP framing, binary/JSON, WebSocket, subscriptions | Python vs Node benchmarks and contract-tested gateway |
| PLUGINS | Industrial Indicator Engineer | Indicator registry, composite widgets, charts/FFT, gear displays | Validated read-only widgets and mock fixtures |
| LV | LabVIEW Adapter / Mock Engineer | LabVIEW publisher interface, contract mock, quality/time model | Deterministic mock contract tests; real LabVIEW deferred until available |
| QA | QA, Security and Performance Engineer | Negative tests, SBOM, dependency audits, injection, load, accessibility | Independent checkpoint evidence and risk classification |
| DOCS | Documentation and Release Engineer | Traceability, compatibility, packaging instructions, provenance | Reproducible handoff, explicit mock vs real status |

Each role's detailed instructions live under `.agents/roles/`.

## Parallel work rules
1. Lead opens scoped work packages from `docs/WORK_PACKAGES.md` with unique IDs and acceptance tests.
2. Assign **one owner per overlapping file or subsystem**. For shared files, Lead coordinates a serial update.
3. Workers use branches like `agent/ux/editor-shell`, `agent/gateway/tcp-framing`, `agent/plugins/motor`, `agent/qa/security`; never rewrite `main` independently.
4. Every PR/change summary lists: requirement IDs, files changed, relevant upstream skills, actual executed tests, screenshots or logs where available, security findings, assumptions, and unverified dependencies.
5. Lead checks integration contracts and merges only after independent QA approval. Rejected tasks return to the worker; critical issues block merge/release.
6. Graphify may index the repo to improve navigation; all inferred edges must be checked against actual code or docs. Security-sensitive commands from external skills need human review before execution.
7. Never claim a team is running continuously, a test has been executed, or a pull request exists unless tools independently confirm it.

## Phase 1 contract
Phase 1 is **indicator-only**, including the gear and alarm widgets. All web clients are read-only; control ownership, command ACK, alarm acknowledgement and write permissions are future-phase architecture only. No equipment write route may be exposed in the phase-1 gateway, mock, plugin API or GUI.

## Review and escalation
- `UNKNOWN`: document unknown and request evidence, don't guess. Examples: G1800 raw codes, toolkit compatibility, actual latency.
- `CHANGE_REQUEST`: user must authorize any new functionality, source-of-truth change or deviation from Phase 1.
- `BLOCKED`: missing hardware/tooling, High/Critical findings, failing contract tests or contradictory requirements.
- `VERIFIED_MOCK_ONLY`: must not be called LabVIEW validated.
- `VERIFIED_REAL`: may be used only after actual native LabVIEW testing with evidence.

## Recommended checkpoint sequence
CP-01 requirements → CP-02 architecture/UX → CP-03 mock/schema/protocol → CP-04 widgets/accessibility → CP-05 robustness/performance/security → CP-06 actual LabVIEW/WebView → release approval.

See `docs/VERIFICATION_GATES.md` for exact review evidence.
