# AI UI and Repository Understanding Skills

These are **developer-agent skills**, not runtime dependencies for LabVIEW or the operator PC. They should guide design/implementation, not override the approved requirements in [AGENTS.md](../AGENTS.md).

## Sources / licenses
- **Graphify:** https://github.com/Pendia/Graphify — knowledge graph of code and docs. Upstream skill and references copied under `.agents/skills/graphify/`; CLI separately requires the `graphifyy` package (not the unrelated `graphify` PyPI package). Preserve upstream LICENSE and NOTICE.
- **UI/UX Pro Max:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill — design systems, industrial dashboard aesthetics, accessibility and visual polish; upstream MIT license.
- **Better Web UI:** https://github.com/aladicf/better-web-ui — UX critique, accessibility, responsive behavior, data-viz and testing. **Custom MIT-derived license** with source-availability and no-resale restrictions; consult its LICENSE before redistribution. The user's application architecture remains separately licensed.

## Project-scoped usage
Read `AGENTS.md` first. For UI work, apply `ui-ux-pro-max` to propose a design direction, then use Better Web UI `frontend-design`, `critique`, `data-viz`, `adapt`, `audit`, and `test` to check hierarchy, accessibility, responsive interactions and graphs. Use `setup` to keep design context aligned with `.better-web-ui.md`.

Graphify may index the docs now; once code exists, rebuild/index code and docs, then query paths and components. **A graph cannot prove that an implementation works.** Every inferred relation requires source verification.

If the Graphify CLI isn't installed on the developer PC, the agent must report **Graphify CLI unavailable** rather than pretend a graph was generated. Recommended upstream human-run commands:

```powershell
# Windows developer PC — run only after reviewing the upstream packages
uv tool install graphifyy
graphify install --project --platform agents
graphify .
```

These commands are **not** needed on the test-rig runtime PC. Do not add AI skill files to the distributed operator executable.

## Suggested skill refresh (developer machine only)
Both UI skill repositories publish their own installers. For a full/updated upstream installation in a developer checkout:

```powershell
npx ui-ux-pro-max-cli init --ai universal
npx skills add aladicf/better-web-ui --agent codex --skill frontend-design --skill setup --skill critique --skill audit --skill data-viz --skill adapt --skill test
```

These install commands can change over time; review changes, licenses and scripts before running. **Never auto-run them in production, CI or the offline operator runtime.** The committed skill snapshots are usable as instructions without needing those installer commands.

## Acceptance
AI output must give exact changed paths, cite source facts, list real/mock/not-tested checks, identify unsupported assumptions and stop on security checkpoint failures. Phase 1 is indicator-only; do not generate hardware command endpoints.
