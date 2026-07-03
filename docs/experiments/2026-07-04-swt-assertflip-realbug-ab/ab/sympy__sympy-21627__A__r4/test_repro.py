from sympy import sympify


def test_repro():
    """Test that checking is_zero on cosh expression doesn't cause RecursionError.

    Reproduces sympy issue #21627:
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    expr.is_zero  # RecursionError: maximum recursion depth exceeded

    The bug manifests as infinite recursion when evaluating is_zero on this
    nested inverse trig/hyperbolic trig expression.
    """
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # This should not raise RecursionError (the original bug)
    # Once fixed, it should return a value without crashing
    result = expr.is_zero

    # cosh of any finite complex number is never exactly zero
    # So is_zero should be False (definitely not zero) or None (unknown)
    # It should definitely not be True
    assert result is False or result is None
