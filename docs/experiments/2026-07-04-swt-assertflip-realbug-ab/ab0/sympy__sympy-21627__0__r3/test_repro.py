"""
Regression test for: RecursionError when checking is_zero of a nested
cosh(acos(acosh(...))) expression.

Bug report:
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    expr.is_zero

raises "RecursionError: maximum recursion depth exceeded while calling a
Python object" instead of returning a definite answer (True/False/None).
"""
from sympy import sympify


def test_cosh_acos_acosh_is_zero_does_not_recurse_infinitely():
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    try:
        result = expr.is_zero
    except RecursionError:
        raise AssertionError(
            "expr.is_zero triggered infinite mutual recursion "
            "(RecursionError) instead of returning True/False/None"
        )

    assert result in (True, False, None)
