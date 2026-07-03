# Changelog 2026-07-03

## Public docs synced to lean loop + production-adoption plan

Decision: update README EN/KO, landing copy, SUGGESTIONS, and older design/research docs so the public
surfaces follow the live `SKILL.md` contract.

Why: `SKILL.md` and `reference/role-loop.md` now make Build -> Forced Verify the mandatory core.
Critic/Fixer remains available, but only as opt-in escalation for under-specified or latent-correctness
work. The public README and landing still described independent Critic -> Fixer as the normal path,
which overstated role separation and hid the measured lean-out result.

What changed:

- `README.md` and `README.ko.md` now describe forced whole-spec verification as the default, with
  Critic/Fixer as escalation. Korean README gained the optional Board/TUI section and the same install
  audit flow as English.
- `docs/index.html` now says visible green is not enough, shows Build -> Forced Verify in the route map
  and mode cards, and surfaces the 10-task production pilot plan as metrics-only.
- `SUGGESTIONS.md` now points to the production-adoption plan first and keeps the synthetic confirmatory
  A/B as a follow-up only if production evidence cannot answer the lean/no-critic question.
- `docs/DESIGN.md`, `docs/research-brief.md`, and `docs/harness-eval-explained.md` now carry status notes
  so historical research does not get mistaken for the live contract.

Rejected alternatives:

- Re-run or rewrite the whole historical design brief: rejected because it is an evidence record. Status
  notes preserve history while preventing stale routing guidance.
- Advertise Critic/Fixer as the main value proposition: rejected because the July eval says forced
  whole-spec verification is the active default for explicit-spec work.
- Put production run vaults in this public repo: rejected because the public docs only need date/mode/gap/gate
  metrics in the production-pilot ledger.

## Korean copy cleanup

Decision: replace translation-shaped Korean/English mixes in the Korean public surfaces.

Why: mixed Korean/English terms in the landing page and Korean docs sounded unnatural and unclear.

Rejected alternative: explain those terms inline. The docs are clearer when the awkward concepts are removed or
rewritten as concrete Korean actions.

Verification planned: run the contract test suite, docs whitespace checks, and local landing smoke check
after the docs patch.
