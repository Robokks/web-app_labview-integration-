# Design Discussion Log

This file contains concise summaries of decisions and ideas discussed in chat, not a verbatim transcript. This is a **public** repository: do not add private system details, customer data, tokens, credentials or other secrets.

## 2026-11-08 — Session 1: Initial project

**User request:** Brainstorm and design web application–LabVIEW integration concepts. Maintain evolving design notes in this GitHub repository.

**Initial alternatives (all unconfirmed):**
- A remote web dashboard for existing LabVIEW applications.
- A drag-and-drop web panel designer that connects to LabVIEW variables.
- A universal web–LabVIEW integration API.
- A combination of the above.

**Initial candidate architecture:** Web UI ↔ Integration layer ↔ LabVIEW. No implementation committed or approved.

## 2026-11-08 — Session 2: Embedded dashboard direction

**User-stated concept:** "Inside the labview using web view toolkit to view dashboard. Data transfer via js or TCP or udp."

**Requirements emerging from the statement:**
- The dashboard is displayed **inside the LabVIEW application** using a WebView toolkit, not necessarily a standalone remote browser.
- A web-technology UI (HTML/CSS/JavaScript) is an intended display surface.
- Communication options to compare include JavaScript integration, TCP and UDP.
- Bidirectional data flow is an architecture possibility; exact control scope is yet to be confirmed.

**Technical research, not implementation decisions:**
- The third-party WebView2 toolkit by sklein supports JavaScript execution and WebMessage event send/receive, and runs on Windows. See https://www.vipm.io/package/sklein_lib_webview2/ and https://github.com/kleinsimon/LV-WebView2.
- WebView2 can use `window.chrome.webview.postMessage` from the page, with a host WebMessageReceived handler, and host-to-page messages. See https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/communicate-btwn-web-native.
- Ordinary browser JavaScript does not expose raw TCP or UDP sockets. Network data usually requires WebSocket/HTTP or a native host component/bridge. See https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API.
- WebView UI responsiveness is a design constraint; avoid heavy work on the UI thread.
- As an alternative for certain LabVIEW 2026 installations, NI has its own Chromium-based WebBrowser control; exact availability/API integration needs confirmation: https://knowledge.ni.com/KnowledgeArticleDetails?id=kA0VU000000Bwn30AC&l=en-US.

**Recommended candidate for further discussion (NOT APPROVED):** embedded WebView ↔ JavaScript/WebMessage bridge ↔ LabVIEW application; investigate TCP/UDP where another native process/device is involved. Design LabVIEW to validate command requests before hardware action.

**Pending clarifications:**
1. Which exact toolkit: sklein WebView2, NI's own browser control, or a different one?
2. Should the UI be fixed or a drag-and-drop configurable panel?
3. What values/events need to move, and at what rate?
4. Is communication only within one Windows application, or also across devices/PCs?
5. Is the intended scope monitoring-only or sending validated control commands?

**Decision status:** Nothing architectural has been frozen. Do not start coding until explicitly agreed.

## Updating this log

When a new design point emerges, append a dated summary with user-stated facts, hypotheses/alternatives, trade-offs and agreed decisions. The assistant can commit changes only during an active turn with GitHub access; this log does not auto-sync with chat.

## 2026-11-08 — Session 3: Drag-and-drop front-panel designer and widget plugins

**User-stated direction:** "It drag and drop front pannel. For the indicator and graph control connect the js interface or ready made template directly plugin."

**Interpretation for confirmation:** A browser-technology front-panel designer with drag/drop controls and indicators, including graph components, with either JavaScript interface connectivity or ready-made templates/plugins. The resulting dashboard is intended to be displayed inside LabVIEW WebView (from previous session).

**New proposed model, not yet approved:**
- Separate **Design Mode** (add, place, resize, configure, bind widgets) from **Runtime Mode** (monitor, interact).
- A common component/plugin contract to avoid bespoke JS for every dashboard item.
- Templates are saved arrangements of component instances; plugins provide component appearance and behavior.
- Shared LabVIEW↔JavaScript data gateway with typed tag values and updates, rather than every plugin directly managing TCP/UDP.
- Candidate widgets: numeric indicator, switch, button, LED, gauge, slider, waveform/trend graph, XY graph, table and alarm list.
- Properties include unique ID, position/size, appearance, value/data type, binding to LabVIEW parameter(s), update rates, read-only/write permissions.
- Store the dashboard as a versioned JSON manifest for save/load and reusability. Individual plugin code/assets would be packaged locally for offline runtime.
- Consider GridStack.js for drag/resizable placement and Apache ECharts for charts; do not lock libraries yet.
- Keep logic for equipment safety, authorization and command validation on LabVIEW side; UI submits requests and displays ACK/error.
- Design typed telemetry stream (possibly buffered, throttled/downsampled for graphs) independently of LabVIEW acquisition/control-loop timing.

**Important design questions:**
1. Will users design and edit the dashboard **inside the embedded LabVIEW WebView**, or will a separate web designer export a layout for LabVIEW runtime?
2. Should users bind widgets by selecting enumerated LabVIEW signals/controls, typing tag names manually, or both?
3. Should the first widget set be fixed/built-in, or should users be able to install third-party plugin bundles?
4. What types of graphs and data rates are required?

**Status:** Concept design only. No implementation authorized or libraries selected.

**Web research references:** https://github.com/gridstack/gridstack.js ; https://echarts.apache.org/ ; https://learn.microsoft.com/en-us/microsoft-edge/webview2/get-started/win32 ; https://www.vipm.io/package/sklein_lib_webview2/
