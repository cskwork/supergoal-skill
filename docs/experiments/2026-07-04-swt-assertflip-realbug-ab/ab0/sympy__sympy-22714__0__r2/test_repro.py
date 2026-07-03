import sympy as sp


def test_sympify_point2d_with_evaluate_false():
    """sympify()'ing a Point2D string under `with evaluate(False)` should not
    crash with `ValueError: Imaginary coordinates are not permitted.`

    See sympy issue: simpify gives 'Imaginary coordinates are not permitted.'
    with evaluate(False)
    """
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')

    assert result == sp.Point2D(1, 2)
