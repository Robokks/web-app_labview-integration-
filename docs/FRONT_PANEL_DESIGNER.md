# Concept 03 — Drag-and-drop Web Front Panel Designer for LabVIEW

**Stage:** Brainstorming and design proposal; no implementation approved  
**Last reviewed:** 2026-11-08

## User-stated requirements (confirmed statements only)

- Render a dashboard **inside LabVIEW** through a WebView toolkit.
- Front panel is constructed through **drag-and-drop**.
- Widgets include **indicators** and **graphs** (additional controls are proposed, not yet confirmed).
- Consider binding controls to a **JavaScript interface**, or directly using **ready-made templates/plugins**.
- Compare JavaScript, TCP, UDP transport approaches.

The exact editor location and data-binding mechanism have **not** yet been confirmed.

## Concept: a reusable HMI designer, not custom HTML for each VI

There are two related assets:

1. **Widget plugin:** reusable visual component (e.g. gauge, graph, button), with property definitions, renderer, lifecycle methods, typed data inputs, and optional commands/events.
2. **Template:** saved dashboard/page containing widget instances, layout, bindings, appearance and page navigation. A template should not have to implement its own transport.

A single shared **JavaScript–LabVIEW Bridge** routes messages to all widgets. Avoid independent raw network access per plugin.

## Possible editor user experience (draft)

```text
+----------------+--------------------------------+--------------------+
| Widget palette | Designer canvas                | Selected properties|
| Gauge          | +----------+ +---------------+ | Label: Speed       |
| Graph          | | Speed    | | Torque        | | Bind: Motor.Speed  |
| Button         | | 1450 RPM | | 82 Nm         | | Unit: RPM          |
| Switch         | +----------+ +---------------+ | Min: 0 / Max:3000  |
| Slider         | +----------------------------+ | Rate: 100 ms       |
| LED            | | Live speed / torque trend  | | Read-only: yes     |
| Table          | +----------------------------+ | Theme: Dark        |
+----------------+--------------------------------+--------------------+
| Design / Preview / Run | Save JSON layout | Templates           |
+------------------------------------------------------------------+
```

### Design Mode
- Drag widgets from palette; resize and reposition.
- Select a widget to configure appearance, scale, unit, binding, data type and optional events.
- Configure graph channels, axes, time window, history/buffer limit and refresh rate.
- Save/reopen a versioned layout in a portable project format.
- Apply templates without writing widget-specific JavaScript.
- Preview with simulated data before binding to an actual LabVIEW application.

### Runtime Mode
- Load saved layout; hide designer controls and lock widget positions.
- Receive values/quality/timestamps; display stale/offline states on lost connection.
- Send validated user commands to LabVIEW and display ACK/reject/timeout.
- Retain data acquisition and safety-relevant control loops outside the browser UI.

## Candidate widget types

| Widget | Data direction | Notes |
|---|---|---|
| Numeric / string indicator | LabVIEW -> JS | Formatting, units, limits |
| LED / alarm indicator | LabVIEW -> JS | Boolean/state maps and quality |
| Analog / digital gauge | LabVIEW -> JS | Range, thresholds, colors |
| Waveform / trend graph | LabVIEW -> JS | Multichannel series, time axis, bounded buffer |
| XY graph | LabVIEW -> JS | Numeric x/y pairs, optional multiple series |
| Button / toggle | JS -> LabVIEW | Action or setpoint request; ACK/status |
| Slider / numeric entry | JS -> LabVIEW | Bounds, type conversion, permissions |
| Table / log viewer | LabVIEW -> JS | Incremental rows and pagination |
| Layout container | Neither | UI grouping and reusable templates |

## Candidate implementation layers

```text
WebView running HTML/CSS/JavaScript
  |-- Designer (drag/resize/select/edit)
  |-- Widget registry (built-in and optional third-party components)
  |-- Dashboard template loader + layout saver
  |-- Binding engine (maps widget instance <-> typed LabVIEW tag)
  `-- Shared WebView message client
            || WebMessage / host bridge / optional web API
LabVIEW host
  |-- WebView adapter and message dispatcher
  |-- Tag registry / data publisher
  |-- Command validator + ACK
  `-- Independent acquisition, control and test logic
```

**Preferred hypothesis to test:** WebView2 WebMessage for the embedded UI bridge because it avoids the complexity of a separate TCP/UDP server for ordinary same-host UI traffic. Browser JS itself cannot use raw TCP/UDP. A native LabVIEW network process, or service adapting TCP/UDP to a web-supported transport, is a possible later extension.

## Conceptual plugin contract (no code)

Each widget exposes:
- Type and version, manifest metadata and required assets.
- Configurable properties (label, theme, bounds, graph options).
- Typed input and optional output capabilities.
- Lifecycle: create, mount, resize, update data, dispose.
- Optional interactions: click, change, write request, acknowledge/error.
- Feature requirements and validation schema.
- Version compatibility with the designer and runtime.

Security note: only allow approved local plugin bundles by default; plugins executing JavaScript can otherwise execute arbitrary code in the WebView context. Prefer an explicit permission model, asset integrity checks and message validation.

## Conceptual template / layout representation

A versioned project file contains page layout; widgets with IDs/types/versions; positions and sizes; property values; bindings to signal identifiers; graph configuration; and optional theme. Keep signal values, credentials and hardware network parameters outside reusable templates. Templates refer to plugin types rather than duplicate plugin implementation code.

## Candidate third-party libraries (research; not selected)

- GridStack.js — drag/resizable grid, serialization: https://github.com/gridstack/gridstack.js
- Apache ECharts — charts with programmatic data update: https://echarts.apache.org/
- WebView2 Toolkit for LabVIEW (sklein) — WebView host, JS execution and WebMessage events: https://www.vipm.io/package/sklein_lib_webview2/
- Microsoft WebView2 host/web messaging reference: https://learn.microsoft.com/en-us/microsoft-edge/webview2/get-started/win32

Evaluate library licenses, exact compatibility, responsiveness and offline packaging before selecting anything.

## Design risks and tests to consider later

- WebView toolkit build, 32/64-bit compatibility, installation and runtime dependencies.
- WebView/UI event thread stalls while sending high-frequency graph data.
- JSON message overhead, delivery ordering, buffering, timestamps and downsampling.
- Single-source-of-truth for tag metadata and state when a page is reloaded.
- Feedback loops (a JS slider updates LabVIEW, which echoes it to JS).
- Input validation, read/write permissions, command ACK, hardware interlocks.
- Performance with many widgets/pages and concurrent graphs.
- Migration of older layout templates as plugin versions evolve.
- Offline packaging and authoring of user-defined plugins.

## Decisions pending

1. **Designer placement:** edit in the WebView embedded in LabVIEW, or external designer with an embedded LabVIEW runtime viewer?
2. **Data binding UX:** browse LabVIEW exposed signals, type names, import definitions, or a combination?
3. **Plugin installation:** built-in widgets only initially, or external locally installable widget bundles from version 1?
4. **Primary graph types/data rate:** trends, waveform, XY, high-rate buffered waveforms?
5. **Configuration storage:** project-local JSON vs shared library; no final selection yet.

No source code should be started from this concept note alone.