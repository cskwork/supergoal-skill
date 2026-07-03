def test_repro():
    """
    Bug: maximum recursion depth error when checking is_zero of cosh expression

    The expression cosh(acos(-i + acosh(-g + i))) causes RecursionError when
    checking .is_zero. This test reproduces the bug and verifies the fix.

    Expected behavior: .is_zero should return False or None, not raise RecursionError.
    """
    from sympy import sympify

    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # On buggy code: this raises RecursionError
    # On fixed code: this returns False or None (the expression is not obviously zero)
    result = expr.is_zero

    # Assert that we get a sensible answer (not a crash)
    # The expression is complex and unlikely to be identically zero
    assert result in (False, None), f"Expected False or None, got {result}"
