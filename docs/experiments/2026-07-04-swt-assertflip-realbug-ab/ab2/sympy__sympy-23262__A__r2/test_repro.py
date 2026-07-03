import inspect
from sympy import lambdify


def test_repro():
    f = lambdify([], tuple([1]))
    src = inspect.getsource(f)
    assert src == 'def _lambdifygenerated():\n    return (1,)\n'
