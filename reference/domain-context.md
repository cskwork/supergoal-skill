# Domain context - repo-local knowledge without prompt bloat

Domain context is a durable, searchable knowledge pack at the target repo root. It is separate from
the run vault and separate from model memory.

- Vault: per-run evidence and decisions in `docs/changelog/<YYYY-MM>/<DD-topic>/` (one folder per
  run: `README.md`, `surfaced-requirements.md`, verification evidence).
- Domain context: local reusable domain facts, stored by default in `.domain-agent/`.
- Model memory: optional reminders only; never the source of truth for a fix.

Current docs/code always win over saved domain context. Treat `.domain-agent/` as a routing index
that helps agents find the right code, tests, and terms quickly.

Load this reference for GREENFIELD (new feature needs domain fit / first knowledge pack), DEBUG
(before choosing a failing proof or root-cause path), and LEGACY (before the affected-code map). Not
for pure TEACH unless the user asks about the target repo's domain.

## First-run setup

Check for `<knowledgePath>/config.json` (default `.domain-agent` at the target repo root). If it does
not exist, ask one concise question:

```text
I do not see domain-agent knowledge for this repo. Should I create it at `.domain-agent/`, or use another path?
```

Then: create the chosen folder from `templates/domain-agent/`; write `config.json` (repo, path,
language, dates); add the chosen path to the repo root `.gitignore` if it is absent; record the path
in the run vault `README.md`. This is the only allowed repo write before Build besides vault setup -
knowledge scaffolding and `.gitignore` only, never product source code. If the user declines storage,
run with an ephemeral Domain Brief in the vault only.

## File contract

Use these folder/file names even when the user chooses a different root path:

- `config.json` - version, repo, language, knowledgePath, createdAt, lastUpdated.
- `index.md` - router only: systems, feature areas, flow files, search keys; short enough to read
  first on every run.
- `glossary.md` - domain terms as used in THIS repo (not generic industry meaning); pick one
  canonical term per concept and list avoided aliases.
- `invariants.md` - business/safety rules; each with a source, confidence, and one way to verify it.
- `code-map.md` - stable entry points (routes, services, repositories, DTOs, migrations, queues,
  jobs, external clients); a map, not an architecture document.
- `test-map.md` - exact commands: targeted/integration tests, build/type/lint, fixtures, env
  prerequisites.
- `flows/*.md` - one source-grounded feature/business flow per file, named what tickets search for
  (`auth-session.md`, `checkout-refund.md`).
- `decisions/*.md` - durable domain decisions only; prefer the repo's own decision system; save here
  only when the choice is hard to reverse, surprising without context, and a real tradeoff.
- `tickets/*.md` - reusable postmortems only (a stable failure mode, invariant, or repro pattern);
  not every ticket.
- `qa/*.md` - Reusable QA suites from QA-ONLY runs (`reference/qa-only.md`): scenario list,
  `Comparison:` type, named DB checks, saved baseline values, and the re-run command / Playwright
  spec path; indexed in `index.md` under `## QA Suites`. No secrets, raw rows, or PII.
- `qa/nav-map.md` - the single browser navigation map for this repo: entry/auth flow, `screen -> URL`
  routes, popup/new-tab triggers and how to switch the driver to them, stable selectors, and each
  screen's real API calls (method + path). Loaded before any browser QA/observe run and self-healed
  on drift (`reference/qa.md` "Navigation map"). No secrets, raw rows, or PII.

## Retrieval loop (every run; capped)

The goal is a small working brief, not a domain encyclopedia in the prompt.

1. Read `config.json`, then `index.md` (keep it as the router).
2. Extract ticket keywords: routes, errors, domain terms, DTO/entity names, external systems,
   expected behavior.
3. Search the knowledge folder with literal terms first.
4. Select the smallest relevant set - usually `glossary.md`, `invariants.md`, `test-map.md`, and one
   `flows/*.md`.
5. Verify load-bearing saved facts against current code with structural tools (`codegraph_context`,
   `codegraph_explore`, call paths) and find current entry points.
6. Write a compact `## Domain Brief` to the run vault `README.md`.

Hard caps: Select at most five domain files for a phase unless the human approves more - if more seem
relevant, route through `index.md` again and name the exact uncertainty. Prefer one `flows/*.md`
file; two is a warning the ticket may span domains. Keep the Domain Brief under 80 lines - only facts
needed for the current ticket. If a file grows too broad, split it by feature area and update
`index.md`.

## Freshness loop

Do not refresh the whole pack every run; verify selected facts against current code instead.

- Light refresh threshold: 5 days after `config.json.lastUpdated` - run CodeGraph status for affected
  repos, check docs/source changed since `lastUpdated`, re-read only selected + cited files, patch
  stale entries surgically.
- Full review threshold: 30 days after `config.json.lastUpdated`, or major repo changes / repeated
  stale-context misses - review the router, code map, test map, invariants, and high-traffic flows;
  split broad files instead of appending more context.
- Triggered refresh: saved knowledge conflicts with current code, or a run proves a stable new
  routing fact. `qa/nav-map.md` is verified against the live site on every browser run; correct a
  drifted row (selector, route, popup target, API path) in place as a triggered refresh, not a
  whole-app re-crawl.

## Domain Brief format

```md
## Domain Brief

- Knowledge path: `.domain-agent/`
- Selected knowledge files: `index.md`, `flows/<name>.md`, `test-map.md`
- Stable terms: <term -> meaning>
- Terminology conflicts: <conflicts found, or 'none'>
- Invariants: <rules that affect this change>
- Current-code verification: <symbols/routes/files checked now>
- Entry points: <route/method/class/file>
- Test commands: <targeted proof commands>
- Gaps: <unknowns, or 'none'>
```

The Domain Brief is the only domain-context payload passed to later phases by default.

## Saving loop

At the end of a run, save new knowledge only when ALL hold: stable across future tickets; verified
against current code/tests/docs; no secrets, tokens, raw logs, customer data, or PII; improves
routing, reproduction, planning, or verification for future agents. Ticket-specific evidence stays in
the vault, not `.domain-agent/`.

Do not save: Raw investigation transcripts, long code excerpts, complete tickets, temporary
hypotheses, or facts one current-code lookup finds just as fast.

Append surgically: term -> `glossary.md`; invariant -> `invariants.md`; entry point -> `code-map.md`;
command -> `test-map.md`; flow -> `flows/<flow>.md`; stable failure pattern ->
`tickets/<short-slug>.md`; reusable QA suite -> `qa/<suite>.md` (indexed under `## QA Suites`);
browser navigation fact (route, popup/new-tab, stable selector, `screen -> API`) -> `qa/nav-map.md`. After
each save, update `index.md` search keys and `config.json.lastUpdated`; keep entries short and split
files that accumulate unrelated content.

Terminology updates: capture a resolved term once it is stable enough to help routing; challenge
vague or overloaded words against the selected files, current repo docs, and the glossary before
adding a synonym; keep implementation details in `code-map.md`/`flows/*.md`/`test-map.md`, not the
glossary; if the user's wording conflicts with saved language, record the conflict in the Domain
Brief - do not silently invent a new term.

Decision updates: prefer the repo's existing decision records; use `decisions/*.md` only for choices
hard to reverse, surprising without context, and made between real alternatives - never ordinary
implementation notes.

## Trust rules

1. Saved knowledge can be stale. Verify load-bearing facts against current code before the plan
   freezes.
2. Saved knowledge is local and ignored by default. Do not assume another machine has it.
3. Do not commit `.domain-agent/` unless the user explicitly asks for a sanitized publication path.
4. `.gitignore` must contain the chosen knowledge path before local knowledge is written.
5. If saved context conflicts with code, write the conflict in the Domain Brief and let current code
   drive the plan.
