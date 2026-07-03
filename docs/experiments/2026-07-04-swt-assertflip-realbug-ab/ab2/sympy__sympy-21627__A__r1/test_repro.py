from sympy import sympify


def test_repro():
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    assert expr.is_zero is None
