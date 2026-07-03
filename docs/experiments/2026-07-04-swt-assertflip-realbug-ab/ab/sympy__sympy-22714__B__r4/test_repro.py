import sympy as sp
from sympy.geometry import Point2D


def test_repro():
    """Reproduce bug: S() with evaluate(False) context raises ValueError for Point2D.

    The bug occurs when using 'with evaluate(False):' context manager.
    This should work identically to passing evaluate=False as an argument.

    Currently fails with: ValueError: Imaginary coordinates are not permitted.
    """
    # This is the exact pattern from the bug report that currently fails
    with sp.evaluate(False):
        result = sp.S('Point2D(Integer(1),Integer(2))')

    # Verify the result is a proper Point2D with correct coordinates
    assert isinstance(result, Point2D), f"Expected Point2D, got {type(result)}"
    assert result.x == 1, f"Expected x=1, got x={result.x}"
    assert result.y == 2, f"Expected y=2, got y={result.y}"
