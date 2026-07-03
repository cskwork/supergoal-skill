from sympy import sympify


def test_repro():
    # Checking is_zero on this nested cosh(acos(...acosh(...))) expression
    # must not blow the Python call stack; it should return a definite
    # boolean or None, not raise RecursionError.
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    result = expr.is_zero
    assert result in (True, False, None)
