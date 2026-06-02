# Experts — roles, dispatch, model tiers

The skill is the **orchestrator**. It does not write production code; it dispatches role-scoped
subagents and ingests only their **compressed summaries** (never raw transcripts) — the converged
2026 pattern (Anthropic multi-agent research system; LangChain; flowhunt.io). Each subagent runs in
a **fresh context** with a **locked role prompt** and reads only its allowed vault files, so a critic
never inherits the coder's rationalizations (arxiv 2507.19902 AgentMesh; arxiv 2506.17208).

## Role → persona → model tier

Each role is a **bundled persona file** at `agents/<name>.md` (a system-prompt body + advisory
`tools`/`model` frontmatter). The **persona file — not any harness's agent registry — is the source of
truth**, so the skill is self-contained and **harness-agnostic**: it runs the same way under Claude
Code, Codex, agy, and other coding CLIs. The roster's name column is the persona basename (e.g.
`verifier` → `agents/verifier.md`). A `name-a / name-b` cell means the role's persona is
`agents/<name-a>.md`; `name-b` is only an alternate registered agent-type a Claude Code host may bind it
to (e.g. `verifier`/`critic`, `debugger`/`tracer`), **not** a second file. The built-in `Explore` helper
is a Claude Code agent, not a persona file.

**Dispatch procedure (every harness).** To run a role:

1. **Select** the persona — read `agents/<name>.md`. The orchestrator only *selects* the file; it never
   improvises a role prompt.
2. **Spawn** a fresh sub-context whose system prompt is that file's body, granting only the read-scope
   the persona declares, pinned to its model tier where the harness lets you choose a model.
   For coding/debug modes, dispatch Build/Fix writers inside the run worktree recorded in
   `state.json.worktree_path`; do not let writers edit the original checkout.
   - *Claude Code:* `Task`/`Agent`. If a same-named agent is registered — or the repo is wrapped in the
     optional `.claude-plugin/plugin.json` so `agents/*.md` auto-register — call it by `subagent_type`
     and the harness auto-injects persona + tools + model. Otherwise pass the file body as the inline
     `prompt`.
   - *Codex / agy / other CLIs:* use the harness's sub-task/sub-agent mechanism with the file body as
     the role prompt. If the harness has **no** sub-agent mechanism, run the role as a **fresh, isolated
     reasoning pass** — never blended with prior role context.
3. **Collect** only the role's compressed summary (never its raw transcript).

Pin the model per role for predictable cost (token spend explains ~80% of multi-agent performance
variance — Anthropic). Frontmatter `tools`/`model` and the declared read-scope are **enforced** where
the harness supports it (Claude Code `tools`/`allowedTools`) and **advisory** elsewhere — instruction-only
isolation is weaker than harness-enforced (see the Verifier note below). The optional Claude Code plugin
wrapper is an ergonomics layer only; it must never become a dependency.

| Role | persona (`agents/<name>.md`) | Model tier | Reads (vault) | Produces |
|---|---|---|---|---|
| Analyst (Intake/Validate) | `analyst` | Opus | objective | `brief.md` (incl. `## Validation`) |
| Explorer (LEGACY Explore) | `explore` (fan out `Explore` helpers for parallel mapping) | Sonnet | brief | `README.md` (codebase map + file:line citations) |
| Architect (Plan) | `architect` | Opus | brief, README map | `plan.md` (incl. architecture + contracts) |
| Builder | `executor` | Sonnet (Opus if novel/algorithmic) | plan | code + `claims.md` entry |
| Designer (UI/UX jobs only) | `designer` | Sonnet | `plan.md` + `reference/taste-skill-v2.md` | UI code to taste-skill v2 rules + dial values; `claims.md` entry |
| Verifier (adversary) | `verifier` / `critic` | Opus | `claims.md` + source only (harness-enforced — see below) | `verification.md` verdicts |
| Completeness critic | `completeness-critic` (CC alt agent-type: `critic`) | Opus | required-coverage list + code (NOT `claims.md` rationale) | gaps → new REDs / justified `Not covered:` entries |
| Security reviewer | `security-reviewer` | Sonnet | diff | findings |
| Code reviewer | `code-reviewer` | Sonnet | diff + `plan.md` | findings |
| QA | `qa-tester` | Sonnet | running app | `verification.md` (`## QA`) + `qa/` evidence (drives the app with agent-browser — `reference/qa.md`) |
| Debugger (DEBUG mode) | `debugger` / `tracer` | Opus | repo, repro | root cause to `README.md` |

**Verifier read-scope isolation** is harness-enforced: dispatch the Verifier subagent with
`allowedTools` (or an equivalent read-allowlist) restricted to `claims.md` and the source paths
listed there. `plan.md` and `brief.md` must not be in the allowlist. Instruction-only isolation is
insufficient — a subagent can read any file it can reach unless the harness blocks it.

**Completeness critic & diverse verifier panel.** After per-claim Verify, dispatch a fresh
`completeness-critic` against the required-coverage list (brief acceptance criteria + domain checklist —
`reference/quality-gates.md`) to name what is NOT covered; each gap is a new RED or a justified
`Not covered:` entry. For **high-severity** claims (security / data-loss / concurrency / auth), replace
the single verifier with a **≥3-verifier panel of distinct lenses** (correctness / security / repro) and
take majority RED → RED. Diverse lenses beat redundant same-lens votes; cost-gate the panel to
high-severity claims only.

Architect/editor split inside Build (Aider architect-mode evidence, directional): the architect
produces the diff intent / plan, the executor emits the actual edits. A reasoning pass plans, a
precise pass writes. On **UI/UX jobs** (`reference/ui-ux.md`) the Designer replaces/augments the
editor for visual surfaces, and the QA gate adds the taste-skill v2 Pre-Flight Check (§14); the
committee and adversarial Verify are unchanged — the Designer never self-approves.

Plan grounding (Architect, Plan phase): before freezing `plan.md`, the Architect self-runs the
grounding pass — a `grill-with-docs`-style self-grill for feature work, an
`improve-codebase-architecture`-style deepening pass for refactor objectives — and **answers each
challenge itself** from the explored docs (`CONTEXT.md`, ADRs, `brief.md`, the map), never by asking
the human. The human's single approval stays the later Human Feedback gate. Method:
`reference/plan-grounding.md`.

## Parallel-wave dispatch (from ultrawork)

1. Classify tasks by independence; build a dependency matrix.
2. Fire all **independent** tasks in the same wave simultaneously (one message, multiple `Task`
   calls). Sequence only true dependents.
3. Use `run_in_background: true` for any op > ~30s (installs, builds, full test runs).
4. **Gate fan-out behind the topology rule** (`pipeline.md`): only wide-and-shallow work fans out.
   DEBUG / LEGACY feature work stays single-driver with isolated helpers for independent probes.
5. **Isolate parallel writers in a `git worktree`** — the run starts in one branch-scoped worktree;
   each fanned-out Build slice can add a child worktree from that run branch if simultaneous writes are
   truly independent. The adversarial Verify still gets its own clean worktree at the build commit.
   No install; remove child worktrees when the wave ends and remove the run worktree only after final
   user acceptance.

## The committee gate (before Deliver)

Spawn reviewers in parallel, each with a **distinct mandate** — a diverse committee finds more
defects than one generic reviewer (arxiv 2511.16708 Codex-Verify; arxiv 2506.17208):

- `architect` → does it match `plan.md` + sound structure / maintainability?
- `security-reviewer` → OWASP, secrets, unsafe patterns?
- `code-reviewer` → correctness, tests, style, dead code?

ALL must approve. This is the **soft gate** — it scores quality/security but **can never override a
failing hard test** (`quality-gates.md`). Each reviewer also checks the diff against the run's
`## Priority Rules` (advisory — violations are findings, not a hard fail; `domain-rules.md`).

## Locked-prompt template (give every dispatched subagent)

```
ROLE: <role>. You run in isolation; you cannot see other agents' transcripts.
READ ONLY THESE VAULT FILES: <list>.   (do not read beyond your scope)
DO: <the one job>.
RULES: <role-relevant Priority Rules lines the conductor injects — advisory; omit for the Verifier>.
WRITE: <exact vault file(s) to append/update>.
RETURN: a compressed summary (decisions + evidence + file:line), NOT your transcript.
GATE: <the machine-checkable exit condition for this phase>.
```

## Anti-patterns (banned)

- Open-ended N-round debate / GroupChat loops that multiply tokens without a bounded gate
  (AutoGen-style) — use graph-style handoffs with checkpoints instead.
- A subagent reading the whole vault "just in case" — breaks role separation and inflates cost.
- The builder approving its own work — only a fresh Verifier sets a GREEN verdict.
