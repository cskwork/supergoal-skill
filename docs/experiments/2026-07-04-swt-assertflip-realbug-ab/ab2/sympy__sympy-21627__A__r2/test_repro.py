from sympy import sympify


def test_repro():
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    # Should not raise RecursionError; is_zero should resolve without crashing.
    assert expr.is_zero is None
