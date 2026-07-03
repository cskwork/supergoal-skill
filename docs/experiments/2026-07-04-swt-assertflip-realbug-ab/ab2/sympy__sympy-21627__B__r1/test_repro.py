from sympy import sympify, Symbol


def test_repro():
    g = Symbol('g')
    i = Symbol('i')
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    # Should not raise RecursionError; is_zero must be decidable to True/False/None.
    assert expr.is_zero in (True, False, None)
