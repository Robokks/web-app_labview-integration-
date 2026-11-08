# Web App – LabVIEW Integration

**Stage:** Concept exploration / brainstorming  
**Repository:** `Robokks/web-app_labview-integration-`  
**Started:** 2026-11-08

## Purpose

Explore and design a flexible integration between a browser-based web application and LabVIEW. The exact product scope has **not yet been decided**. This repository is the versioned home for our design discussions, alternatives, questions and decisions.

No implementation is authorized by these concept documents.

## Brainstorm workflow

1. Discuss an idea in chat.
2. Record a concise, dated summary in [docs/DESIGN_LOG.md](docs/DESIGN_LOG.md) (not a verbatim chat transcript).
3. Put alternatives and trade-offs in [docs/CONCEPTS.md](docs/CONCEPTS.md).
4. Move an idea to [docs/DECISIONS.md](docs/DECISIONS.md) only when explicitly agreed; proposed ideas remain marked **Unconfirmed**.
5. Later create requirements, interface specifications, diagrams and source code after scope and architecture are agreed.

**Important:** GitHub updates occur only when the assistant actively performs a commit during a chat turn; this is not background or automatic synchronization. Never put credentials, tokens, customer data, internal network addresses, or private documents in this public repository.

## Candidate starting architecture (unconfirmed)

```text
Browser UI  <-->  Web API / Gateway  <-->  LabVIEW Application
(view/control)    (auth, events, types)     (acquisition/control)
```

Potential gateway approaches: LabVIEW-native services, Python integration service, or Node.js integration service. We will compare their trade-offs before choosing.

## Questions to settle

- What is the **primary product**: an existing LabVIEW application's remote dashboard, a configurable drag-and-drop web front panel, a general LabVIEW integration API, or a combination?
- Is the first target Windows LabVIEW, cRIO Real-Time, or both?
- Which interactions must be supported first: telemetry, commands, configuration, profiles, alarms, or file/report transfer?
- Will the system run locally, over a LAN, or across remote networks?

See [docs/DESIGN_LOG.md](docs/DESIGN_LOG.md) for the evolving discussion.
