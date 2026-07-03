from sympy import Integer, Point2D, S, evaluate


def test_point2d_creation_under_evaluate_false():
    # Regression test for: constructing Point2D inside `with evaluate(False)`
    # incorrectly raised "Imaginary coordinates are not permitted."
    with evaluate(False):
        p = Point2D(Integer(1), Integer(2))
    assert p == Point2D(1, 2)


def test_sympify_point2d_under_evaluate_false():
    # Same bug as above, reached through sympify/parse_expr as in the report.
    with evaluate(False):
        p = S('Point2D(Integer(1),Integer(2))')
    assert p == Point2D(1, 2)
