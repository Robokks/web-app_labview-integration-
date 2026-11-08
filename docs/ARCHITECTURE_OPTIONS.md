# Architecture Alternatives — Web Dashboard Embedded in LabVIEW

Status: **Discussion draft, not approved for implementation.** Last updated: 2026-11-08.

## Common runtime concept

```text
+-------------------------------------------------------+
| LabVIEW Windows Application                            |
|                                                       |
|   +------------------------+                          |
|   | Embedded WebView       |                          |
|   | HTML/CSS/JavaScript UI |                          |
|   +-----------+------------+                          |
|               |                                      |
|        IPC / WebMessage / optional network interface  |
|               |                                      |
|   +-----------v------------+                          |
|   | LabVIEW command/data   |                          |
|   | dispatch and validation|                          |
|   +-----------+------------+                          |
|               |                                      |
|   +-----------v------------+                          |
|   | Data acquisition and   |                          |
|   | hardware/test logic    |                          |
|   +------------------------+                          |
+-------------------------------------------------------+
```

## Option A: Direct WebView JS/WebMessage bridge

LabVIEW feeds JSON/status messages into the WebView, and JavaScript sends structured user actions back. No separate TCP/UDP server is needed for same-process display. Research suggests sklein WebView2 supports WebMessages; confirm exact LabVIEW VI/event behavior with a proof of concept. Avoid long-running UI-thread interactions.

## Option B: Local TCP data service with a native bridge

A LabVIEW TCP listener or external helper owns a TCP connection. The browser page does **not** open a raw TCP socket; a bridge or service converts messages into a web-supported interface (for example WebSocket). More moving parts but supports process separation and network clients.

## Option C: UDP telemetry via a native bridge

LabVIEW may publish UDP datagrams to another native process, which translates received data into a browser-compatible channel. Appropriate only if best-effort telemetry and packet-loss semantics are acceptable; not a default command pathway.

## Option D: Hybrid

Direct WebMessage for UI commands and configuration; optional network transports for independent consumers or larger telemetry flows. Needs more lifecycle and data-sync handling. This is an alternative, not the selected design.

## Protocol concept (unconfirmed)

```json
{"type":"telemetry","tag":"motor.speed","value":1250,"unit":"rpm","timestamp":"..."}
{"type":"command","id":"123","action":"set_speed","value":1000}
{"type":"ack","id":"123","accepted":true}
```

These are illustrative message envelopes only, not implemented APIs.

## Guardrails to decide early

- Distinguish display refresh rate from acquisition/control loop rates.
- Use command IDs, acknowledgements, validation, error states, and a visible connection status.
- Never allow the web UI to bypass LabVIEW safety checks or hardware interlocks.
- Plan clean init/dispose/reload and avoid stale subscriptions.
- If remote content is allowed, validate origins and all received messages.
- Measure latency, throughput, redraw performance, jitter and CPU load rather than assuming transport speed.
- Confirm Windows/LabVIEW 64-bit/toolkit build/runtime deployment compatibility.

## Next discussion

Clarify the toolkit, UI design workflow, control scope and required update frequencies before selecting a transport or coding.
