import sympy as sp


def test_repro():
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')
    assert result == sp.Point2D(1, 2)
