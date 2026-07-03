from sympy import S
from sympy.physics.units import milli, W


def test_prefix_times_unit_does_not_collapse_to_one():
    """milli*W should give milli watts, not the bare number 1.

    Reported bug: `milli*W == 1` evaluates to True, and `W*milli`
    returns a stray, unsimplified `watt*Prefix(...)` expression instead
    of a proper milliwatt quantity.
    """
    result = milli * W

    # The result must not silently collapse to the pure number 1.
    assert result != 1
    assert result != S.One

    # Multiplication should be commutative: milli*W and W*milli must
    # represent the same quantity.
    assert milli * W == W * milli
