from sympy import sympify


def test_repro():
    """Test that checking is_zero of cosh expression doesn't cause RecursionError.

    Bug: checking is_zero of cosh(acos(-i + acosh(-g + i))) raises RecursionError.

    Currently: RecursionError raised (test fails)
    After fix: Returns a valid three-valued logic value (test passes)
    """
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # Accessing is_zero should not raise RecursionError
    # The result should be True, False, or None (three-valued logic)
    result = expr.is_zero

    # Valid results for is_zero: True (provably zero), False (provably not zero),
    # or None (indeterminate/unknown)
    assert result in (True, False, None)
