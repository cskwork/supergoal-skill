import inspect
from sympy import lambdify


def test_repro():
    """
    Test that lambdify correctly generates code for single-element tuples.

    Bug: In SymPy 1.10, single-element tuples lose their trailing comma,
    causing them to be interpreted as integers instead of tuples.

    Expected: lambdify([], tuple([1])) should return (1,) — a tuple
    Buggy behavior: lambdify([], tuple([1])) returns (1) — an integer
    """
    # Create a lambdified function that returns a single-element tuple
    func = lambdify([], tuple([1]))

    # Execute the function
    result = func()

    # The result must be a tuple, not an int
    assert isinstance(result, tuple), (
        f"Expected result to be a tuple, but got {type(result).__name__}: {result}"
    )

    # The result must equal (1,)
    assert result == (1,), f"Expected (1,), but got {result}"

    # Verify the generated source code contains the proper syntax
    source = inspect.getsource(func)
    assert "(1,)" in source, (
        f"Generated code is missing comma in single-element tuple. "
        f"Source code:\n{source}"
    )
