import inspect
from sympy import lambdify


def test_repro():
    """Test that lambdify generates correct code for single-element tuples.

    Regression in SymPy 1.10: single-element tuples were generated as (1)
    instead of (1,), causing them to be interpreted as grouped expressions
    rather than tuples.

    This test reproduces the bug by:
    1. Creating a lambdified function that returns a single-element tuple
    2. Verifying the function returns a tuple (not an integer)
    3. Verifying the generated source code contains the correct syntax (1,)
    """
    # Create a lambdified function that returns a single-element tuple
    f = lambdify([], tuple([1]))

    # Call the function and check the result type and value
    result = f()
    assert isinstance(result, tuple), f"Expected tuple, got {type(result)}"
    assert result == (1,), f"Expected (1,), got {result}"

    # Verify the generated source code contains correct tuple syntax with comma
    source = inspect.getsource(f)
    assert '(1,)' in source, f"Generated code missing comma in tuple:\n{source}"
