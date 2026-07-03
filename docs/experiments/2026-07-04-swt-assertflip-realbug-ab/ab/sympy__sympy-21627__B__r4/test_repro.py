"""
Regression test for sympy issue: RecursionError on is_zero of cosh expression.

Bug: Evaluating is_zero on certain nested trigonometric/hyperbolic expressions
(cosh(acos(...))) causes infinite recursion.

Expected behavior: is_zero should complete without raising RecursionError,
returning a boolean or None.
"""

def test_repro():
    """Test that is_zero does not cause RecursionError on cosh(acos(...)) expression."""
    from sympy import sympify

    # This expression caused RecursionError when checking is_zero
    expr = sympify("cosh(acos(-i + acosh(-g + i)))")

    # The bug manifests as RecursionError on the next line.
    # After the fix, is_zero should complete and return a boolean or None.
    result = expr.is_zero

    # Verify the result is a valid tristate (True, False, or None)
    assert result is None or result is True or result is False, \
        f"is_zero should return bool or None, got {type(result)}: {result}"
