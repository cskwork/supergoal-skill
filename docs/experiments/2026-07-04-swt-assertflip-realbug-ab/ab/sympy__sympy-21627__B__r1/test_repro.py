from sympy import sympify


def test_repro():
    """Test that checking is_zero on cosh(acos(-i + acosh(-g + i))) doesn't cause RecursionError.

    This expression previously caused infinite recursion when calling .is_zero.
    The bug should be fixed so that the operation completes and returns a valid result
    (True, False, or None per sympy's three-valued logic).
    """
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # This should not raise RecursionError
    result = expr.is_zero

    # result should be True, False, or None (sympy's three-valued logic)
    assert result in (True, False, None)
