#!/usr/bin/env python3
"""Assert the dual-gate outcomes from validate_tasks.sh pier runs."""
import json, glob, os, sys

ROOT = os.environ.get("VALIDATE_ROOT", "/tmp/sg-debug-luna/validate")
fails = []
checked = 0
for path in sorted(glob.glob(f"{ROOT}/*-oracle") + glob.glob(f"{ROOT}/*-nop")):
    checked += 1
    name = path.split("/")[-1]
    rewards = glob.glob(f"{path}/**/verifier/reward.json", recursive=True)
    if not rewards:
        fails.append(f"{name}: no reward.json")
        continue
    r = json.load(open(rewards[0]))
    if name.endswith("-oracle"):
        ok = r.get("reward") == 1
        detail = f"reward={r.get('reward')} f2p={r.get('f2p_passed')}/{r.get('f2p_total')} p2p={r.get('p2p_passed')}/{r.get('p2p_total')}"
    else:
        # empty P2P (e.g. sympy-24102) is vacuously fine; grader scores it 1.0
        ok = (r.get("reward") == 0 and r.get("f2p_passed") == 0
              and r.get("p2p_passed") == r.get("p2p_total"))
        detail = f"reward={r.get('reward')} f2p={r.get('f2p_passed')}/{r.get('f2p_total')} p2p={r.get('p2p_passed')}/{r.get('p2p_total')}"
    print(("PASS " if ok else "FAIL ") + f"{name}: {detail}")
    if not ok:
        fails.append(f"{name}: {detail}")
print("=" * 40)
if checked == 0:
    print("GATE FAILED: no validation runs found under", ROOT)
    sys.exit(1)
if fails:
    print("GATE FAILED:")
    for f in fails:
        print(" ", f)
    sys.exit(1)
print("GATE PASSED: all tasks valid")
