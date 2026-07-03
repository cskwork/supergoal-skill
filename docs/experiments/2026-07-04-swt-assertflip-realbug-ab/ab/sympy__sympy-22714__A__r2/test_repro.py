from sympy import S, evaluate, Point2D


def test_repro():
    """Test that sympify with evaluate(False) context works with Point2D.

    Bug: with evaluate(False) context, parsing Point2D crashes with
    ValueError: Imaginary coordinates are not permitted.

    Expected: should work and return a Point2D object, same as explicit
    evaluate=False parameter or no context at all.
    """
    # This currently raises ValueError, but should successfully create Point2D
    with evaluate(False):
        result = S('Point2D(Integer(1),Integer(2))')

    # Verify the result is a Point2D object
    assert isinstance(result, Point2D)
