"""
Test for sympy issue: collect_factor_and_dimension does not detect equivalent dimensions in addition
Bug: acceleration*time should be recognized as equivalent to velocity dimensionally
"""
import pytest
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """
    Test that _collect_factor_and_dimension correctly handles addition of quantities
    with equivalent dimensions (e.g., acceleration*time + velocity).

    The bug was that it failed to recognize acceleration*time as equivalent to velocity,
    even though dimensionally they are the same.
    """
    # Create quantities as in the bug report
    v1 = units.Quantity('v1')
    SI.set_quantity_dimension(v1, units.velocity)
    SI.set_quantity_scale_factor(v1, 2 * units.meter / units.second)

    a1 = units.Quantity('a1')
    SI.set_quantity_dimension(a1, units.acceleration)
    SI.set_quantity_scale_factor(a1, -9.8 * units.meter / units.second**2)

    t1 = units.Quantity('t1')
    SI.set_quantity_dimension(t1, units.time)
    SI.set_quantity_scale_factor(t1, 5 * units.second)

    # Create expression: a1*t1 + v1
    # a1*t1 has dimension of acceleration*time = velocity
    # v1 has dimension of velocity
    # These should be compatible for addition
    expr1 = a1*t1 + v1

    # This should NOT raise ValueError about incompatible dimensions
    # The bug was that it incorrectly raised:
    # ValueError: Dimension of "v1" is Dimension(velocity),
    #             but it should be Dimension(acceleration*time)
    #
    # Expected behavior: the operation should complete successfully
    # since acceleration*time and velocity are equivalent dimensions
    result = SI._collect_factor_and_dimension(expr1)

    # We expect the result to be a valid tuple of (factor, dimension)
    # Both terms have equivalent velocity dimensions, so they can be combined
    assert result is not None
    assert len(result) == 2
    factor, dimension = result
    # The dimension should be velocity (or equivalent)
    assert dimension == units.velocity
