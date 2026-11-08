# Multi-Agent Task Board

Status: **DESIGN ONLY** until the user authorizes implementation. Assignments below are planning tasks, not evidence that agents are running.

| ID | Owner | Work package | Dependencies | Status |
|---|---|---|---|---|
| ARCH-01 | Team Lead | Consolidate approved architecture and requirements IDs | Approved docs | PLANNED |
| UX-01 | UI/UX | Design editor workflow, grid/free canvas, inspector | ARCH-01 | PLANNED |
| FE-01 | Frontend | Define editor/runtime module boundaries | ARCH-01, UX-01 | PLANNED |
| PLG-01 | Plugin | Define widget manifests, sandbox, versioning | ARCH-01 | PLANNED |
| LV-01 | LabVIEW | Define read-only gateway and typed signal contract | ARCH-01 | PLANNED |
| DATA-01 | Data Viz | Define graph/history/FFT contract | LV-01 | PLANNED |
| QA-01 | QA | Define mock test matrix and release evidence | ARCH-01 | PLANNED |
| SEC-01 | Security | Define threat model and scan checklist | ARCH-01, PLG-01 | PLANNED |
| DOC-01 | Docs | Decision register and traceability | All design tasks | PLANNED |

Task state transitions: PLANNED → ASSIGNED → IN_PROGRESS → REVIEW → APPROVED / BLOCKED. Lead updates with evidence; no status change based on assumption.
