from sympy import sympify


def test_repro():
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    # Fixed sympy must evaluate is_zero without blowing the recursion
    # stack; there is no other assertable value here, so simply
    # completing the call (instead of raising RecursionError) is the
    # correct post-fix behavior.
    result = expr.is_zero
    assert result in (True, False, None)
