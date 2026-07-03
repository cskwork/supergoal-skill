"""
Regression test for sympy issue: sympify gives 'Imaginary coordinates are not permitted.'
with evaluate(False) context manager.

Bug: Point2D construction via sympify crashes when evaluate(False) is active globally,
but works without the context manager or when evaluate=False is passed directly.
"""
from sympy import S, evaluate


def test_repro():
    """
    Test that Point2D can be constructed via sympify with evaluate(False) context.

    This should NOT raise ValueError: Imaginary coordinates are not permitted.
    """
    # This is the bug: using evaluate(False) context manager causes a crash
    with evaluate(False):
        result = S('Point2D(Integer(1),Integer(2))')

    # Verify the result is a valid Point2D with correct coordinates
    assert result.x == 1
    assert result.y == 2
