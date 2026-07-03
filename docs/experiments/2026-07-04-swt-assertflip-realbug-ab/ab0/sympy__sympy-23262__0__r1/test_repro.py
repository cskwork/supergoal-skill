import inspect

from sympy import lambdify


def test_lambdify_single_element_tuple_returns_tuple():
    """lambdify of a single-element tuple must generate code that returns
    a real tuple, i.e. `(1,)` with the trailing comma, not `(1)` which is
    just a parenthesized integer.

    Regression test for the Python code printer dropping the trailing
    comma on one-element tuples.
    """
    f = lambdify([], tuple([1]))

    source = inspect.getsource(f)
    assert "return (1,)" in source

    result = f()
    assert isinstance(result, tuple)
    assert result == (1,)
