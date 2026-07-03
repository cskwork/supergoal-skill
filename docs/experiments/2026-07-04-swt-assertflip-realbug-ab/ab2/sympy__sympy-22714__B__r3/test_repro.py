import sympy as sp
from sympy import Point2D, Integer


def test_repro():
    # Point2D(1, 2) should build fine under evaluate(False), just like it
    # does with evaluate defaulted or explicitly False via S(...).
    with sp.evaluate(False):
        p = Point2D(Integer(1), Integer(2))
    assert p.args[0] == Integer(1)
    assert p.args[1] == Integer(2)
