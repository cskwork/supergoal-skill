import inspect

from sympy import lambdify


def test_repro():
    src = inspect.getsource(lambdify([], tuple([1])))
    assert src == 'def _lambdifygenerated():\n    return (1,)\n'
