# Design Option — Embedded WebView vs Auto-Launched Separate Web App

**Discussion date:** 2026-11-08  
**Status:** Alternative analysis; recommendation only. No architectural decision approved and no implementation started.

## Context

The user wants a LabVIEW front panel based on drag-and-drop HTML/JS widgets, charts, indicators, controls, templates and plugins. Initially the UI was to appear inside LabVIEW using a WebView toolkit. New alternative: when a LabVIEW executable opens, it automatically launches a separate web app.

### Definitions

- **Embedded-only:** HTML/CSS/JS assets load directly inside a LabVIEW-hosted WebView. LabVIEW and browser UI typically share a host process, with WebView runtime components running in their own processes.
- **Separate web app:** a web front-end hosted locally in a separate browser or desktop shell. The static website may be served by a local HTTP server and/or use a separate backend service. LabVIEW is responsible for starting the required service and optionally the browser.
- **Hybrid / one web front-end, two view modes:** same bundled web app can appear in a separate browser or inside LabVIEW WebView, backed by a common web-compatible API and data-binding engine.

These are not necessarily three different UI codebases. Packaging/transport can differ independently of UI design.

## Pros and cons

| Area | Embedded-only | Separate local web app / browser | Hybrid shared front-end |
| --- | --- | --- | --- |
| Inside the LabVIEW front panel | Native | Not unless embedded | Optional |
| Independent UI debugging | Possible but more tied to LabVIEW | Easiest | Easiest while designing |
| Standalone designer | Extra work | Natural | Natural |
| Reuse on a remote PC | Extra networking | Natural with deliberate network service | Natural when enabled |
| Direct WebView WebMessage | Yes | No | Optional adapter |
| Standard browser WebSocket | Yes, if server provided | Yes, if server provided | Yes |
| Running local service required | Not for WebMessage-only | Depends on packaging/transport | Usually for common API |
| Packaging | Toolkit + UI assets | UI assets plus possibly backend/service | Both modes and selected backend |
| Browser UI fault isolation | Limited in integration, WebView subprocesses exist | Better process separation | Depends on mode |
| UI update independent of LabVIEW build | Often achievable by separate assets | Straightforward | Straightforward |
| Offline support | Yes | Yes | Yes |
| UI performance | Depends on rendering, event threading, transfer rates | Depends on rendering and IPC | Depends on selected mode |

Do not imply that external web apps inherently have lower latency or better CPU usage. Benchmark both.

## Recommended design hypothesis (unconfirmed)

**One standalone web front-end with a shared transport-agnostic binding layer**, developed/tested independently and capable of being opened in a browser or embedded WebView. Start with a **local-only service** when networking is required. LabVIEW remains responsible for hardware, safety and execution.

```text
LabVIEW Application.exe
  |-- Acquisition, control, fault handling and command validation
  |-- Startup / service supervision
  `-- LabVIEW↔Gateway transport adapter
          |
          | Native TCP or compatible WebSocket/HTTP implementation
          v
    Local integration service (if necessary)
      |-- WebSocket + HTTP asset hosting
      |-- Typed tag/state distribution
      `-- Command routing + acknowledgement
          |
          v
    Same drag/drop web dashboard runtime
          |-- Browser window
          `-- Embedded WebView (optional)
```

**Alternative simpler first phase:** avoid a separate backend if LabVIEW itself can expose the chosen HTTP/WebSocket interface with supported software. Verify support before assuming. Do not make the launch sequence more complex than required.

## Launch lifecycle design

1. LabVIEW starts and loads runtime configuration.
2. Check whether its own correctly identified integration service instance already exists; do not assume that an occupied port is the correct service.
3. If a sidecar is needed, launch using LabVIEW System Exec VI or another process-management interface; handle quoted paths, working directory and non-blocking execution.
4. Wait for a bounded startup readiness/health response; show errors clearly on failure.
5. Open the configured local URL (separate browser) or load it in the embedded WebView.
6. Browser authenticates/connects, requests the tag catalog/current snapshot, and subscribes to updates.
7. Data exchange continues asynchronously; cap graph updates/buffers and support reconnect.
8. On shutdown, stop accepting new commands, close connections, and stop only the processes owned by this LabVIEW instance. Define behavior when the browser closes or the dashboard service fails.

### Safety and network policy

- Default listener address should be loopback (`127.0.0.1`) when access is local. Remote access is opt-in, secured and explicitly designed.
- Localhost is **not** a substitute for authentication, origin checks, per-command permissions and message validation.
- A UI crash/disconnect must not defeat independent equipment safety handling and should not inadvertently command actuators.
- Use per-request IDs, accepted/rejected responses and state synchronization for controls.
- Prevent duplicate applications/services and duplicate writes when restarting/reconnecting.

## Critical protocol clarification

Browser JavaScript cannot speak arbitrary raw TCP or UDP. If LabVIEW communicates by native TCP/UDP, a gateway/adapter is needed to deliver the data to browser JavaScript, for example via WebSocket. Alternatively choose a LabVIEW-compatible HTTP/WebSocket server implementation. TCP may be useful between native processes; UDP should be reserved for data where loss/reordering are explicitly acceptable.

WebSocket itself provides bidirectional messages; it is not a hard real-time safety/control bus. Avoid sending every acquisition sample unfiltered to every visual widget.

## A lean initial concept

- LabVIEW.exe: core control and tag registry, local API endpoint or simple native protocol.
- Optional small gateway: protocol bridge and file serving.
- Browser web app: design / preview / run modes with widget registry and templates.
- Optional embedding: use WebView2 pointed at the same local web app rather than fork the web UI.
- Offline package: include all scripts, icons, fonts, charting libraries and templates locally.

## Validation before selecting architecture

- Which is the operator's preferred display: separate browser window, inside LabVIEW, or both?
- Who starts/stops the web service and what happens when LabVIEW is closed?
- Can a locally installed WebView2 toolkit display the same URL with supported security features?
- Exact LabVIEW version, build target and Windows runtime.
- Whether a supported LabVIEW WebSocket server is available or a TCP↔WebSocket gateway is necessary.
- Target number of widgets/graphs, update rate, latency and message frequency.
- Single-client control policy vs multiple viewers, including local/remote.
- Deployment model: static HTML only, local helper service, or packaged native desktop app.
- Security and offline installation requirements.

## References

- NI — Run an Executable Programmatically in LabVIEW: https://knowledge.ni.com/KnowledgeArticleDetails?id=kA03q000000YGhVCAW
- NI — Execute Command Line Arguments from LabVIEW: https://knowledge.ni.com/KnowledgeArticleDetails?id=kA03q000000YGivCAG&l=en-MY
- WebView2 Toolkit for LabVIEW: https://www.vipm.io/package/sklein_lib_webview2/
- MDN — WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API

**Next decision:** Separate browser UI, embedded-only WebView, or **the same dashboard in both**? This remains a user choice.
