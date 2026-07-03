import sympy as sp
from sympy.geometry import Point2D


def test_repro():
    with sp.evaluate(False):
        p = sp.S('Point2D(Integer(1),Integer(2))')
    assert p == Point2D(1, 2)
