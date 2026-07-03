"""Test that collect_factor_and_dimension recognizes equivalent dimensions in addition."""

def test_repro():
    """
    Test that acceleration*time is recognized as equivalent to velocity.

    This test reproduces the bug where _collect_factor_and_dimension fails
    to recognize that dimensions like velocity and acceleration*time are equivalent.

    BUG: The function raises ValueError about dimension mismatch when adding
    terms with equivalent but differently-expressed dimensions.

    FIX: The function should recognize dimensional equivalence and return
    successfully without raising an error.
    """
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

    # Create a velocity quantity
    v1 = units.Quantity('v1')
    SI.set_quantity_dimension(v1, units.velocity)
    SI.set_quantity_scale_factor(v1, 2 * units.meter / units.second)

    # Create an acceleration quantity
    a1 = units.Quantity('a1')
    SI.set_quantity_dimension(a1, units.acceleration)
    SI.set_quantity_scale_factor(a1, -9.8 * units.meter / units.second**2)

    # Create a time quantity
    t1 = units.Quantity('t1')
    SI.set_quantity_dimension(t1, units.time)
    SI.set_quantity_scale_factor(t1, 5 * units.second)

    # Create expression: a1*t1 + v1
    # Dimensionally: (acceleration)(time) + velocity = velocity + velocity
    # Since acceleration*time = (length/time²)*time = length/time = velocity
    expr1 = a1*t1 + v1

    # This should NOT raise a ValueError about dimension mismatch
    # The bug causes it to raise:
    # ValueError: Dimension of "v1" is Dimension(velocity), but it should be Dimension(acceleration*time)
    # But acceleration*time IS equivalent to velocity, so this should work
    result = SI._collect_factor_and_dimension(expr1)

    # Verify we got a result without error
    assert result is not None
