"""
Regression test for: RecursionError when checking .is_zero on
cosh(acos(-i + acosh(-g + i))).

Before the fix, evaluating `expr.is_zero` on this expression triggers
infinite mutual recursion between assumption handlers (e.g. Abs/Pow
_eval_power calling abs() on itself repeatedly), raising a
RecursionError instead of returning a definite True/False/None.
"""
import sys

import pytest
from sympy import sympify


def test_cosh_is_zero_does_not_recurse():
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    old_limit = sys.getrecursionlimit()
    sys.setrecursionlimit(2000)
    try:
        try:
            result = expr.is_zero
        except RecursionError:
            pytest.fail(
                "expr.is_zero raised RecursionError instead of returning "
                "True/False/None"
            )
    finally:
        sys.setrecursionlimit(old_limit)

    assert result in (True, False, None)
