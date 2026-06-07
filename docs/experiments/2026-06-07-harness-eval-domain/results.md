# Domain-knowledge eval: does the harness help where domain rules are the main factor?

Two new self-contained DOMAIN cases + case-015, all on `gpt-5.3-codex-spark` high, v2 scorer, current
INLINE-mode skill. Each domain case ships an explicit `RULES.md`; the visible tests deliberately do NOT
cover the subtle rules, so the agent must apply the spec carefully. Hidden tests check the subtle rules.

Fixtures validated before running: a correct reference passes all tests; the shipped stub passes only
the visible tests (billing 4/8, shipping 3/7) — so every gap is a domain-rule the agent must supply.

## Per-case (spark-high)

| case | baseline | harness | baseline tokens | harness tokens |
|---|---|---|---:|---:|
| billing-tax | **80, 8/8** | 76, 6/8 | 1.81M | **0.91M** |
| shipping-rates | 78, 7/7 | 78, 7/7 | 0.81M | 1.03M |
| case-015-lsp (algorithmic, from Exp B) | 81, 7/9 | 82, 6/9 | 4.05M | 2.71M |

## Averages

| group | baseline score | harness score | baseline pass-frac | harness pass-frac | crashes |
|---|---:|---:|---:|---:|---|
| domain-only (2 cases) | 79 | 77 | **1.00** | 0.875 | 0 / 0 |
| all 3 cases | 79.7 | 78.7 | 0.926 | 0.806 | 0 / 0 |

## Honest findings

1. **The domain hypothesis was NOT supported.** On the two domain cases the harness did not beat the
   baseline — it tied on shipping (both perfect 7/7) and LOST on billing (baseline perfect 8/8; harness
   6/8). The baseline averaged slightly higher on both score (79 vs 77) and pass-fraction (1.00 vs 0.875).
2. **What the harness got wrong on billing:** banker's-rounding ties and the discount-before-tax order —
   two subtle rules. It DID read `RULES.md` (44 references) and ran the tests 11 times, so it engaged the
   spec; it simply implemented two edges wrong with ~half the compute the baseline used (0.91M vs 1.81M
   tokens). The baseline spent more and nailed all eight.
3. **A strong high-reasoning baseline is very good at explicit specs.** Given a clear `RULES.md`, the
   baseline scored a perfect pass-fraction (8/8 and 7/7) on both domain cases unaided. There was little
   room for a harness to add quality.
4. **The harness's real, repeatable value is stability + cost, not quality.** 0 crashes across all 6
   domain arms (INLINE fix holds), and it was markedly cheaper where it mattered (billing 0.91M vs 1.81M;
   case-015 2.71M vs 4.05M). But across 3 cases it does not lift correctness — and can slightly hurt it
   by being less thorough.

## Important caveat about the test format

These cases hand the domain knowledge to the agent as an **explicit written spec** (`RULES.md`). That
tests *applying a stated spec*, not *discovering implicit domain knowledge* — which is what the skill's
domain features (ten-rules, domain-context, LEARN-DOMAIN) are actually designed for. Real
"domain-knowledge-primary" work has the rules buried in a codebase / data / tribal knowledge, not in a
clean spec the model can just read. A self-contained one-shot eval cannot reproduce that, so this
experiment under-tests the harness's intended domain advantage. A fair test needs a real repo with
implicit, undocumented domain rules (LEGACY/LEARN-DOMAIN territory), graded on whether the agent
discovers and respects them.

## Bottom line

On these tasks the supergoal harness is an **efficiency and stability** tool (no crashes, ~30-50% fewer
tokens) but **not a quality multiplier** — a strong baseline on an explicit spec matches or beats it.
The skill's hypothesized domain-knowledge edge is neither confirmed nor refuted here, because the format
gives the rules to the baseline for free.
