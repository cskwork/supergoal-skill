"""
Regression test for SymPy issue with single-element tuple code generation.

In SymPy 1.10, lambdify generated `(1)` instead of `(1,)` for single-element
tuples, causing the printer to return a scalar instead of a tuple.
"""

from sympy import lambdify


def test_repro():
    """Test that lambdify generates correct Python code for single-element tuple.

    The generated function should return a tuple with one element, not a scalar.
    """
    # Create a lambdified function that returns a single-element tuple
    func = lambdify([], tuple([1]))
    result = func()

    # The result must be a tuple, not a scalar
    # On buggy code, this returns 1 (int) instead of (1,) (tuple)
    assert isinstance(result, tuple), (
        f"Expected tuple but got {type(result).__name__}. "
        f"Value: {result}"
    )
    assert result == (1,), f"Expected (1,) but got {result}"

    # Also verify multi-element tuples still work correctly
    func2 = lambdify([], tuple([1, 2]))
    result2 = func2()
    assert isinstance(result2, tuple), f"Expected tuple but got {type(result2).__name__}"
    assert result2 == (1, 2), f"Expected (1, 2) but got {result2}"
