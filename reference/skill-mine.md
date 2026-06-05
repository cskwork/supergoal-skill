# SKILL-MINE mode - mine history, suggest 3-5 skills, forge the picked one

Use when the user wants to turn repeated work into a reusable skill: "make a skill", "스킬 만들어",
"learn new skill", "make skill from history/conversation", "이거 자주 하는데 스킬로/자동화". It mines
recent agent session history, surfaces 3-5 candidate skills ranked by frequency x payoff, lets the user
pick (or reject, or name a new one), then forges ONE cross-agent-portable SKILL.md and installs it.

Writes NO production code and needs NO worktree. Read-only except the generated skill directory, its
install targets, and the journal. The human pick is a hard gate: never create or install a skill the
user did not approve - this is the validation gate that Hermes-style autonomous skill creation lacks.

## Pipeline

`Intake -> Window -> Mine -> Rank -> Suggest -> [Human pick/reject] -> Forge -> Verify -> Install -> Journal`

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Capture target agent(s), repo scope, what "useful" means | run note | scope + install targets named |
| Window | Pick adaptive 7-30d window | run note | window days + rationale recorded |
| Mine | Run the mechanical miner | - | miner JSON obtained |
| Rank | Cluster intents, score by frequency x payoff, drop already-skilled | run note | <=5 ranked candidates |
| Suggest | Show 3-5 + evidence; offer "new" and "reject all" | - | candidates shown with recurrence/example |
| Human pick | User picks / rejects / names new | run note | explicit approval recorded (or stop) |
| Forge | Generate portable SKILL.md | skill dir | frontmatter + body within limits |
| Verify | Gate + adversarial check | - | gate exits 0; trigger matches mined pattern |
| Install | Copy/symlink to each chosen agent dir | skill dirs | present in every target; none clobbered |
| Journal | Record mining evidence + decision | `learn/` | journal entry written |

## Window (adaptive)

The miner picks the window: start 7d; if <3 sessions in window, widen to 14 then 30. An active repo
satisfies 7d. Sparse history widens AND lowers `minsup` so thin signal still surfaces.

`node templates/skill-mine/mine.mjs [--repo <slug>] [--all] [--minsup 0.2] [--days N]`

Default repo = current cwd (Claude Code slug = cwd with `/` and `.` replaced by `-`). `--all` mines every
repo. The miner reads `~/.claude/projects/<slug>/*.jsonl` (full tool-call transcripts), NOT the
prompt-only `~/.claude/history.jsonl`.

## Mine + Rank

The miner does the cheap mechanical part; the agent does the semantic part. Dispatch `skill-miner`.

- **Use, do not trust, tool n-grams.** Raw tool-name n-grams (`Bash > Bash`) are generic; context only,
  never a candidate by themselves.
- **Bash signatures** (verb+subcommand, noise-filtered) reveal concrete repeated procedures - e.g.
  `git add`+`git commit`+`git tag`+`gh release` = a release procedure.
- **Intent hints** (first user prompt per session) are the strongest signal. Cluster by intent (one
  actor + one repeated goal each); corroborate with bash signatures. Each recurring cluster is a candidate.
- **Score** = support (fraction of sessions) x payoff (steps/toil removed). Rank, keep top 3-5.
- **Drop already-skilled**: exclude anything in the miner's `alreadySkilled` unless the user asks to
  improve one.

## Suggest + Human pick (anti over-suggestion gate)

Surface a candidate ONLY when `support >= minsup AND it plausibly recurs` (Horvitz mixed-initiative: act
only when expected value beats inaction). Present 3-5 max via `AskUserQuestion`, each with: name, one-line
what+when, recurrence (N sessions / example), estimated payoff. Always include a "make a different skill
(describe it)" option and a "none of these" option. Rejection is free and ends the run cleanly; never
re-pitch a rejected candidate.

## Forge (cross-agent-portable SKILL.md)

A skill is a DIRECTORY with `SKILL.md` as the entrypoint (agentskills.io open standard). Dispatch
`skill-forger`; generate from `templates/skill.md.template`. Portable rules:

- **Directory name = command name**: lowercase letters/digits/hyphens, <=64 chars, no reserved word
  (`anthropic`, `claude`). Frontmatter `name` matches the directory.
- **description** states what AND when, key use case first. Keep `description` + `when_to_use` combined
  <=1536 chars (the skill-listing truncation cap). Description quality IS the discovery mechanism.
- **Body <=~5k tokens** (Claude Code keeps only the first 5k after compaction). Push long reference,
  data, or scripts to bundled files loaded on demand (progressive disclosure), not the body.
- **Stay portable**: the core SKILL.md must run on any agentskills.io agent. Do not depend on Claude
  Code-only frontmatter (`allowed-tools`, `context: fork`, `disable-model-invocation`); add those only as
  an optional Claude-tuned variant if the user asks.

## Verify

1. `node templates/skill-frontmatter-gate.mjs <skill-dir>` exits 0 only when name/description/body pass
   the portable limits above. Never edit the gate to pass.
2. Adversarial check: the description's "when" must match the mined trigger, and the body's steps must
   reproduce the mined procedure. If the skill wraps a command, dry-run it once.

## Install (no auto-sync - copy/symlink to each chosen agent)

Custom skills do NOT sync across agents/surfaces; install the same skill dir to each target picked at
Intake:

| Agent | Personal dir | Project dir |
|---|---|---|
| Claude Code | `~/.claude/skills/<name>/SKILL.md` | `.claude/skills/<name>/SKILL.md` |
| Codex | `~/.codex/skills/<name>/SKILL.md` | personal unless a project dir is confirmed |
| opencode | `~/.config/opencode/skills/<name>/SKILL.md` | personal unless confirmed |
| Hermes | `~/.hermes/skills/<name>/SKILL.md` | - |

If `~/.skills-manager/skills/` exists, prefer the user's existing pattern: write the canonical skill there
once and symlink it into each agent dir (one source, deploy-to-all) instead of copying N times. Never
silently overwrite an existing skill of the same name; on collision show a diff and ask.

## Journal

Append to `learn/skill-mined-<name>-YYYY-MM-DD.md`: the mining window, the candidate set shown, what the
user picked/rejected, the recurrence evidence, and the install targets. Create `learn/` if missing.

## Stop conditions

- User rejects all / picks none: stop cleanly; record the rejection in the journal (informs next run).
- No candidate clears `minsup`: report "no repeated pattern strong enough yet", suggest a wider window or
  `--all`; do not invent a skill.
- Name collides with an existing skill: show the diff, ask before overwrite; never clobber silently.
- A chosen agent's install dir does not exist: report it; install to the agents that are present.
- A skill would embed secrets/tokens/PII surfaced from history: redact; never write them into a skill.
