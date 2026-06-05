# 2026-06-05 — SKILL-MINE mode (mine history → suggest → forge skill)

## What

Added a 7th supergoal mode, **SKILL-MINE**: mine recent agent session history, suggest 3-5 candidate
skills ranked by frequency x payoff, let the user pick/reject, then forge ONE cross-agent-portable
`SKILL.md` and install it. Backed by a deep-research report (Hermes precedent, pattern-mining methods,
agentskills.io spec, Horvitz mixed-initiative UX) + local ground-truth verification.

New files:
- `templates/skill-mine/mine.mjs` — mechanical miner. Reads `~/.claude/projects/<slug>/*.jsonl`, picks
  an adaptive 7-30d window, emits frequent tool-name n-grams + Bash command signatures + per-session
  intent hints + already-used skills. Pure Node, no deps.
- `reference/skill-mine.md` — mode procedure (Window/Mine/Rank/Suggest/Human-pick/Forge/Verify/Install/Journal).
- `agents/skill-miner.md` (read-only mine+rank), `agents/skill-forger.md` (forge+verify).
- `templates/skill-frontmatter-gate.mjs` — validates a generated SKILL.md against portable limits.
- `templates/skill.md.template` — portable SKILL.md skeleton.
- `SKILL.md` — wired the mode into Step 0 table, mode descriptions, Vault note, Reference map, Template scripts.

## Why these decisions

- **Mine `projects/*.jsonl`, not `history.jsonl`.** Hermes's own Claude Code importer reads
  `~/.claude/history.jsonl` (user prompts only). Local inspection confirmed `projects/<slug>/<sid>.jsonl`
  carries full `tool_use`/`tool_result` blocks (`{type,id,name,input,caller}`) + `timestamp`, `gitBranch`,
  and `attributionSkill` (which skill produced output → used to dedupe already-skilled work). Tool-call
  context is the signal; prompt-only history is too thin.
- **Hybrid mining (mechanical script + agent semantics), not pure-LLM or pure-PrefixSpan.** The script
  does the cheap frequency part; the agent clusters intents and names skills. Avoids running an LLM over
  30 days of history and avoids an external embedding API dependency (the agent IS the LLM).
- **Tool-name n-grams are context only, never a candidate.** Real-data experiment on this repo (19
  sessions, 1290 tool-calls, 7d window) showed tool n-grams degenerate to `Bash > Bash` / `Read > Read`
  (support 0.9-1.0, zero meaning). The signal lives in Bash signatures (`git tag` + `gh release` = a
  release procedure) and intent-prompt clusters ("make skill improvement…", "update to .claude and
  .codex skill", "do vX release"). This is the research's domain-transfer caveat #3, confirmed on real
  LLM-agent transcripts.
- **Noise-filter Bash builtins** (`echo/cd/ls/pwd/cat/…`) so concrete procedures (`git`, `gh release`,
  `node <script>`) surface above shell glue.
- **Human pick is a hard gate.** Hermes auto-creates skills with no external validation (its documented
  weakness, issue #25833). SKILL-MINE never creates/installs without explicit approval; rejection is free
  and ends the run.
- **Portable SKILL.md = agentskills.io directory standard.** Re-verified current spec: command name comes
  from the directory; `description` + `when_to_use` truncate at **1,536 chars** in the listing (not the
  older 1,024); body kept ≤~5k tokens (Claude Code retains only the first 5k after compaction). Avoid
  Claude-Code-only frontmatter so one skill runs on any agentskills.io agent.
- **Install copies/symlinks to each agent dir; no auto-sync.** Confirmed `~/.claude/skills`,
  `~/.codex/skills`, `~/.config/opencode/skills` all exist on this machine. Prefer symlink-from-canonical
  when `~/.skills-manager/skills/` is present (matches the user's existing deploy-to-all pattern).

## Verified

- Miner runs on real history: 7d window auto-selected (19 sessions), surfaces the release procedure +
  recurring intents. Sparse/non-existent repo widens to 30d and returns empty valid JSON. `--all` mines
  850 sessions (99 in 7d, 7713 tool-calls).
- Frontmatter gate: 5/5 cases — valid skill exits 0; uppercase name, empty description, combined >1536,
  and missing SKILL.md each exit 1.
- `node --check` clean on both scripts.

## Not done / follow-ups

- README landing page still says "6 modes" — update the grid to 7 if the mode ships.
- Codex/opencode *project-level* skill dirs and pi-agent paths not individually confirmed (personal dirs
  confirmed). Verify before installing project-scoped skills there.
- Live agent-driven flow (skill-miner dispatch → AskUserQuestion → forge → real install) validated
  component-by-component; the end-to-end runtime runs when the user triggers SKILL-MINE.
