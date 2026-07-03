"""
Regression test for: collect_factor_and_dimension does not detect
equivalent dimensions in addition.

Adding a quantity of dimension `velocity` to a quantity of dimension
`acceleration*time` (which is dimensionally equivalent to velocity) must
not raise a ValueError, since sympy's dimension system knows these two
dimensions are equivalent.
"""

from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_collect_factor_and_dimension_addition_equivalent_dims():
    v1 = units.Quantity('v1')
    SI.set_quantity_dimension(v1, units.velocity)
    SI.set_quantity_scale_factor(v1, 2 * units.meter / units.second)

    a1 = units.Quantity('a1')
    SI.set_quantity_dimension(a1, units.acceleration)
    SI.set_quantity_scale_factor(a1, -9.8 * units.meter / units.second ** 2)

    t1 = units.Quantity('t1')
    SI.set_quantity_dimension(t1, units.time)
    SI.set_quantity_scale_factor(t1, 5 * units.second)

    expr1 = a1 * t1 + v1

    # Should not raise ValueError("Dimension of ... but it should be ...")
    factor, dimension = SI._collect_factor_and_dimension(expr1)

    assert factor == -47
    assert dimension == units.velocity.dimension
