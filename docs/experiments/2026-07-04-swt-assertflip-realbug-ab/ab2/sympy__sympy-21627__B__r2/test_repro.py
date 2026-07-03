from sympy import sympify


def test_repro():
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    # Evaluating is_zero should terminate and return a definite tri-state
    # value, not blow the stack with a RecursionError.
    assert expr.is_zero in (True, False, None)
