# PanelForge — Phase 1 Mock Dashboard MVP

**Status:** prototype; read-only, mock-only, Windows/browser and LabVIEW WebView integration not verified.

## Run on developer PC

Requires Python 3.10+, aiohttp 3.x. From this directory:

```powershell
python -m pip install -r requirements-dev.txt
python -m gateway.mock_gateway --port 8766
```

Open http://127.0.0.1:8766/ in Edge or Chrome.

No LabVIEW installation required. Mock gateway deliberately listens on loopback only; it is **not** intended for remote access or production test rigs. No external CDNs, fonts or telemetry connections. No hardware or equipment control endpoints.

## Current features

- Dark industrial dashboard designer; add, select, reorder and remove display widgets.
- Grid and free-position HMI canvas; drag items from palette, free-canvas drag and inspector geometry fields.
- Read-only mock gateway using WebSocket snapshots with typed signals, quality and dual timestamps.
- Live numeric, gauge, LED, motor, gear, profile, test-status, trend and XY widgets.
- Explicit FFT placeholder: avoids inventing measurement spectra when no FFT source is provided.
- Design/Preview; browser-local layout save; JSON layout export.
- Automatic reconnect with visibly disconnected status and bounded history (200 samples).

## Limits and caveats

- **Mock only:** success does not verify LabVIEW API, WebView toolkit, TCU gear mapping, motor instrumentation or a physical rig.
- Demo H-pattern is *not* an approved or verified G1800 gear map.
- Python mock gateway is a temporary implementation for contract testing; **Python vs Node.js production gateway remains undecided**.
- This sprint uses WebSocket mock snapshots; native LabVIEW framed TCP + JSON/binary protocol is a separate work item, not yet validated.
- Layout save is browser localStorage, not yet the project-level version-pinned configuration service.
- Plugin import/sandbox, RBAC, authenticated LAN and production deployment are not implemented.
- UI is optimized for desktop workstations; small-screen inspector remains an early prototype.

## Tests

```powershell
python -m pytest -q tests/test_gateway.py
node --check web/app.js
python -m compileall -q gateway
```

Tests exercise mock protocol, security headers, cross-origin restrictions, read-only boundary and subscription validation. Real LabVIEW checkpoint CP-06 remains **NOT_TESTED**.

## Security boundary

In this mock, HTTP only responds to GET paths and WebSocket only accepts read-only subscriptions. Unexpected messages, including commands, are rejected. Default bind address is 127.0.0.1, Host/Origin checked and CSP applied. This is not a complete penetration test or production security approval.

## CI and evidence

- `.github/workflows/phase1-mock-checks.yml` defines tests, Python static scanning (Bandit), and dependency audits (pip-audit). A committed workflow is not evidence it has run successfully.
- See `IMPLEMENTATION_CHECKPOINTS.md` for requirement traceability, locally executed test evidence and production blockers.
- Browser-interaction tests inject the mock WebSocket into an in-memory page because direct Chromium HTTP navigation is blocked in this runner; the actual backend WebSocket is tested separately via aiohttp's test client.
