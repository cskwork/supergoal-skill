def test_repro():
    """
    Test that checking is_zero on cosh(acos(-i + acosh(-g + i)))
    does not cause RecursionError.

    Bug: https://github.com/sympy/sympy/issues/21627

    On buggy code: RecursionError is raised (test fails)
    On fixed code: is_zero returns a value, no recursion error (test passes)
    """
    from sympy import sympify

    # This expression triggers infinite recursion when checking is_zero
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # Accessing is_zero should not raise RecursionError
    result = expr.is_zero

    # cosh is mathematically non-zero, so is_zero should be False or None
    # (False if definitely not zero, None if undetermined)
    assert result in (False, None)
