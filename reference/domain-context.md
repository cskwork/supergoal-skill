# Domain context - repo-local knowledge without prompt bloat

Domain context is a durable, searchable knowledge pack at the target repo root. It is separate from
the run vault and separate from model memory.

- Vault: per-run evidence and decisions, tracked in `docs/changelog/<date>-<slug>/`.
- Domain context: local reusable domain facts, stored by default in `.domain-agent/`.
- Model memory: optional reminders only; never the source of truth for a fix.

Current docs/code always win over saved domain context. Treat `.domain-agent/` as a routing index that
helps agents find the right code, tests, and terms quickly.

## When to use

Load this reference for:

- **GREENFIELD** Plan when a new feature needs domain fit or a new repo needs a first knowledge pack.
- **DEBUG** Reproduce/Diagnose before choosing a failing proof or root-cause path.
- **LEGACY** Explore before writing the affected-code map.

Do not load it for pure LEARN unless the user asks to explain the target repo's domain.

## First-run setup

At the first coding/debug run in a repo, check for `<knowledgePath>/config.json`. Default
`knowledgePath` is `.domain-agent` at the target repo root.

If it does not exist, ask one concise question:

```text
I do not see domain-agent knowledge for this repo. Should I create it at `.domain-agent/`, or use another path?
```

Then:

1. Create the chosen folder from `templates/domain-agent/`.
2. Write `config.json` with the repo name, chosen path, language, and dates.
3. Add the chosen path to the repo root `.gitignore` if it is absent.
4. Record the initialization and chosen path in the run vault `README.md`.

This is the only allowed pre-Human-Feedback repo write besides vault setup. It may create local
knowledge scaffolding and update `.gitignore`; it must not change product source code.

If the user declines storage, run with an ephemeral Domain Brief in the vault only.

## File contract

```text
.domain-agent/
  config.json
  index.md
  glossary.md
  invariants.md
  code-map.md
  test-map.md
  flows/
  decisions/
  tickets/
```

Use the folder names above even when the user chooses a different root path.

### `config.json`

Machine-readable settings: version, repo, language, knowledgePath, createdAt, lastUpdated.

### `index.md`

Router only. It lists systems, feature areas, flow files, and search keys. Keep it short enough to
read first on every run.

### `glossary.md`

Domain terms, aliases, IDs, and overloaded words. Terms must define what they mean in this repo, not
generic industry meaning. Pick a canonical term when synonyms compete; list avoided aliases instead
of letting future runs use several words for one concept.

### `invariants.md`

Business and safety rules that must not break. Each invariant needs a source, confidence, and at
least one way to verify it.

### `code-map.md`

Stable entry points: routes, controllers, services, repositories, DTOs, migrations, queues, events,
scheduled jobs, and external clients. This is a map, not a full architecture document.

### `test-map.md`

Exact commands for targeted tests, integration tests, build/type/lint checks, data fixtures, and
environment prerequisites.

### `flows/*.md`

One source-grounded feature or business flow per file. Prefer names users and tickets search for:
`textbook-init.md`, `auth-session.md`, `checkout-refund.md`.

### `decisions/*.md`

Durable domain decisions only. Prefer the repo's tracked decision system if one exists. Put a
decision here only when no existing decision record covers it and the choice is hard to reverse,
surprising without context, and based on a real tradeoff.

### `tickets/*.md`

Reusable postmortems only. Do not archive every ticket. Save a ticket note only when it teaches a
stable failure mode, invariant, or reproduction pattern.

## Retrieval loop

Retrieval is capped. The goal is a small working brief, not a domain encyclopedia in the prompt.

1. Read `config.json`, then `index.md`.
2. Extract ticket keywords: routes, errors, domain terms, DTO/entity names, external systems, and
   expected behavior.
3. Search the knowledge folder with literal terms first.
4. Select the smallest relevant set: usually `glossary.md`, `invariants.md`, `test-map.md`, and one
   `flows/*.md`.
5. Use structural tools on current code (`codegraph_context`, `codegraph_explore`, call paths) to
   verify saved facts and find current entry points.
6. Write a compact `## Domain Brief` to the run vault `README.md`.

Never dump the whole knowledge folder into a phase. If more than five files seem relevant, route
through `index.md` again and name the exact uncertainty.

Hard caps:

- Read `index.md` first and keep it as the router.
- Select at most five domain files for a phase unless the human approves more.
- Prefer one `flows/*.md` file; two is a warning that the ticket may span domains.
- Keep the Domain Brief under 80 lines.
- Each selected file contributes only facts needed for the current ticket.
- If a file grows too broad, split it by feature area and update `index.md`.

## Freshness loop

Do not refresh the whole pack every run. Use cheap freshness checks plus current-code verification.

Default policy:

- Light refresh threshold: 5 days after `config.json.lastUpdated`.
- Full review threshold: 30 days after `config.json.lastUpdated`.
- Triggered refresh: selected knowledge conflicts with current code, or a run proves a stable new
  fact that improves future routing.

Every run:

1. Read `config.json` and `index.md`.
2. Select the smallest relevant file set.
3. Verify load-bearing facts against current code/docs.
4. Write only the compact Domain Brief to the run vault.

Light refresh:

1. Run CodeGraph status for affected repos only.
2. Check changed docs/source since `lastUpdated` when git history is usable.
3. Re-read selected domain files and cited source files only.
4. Patch stale entries surgically.

Full review is monthly or triggered by major repo changes/repeated stale-context misses. Review the
router, code map, test map, invariants, and high-traffic flows; split broad files instead of appending
more context.

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

At Deliver, save new knowledge only when all are true:

- It is stable across future tickets.
- It was verified against current code, tests, docs, or production-safe evidence.
- It contains no secrets, tokens, raw logs, customer data, private identifiers, or PII.
- It improves routing, reproduction, planning, or verification for future agents.

Save ticket-specific evidence in the vault, not `.domain-agent/`.

Do not save:

- Raw investigation transcripts.
- Long code excerpts.
- Complete tickets.
- Temporary hypotheses.
- Facts that can be found just as quickly with one current-code lookup.

Append updates surgically:

- New term -> `glossary.md`
- New invariant -> `invariants.md`
- New entry point -> `code-map.md`
- New command -> `test-map.md`
- New flow -> `flows/<flow>.md`
- Stable failure pattern -> `tickets/<short-slug>.md`

Terminology updates:

- Capture a resolved term as soon as it becomes stable enough to help future routing.
- Challenge vague or overloaded words against selected knowledge files, current repo docs when
  present, and the domain-agent glossary before adding a synonym.
- Keep implementation details out of `glossary.md`; put routes, classes, tables, and commands in
  `code-map.md`, `flows/*.md`, or `test-map.md`.
- If the user's wording conflicts with saved language, record the conflict in the Domain Brief and
  do not silently invent a new term.

Decision updates:

- Prefer the repo's existing decision records when they exist.
- Use `decisions/*.md` only for choices that are hard to reverse, surprising without context, and
  made between real alternatives.
- Do not save ordinary implementation notes as decisions.

After each save, update `index.md` search keys and `config.json.lastUpdated`.

Keep files small and searchable:

- `index.md`: routing keys only.
- `glossary.md`: one short entry per term.
- `invariants.md`: one rule per entry with source and verification.
- `code-map.md`: entry points and boundaries only.
- `test-map.md`: exact commands only.
- `flows/*.md`: one flow per file; split when unrelated steps accumulate.

## Trust rules

1. Saved knowledge can be stale. Verify load-bearing facts against current code before Plan.
2. Saved knowledge is local and ignored by default. Do not assume another machine has it.
3. Do not commit `.domain-agent/` unless the user explicitly asks for a sanitized publication path.
4. `.gitignore` must contain the chosen knowledge path before local knowledge is written.
5. If saved context conflicts with code, write the conflict in the Domain Brief and let current code
   drive the plan.
