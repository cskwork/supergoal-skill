"""
Reproducer for SymPy issue: collect_factor_and_dimension does not detect equivalent dimensions in addition.

When adding a1*t1 + v1 where:
  - a1 has acceleration dimension
  - t1 has time dimension
  - v1 has velocity dimension

The function should recognize that acceleration*time = velocity and allow the addition.
Currently it raises ValueError about mismatched dimensions.
"""

from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """
    Test that collect_factor_and_dimension correctly detects equivalent dimensions in addition.

    acceleration*time is mathematically equivalent to velocity, so a1*t1 + v1 should be valid.

    Current (buggy) behavior: Raises ValueError about dimension mismatch
    Expected (fixed) behavior: Successfully processes the addition and returns result
    """

    # Set up velocity quantity
    v1 = units.Quantity('v1')
    SI.set_quantity_dimension(v1, units.velocity)
    SI.set_quantity_scale_factor(v1, 2 * units.meter / units.second)

    # Set up acceleration quantity
    a1 = units.Quantity('a1')
    SI.set_quantity_dimension(a1, units.acceleration)
    SI.set_quantity_scale_factor(a1, -9.8 * units.meter / units.second**2)

    # Set up time quantity
    t1 = units.Quantity('t1')
    SI.set_quantity_dimension(t1, units.time)
    SI.set_quantity_scale_factor(t1, 5 * units.second)

    # Create expression: a1*t1 + v1
    # Dimension analysis: (acceleration) * (time) = velocity ✓
    expr1 = a1*t1 + v1

    # The operation should succeed without raising ValueError
    # On buggy code: This line will raise ValueError
    # On fixed code: This will return the collected factor and dimension
    result = SI._collect_factor_and_dimension(expr1)

    # If we reached here, the bug is fixed (no exception was raised)
    assert result is not None
