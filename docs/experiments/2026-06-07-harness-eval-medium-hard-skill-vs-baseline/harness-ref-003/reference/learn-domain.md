# LEARN-DOMAIN mode - learn a codebase for the agent, persist a verified wiki

Use for "learn/onboard/map this codebase", "build a domain wiki", "도메인 파악", "이 레포 구조 파악".
The goal is durable, source-grounded `.domain-agent/` knowledge that lets later GREENFIELD/DEBUG/LEGACY
runs route fast, not a one-off chat answer.

Boundary with LEARN: LEARN (`reference/learn.md`) teaches a human and writes only a chat-time journal.
LEARN-DOMAIN learns *for the agent* and writes the repo-local `.domain-agent/` pack. It writes no
production code and uses no implementation gates; its only writes are the knowledge pack plus throwaway
grounding probes in a sandbox.

## Why this design (research-grounded)

The technique choices below are deliberate, not defaults. One-clause rationale each:

- **Agentic discovery, not embeddings/RAG.** Read structure, read files, follow imports, grep. Vector
  indexing fragments call/definition coherence, doubles the security surface, and goes stale on every
  edit; leading agent teams abandoned it for code.
- **Markdown-first persistence.** A concise repo map of key symbols + signatures (Aider repo-map
  pattern) is lightweight, git-friendly, and harness-agnostic across Claude Code, Codex, agy.
- **Bottom-up hierarchy.** Summarize symbol -> file -> package -> bounded context -> repo, grounded in
  business meaning; direct whole-file summarization measurably drops functions/variables.
- **Optional structural index only.** A local tree-sitter/ctags graph (no vectors) may speed lookup,
  but graph scaffolding does not reliably beat a grep baseline (ContextBench), so it is a cache, never
  the source of truth and never required.
- **Balanced budget.** Moderate retrieval rounds and moderate chunks beat both whole-file dumps and
  hyper-fragmentation.
- **Execution-grounded verification.** Each load-bearing summary is proven by a probe that runs;
  ~1/5 of even the best LLM's code descriptions are inaccurate and static self-checks do not correlate
  with accuracy.

## Pipeline

`Intake -> Survey -> Scope checkpoint -> Map -> Deepen -> Ground -> Persist -> Onboard -> Freshness loop`

Read-only except the knowledge pack and sandbox probes. No production source changes. No Human Feedback
implementation gate (nothing ships), but the Scope checkpoint pauses for the user before deep fan-out.

| Phase | Goal | Writes | Exit gate |
|---|---|---|---|
| Intake | Detect repo root, language(s), build tool, module/service count; ensure knowledge pack exists | `.domain-agent/config.json` (via `domain-context.md` first-run) | repo facts recorded; budget set |
| Survey | Agentic discovery of entry points and seams (no embeddings) | `index.md` draft | entry points + candidate bounded contexts named |
| Scope checkpoint | Propose bounded-context list + learning budget; let the user narrow | run note | user confirms or narrows scope; proceed unless told to wait |
| Map | Aider-style repo map: key symbols + signatures, dependency-ranked | `code-map.md` | within budget; no full-file dumps |
| Deepen | Per bounded-context fan-out; bottom-up summaries grounded in domain meaning | `glossary.md`, `invariants.md`, `flows/<ctx>.md`, `test-map.md` | each context has a flow file with current code path |
| Ground | Generate + run probes that prove load-bearing facts; mark verified/unverified | `verified:`/`Grounding:` markers in pack | `learn-grounding-gate.mjs <knowledgePath>` exits 0; completeness critic finds no un-named context |
| Persist | Surgical save under the existing saving loop | `index.md` keys, `config.json.lastUpdated` | no secrets/PII; `.gitignore` contains the path |
| Onboard | Render the grounded pack into one human-facing HTML handbook | `onboarding.html` | self-contained HTML built only from the pack; no new facts; no external scripts |

## Step 0 - Intake and budget

1. Resolve target repo root. Detect stack: Spring Boot (`pom.xml`/`build.gradle`, `@SpringBootApplication`,
   `application*.yml`), Node, Python, Go, etc. Count modules/services for MSA vs monolith.
2. Run the `domain-context.md` first-run setup if `<knowledgePath>/config.json` is absent (default
   `.domain-agent/`; ask once for an alternate path; add it to `.gitignore`). This is the only allowed
   pre-existing-knowledge write besides the run note.
3. Set a **balanced budget**: a per-pass file/token cap and a first-round target of the routing index
   plus the top-N highest-traffic bounded contexts - never "learn everything" in one pass. Record the
   budget and N in the run note. Over-engineering (learning the whole repo, building a graph up front)
   is a known failure mode; start small and let later runs deepen.

## Step 1 - Survey (agentic discovery, not RAG)

Mirror a senior engineer joining the team:

1. Read top-level folder structure and file names; identify build/config/entry files.
2. Locate entry points by stack idiom and grep, e.g. for Spring Boot:
   `@SpringBootApplication`, `@RestController`/`@Controller`, `@Configuration`, `@Service`,
   `@Repository`/`@Entity`, `@Scheduled`, listeners/`@KafkaListener`/`@RabbitListener`,
   `application*.yml`, Flyway/Liquibase migrations, `@FeignClient`/external clients.
3. Follow imports across one or two layers to see how entry points reach data and external systems.
4. Draft `index.md`: systems, feature areas, common entry points, search keys. Keep it a router.

Do not build an embedding index. A local structural index (CodeGraph/Graphify, tree-sitter, ctags) may
be used if already present in the repo or trivially available, but only as a lookup cache that is
re-derived from current code; never persist it as the source of truth.

## Step 2 - Scope checkpoint

State to the user, in one short message:

- detected stack and size (modules/services, rough file count),
- the proposed bounded-context list (top-N this pass) and what is deferred,
- the learning budget.

Proceed with that scope unless the user narrows or defers it. This replaces a heavy approval gate:
LEARN-DOMAIN ships nothing, so the only real risk is spending tokens on the wrong scope.

## Step 3 - Map (Aider repo-map pattern)

Build a concise map of the most important symbols, not full files:

- Extract classes/functions/methods with their **signatures** (params + return), one line of purpose.
- Rank by reference frequency / dependency centrality (PageRank-style if a structural index exists,
  otherwise approximate by import and call-site counts from grep). Keep the most-referenced symbols.
- Write to `code-map.md` under `## Key Symbols (signatures)` using
  `path :: Owner.symbol(sig) -> ret    # one-line purpose`.

Sending whole files wastes the context window; signatures plus purpose are enough to route. Stay inside
the per-pass budget.

## Step 4 - Deepen (bounded-context fan-out, bottom-up)

Fan out wide-and-shallow: one fresh read-only `explore`/`architect` agent per bounded context (Spring
layered slice, DDD context, or service). This is the only mode besides GREENFIELD that fans out by
default, because comprehension is genuinely parallel and read-only.

Each agent builds summaries **bottom-up** and grounded in business meaning:

1. Summarize key functions/methods in the context (what business action, not just syntax).
2. Aggregate to file, then package/module summaries.
3. Write one `flows/<context>.md` with the current code path (entry -> service -> data/external),
   invariants touched, and scenario checks.
4. Add repo-specific terms to `glossary.md`, business/safety rules to `invariants.md`, and proof
   commands to `test-map.md`.

Caps from `domain-context.md` apply: keep each file narrow; split when a file spans two contexts.

## Step 5 - Ground (execution-grounded verification - the key gate)

Static self-review does not predict accuracy. Prove load-bearing facts by running something:

1. For each invariant and each flow's load-bearing claim, generate a **probe**: a scratch test,
   assertion, focused script, or a targeted command from `test-map.md` that would pass iff the claim
   holds. Run it in a sandbox worktree; do not commit probes.
2. Mark the fact `Grounding: verified -- <probe + result>` when the probe passes.
3. When a fact genuinely cannot be executed (glue, config, narrative architecture), mark it
   `Grounding: unverified -- <reason>` and lower its `Confidence`. Never imply verification that did
   not run.
4. Self-check the bounded-context list: every named context must have a flow file; every load-bearing
   invariant must carry a `Grounding:` marker. Gaps become work or explicit `unverified` entries.
5. Run `node templates/learn-grounding-gate.mjs <knowledgePath>`; it must exit 0.

High-stakes invariants (auth, money, data-loss, concurrency) use >=2 grounding probes / lenses, each
re-derived from a fresh isolated pass (re-confirm the fact from the cited source, not from prior output).

## Step 6 - Persist

Save under the existing `domain-context.md` saving loop - surgical appends only, no encyclopedia:

- New term -> `glossary.md`; new invariant -> `invariants.md`; new entry point/signature -> `code-map.md`;
  new command -> `test-map.md`; new flow -> `flows/<ctx>.md`; stable failure pattern -> `tickets/`.
- Update `index.md` search keys and `config.json.lastUpdated`.
- No secrets, tokens, raw logs, customer data, or PII. Do not commit `.domain-agent/` unless the user
  asks for a sanitized publication path; `.gitignore` must already contain it.

## Step 7 - Onboard (human handbook, HTML)

After Persist, render the grounded pack into one self-contained HTML handbook **for humans only**:
`<knowledgePath>/onboarding.html` (default `.domain-agent/onboarding.html`, gitignored with the pack).
Agents keep reading the markdown pack, which stays the source of truth; the HTML is a derived snapshot,
never a second source. It exists so a new engineer can grasp what the domain encompasses fast - simple
to onboard with, yet comprehensive and carrying the discovered expertise.

Clone `templates/domain-onboarding.html` and fill it **from the pack only** - introduce no fact absent
from the pack, and never upgrade an `unverified` fact to verified to make the page read better. Sections,
plain summary first then expert detail:

1. Orientation - what this system is, who it serves, the one-paragraph mental model.
2. Key terms - `glossary.md` in this repo's meaning, each in plain language (not generic industry meaning).
3. Architecture - systems, bounded contexts, entry points, and how a request/data moves; one inline
   diagram (inline SVG or CSS boxes, no external scripts).
4. Key flows - per `flows/<ctx>.md`, entry -> service -> data/external in human terms + invariants touched.
5. Rules that must not break - `invariants.md`, each with its grounding status shown.
6. Get hands-on - the key `test-map.md` commands a newcomer runs to see the system work.
7. Trust & freshness - a verified/unverified legend, `config.json.lastUpdated`, and a line stating the
   markdown pack is the source of truth and this page a derived snapshot.

Constraints:

- **Functional tier, not Expressive.** This is an internal documentation tool, so follow
  `reference/functional-ui.md` as the visual authority: one accent + one type/spacing/radius scale,
  computed WCAG-AA contrast (body AAA), information density, minimal motion honoring
  `prefers-reduced-motion`, a declared `color-scheme` with light+dark tokens, and no empty decoration.
  Because the handbook must stay self-contained and offline, implement that baseline with a small inline
  token set rather than pulling a named external design system (Fluent/Carbon/shadcn) - the offline /
  no-CDN constraint below overrides functional-ui's "adopt one named system" rule.
- Single self-contained file: inline CSS only; **no external scripts, fonts, CDN, or network requests**
  (works offline, adds no security surface). Use inline SVG for any diagram.
- Carry each load-bearing fact's grounding as a visible badge (verified / unverified) so a reader is
  never misled; put expert detail (signatures, file paths, probe commands) in `<details>` for
  progressive disclosure - simple on the surface, expert underneath.
- Accessible and responsive: semantic HTML, a table of contents with anchors, usable below 768px.
- Language: prose in the user's language; keep identifiers, signatures, file paths, and commands verbatim.
- No secrets, tokens, raw logs, or PII (the pack already passed the secret scan; add no new content).
- Committing exposes internal architecture: keep it in the gitignored knowledge path; ask before moving
  it outside, exactly like publishing the pack.

LEARN-DOMAIN runs no implementation gates, so the Onboard render does not pull the product Designer's
`claims.md` / QA contrast gate / committee apparatus; the agent self-applies the functional-ui baseline.
On a later Freshness run, regenerate the handbook from the refreshed pack so it never drifts from it.

## Freshness loop (incremental, not full re-learn)

Keep the pack fresh without re-summarizing the repo each change:

- On a later LEARN-DOMAIN run, diff from the last learned point
  (`git diff <lastLearnedSHA>..HEAD --name-only` when git history is usable) and re-learn only changed
  packages/contexts.
- Re-run the grounding probes only for facts whose cited source files changed; leave verified,
  unchanged facts alone.
- Follow `templates/domain-agent/freshness.md` thresholds (light after 5 days, full review after 30) for
  prose summaries; structural caches (if any) auto-refresh via file-watch or a post-commit hook.
- Record `lastLearnedSHA` (or date when no git) in `config.json` so the next run scopes itself.

## Dispatch

| Step | Role (`agents/<name>.md`) | Reads | Produces |
|---|---|---|---|
| Survey/Map | `explore` (+ `Explore` helpers) | repo, current code | `index.md`, `code-map.md` |
| Deepen | `explore` per context; `architect` for boundaries | repo, draft map | `flows/*.md`, `glossary.md`, `invariants.md`, `test-map.md` |
| Ground | `executor` runs probes in sandbox; a fresh pass re-confirms from clean state | the claim + cited source only | `Grounding:` markers |
| Completeness | self-check + `learn-grounding-gate.mjs` | bounded-context list + code | gaps -> work or `unverified` |
| Onboard | `explore` renders to the Functional tier (`reference/functional-ui.md`) | persisted pack | `onboarding.html` |

Language: write pack prose in the user's language; keep identifiers, signatures, commands, and
`Grounding:`/`verified:` markers verbatim so the gate keeps matching.

## Stop conditions

- Knowledge path missing and user declines storage: run an ephemeral pass into the vault Domain Brief
  only; do not invent a path.
- Grounding gate cannot pass: report which facts lack a `Grounding:` marker; never fake verification.
- Scope too large for the budget: narrow N and defer the rest to later runs; log what was deferred so
  coverage is not silently truncated.
- Onboard would need an ungrounded claim to read well: keep it `unverified` with its badge; never invent
  facts or upgrade grounding to make the handbook look more complete.
