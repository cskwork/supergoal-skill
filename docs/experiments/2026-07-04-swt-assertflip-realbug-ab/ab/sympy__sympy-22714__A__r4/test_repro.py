import sympy as sp


def test_repro():
    """Test that sympify with evaluate(False) context manager works with Point2D.

    Reproduces bug where using evaluate(False) as a context manager
    causes Point2D parsing to fail with 'Imaginary coordinates are not permitted.'
    while the equivalent parameter form works fine.

    The bug is that the context manager version doesn't properly propagate
    the evaluate=False setting to the Point constructor.
    """
    # This should not raise ValueError: 'Imaginary coordinates are not permitted.'
    # Currently fails on buggy code; passes once fixed
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')

    # Verify result is a valid Point object
    from sympy.geometry import Point
    assert isinstance(result, Point)

    # Verify coordinates are correct
    assert result.x == 1
    assert result.y == 2
