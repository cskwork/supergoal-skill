# HARNESS-MAKE - design a portable agent/skill harness

Use when the user asks to build, design, audit, extend, or integrate a harness: agent team, role set, skills, orchestrator, workflow pack, or reusable agent system.

## Contract

HARNESS-MAKE creates a harness specification and optional generated agent/skill files. It does not run implementation work unless the user routes the produced harness into GREENFIELD, DEBUG, LEGACY, QA-ONLY, or HARNESS-EVAL.

Runtime-neutral by default. Target runtime is an adapter decision, not the workflow itself: Codex skills, Claude Code `.claude/`, Pi agent, MCP tools, normal subagents, or a mixed setup.

Never install or overwrite generated agents/skills without explicit human approval.

## Pipeline

`Intake -> Domain Audit -> Pattern Pick -> Agent/Skill Map -> Orchestrator Draft -> Human Feedback -> Generate -> Verify -> Install/Document -> Journal`

## Steps

1. Intake
   - Restate the domain, target repo, expected outputs, target runtime, and risky side effects.
   - If runtime is not named, default to portable files first.

2. Domain Audit
   - Read repo-local instructions, existing skills, existing agents, docs, tests, and domain references.
   - Mark reuse candidates before proposing new agents or skills.

3. Pattern Pick
   - Load `reference/harness-patterns.md`.
   - Pick the smallest pattern that covers the work.
   - Prefer fewer agents when direct collaboration is enough.

4. Agent/Skill Map
   - Write `templates/harness-spec.md`.
   - Each agent needs role, input, output, allowed tools, failure behavior, and Quality contract.
   - Each skill needs trigger, body, references, and verification hooks.

5. Orchestrator Draft
   - Define sequence, handoffs, files written, and gates.
   - Keep runtime-specific commands in `runtime_adapter`, not in core instructions.

6. Human Feedback
   - Show the harness spec and the files that would be created or modified.
   - Proceed only after explicit approval.

7. Generate
   - Use `templates/harness-agent.md.template` and `templates/harness-skill.md.template`.
   - Preserve existing files unless approval names an overwrite.

8. Verify
   - Run frontmatter checks, trigger checks, and dry-run data-flow checks.
   - For generated skills, create at least one should-trigger and one near-miss prompt.

9. Install/Document
   - Install only approved files.
   - Record adapter, install paths, and rollback steps.

10. Journal
   - Write the decision and verification evidence to `docs/changelog/changelog-YYYY-MM-DD.md`.

## Reject

- Claude-only assumptions in the portable spec.
- Hardcoded model names as policy.
- Team creation for a one-agent task.
- Hidden auto-install.
- Score claims without HARNESS-EVAL evidence.
