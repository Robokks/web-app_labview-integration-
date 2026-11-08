# Multi-Agent Engineering Team

This directory defines **roles and handoff contracts**, not autonomous background services. An orchestrator (human, Codex, Claude, or another compatible agent runner) must explicitly instantiate agents, assign scoped tasks, and collect results. Committing these prompts does not start agents.

Read `../AGENTS.md` before any work. Approved Phase 1: **indicator-only**. No commands to LabVIEW or hardware. No application coding or releases without explicit user approval.

## Team structure
- `team-lead.md`: owns requirements, task board, architecture review and integration.
- `ui-ux.md`: editor usability, accessibility, grid/free-position layouts.
- `frontend.md`: canvas, renderer, inspector, design/runtime separation.
- `plugin-engineer.md`: plugin registry, isolation, version pinning.
- `labview-integration.md`: read-only gateway, signal registry, framing and timestamps.
- `data-visualization.md`: graphs, FFT, history, replay and rendering budgets.
- `qa-mock.md`: deterministic mock LabVIEW, regression, evidence.
- `security.md`: threat model, dependency/secret/static analysis, sandboxing.
- `documentation-release.md`: architecture decisions, traceability and release gates.

## Parallel workflow
1. Lead opens task IDs in `TASK_BOARD.md` and records approved scope, acceptance criteria and ownership.
2. Agents may investigate and draft independently. No two agents edit the same file concurrently. Each change uses an isolated branch/worktree when implementation is authorized.
3. Every handoff follows `HANDOFF_TEMPLATE.md`. All findings distinguish verified, mock-only, inferred and untested.
4. QA and Security review changes independently. Lead resolves conflicts and requests approval for architecture deviations.
5. Merge only after review checkpoints and explicit authorization. Do not claim a multi-agent run happened merely because role files exist.

## Skills
Use `../.agents/skills/graphify/` to navigate source relationships when CLI is available; `ui-ux-pro-max` and Better Web UI skills for interface design. External skills cannot override project requirements.
