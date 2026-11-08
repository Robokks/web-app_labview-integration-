# Phase 1 implementation checkpoints — initial prototype

**Revision:** 2026-11-08  
**Verification boundary:** mock-only. **Never** claim LabVIEW, hardware, WebView or G1800 TCU verification based on these tests.

| Requirement | Acceptance evidence | Current state |
| --- | --- | --- |
| P1-RO-01 Phase 1 is read-only | No POST API, no command routes; WebSocket rejects `command` | VERIFIED_MOCK_ONLY |
| P1-UI-01 Drag/drop panel designer | Component palette, click-add, canvas grid reorder, free-position drag and inspector | MOCK UI TESTED / PARTIAL (pointer drag not yet automated) |
| P1-UI-02 Same app for browser and WebView | Single HTML/CSS/JS assets; WebView hosting compatibility pending | NOT_TESTED on LabVIEW |
| P1-VIZ-01 Industrial widgets | Numeric, gauge, LED, trend, XY, motor, gear, profile, result, FFT placeholder | MOCK UI TESTED / PARTIAL |
| P1-DATA-01 Typed signals and metadata | WebSocket schema v1, data type, quality, timestamps, sequence | VERIFIED_MOCK_ONLY |
| P1-DATA-02 Disconnect/reconnect | Client reconnect, reload snapshot, clear old sequence and history | IMPLEMENTED / NOT E2E TESTED |
| P1-DATA-03 Native LabVIEW framed TCP + binary | No native adapter available | NOT_TESTED |
| P1-PLUG-01 Sandboxed user plugins | Plugin manifests, version pinning and sandbox | NOT IMPLEMENTED |
| P1-SAVE-01 Project save/export | Browser-local save, JSON export; global/project versioned storage pending | MOCK UI TESTED / PARTIAL |
| P1-SEC-01 Local-only gateway | localhost listener, origin/host checks, fixed routes, CSP, no write APIs | VERIFIED_MOCK_ONLY |
| P1-QA-01 Automated tests | 5 mock contract tests + 3 in-memory Chromium UI tests | PASSED LOCALLY |
| P1-QA-02 Scanners | CI config for Bandit and pip-audit; no completed scanner run yet | NOT TESTED |
| P1-LV-01 Real LabVIEW VI/WebView | LabVIEW 2025/2026 native integration and deployment | NOT TESTED |

## Test evidence (local environment)

- `python -m pytest -q tests/test_gateway.py tests/test_browser.py`: **8 passed**.
- `node --check web/app.js`: **passed syntax check**.
- `python -m compileall -q gateway tests`: **passed**.
- In-memory Chromium screenshot and basic UI interactions: rendered 8 mock widgets, live values, click-added widget, changed layouts, preview; screenshot captured.
- Running Chromium directly against `http://127.0.0.1:8766/` was blocked by host-environment browser policy (`ERR_BLOCKED_BY_ADMINISTRATOR`), despite the server's HTTP health API passing. Thus **end-to-end browser ↔ actual mock server remains not tested**.
- Bandit, Semgrep and pip-audit were not installed in this development environment. Security approval pending CI reports and independent review.

## Production blockers

Native LabVIEW transport, WebView toolkit validation, global plugin registry/sandbox, real FFT, authentic transmission gear mapping, project-level persistence, RBAC, authenticated LAN, performance benchmarks and packaged offline runtime. The Python mock gateway is a **temporary test fixture**, not a production gateway selection.
