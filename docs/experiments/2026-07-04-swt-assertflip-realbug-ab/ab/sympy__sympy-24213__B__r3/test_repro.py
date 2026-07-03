"""Reproducer for sympy issue: collect_factor_and_dimension does not detect equivalent dimensions in addition"""

from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """Test that collect_factor_and_dimension detects equivalent dimensions in addition.

    This reproduces the bug where a1*t1 (acceleration*time) is not recognized
    as equivalent to v1 (velocity) when adding them together.

    Bug: ValueError raised claiming dimension mismatch
    Expected: Should recognize acceleration*time == velocity and process successfully
    """

    # Create velocity quantity
    v1 = units.Quantity('v1')
    SI.set_quantity_dimension(v1, units.velocity)
    SI.set_quantity_scale_factor(v1, 2 * units.meter / units.second)

    # Create acceleration quantity
    a1 = units.Quantity('a1')
    SI.set_quantity_dimension(a1, units.acceleration)
    SI.set_quantity_scale_factor(a1, -9.8 * units.meter / units.second**2)

    # Create time quantity
    t1 = units.Quantity('t1')
    SI.set_quantity_dimension(t1, units.time)
    SI.set_quantity_scale_factor(t1, 5 * units.second)

    # Create expression: a1*t1 + v1
    # Mathematically: acceleration*time + velocity
    # Both have dimension velocity, so addition should be valid
    expr1 = a1*t1 + v1

    # This call currently raises ValueError on buggy code.
    # After fix, should return successfully with collected factor and dimension.
    result = SI._collect_factor_and_dimension(expr1)

    # Verify the function completed without error
    assert result is not None
