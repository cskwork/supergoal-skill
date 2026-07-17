# Iteration-0 failure autopsy (running notes)

Method: per-test root-cause vs gold patch/tests, per the 2026-07-17 termenv autopsy discipline.
No lever text is final until all iteration-0 seeds are in.

## Seed 1 (v090-s1): baseline 3/6, v090 3/6 (tie)

Dual-solved (dropped at ceiling screen): 20442, 21055, 22714. v090 was faster on 2 of 3
(105s vs 224s; 127s vs 334s), slower on 21055 (301s vs 182s). Speed is secondary only.

### 24909 milli-prefix (both arms failed) — hidden idiom contract
- Both arms correctly stopped `Prefix*Unit` collapsing to 1 (their own added tests pass).
- Gold TIGHTENED existing assertions: `m*k == 1` → `m*k is S.One`, `dodeca/dodeca == 1` →
  `is S.One`. Gold solution returns `S.One` (sympy canonical singleton); agents surgically
  preserved the original `return 1` (raw int). Not derivable from the bug report; derivable
  from sympy idiom (Expr operators return sympified canonicals — sibling branches in the same
  method return Prefix/Mul objects).
- **Counterfactual (verifier-procedure-faithful, in-container): agent s1 patch + normalize
  `return 1`→`S.One` on the mul/truediv symmetric surface ⇒ gold f2p PASSES (4/4).** The
  idiom-conformance lever alone flips this task.
- Trap note: naive counterfactual (gold test patch over agent's edited test file) silently
  fails to apply and runs agent tests instead — must mirror grader.py's per-file reset.

### 21627 cosh is_zero recursion (both arms failed) — symptom guard vs root cause
- Gold fixes `complexes.py` `Abs.eval` (early return for `arg.is_extended_real`) — the owner
  of the conjugate-rewrap recursion cycle.
- baseline guarded `cosh._eval_is_real/positive/nonnegative`; harness added
  `cosh/sinh._eval_is_zero` via `_peeloff_ipi`. Both make the REPORTED repro pass; gold's
  `test_Abs` enters the same cycle via a different path and still hits RecursionError.
- "My repro passes" was the false completion signal in both arms. Lever angle: name the
  violated invariant and its owning frame from the cycle; add one alternative-entry repro.

### 23191 vector pretty_print (both arms failed) — exact canonical layout
- Both arms edited the right file (pretty.py, same as gold), moved the basis vector, but
  produced a plausible layout differing from gold's pinned unicode string.
- baseline additionally broke pre-existing `test_pretty_print_unicode_v` (p2p 2/3); v090 kept
  p2p green. Weakest lever surface; exact-layout matching is close to gold-string guessing.

## Replacement screen (v090-s1): 21847 dual-solve (drop), 23262 dual-solve (drop), 24102 SURVIVES

Final surviving set: 21627, 23191, 24909, 24102 (>=4, PREREG satisfied; one re-roll used).

### 24102 parse_mathematica greek (both arms 1/2 f2p) — reported symptom vs broader entry
- Both arms fix tokenizing bare greek ('λ' → tokenizer f2p passes).
- Gold's second f2p (`test_mathematica`) adds `Cos(1/2 * π)` → expects `Cos(π/2)`; agent parse
  yields `Cos*π/2` — the fix does not hold for greek inside function-call parentheses. Same
  family as 21627: the reported repro is a special case; gold probes a sibling entry path.

## Lever skeleton (draft, to be finalized after all seeds)

DEBUG hidden-contract gate (single candidate, inserted in role-loop DEBUG flow):
1. Invariant owner: name the invariant the bug violated and the function owning it; a patch
   that guards a caller/reporting path instead of the owner is not done — refix at the owner
   or record why the owner must not change.
2. Alternative-entry repro: construct one additional repro reaching the same root cause
   through a different caller; it must pass too.
3. Convention conformance (grounded, not invented): for the changed surface AND its symmetric
   siblings (mul/div, add/sub, eq/hash), align returned values/types with 2-3 sibling
   implementations' canonical forms (e.g. sympy `S.One` over raw `1`). Neighboring idiom counts
   as current-behavior grounding (must-grade), not "silence → stricter semantics".

Note the existing guardrail "do not turn silence into stricter semantics" actively steers away
from (3) unless idiom is explicitly classified as grounding — the lever text must make that
distinction, not add a generic "be careful" line.
