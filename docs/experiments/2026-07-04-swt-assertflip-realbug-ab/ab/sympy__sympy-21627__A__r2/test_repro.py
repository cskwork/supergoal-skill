def test_repro():
    """
    Test for issue: maximum recursion depth error when checking is_zero of cosh expression.

    The expression sympify("cosh(acos(-i + acosh(-g + i)))") causes a RecursionError
    when accessing the is_zero property. After the fix, it should return without crashing.
    """
    from sympy import sympify

    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # After the fix, this should not raise RecursionError
    # and should return a boolean (True/False) or None (if indeterminate)
    result = expr.is_zero

    # Assert the result is a valid value (not a crash)
    assert result in (True, False, None)
