def test_repro():
    """Test that SI._collect_factor_and_dimension properly handles exp of dimensionless quantities.

    Bug: SI._collect_factor_and_dimension() cannot properly detect that the argument to exp()
    is dimensionless, causing it to raise ValueError when processing 100 + exp(expr).

    Expected behavior: The function should recognize that exp(dimensionless) is dimensionless,
    and return the correct dimension without error.
    """
    from sympy import exp
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

    # First verify the base case: the exponent is dimensionless
    expr = units.second / (units.ohm * units.farad)
    dim = SI._collect_factor_and_dimension(expr)[1]
    assert SI.get_dimension_system().is_dimensionless(dim), \
        "The exponent (second / (ohm * farad)) should be dimensionless"

    # Now test the case that currently raises ValueError
    # This is the core bug: 100 + exp(dimensionless_expr) should work
    buggy_expr = 100 + exp(expr)

    # This should not raise ValueError:
    # "Dimension of "exp(second/(farad*ohm))" is Dimension(time/(capacitance*impedance)),
    # but it should be Dimension(1)"
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # The result should be dimensionless:
    # - 100 is dimensionless
    # - exp(dimensionless) is dimensionless
    # - dimensionless + dimensionless = dimensionless
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        f"The result should be dimensionless, but got dimension: {dimension}"
