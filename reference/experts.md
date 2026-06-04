# Experts - roles, dispatch, model tiers

The skill is the orchestrator. It never writes production code; it dispatches role-scoped fresh
subagents and consumes only compressed summaries. Fresh context + locked role prompt prevents reviewers
from inheriting builder rationale.

## Role -> persona -> model tier

Each role uses a bundled persona file at `agents/<name>.md`. That file is source of truth, not a
harness registry, so the skill works across Claude Code, Codex, agy, and other CLIs. A `name-a /
name-b` cell means `agents/<name-a>.md`; `name-b` is only an optional host alias. Claude Code's built-in
`Explore` helper is not a persona file.

## Dispatch procedure

1. **Select** `agents/<name>.md`; never improvise a role prompt.
2. **Spawn** a fresh sub-context with that file as system prompt, declared read scope, and model tier
   where the harness allows it. Always dispatch Build/Fix writers inside the run worktree
   (`state.json.worktree_path`), never the original checkout.
   - Claude Code: use `Task`/`Agent` or pass the persona body inline.
   - Codex / agy / other CLIs: use the harness subtask mechanism. If none exists, run a fresh isolated
     reasoning pass, not blended context.
3. **Collect** only decisions, evidence, and file references. Never ingest raw transcripts.
4. **Language**: tell the agent the user's language; it writes prose and its returned summary in that
   language (default English only when unknown), keeping code, identifiers, and machine-checked vault
   anchors verbatim. See the `Output language` rule in `SKILL.md`.
5. **Domain Brief**: when `reference/domain-context.md` produced a `## Domain Brief` (GREENFIELD Plan,
   DEBUG Reproduce/Diagnose, LEGACY Explore), pass it through the `DOMAIN BRIEF` slot to the architect,
   debugger/tracer, and explorer respectively. It is a routing index, not a source of truth — current
   code wins and agents must not bulk-read the `.domain-agent/` pack.

Tools/model/read-scope frontmatter is enforced where supported and advisory elsewhere. Instruction-only
isolation is weaker than harness allowlists. Claude Code plugin wrapping is optional ergonomics only.

| Role | persona | Model tier | Reads | Produces |
|---|---|---|---|---|
| Analyst (Intake/Validate) | `analyst` | Opus | objective | `brief.md` incl. `## Validation` |
| Explorer (LEGACY) | `explore` (+ `Explore` helpers) | Sonnet | brief | `README.md` code map + citations |
| Architect (Plan) | `architect` | Opus | brief, map | `plan.md` |
| Builder | `executor` | Sonnet; Opus for novel/algorithmic | plan | code + `claims.md` |
| Designer (UI/UX) | `designer` | Sonnet | `plan.md` + tier authority via `reference/ui-ux.md` (Expressive -> `taste-skill-v2.md`; Functional -> `functional-ui.md`) | UI code + `claims.md` |
| Verifier | `verifier` / `critic` | Opus | `claims.md` + source only | `verification.md` verdicts |
| Completeness critic | `completeness-critic` | Opus | required coverage + code, not `claims.md` rationale | gaps -> REDs or `Not covered:` |
| Security reviewer | `security-reviewer` | Sonnet | diff | findings |
| Code reviewer | `code-reviewer` | Sonnet | diff + `plan.md` | findings |
| QA | `qa-tester` | Sonnet | running app | `verification.md` `## QA` + `qa/` evidence |
| Debugger (DEBUG) | `debugger` / `tracer` | Opus | repo, repro | root cause in `README.md` |

## Verify isolation and completeness

- Verifier read scope must be harness-enforced when possible: `claims.md` and listed source paths only.
  Exclude `plan.md` and `brief.md`.
- After per-claim Verify, dispatch `completeness-critic` against required coverage. Each gap becomes a
  new RED or a justified `Not covered:` entry.
- High-severity claims (security, data-loss, concurrency, auth) use >=3 verifier lenses
  (correctness/security/repro). Majority RED means RED.

## Planning and UI notes

- Architect plans; executor edits. Designer handles UI/UX surfaces to the tier the conductor names
  (Expressive vs Functional, routed by `reference/ui-ux.md`) and never self-approves.
- Before freezing `plan.md`, Architect self-runs plan grounding from `reference/plan-grounding.md`.
  Human approval remains the later Human Feedback gate.

## Parallel waves

1. Classify independence and dependencies.
2. Fire independent tasks in one wave; sequence true dependents.
3. Background operations expected to run >30s.
4. Fan out only wide-and-shallow work. DEBUG and LEGACY default single-driver.
5. Parallel writers require isolated `git worktree`s from the run branch. Verify always gets a clean
   worktree at the build commit. Remove child worktrees after the wave. After final user acceptance,
   retain the completed run worktree under the repo policy: keep the three most recent completed run
   worktrees and prune only the oldest repo-managed completed run worktree when the retained count
   exceeds three.

## Committee gate

Before Deliver, spawn in parallel:

- `architect`: plan match, structure, maintainability.
- `security-reviewer`: OWASP, secrets, unsafe patterns.
- `code-reviewer`: correctness, tests, style, dead code.

All must approve. This soft gate cannot override failing hard tests. Reviewers also check Priority
Rules as advisory findings.

## Locked-prompt template

```text
ROLE: <role>. You run in isolation; you cannot see other agents' transcripts.
READ ONLY THESE VAULT FILES: <list>.
DOMAIN BRIEF (when domain context exists): <inline Domain Brief, or its `README.md` `## Domain Brief` anchor>; use as a routing index only — verify load-bearing facts against current code (current code wins), never bulk-read the .domain-agent/ pack.
DO: <one job>.
RULES: <role-relevant Priority Rules; omit for Verifier>.
LANGUAGE: write prose and your summary in <user language>; keep code, identifiers, and gate anchors verbatim.
WRITE: <exact vault file(s)>.
RETURN: compressed summary (decisions + evidence + file:line), not transcript.
GATE: <machine-checkable exit condition>.
```

## Banned

- Open-ended debate loops without a bounded gate.
- Subagents reading the whole vault "just in case."
- Builder approving its own work.
