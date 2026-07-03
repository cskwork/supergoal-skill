# SWT-Bench-Lite (sympy) AssertFlip A/B

Real-bug escalation of the toy assertflip A/B. 8 SWE-bench_Lite sympy bugs, fail-to-pass graded vs gold patch.

**Result: null. arm A 23/32 (72%) vs arm B 22/32 (69%), permutation p=1.000.** See `report.md`.

Reproduce: `pip install mpmath pytest`; clone sympy; `python validate_all.py` then run `produce_wf.js` (Workflow) then `python grade_swt.py`. Env = sympy from source via PYTHONPATH (no Docker). Change (1) stays uncommitted (unproven).
