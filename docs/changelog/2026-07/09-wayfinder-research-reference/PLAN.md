# WAYFINDER Research Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a small research reference that WAYFINDER can use for evidence-gathering tickets when the
current repo/context cannot answer a planning question.

**Architecture:** Keep research as a loaded reference, not a new top-level mode. `SKILL.md` remains the
router, `reference/wayfinder.md` decides when a planning ticket needs research, and
`reference/research.md` defines the source-quality and cited-output contract. Contract tests guard the
anchors so the helper stays reachable and non-delivery.

**Tech Stack:** Markdown contract docs, Bash contract tests, existing `tests/run-all.sh` auto-discovery.

---

## Theory

Problem: WAYFINDER can already map large work into tickets, blocker edges, and a next frontier, but it
does not name the path for tickets that are blocked on outside knowledge: official docs, specs,
upstream source, API behavior, or current vendor guidance.

Goal: Add a `reference/research.md` helper so a WAYFINDER ticket can say "this decision needs research",
produce one cited Markdown asset, then return the answer to the map/ticket. This models real-world
planning: a map is only as good as the evidence behind the decisions it records.

Expected outcome: WAYFINDER can create or resolve a research-needed ticket without pretending research
is product delivery. The research answer is a linked evidence asset, not a shipped feature, not a
delivery `Done` proof, and not a substitute for current repo tests when a delivery ticket starts.

External inspiration to re-check during implementation:
- `mattpocock/skills` README lists `research` as a model-invoked engineering skill and says it
  investigates high-trust primary sources and captures findings in repo Markdown.
- Raw source: `https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/research/SKILL.md`
- Relevant upstream WAYFINDER idea: research tickets are AFK investigation tickets that create a
  Markdown summary as a linked asset when knowledge outside the working directory is required.

## Files

- Create: `reference/research.md`
  - One purpose: high-trust source research helper for planning and docs/API fact gathering.
- Modify: `reference/wayfinder.md`
  - Add when to call `reference/research.md` from a WAYFINDER ticket.
  - Keep the map/ticket frontier contract unchanged.
- Modify: `SKILL.md`
  - Add `reference/research.md` to the reference map.
  - Do not add a new mode row.
- Create: `tests/research-contract.test.sh`
  - Guard helper existence, primary-source rule, cited Markdown asset rule, WAYFINDER linkage, and
    non-delivery boundary.
- Modify: `README.md`
  - Add a short reference-map mention and one phrase in the WAYFINDER row.
- Modify: `README.ko.md`
  - Mirror the README change in natural Korean while keeping `WAYFINDER` and `reference/research.md`
    literal.
- Modify: `docs/index.html`
  - Only change the WAYFINDER card copy, adding a short research-asset phrase in English and Korean.
- Modify: `docs/changelog/changelog-2026-07-09.md`
  - Append the decision record and rejected alternatives. Do not rewrite existing sections.

## Rejected Alternatives

- New `RESEARCH` mode: rejected because the user asked for a reference "when wayfinding". Research is a
  supporting ticket type, not an objective route.
- Fold into `reference/market-research.md`: rejected because that file is GREENFIELD demand validation;
  this helper covers technical/docs/API/source research for decisions.
- Put all instructions inside `reference/wayfinder.md`: rejected because source-quality rules are useful
  outside WAYFINDER too, and a separate reference keeps the wayfinder file cohesive.
- Let research satisfy delivery done: rejected because research can answer a decision, but delivery still
  needs the selected route's real tests, request/docs trace, and runtime proof.

---

### Task 1: Add The Failing Contract Test

**Files:**
- Create: `tests/research-contract.test.sh`

- [ ] **Step 1: Add the test file**

Use `apply_patch` to add `tests/research-contract.test.sh` with this content:

```bash
#!/usr/bin/env bash
# /supergoal research reference contract.
# Research is a source-quality helper for planning/wayfinding decisions, not a
# top-level delivery mode and not product-code proof.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

require_file() {
  local label="$1" file="$2"
  if [ -f "$ROOT/$file" ]; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing file: %s\n' "$file"
  fi
}

require_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  else
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        missing in %s: %s\n' "$file" "$text"
  fi
}

reject_text() {
  local label="$1" file="$2" text="$3"
  local normalized
  normalized="$(tr '\n\t\r' '   ' < "$ROOT/$file" | tr -s ' ')"
  if printf '%s' "$normalized" | grep -Fqi -- "$text"; then
    FAIL=$((FAIL + 1)); printf '  FAIL  %s\n' "$label"; printf '        forbidden in %s: %s\n' "$file" "$text"
  else
    PASS=$((PASS + 1)); printf '  PASS  %s\n' "$label"
  fi
}

echo "=================================================================="
echo " /supergoal research reference contract   skill: $ROOT"
echo "=================================================================="

require_file "research reference exists" "reference/research.md"
require_text "SKILL points to research reference" "SKILL.md" "reference/research.md"
require_text "wayfinder invokes research reference" "reference/wayfinder.md" "reference/research.md"
require_text "research uses primary sources" "reference/research.md" "primary sources"
require_text "research follows claims to source owner" "reference/research.md" "source that owns it"
require_text "research writes a single Markdown asset" "reference/research.md" "single Markdown"
require_text "research cites claims" "reference/research.md" "cite each claim"
require_text "research records gaps" "reference/research.md" "Gaps"
require_text "research stays non-delivery" "reference/research.md" "does not satisfy delivery Done"
require_text "research output can live under wayfinder ticket" "reference/research.md" "wayfinder/tickets"
require_text "public README mentions research helper" "README.md" "reference/research.md"
require_text "Korean README mentions research helper" "README.ko.md" "reference/research.md"
reject_text "research is not a top-level mode" "SKILL.md" "| research"

printf '\nSummary: %s passed, %s failed\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
```

Then make it executable:

```bash
chmod +x tests/research-contract.test.sh
```

- [ ] **Step 2: Run the focused test and confirm it fails for the missing reference**

Run:

```bash
bash tests/research-contract.test.sh
```

Expected: FAIL, including `missing file: reference/research.md` and missing anchors in `SKILL.md`,
`reference/wayfinder.md`, `README.md`, and `README.ko.md`.

---

### Task 2: Add `reference/research.md`

**Files:**
- Create: `reference/research.md`

- [ ] **Step 1: Create the reference**

```markdown
# Research - high-trust source pass

Use when a planning, docs, API, or design decision needs facts outside the current working set. In
WAYFINDER, this is the helper for a ticket whose answer depends on official docs, upstream source,
specs, first-party APIs, standards, or current vendor behavior.

Research resolves a knowledge question. It does not satisfy delivery Done, does not ship product code,
and does not replace the selected route's real tests when implementation starts.

## Source contract

- Prefer primary sources: official docs, source code, specs, standards, first-party APIs, changelogs,
  release notes, issue/PR discussion by the owning project, or live behavior you can verify.
- Follow each important claim back to the source that owns it. Secondary write-ups can suggest leads,
  but they do not settle facts that primary sources can answer.
- Record dates for unstable facts: current APIs, prices, legal/regulatory rules, release status,
  product limits, compatibility, and security guidance.
- Name uncertainty. If sources conflict or a primary source is unavailable, write the gap and the
  conservative assumption instead of smoothing it over.

## Output

Write one single Markdown asset. Match the repo's existing note location. In a WAYFINDER run, prefer:

```text
docs/changelog/<YYYY-MM>/<DD-topic>/wayfinder/tickets/<ticket-id-or-slug>/research.md
```

If there is no WAYFINDER ticket, use:

```text
docs/changelog/<YYYY-MM>/<DD-topic>/research/<slug>.md
```

Use these headings:

- `Question` - the exact thing the research must decide.
- `Sources consulted` - source name, URL/path, access date, and why it is authoritative.
- `Findings` - concise claims, each with a citation or local path.
- `Applicability` - what this means for the current repo, ticket, or plan.
- `Gaps` - unresolved facts, conflicts, stale sources, and what would prove them.
- `Next step` - one action: update the map, ask the user, prototype, or route a delivery ticket.

## Dispatch

If background subagents are available, dispatch one research agent with the question, output path, and
source preferences. Keep working only on independent planning work while it reads. If subagents are not
available, run the same source contract inline.

Do not paste long source text. Summarize, cite, and link. Keep the final answer small enough that a
fresh-context agent can load it before resolving the ticket.

## Return To WAYFINDER

When the research asset is written:

- Link it from the WAYFINDER ticket.
- Add the answer summary to the ticket resolution or map decision.
- Graduate newly specific fog into tickets only if the research made the question sharp.
- Keep out-of-scope findings out of `Decisions so far`; record them under `Out of scope` when useful.
```

- [ ] **Step 2: Run the focused test**

Run:

```bash
bash tests/research-contract.test.sh
```

Expected: still FAIL because `SKILL.md`, `reference/wayfinder.md`, and README surfaces are not wired yet.

---

### Task 3: Wire Research Into WAYFINDER And The Router

**Files:**
- Modify: `reference/wayfinder.md`
- Modify: `SKILL.md`

- [ ] **Step 1: Add the WAYFINDER hook**

In `reference/wayfinder.md`, after the `Ticket contract` bullet list, add:

```markdown
Research-needed tickets stay WAYFINDER tickets. When the decision needs knowledge outside the current
repo or recorded Domain Brief, write `Research: reference/research.md -> <question>` in the ticket and
link the resulting Markdown asset from the resolution. Research answers a decision; it does not deliver
the destination.
```

Then add this section before `## Frontier rule`:

```markdown
## Research assets

Use `reference/research.md` when a ticket needs official docs, upstream source, specs, first-party APIs,
standards, release notes, or other high-trust evidence before the decision can be made. Keep the
research output as a linked asset under the current run vault's `wayfinder/tickets/` folder. The map
records only the decision gist and link; the cited details live in the research file or ticket.
```

- [ ] **Step 2: Add the router reference**

In `SKILL.md` under `## Reference map`, add this row after `reference/wayfinder.md`:

```markdown
| `reference/research.md` | WAYFINDER research-needed tickets; docs/API/source facts that need high-trust cited evidence |
```

Do not add a `RESEARCH` row to the mode table.

- [ ] **Step 3: Run the focused test**

Run:

```bash
bash tests/research-contract.test.sh
```

Expected: still FAIL only on README/public-doc anchors if Task 3 is correct.

---

### Task 4: Update Public Docs And Changelog

**Files:**
- Modify: `README.md`
- Modify: `README.ko.md`
- Modify: `docs/index.html`
- Modify: `docs/changelog/changelog-2026-07-09.md`

- [ ] **Step 1: Update `README.md`**

Change the WAYFINDER approach row from:

```markdown
| "spec this / break this into tickets / roadmap / what first?" | **WAYFINDER** | issue map under the run vault's `wayfinder/` folder -> optional ticket-depth sections (glossary, user story, EARS checks, design notes, tasks) -> vertical tickets -> blocker edges -> next frontier; route one ticket, stop, then ask for context clear + integration test before the next |
```

to:

```markdown
| "spec this / break this into tickets / roadmap / what first?" | **WAYFINDER** | issue map under the run vault's `wayfinder/` folder -> optional ticket-depth sections (glossary, user story, EARS checks, design notes, tasks) and cited research assets via `reference/research.md` when outside facts are needed -> vertical tickets -> blocker edges -> next frontier; route one ticket, stop, then ask for context clear + integration test before the next |
```

In the layout block, add `research` to the `reference/` line between `plan-grounding` and
`market-research`.

- [ ] **Step 2: Update `README.ko.md`**

Change the WAYFINDER row so it includes this Korean phrase after `tasks를 추가`:

```text
, 외부 사실 확인이 필요하면 `reference/research.md`로 인용된 research asset을 남김
```

In the layout block, add `research` to the `reference/` line between `plan-grounding` and
`market-research`.

- [ ] **Step 3: Update `docs/index.html`**

In the WAYFINDER card, change the English sentence to:

```html
<p class="en">Map the destination inside the run vault, add ticket-depth requirements or cited research assets only where useful, route one frontier ticket, then stop for context clear and integration proof.</p>
```

Change the Korean sentence to:

```html
<p class="ko">실행 vault 안에서 목적지를 정리하고, 필요한 티켓에만 세부 요구사항이나 인용된 research asset을 더합니다. 그런 다음 frontier 티켓 하나만 실행하고 context clear와 통합 검증을 요청합니다.</p>
```

- [ ] **Step 4: Append the changelog section**

Append to `docs/changelog/changelog-2026-07-09.md`:

```markdown
## WAYFINDER research reference

**Change**: Planned a `reference/research.md` helper and WAYFINDER hook for tickets that need cited
outside/current-source evidence before a decision can be made.

**Why**: Matt Pocock's `research` skill has one useful import for Supergoal: high-trust primary-source
research should produce a cited Markdown asset in the repo. Supergoal should use that inside
WAYFINDER tickets instead of creating another top-level mode.

**Rejected alternatives**:

- Add a `RESEARCH` mode - too much surface for a helper that only resolves knowledge questions.
- Reuse `reference/market-research.md` - wrong scope; demand validation is not technical/docs/API
  evidence gathering.
- Let research count as delivery proof - unsafe; implementation still needs the selected route's real
  tests and request/docs trace.

**Verification target**: `bash tests/research-contract.test.sh`, `bash tests/reference-integrity.test.sh`,
and `bash tests/run-all.sh`.
```

- [ ] **Step 5: Run the focused test**

Run:

```bash
bash tests/research-contract.test.sh
```

Expected: PASS.

---

### Task 5: Run Contract Verification

**Files:**
- No edits unless verification exposes a contract miss.

- [ ] **Step 1: Run reference integrity**

Run:

```bash
bash tests/reference-integrity.test.sh
```

Expected: PASS. If it reports `reference/research.md` as unreachable, fix the exact `SKILL.md` reference
map row rather than weakening the test.

- [ ] **Step 2: Run the WAYFINDER focused suite**

Run:

```bash
bash tests/wayfinder-prototype-contract.test.sh
```

Expected: PASS. This proves the research hook did not break the existing WAYFINDER/PROTOTYPE route
contract.

- [ ] **Step 3: Run all local checks**

Run:

```bash
bash tests/run-all.sh
```

Expected: PASS. The runner auto-discovers `tests/research-contract.test.sh`, syntax-checks templates,
and skips `examples/url-shortener` if absent.

- [ ] **Step 4: Check whitespace**

Run:

```bash
git diff --check
```

Expected: no output.

---

## Self-Review

- Spec coverage: the plan covers the user's requested "another reference" and ties it specifically to
  WAYFINDER. It reuses the Matt Pocock research idea only as primary-source cited research, not as a
  wholesale process import.
- Placeholder scan: no placeholder tokens or generic "write tests" steps remain. Each edit has an exact
  file and expected command.
- Type/name consistency: the new helper name is always `reference/research.md`; public copy keeps
  `WAYFINDER` as the mode and does not introduce `RESEARCH`.
- Main risk: the current checkout already has dirty edits in `SKILL.md`, `README.md`, `README.ko.md`,
  `docs/index.html`, `tests/run-all.sh`, and `docs/changelog/changelog-2026-07-09.md`. Implementation
  must read the current version before applying each snippet and preserve unrelated changes.
