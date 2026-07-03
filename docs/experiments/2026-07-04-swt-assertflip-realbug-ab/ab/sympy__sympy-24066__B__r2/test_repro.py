def test_repro():
    """
    Test that SI._collect_factor_and_dimension() correctly handles exp()
    of dimensionless expressions.

    Bug: exp(dimensionless_expr) should be dimensionless, but the function
    fails to recognize this and raises ValueError instead.
    """
    from sympy import exp
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

    # The exponent expression: second / (ohm * farad)
    # This should be dimensionless (time / (resistance * capacitance) = dimensionless)
    expr = units.second / (units.ohm * units.farad)

    # Verify the exponent itself is dimensionless
    dim = SI._collect_factor_and_dimension(expr)[1]
    assert SI.get_dimension_system().is_dimensionless(dim), \
        f"Expected expr to be dimensionless, but got dimension: {dim}"

    # The problematic expression: 100 + exp(expr)
    # Since expr is dimensionless, exp(expr) is dimensionless,
    # so 100 + exp(expr) should also be dimensionless
    buggy_expr = 100 + exp(expr)

    # This should NOT raise a ValueError about incorrect dimension
    # This is the key test: in buggy code, it will raise ValueError
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # Verify the result is correctly dimensionless
    # (100 is dimensionless, exp(dimensionless) is dimensionless,
    # so their sum is dimensionless)
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        f"Expected result to be dimensionless, but got dimension: {dimension}"
