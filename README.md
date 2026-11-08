# Web App – LabVIEW Integration

**Status:** Concept exploration / brainstorming (no architecture frozen)  
**Started:** 2026-11-08

## Goal

Design a dashboard using web technologies displayed **inside a LabVIEW application's front panel** through a WebView toolkit. Explore bidirectional transfer between JavaScript and LabVIEW through WebMessage, TCP or UDP; compare approaches before choosing.

## Current working concept (not approved for implementation)

```text
+-----------------------------------------------------------+
| LabVIEW Windows Application                               |
|                                                           |
|  +-----------------------+                                |
|  | Embedded WebView      |  HTML / CSS / JavaScript        |
|  | Dashboard             |                                |
|  +-----------+-----------+                                |
|              | UI bridge / WebMessage / optional network  |
|  +-----------v-----------+                                |
|  | LabVIEW message and   |                                |
|  | command dispatcher    |                                |
|  +-----------+-----------+                                |
|              |                                            |
|  +-----------v-----------+                                |
|  | Acquisition and       |                                |
|  | control application   |                                |
|  +-----------------------+                                |
+-----------------------------------------------------------+
```

A local JavaScript/WebMessage interface may avoid running a separate network server. TCP or UDP may be relevant to another native process or remote hardware, but embedded browser JavaScript cannot directly open ordinary raw TCP/UDP sockets. These are still candidate choices only.

## Brainstorm documentation

- [Design log](docs/DESIGN_LOG.md) — dated discussion summaries, user ideas and unresolved questions.
- [Architecture alternatives](docs/ARCHITECTURE_OPTIONS.md) — WebMessage, TCP, UDP and hybrid designs.
- [Drag-and-drop front panel designer](docs/FRONT_PANEL_DESIGNER.md) — reusable widget plugins, templates, tag bindings and edit/run modes.

## Working rules

1. Brainstorm and record the user's actual requirements before freezing any architecture.
2. Distinguish **user-stated direction**, **proposed ideas**, **researched facts**, and **approved decisions**.
3. Discuss design and trade-offs before coding. Do not start implementation until specifically agreed.
4. Keep source code, private information, credentials and customer data out of the discussion log.
5. Update these files through explicit GitHub writes during active conversations. Chat messages do **not** automatically synchronize with GitHub.

## Open topics

- Exact WebView toolkit and LabVIEW version.
- Dashboard widgets and whether the layout is editable.
- Update rates, datasets and the UI-to-LabVIEW command model.
- Local-only vs networked clients.
- Safety, lifecycle, error and reconnection behavior.
