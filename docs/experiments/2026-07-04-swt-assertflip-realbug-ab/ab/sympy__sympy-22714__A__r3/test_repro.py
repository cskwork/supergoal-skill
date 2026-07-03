import sympy as sp
from sympy.geometry import Point2D


def test_repro():
    """Test that sympify with evaluate(False) context manager works with Point2D.

    This reproduces the bug where using `with sp.evaluate(False):` causes
    `sp.S('Point2D(Integer(1),Integer(2))')` to incorrectly raise
    ValueError: Imaginary coordinates are not permitted.

    The context manager should not interfere with Point2D creation from strings.
    """
    # This should not raise ValueError about imaginary coordinates
    # when evaluate(False) is set via context manager
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')

    # Verify it's a Point2D
    assert isinstance(result, Point2D), f"Expected Point2D, got {type(result)}"

    # Verify the coordinates are correct
    assert result.x == 1, f"Expected x=1, got x={result.x}"
    assert result.y == 2, f"Expected y=2, got y={result.y}"
