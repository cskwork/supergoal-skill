# HARNESS-MAKE - design and install a portable agent/skill harness

Use when the user asks to build, design, audit, extend, or integrate a harness:
agent team, role set, skills, orchestrator, workflow pack, or reusable agent
system.

## Contract

HARNESS-MAKE creates a harness specification and optional generated agent/skill
files. It does not run product implementation work unless the user routes the
produced harness into GREENFIELD, DEBUG, LEGACY, QA-ONLY, or HARNESS-EVAL.

Runtime-neutral by default. Target runtime is an adapter decision, not the core
workflow: Codex skills, Claude Code, Pi agent, MCP tools, normal subagents, or a
mixed setup.

Draft paths are reviewable artifacts, not active runtime registries. Use them for
specs, previews, evidence, and archived generated files only.

Approved active files must be written to the selected runtime_adapter
install_target. Do not place runnable agents under `.domain-agent/` unless that
exact path is the documented active registry for the selected adapter.

Never install or overwrite generated agents/skills without explicit human
approval. After explicit approval, generate, install, verify, and journal without
asking again unless a new overwrite or new install target appears.

## Pipeline

`Intake -> Domain Audit -> Pattern Pick -> Agent/Skill Map -> Orchestrator Draft -> Human Feedback -> Generate -> Install -> Verify -> Document -> Journal`

## Steps

1. Intake
   - Restate domain, target repo, outputs, runtime, and expected active behavior.
   - Default to `portable` until the active runtime adapter is selected.

2. Domain Audit
   - Read repo-local instructions, existing skills, existing agents, docs, tests,
     and domain references.
   - Mark reuse before new agents.
   - Detect any existing active agent/skill registry for the selected runtime.

3. Pattern Pick
   - Load `reference/harness-patterns.md`.
   - Pick the smallest pattern that preserves quality.
   - Prefer fewer agents when one cohesive agent can do the work.

4. Agent/Skill Map
   - Fill `templates/harness-spec.md`.
   - Record both `draft_root` and `active_install_target`.
   - Each agent needs role, input, output, allowed tools, failure behavior, and a
     quality contract.
   - Each skill needs trigger, body, references, and verification hooks.

5. Orchestrator Draft
   - Define sequence, handoffs, files written, gates, and retry bound.
   - Keep runtime-specific commands in the spec `runtime_adapter` section, not in
     portable agent or skill bodies.

6. Human Feedback
   - Show the harness spec, `draft_root`, `active_install_target`, exact files to
     create or modify, overwrite list, rollback steps, and verification commands.
   - If the user approves those files and locations, continue automatically
     through Generate, Install, Verify, Document, and Journal.
   - Ask again only for a new overwrite, new active install target, or file not in
     the approved list.

7. Generate
   - Use `templates/harness-agent.md.template` and
     `templates/harness-skill.md.template`.
   - Generate review copies under `draft_root` if useful.
   - Preserve existing files unless approval names an overwrite.

8. Install
   - Copy or write approved active files into `active_install_target`.
   - For this `supergoal` skill itself, active role personas are
     `agents/<role>.md`.
   - For external runtimes, verify the active registry from current adapter docs
     or existing repo config before writing files.

9. Verify
   - Run frontmatter checks, trigger checks, dry-run data-flow checks, and any
     adapter-specific registry/listing check available.
   - For generated skills, create at least one should-trigger and one near-miss
     prompt.
   - Record evidence that the active runtime can see or load the installed files.

10. Document
   - Record adapter, draft path, active install path, files installed, files
     overwritten, and rollback steps.

11. Journal
   - Write the decision and verification evidence to
     `docs/changelog/changelog-YYYY-MM-DD.md`.

## Reject

- Claude-only assumptions in the portable spec.
- Hardcoded model names as policy.
- Team creation for a one-agent task.
- Hidden auto-install.
- Treating .domain-agent/harness/agents/ as active agent installation.
- Installing into a guessed runtime path.
- Score claims without HARNESS-EVAL evidence.
