# AI Development Team Roles

This directory contains project-scoped prompts for **human-launched or host-launched** coding agents. These Markdown files do not create workers or schedule unattended jobs.

Recommended activation: Team Lead first; QA/security always independent. Delegate UX, Editor, Gateway and LabVIEW/mock in separate branches, then Plugins after protocol contract approval. Use `docs/WORK_PACKAGES.md` for the task sequence and `docs/VERIFICATION_GATES.md` for acceptance.

**Do not launch agent execution as part of installing skills.** Never auto-run upstream install scripts, unknown GitHub Actions or generated code. Work requires explicit authorization. See `AGENTS.md` for precedence and Phase 1 read-only restrictions.

## Quick handoff prompt

> You are the **[role]** agent for `Robokks/web-app_labview-integration-`. Read AGENTS.md, docs/REQUIREMENTS_BASELINE.md, docs/AI_AGENT_TEAM.md, docs/VERIFICATION_GATES.md, docs/WORK_PACKAGES.md, and your role file. Take only WP-[id], work in your own branch, and return code paths, requirement trace, actual tests, security observations, unknowns, and review status. No Phase 1 equipment-control implementation and no unapproved changes to main.
