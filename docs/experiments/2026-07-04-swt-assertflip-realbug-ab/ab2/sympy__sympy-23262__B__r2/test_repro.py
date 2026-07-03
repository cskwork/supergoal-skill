import inspect
from sympy import lambdify


def test_repro():
    f = lambdify([], tuple([1]))
    src = inspect.getsource(f)
    assert "(1,)" in src
    assert f() == (1,)
