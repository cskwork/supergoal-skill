import sympy as sp


def test_repro():
    with sp.evaluate(False):
        p = sp.S('Point2D(Integer(1),Integer(2))')
    assert p.args == (sp.Integer(1), sp.Integer(2))
