def test_repro():
    """Test that collect_factor_and_dimension recognizes equivalent dimensions in addition.

    When adding quantities with equivalent dimensions (e.g., acceleration*time + velocity),
    the function should recognize they are compatible, not raise ValueError about
    incompatible dimensions.
    """
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

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

    # Create expression: a1*t1 (dimension: acceleration*time = velocity) + v1 (dimension: velocity)
    # These should be dimensionally compatible
    expr1 = a1*t1 + v1

    # Should not raise ValueError about incompatible dimensions
    # acceleration*time is dimensionally equivalent to velocity
    result = SI._collect_factor_and_dimension(expr1)

    # Verify we got a valid result
    assert result is not None
