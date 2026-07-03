from sympy import sympify


def test_cosh_is_zero_no_recursion_error():
    """`.is_zero` on cosh(acos(-i + acosh(-g + i))) must not blow the stack.

    Regression test for a RecursionError ("maximum recursion depth exceeded")
    raised while evaluating `is_zero` on this nested expression.
    """
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # Should complete without raising RecursionError.
    result = expr.is_zero

    assert result in (True, False, None)
