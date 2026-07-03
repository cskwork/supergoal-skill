#!/usr/bin/env python3
"""Create one sympy base worktree per instance (detached at base_commit) for agents to run pytest against."""
import json, os, subprocess, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
from lib import SYMPY, SCR

WT = os.path.join(SCR, "swt/wt")
os.makedirs(WT, exist_ok=True)
insts = [json.load(open(f)) for f in sorted(glob.glob(os.path.join(SCR, "swt/instances/sympy__sympy-*.json")))]

def g(cmd):
    return subprocess.run(cmd, cwd=SYMPY, capture_output=True, text=True, timeout=300)

# make sure main clone is clean/known state
g(["git", "worktree", "prune"])
for inst in insts:
    iid = inst["instance_id"]; base = inst["base_commit"]
    path = os.path.join(WT, iid)
    if os.path.isdir(path):
        print(f"  {iid}: exists"); continue
    r = g(["git", "worktree", "add", "--detach", "--force", path, base])
    ok = r.returncode == 0
    # smoke: import sympy from the worktree
    env = dict(os.environ, PYTHONPATH=path)
    s = subprocess.run([sys.executable, "-c", "import sympy; print(sympy.__version__)"], env=env, capture_output=True, text=True, timeout=120)
    print(f"  {iid}: worktree={ok} import_sympy={s.stdout.strip() or s.stderr.strip()[:80]}")
print("\nworktrees at:", WT)
