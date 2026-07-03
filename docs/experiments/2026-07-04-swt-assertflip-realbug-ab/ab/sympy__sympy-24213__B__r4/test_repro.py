"""
Regression test for: collect_factor_and_dimension does not detect equivalent dimensions in addition

Bug: acceleration*time should be recognized as equivalent to velocity when adding expressions.
The bug causes ValueError when calling _collect_factor_and_dimension on a1*t1 + v1
where a1*t1 has dimension acceleration*time and v1 has dimension velocity.
"""

from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """
    Test that _collect_factor_and_dimension correctly handles dimensionally
    equivalent terms in addition.

    Before fix: Raises ValueError claiming dimensions don't match
    After fix: Should succeed and return result without error
    """
    # Set up quantities as in the bug report
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
    # a1*t1 has dimension: acceleration * time = (m/s²) * s = m/s = velocity
    # v1 has dimension: velocity = m/s
    # These should be compatible for addition without error
    expr1 = a1*t1 + v1

    # Before fix: raises ValueError: Dimension of "v1" is Dimension(velocity),
    #            but it should be Dimension(acceleration*time)
    # After fix: should succeed and return a result
    result = SI._collect_factor_and_dimension(expr1)

    # The function should succeed without raising ValueError
    assert result is not None
