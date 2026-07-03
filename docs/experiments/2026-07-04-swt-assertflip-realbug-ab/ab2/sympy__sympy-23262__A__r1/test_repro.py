import inspect
from sympy import lambdify


def test_repro():
    source = inspect.getsource(lambdify([], tuple([1])))
    assert source == 'def _lambdifygenerated():\n    return (1,)\n'
