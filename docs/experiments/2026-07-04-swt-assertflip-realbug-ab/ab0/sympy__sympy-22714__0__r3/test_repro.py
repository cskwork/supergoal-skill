from sympy import Point2D, Integer, S, evaluate


def test_point2d_construction_inside_evaluate_false():
    # Constructing a Point2D directly with plain integer args used to
    # raise "Imaginary coordinates are not permitted." when done inside
    # `with evaluate(False)`, even though the coordinates are real.
    with evaluate(False):
        p = Point2D(Integer(1), Integer(2))
    assert p.args == (Integer(1), Integer(2))


def test_sympify_point2d_inside_evaluate_false():
    # Matches the exact reproduction from the bug report.
    with evaluate(False):
        p = S('Point2D(Integer(1),Integer(2))')
    assert p.args == (Integer(1), Integer(2))
