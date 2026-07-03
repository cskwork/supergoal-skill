"""
Reproducer for sympy issue #23262: Python code printer not respecting tuple with one element
https://github.com/sympy/sympy/issues/23262

The bug: lambdify([], tuple([1])) generates 'return (1)' instead of 'return (1,)'
causing the function to return an int instead of a tuple.
"""
import inspect
from sympy import lambdify


def test_repro():
    """Test that lambdify generates correct code for single-element tuples."""
    # Create a lambdified function that returns a single-element tuple
    fn = lambdify([], tuple([1]))
    result = fn()

    # The bug: result is 1 (int) instead of (1,) (tuple)
    # After fix: result should be a tuple
    assert isinstance(result, tuple), f"Expected tuple but got {type(result).__name__}: {result}"
    assert result == (1,), f"Expected (1,) but got {result}"

    # Verify the generated source code has the trailing comma
    source = inspect.getsource(fn)
    assert 'return (1,)' in source, f"Source code should contain 'return (1,)' but got:\n{source}"

    # Also test with multiple elements to ensure we didn't break that case
    fn2 = lambdify([], tuple([1, 2]))
    result2 = fn2()
    assert isinstance(result2, tuple)
    assert result2 == (1, 2)
