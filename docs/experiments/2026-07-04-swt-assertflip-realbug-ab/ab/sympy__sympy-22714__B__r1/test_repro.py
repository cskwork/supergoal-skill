def test_repro():
    """
    Test that Point2D parsing works correctly with evaluate(False) context manager.

    Bug: Using `with sp.evaluate(False):` followed by `sp.S('Point2D(...)')`
    incorrectly raises ValueError about imaginary coordinates, even though the
    coordinates are real integers.

    Expected: Point2D should be created successfully with real coordinates (1, 2).
    """
    import sympy as sp

    # This currently raises: ValueError: Imaginary coordinates are not permitted.
    # Should not raise any error and should return a valid Point2D object.
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')

    # Verify the result is a Point2D with correct coordinates
    assert hasattr(result, 'x') and hasattr(result, 'y'), \
        f"Expected Point2D object, got {type(result)}"
    assert result.x == 1, f"Expected x=1, got x={result.x}"
    assert result.y == 2, f"Expected y=2, got y={result.y}"
