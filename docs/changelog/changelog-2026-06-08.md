# Changelog - 2026-06-08

## Clarifying Interview Question Cap

- Aligned the supergoal Frame step and interview reference on a maximum-five question cap (`<=5`).
- Reason: the contract should allow fewer than five high-leverage questions while preventing unbounded
  or minimum-three interviews.
- Updated the interview contract test to assert the new wording.

## Korean README Copy Polish

- Refined `README.ko.md` so the opening, principles, mode table, default loop, install notes, layout, and
  evidence sections read more naturally in Korean while preserving the existing product claims.
- Reason: the Korean README should be approachable to non-developers who need the value proposition and
  precise enough for developers who need the execution and verification model.

## Korean Landing Page Copy Polish

- Refined Korean copy in `docs/index.html` across the hero, proof cards, metrics, workflow claims, mode
  cards, principles, bundled-role section, examples, install copy, and footer.
- Added Korean labels to previously English-only visible proof/footer text while preserving balanced
  English/Korean language-toggle blocks.
- Updated the landing metric from `<=3` questions to `<=5` so it matches the current interview contract.
- Reason: the landing page should explain the skill naturally in Korean without drifting from the
  current README and `SKILL.md` behavior.

## Agent-Neutral Product Wording

- Replaced Claude Code-only wording in `README.md`, `README.ko.md`, and `docs/index.html` with
  agent-neutral language that names Claude Code, Codex, and agy as supported agent CLIs.
- Reason: `/supergoal` is a portable skill used by multiple agents, not a Claude Code-only workflow.
