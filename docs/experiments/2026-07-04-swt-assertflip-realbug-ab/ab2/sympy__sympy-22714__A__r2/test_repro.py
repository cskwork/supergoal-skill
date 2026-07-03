import sympy as sp


def test_repro():
    with sp.evaluate(False):
        p = sp.S('Point2D(Integer(1),Integer(2))')
    assert p is not None
