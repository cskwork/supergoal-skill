def test_repro():
    """Test that checking is_zero on cosh(acos(...)) doesn't cause RecursionError.

    This reproduces sympy issue #21627 where accessing is_zero on certain
    nested cosh/acos expressions triggers infinite recursion.
    """
    from sympy import sympify

    expr = sympify("cosh(acos(-i + acosh(-g + i)))")
    # This should not raise RecursionError
    # After fix, is_zero should return a valid value (True, False, or None)
    result = expr.is_zero
    assert result in (True, False, None)
