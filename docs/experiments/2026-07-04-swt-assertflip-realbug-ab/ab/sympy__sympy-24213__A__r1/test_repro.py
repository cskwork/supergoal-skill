def test_repro():
    """Test that collect_factor_and_dimension detects equivalent dimensions in addition.

    Bug: acceleration*time should be recognized as equivalent to velocity,
    but the function incorrectly raises ValueError when adding terms with
    these equivalent dimensions.
    """
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

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
    # a1*t1 has dimension acceleration*time = velocity (equivalent to v1)
    expr1 = a1*t1 + v1

    # This should NOT raise ValueError
    # The function should recognize that both terms have equivalent dimensions
    result = SI._collect_factor_and_dimension(expr1)

    # Verify the result is valid (not None)
    assert result is not None
