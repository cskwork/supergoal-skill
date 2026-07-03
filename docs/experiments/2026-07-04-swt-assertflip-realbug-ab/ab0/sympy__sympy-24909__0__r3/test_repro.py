"""Reproduces: milli * W incorrectly evaluates to 1 instead of watt/1000.

Bug report: multiplying a Prefix (e.g. `milli`) by a Quantity (e.g. `W`)
collapses to the number 1 instead of producing a milliwatt quantity
(watt/1000).
"""
from sympy.physics.units import milli, W


def test_prefix_times_quantity_is_not_one():
    result = milli * W
    assert result != 1, (
        f"milli*W collapsed to 1, expected watt/1000, got {result!r}"
    )


def test_prefix_times_quantity_equals_scaled_quantity():
    assert milli * W == W / 1000
