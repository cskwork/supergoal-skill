import inspect
from sympy import lambdify


def test_repro():
    """
    Verify that lambdify generates correct code for single-element tuples.

    Bug: SymPy 1.10 generates (1) instead of (1,) - the trailing comma is missing,
    which makes Python interpret it as an integer instead of a tuple.
    """
    # Create a lambdified function that returns a single-element tuple
    func = lambdify([], tuple([1]))

    # Get the generated source code
    source = inspect.getsource(func)

    # The source must contain (1,) with a trailing comma, not (1)
    assert "(1,)" in source, f"Expected '(1,)' in generated code but got:\n{source}"

    # Also verify the function actually returns a tuple (not an int)
    result = func()
    assert isinstance(result, tuple), f"Expected tuple but got {type(result)}"
    assert result == (1,), f"Expected (1,) but got {result}"

    # Also test that multi-element tuples still work correctly
    func_multi = lambdify([], tuple([1, 2]))
    result_multi = func_multi()
    assert isinstance(result_multi, tuple)
    assert result_multi == (1, 2)
