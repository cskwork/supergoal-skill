"""
Reproduction test for sympy issue: S() with Point2D fails in evaluate(False) context.

Bug: sp.S('Point2D(Integer(1),Integer(2))') raises ValueError inside
with sp.evaluate(False) context, but works without it or with evaluate=False parameter.
"""

from sympy import S, evaluate, Integer
from sympy.geometry import Point2D


def test_repro():
    """
    Test that sp.S() can parse Point2D inside evaluate(False) context.

    This reproduces the bug where the evaluate(False) context manager
    causes spurious 'Imaginary coordinates are not permitted' error.
    """
    # The bug manifests here: this should work but raises ValueError
    with evaluate(False):
        result = S('Point2D(Integer(1),Integer(2))')

    # Verify we got a valid Point2D with correct coordinates
    assert isinstance(result, Point2D)
    assert result.x == 1
    assert result.y == 2
