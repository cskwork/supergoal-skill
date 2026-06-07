# Underspecified greenfield: supergoal skill vs plain codex (n=3)

Runtime: `codex-exec:gpt-5.3-codex-spark:reasoning-high`, INLINE single non-interactive process.
Regime: **thin prompt, no RULES.md.** Visible tests = happy path only (so a literal-minimal impl passes
them and self-reports GREEN). Hidden tests = domain-standard *implicit* behavior, injected only after each
agent finished. Stubs fail the visible tests, so both arms must really implement. Pre-flight
(`preflight.mjs`) proved each stub fails visible and a correct reference impl passes all visible+hidden.

Hypothesis tested: a thin prompt hides real-world requirements, so the skill's "surface hidden
requirements" step should make the harness arm pass more hidden checks than a baseline that stops at the
literal/visible spec.

## Result - hypothesis REFUTED (all three cases ceiling)

| case | baseline hidden | harness hidden | baseline q | harness q | baseline tok | harness tok |
|---|---|---|---:|---:|---:|---:|
| csv (RFC4180 quoting) | 5/5 | 5/5 | 82 | 82 | 335k | 687k |
| lru (recency/eviction) | 4/4 | 4/4 | 85 | 82 | 229k | 587k |
| semver (prerelease/build) | 5/5 | 5/5 | 85 | 85 | 624k | 1010k |
| **aggregate** | **14/14** | **14/14** | **252** | **249** | **1.19M** | **2.28M** |

- Hidden-check winner: **tie** (both 14/14, machine-checked ground truth).
- Quality winner: baseline (252 vs 249; coarse heuristic rubric, treat as secondary).
- Cost: harness **1.92x tokens, 1.73x wall-clock**. Zero crashes either arm.
- Harness arms confirmed to read `harness-ref/SKILL.md` (skill mentions 6/4/7); baseline arms had zero leakage.

Per the HARNESS-EVAL contract, an all-pass ceiling case is **inconclusive, not a tie or a win**. Three
ceiling cases = no discrimination = the harness is **not proven more effective** here. It was, if anything,
slightly worse on coarse quality at ~2x cost.

## Why the hypothesis failed (the real lesson)

The implicit requirements I chose are **public domain standards** - RFC4180 CSV quoting, LRU
recency-on-get, SemVer prerelease/build precedence. A capable model (spark, high reasoning) already has
these in its training, so a thin prompt does not hide them: the baseline implements them perfectly without
any harness. The skill's requirement-surfacing lever only creates headroom when the requirement is
**genuinely unknown to the model** - repo-local conventions, proprietary business rules, project-specific
invariants - not famous standards a strong model recalls on its own.

This also confirms the skill's OWN guidance ("for a trivial single edit, skip this skill"): on small tasks
the cost of loading + routing the skill and running extra verify passes dominates, buying nothing because
there is no hidden requirement to surface.

## Combined picture (with the LSP run earlier today)

Across 4 fresh cases today (lsp/case-015 + csv + lru + semver):

- 1 narrow, in-noise harness win (lsp prefix-completion - and that requirement was *under-specified by the
  visible test*, the exact condition where surfacing helps).
- 3 ceilings where the baseline already knew the standard behavior.
- The harness cost more in every single case (1.6x-2.6x tokens).

Net: **no reliable effectiveness gain on explicit-spec OR public-knowledge-underspecified tasks; a
consistent cost penalty.** The only observed win came from a requirement the model would otherwise
under-weight - which points squarely at the remaining untested regime.

## Decision

**Not proven** (in fact, no headroom in this regime). No skill edit claiming effectiveness is warranted
from this evidence.

## Next test that could actually show headroom

Repo-local / proprietary implicit requirements (LEGACY regime): a small existing repo with conventions and
constraints that are NOT public knowledge (custom error envelope, project-specific validation order, an
internal API contract), with hidden tests on those repo-local rules. That is the one place the
"surface hidden requirements" lever should bite, because the requirement is not in the model's head.
