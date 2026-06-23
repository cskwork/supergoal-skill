#!/usr/bin/env python3
"""
Template: disposable seeded-DB repro (see README.md).

Worked example of the bug CLASS "session/scope-scoped list query leaks rows from other active
scopes because the filter binds to 'any active scope for this user' instead of 'the current scope'."
Domain-agnostic on purpose — adapt the schema/seed/queries to your bug. Stdlib only.

Run:  python3 example.py     (exit 0 = fixture discriminates: buggy leaks, fix clean, invariant held)
"""
import sqlite3
import sys


def build():
    db = sqlite3.connect(":memory:")
    db.executescript(
        """
        CREATE TABLE scope(scope_id INTEGER PRIMARY KEY, user_id TEXT, token TEXT, active TEXT);
        CREATE TABLE item (item_id  INTEGER PRIMARY KEY, user_id TEXT, scope_token TEXT, label TEXT);
        """
    )
    # Smallest seed that triggers it: one user with TWO active scopes (prior left open + current),
    # plus one ordinary non-scoped row that must stay correct (the invariant).
    db.executemany("INSERT INTO scope VALUES(?,?,?,?)", [
        (1, "u1", "S1", "Y"),    # prior scope, never closed -> the accumulation cause
        (2, "u1", "S2", "Y"),    # current scope
        (3, "u1", "MAIN", None),  # ordinary (non-scoped) context
    ])
    db.executemany("INSERT INTO item VALUES(?,?,?,?)", [
        (10, "u1", "S1", "prior item 1"),
        (11, "u1", "S1", "prior item 2"),
        (12, "u1", "S2", "current item"),
        (13, "u1", "MAIN", "main-context item"),
    ])
    db.commit()
    return db


USER, CURRENT = "u1", "S2"

# BUGGY: binds to ANY active scope of the user -> no current-scope predicate (the defect).
BUGGY = """SELECT item.item_id, item.scope_token FROM item JOIN scope ON item.scope_token = scope.token
           WHERE item.user_id = ? AND scope.active = 'Y'"""

# FIXED: bind to the current scope token.
FIXED = """SELECT item.item_id, item.scope_token FROM item JOIN scope ON item.scope_token = scope.token
           WHERE item.user_id = ? AND scope.token = ? AND scope.active = 'Y'"""


def scopes(rows):
    return sorted({r[1] for r in rows})


def main():
    db = build()
    buggy = db.execute(BUGGY, (USER,)).fetchall()
    fixed = db.execute(FIXED, (USER, CURRENT)).fetchall()
    invariant = db.execute(
        "SELECT item_id FROM item WHERE user_id = ? AND scope_token = ?", (USER, "MAIN")
    ).fetchall()

    leak = [r for r in buggy if r[1] != CURRENT]
    red_ok = len(leak) > 0                 # bug reproduces: other active scopes leak in
    green_ok = scopes(fixed) == [CURRENT]   # fix isolates to the current scope
    inv_ok = len(invariant) == 1            # the non-scoped context is untouched

    print(f"BUGGY -> {len(buggy)} rows, scopes {scopes(buggy)}, leaked ids {[r[0] for r in leak]}")
    print(f"FIXED -> {len(fixed)} rows, scopes {scopes(fixed)}")
    print(f"RED {red_ok} | GREEN {green_ok} | INVARIANT {inv_ok}")

    discriminates = red_ok and green_ok and inv_ok
    print("DISCRIMINATES:", "YES" if discriminates else "NO")
    return 0 if discriminates else 1


if __name__ == "__main__":
    sys.exit(main())
