import inspect
from sympy import lambdify


def test_repro():
    """
    Test that single-element tuples are generated correctly with trailing comma.

    Bug: SymPy 1.10 generates (1) instead of (1,) for single-element tuples,
    which causes the function to return an integer instead of a tuple.
    """
    # Create a lambda function that should return a single-element tuple
    func = lambdify([], tuple([1]))

    # Get the generated source code
    source = inspect.getsource(func)

    # The source MUST contain (1,) with the trailing comma
    # Bug in 1.10: produces (1) without the comma
    assert "(1,)" in source, (
        f"Single-element tuple must have trailing comma. "
        f"Expected '(1,)' in source, but got:\n{source}"
    )

    # Execute the function and verify it returns a tuple
    result = func()
    assert isinstance(result, tuple), (
        f"Expected tuple type, but got {type(result).__name__}: {result}"
    )
    assert result == (1,), f"Expected (1,), but got {result}"

    # Also verify that multi-element tuples work correctly (regression check)
    func2 = lambdify([], tuple([1, 2]))
    source2 = inspect.getsource(func2)
    assert "(1, 2)" in source2

    result2 = func2()
    assert isinstance(result2, tuple)
    assert result2 == (1, 2)
