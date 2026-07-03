"""Reproduces: Python code printer drops trailing comma for a one-element
tuple, so ``lambdify([], (1,))`` generates ``return (1)`` (an int) instead of
``return (1,)`` (a tuple). See sympy issue for lambdify + PythonCodePrinter.
"""
import inspect

from sympy import lambdify


def test_lambdify_one_element_tuple_returns_tuple():
    f = lambdify([], tuple([1]))

    # The generated source must keep the trailing comma so a 1-tuple,
    # not a bare int, is produced (and returned) at call time.
    source = inspect.getsource(f)
    assert "(1,)" in source, (
        f"expected a one-element tuple literal '(1,)' in generated source, got: {source!r}"
    )

    result = f()
    assert isinstance(result, tuple), (
        f"lambdify([], (1,))() should return a tuple, got {type(result)}: {result!r}"
    )
    assert result == (1,)


def test_lambdify_multi_element_tuple_unaffected():
    f = lambdify([], tuple([1, 2]))
    assert f() == (1, 2)
