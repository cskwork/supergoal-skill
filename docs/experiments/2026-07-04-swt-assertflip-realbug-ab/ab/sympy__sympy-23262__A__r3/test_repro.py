"""Reproduce test for sympy bug: Python code printer not respecting tuple with one element"""
import inspect
from sympy import lambdify


def test_repro():
    """Test that single-element tuples are generated with correct syntax (1,) not (1)"""
    # Create a lambdified function that should return a single-element tuple
    f = lambdify([], tuple([1]))
    result = f()

    # The bug causes it to return an integer (1) instead of a tuple (1,)
    # This assertion will FAIL on buggy code, PASS when fixed
    assert isinstance(result, tuple), f"Expected tuple but got {type(result).__name__}: {result}"
    assert result == (1,), f"Expected (1,) but got {result}"

    # Also verify the source code contains the correct syntax
    source = inspect.getsource(f)
    assert "(1,)" in source, f"Expected '(1,)' in generated code, but got:\n{source}"
