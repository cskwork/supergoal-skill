"""
Reproduction test for sympy issue #22714

Bug: sympify raises ValueError when called inside a with evaluate(False) context,
even though the same call works with evaluate=False as an explicit parameter.
"""

from sympy import S, evaluate, Point2D, Integer


def test_repro():
    """
    Test that Point2D can be created with evaluate(False) context manager.

    This reproduces the bug where S() raises:
        ValueError: Imaginary coordinates are not permitted.

    when called inside a with evaluate(False): context, even though the
    coordinates are clearly real integers.

    The bug is that the context manager form behaves differently from the
    explicit parameter form, which should be equivalent.
    """
    # This should not raise ValueError about imaginary coordinates
    with evaluate(False):
        result = S('Point2D(Integer(1),Integer(2))')

    # Verify the result is a Point2D with the correct coordinates
    assert isinstance(result, Point2D)
    assert result.x == 1
    assert result.y == 2
