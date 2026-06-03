# Vault - only cross-phase state

Every run creates `docs/changelog/<date>-<slug>/` in the target repo. This tracked folder is the
single blackboard for fresh subagent contexts and the permanent, browsable changelog. `<slug>` is
kebab-case objective; `<date>` is ISO date. Create `docs/` if absent.

## Files

Keep six files unless read-scope requires more separation:

| File | Writer | Mutability | Holds |
|---|---|---|---|
| `README.md` | any; orchestrator owns | append-only | audit log: decisions, hypotheses, skips, escalations, `## Priority Rules` |
| `brief.md` | Analyst | frozen per section | goal, audience, acceptance criteria, non-goals, GREENFIELD `## Validation` with `Decision: GO/NO-GO` |
| `plan.md` | Architect; DEBUG Diagnose | frozen once written | slice/fix plan, Architecture, Contracts, `## Human Feedback` packet |
| `claims.md` | Builder | append-only, untrusted | one claim per slice + `run-to-prove` |
| `verification.md` | Verifier + QA | append-only | claim verdicts, one aggregate `verdict: GREEN/RED`, `## Coverage`, `## QA` |
| `state.json` | orchestrator | live machine state | mode, phase, cycles, signatures, plan hash, approval, branches/worktree |

Merged legacy files: `validation.md` -> `brief.md`; `architecture.md`/`contracts.md` -> `plan.md`;
`qa-report.md` -> `verification.md`; `decisions.log` -> `README.md`. When consolidating existing vaults,
use `git rm` for removed legacy files.

## Non-vault domain knowledge

Repo-local domain knowledge lives outside the vault, default `.domain-agent/`; see
`reference/domain-context.md`. The vault may contain a compact `## Domain Brief` and audit entries
about domain-context initialization or updates, but not the full knowledge pack.

## Branch/worktree fields

Coding/debug runs record before Intake writes:

```json
"base_branch": "main",
"target_branch": "main",
"run_branch": "supergoal/2026-06-02-add-sso",
"worktree_path": "/abs/path/.supergoal-worktrees/2026-06-02-add-sso",
"worktree_retention": {
  "scope": "repo-managed completed run worktrees",
  "keep_recent": 3,
  "recent_by": "accepted_at timestamp; fallback to worktree directory mtime",
  "prune": "oldest first only when retained count exceeds keep_recent"
}
```

`base_branch` creates the run worktree. `target_branch` receives the accepted merge; default equals base
if the user gave only one branch. `run_branch` stores implementation commits. `worktree_path` is where
Build/Fix writers work. `worktree_retention` keeps accepted run worktrees available for review while
preventing repo-local worktree buildup; it never targets the active run worktree, original checkout, or
manual worktrees outside the repo-managed pool.

## `cycles`

Fixed keys across all modes:

```json
"cycles": {
  "intake": 0, "validate": 0, "plan": 0, "human_feedback": 0, "build": 0,
  "verify": 0, "qa": 0, "deliver": 0,
  "reproduce": 0, "diagnose": 0, "fix": 0, "explore": 0
}
```

Increment the relevant key on each rewind. Unused phases stay 0.

## `error_signatures`

Map normalized error signature to count, managed by `templates/circuit-breaker.mjs`.

Normalization: first failing assertion + `file:line`, lowercase, trimmed before the first `at ` frame.

```json
"error_signatures": {
  "assertionerror: expected 200 but got 401 auth.spec.ts:42": 2
}
```

When count reaches `circuit_breaker_threshold` (default 3), the script exits 1 and the orchestrator
halts the fix loop.

## `plan_hash`

On Plan exit, store `shasum -a 256 plan.md`. Before Deliver, re-hash and compare. Mismatch fails unless
`README.md` logs `RE-PLAN:`.

## `approval`

`null` until the human approves Build/Fix:

```json
"approval": { "phase": "<phase-name>", "status": "APPROVED" }
```

No source-tree write while `approval` is `null`. Use this exact field; no variants.

## `plan.md` Human Feedback packet

Do not add `approval.md`. Append this to `plan.md`:

```md
## Human Feedback

### Plain-language brief
<short non-developer explanation>

### Technical brief
<novice-dev-friendly plan: files/modules, tests, risks>

### Terms
- <term>: <plain definition>

### Approval request
Approve <Build|Fix>, request changes, or stop.
```

Plain-language comes before technical. Technical defines hard terms. The gate checks this packet and
`state.json.approval`.

## Trust rules

1. **`claims.md` is untrusted.** Builder asserts; Verifier proves from a clean state while reading only
   `claims.md` + source. Self-reported done is insufficient.
2. **Frozen files stay frozen.** Build implements `plan.md`; it does not redesign mid-build.

## `claims.md` format

```md
## CLAIM <slice-id>
what: <one line>
files: <paths touched>
run-to-prove: <exact shell command that exits 0 iff claim holds>
expected: <passing output>
```

## `verification.md` completeness

```md
## Coverage
<required coverage = brief acceptance criteria + domain checklist>
- <criterion / vuln-class>: <claim id or probe> - GREEN
...
Not covered: <items not verified with justification, or 'none'>
Regression tests: <permanent tests for fixed REDs, or 'none'>
```

GREEN means every enumerated item re-verified. `Not covered:` forces known gaps into review.

## Resumption

On re-invocation, read `state.json.current_phase` and resume. The vault + git history reconstruct state;
do not rely on memory.
