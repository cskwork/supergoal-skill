def test_repro():
    """Test that SI._collect_factor_and_dimension properly handles exp of dimensionless expressions.

    This reproduces the bug where _collect_factor_and_dimension fails to recognize that
    the exponent in exp(second/(farad*ohm)) is dimensionless, causing it to raise ValueError
    when processing 100 + exp(second/(farad*ohm)).
    """
    from sympy import exp
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

    # Create a dimensionless quantity: second / (ohm * farad)
    expr = units.second / (units.ohm * units.farad)

    # Verify that the base expression is indeed dimensionless
    dim = SI._collect_factor_and_dimension(expr)[1]
    assert SI.get_dimension_system().is_dimensionless(dim), \
        "The base expression second/(ohm*farad) should be dimensionless"

    # The bug: _collect_factor_and_dimension raised ValueError when given
    # an expression like 100 + exp(dimensionless_expr) because it failed to
    # recognize that the exponent was dimensionless
    buggy_expr = 100 + exp(expr)

    # After the fix, this should not raise ValueError
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # The result should have a valid dimension that is dimensionless
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        "The dimension of 100 + exp(dimensionless) should be dimensionless"
