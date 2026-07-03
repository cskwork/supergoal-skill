import sympy as sp


def test_repro():
    # sympify('Point2D(...)') under evaluate(False) should not raise;
    # it should construct a Point2D just like it does without evaluate(False)
    # and like sympify(..., evaluate=False) does.
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')

    assert isinstance(result, sp.Point2D)
    assert result.args[:2] == (sp.Integer(1), sp.Integer(2))
