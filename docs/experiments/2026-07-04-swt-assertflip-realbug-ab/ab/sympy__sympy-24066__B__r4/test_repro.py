from sympy import exp
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """
    Test that SI._collect_factor_and_dimension() properly handles exp()
    with dimensionless exponents.

    Bug: SI._collect_factor_and_dimension() cannot properly detect that
    the exponent is dimensionless, causing ValueError when processing
    100 + exp(second/(ohm*farad)).
    """
    # Create a dimensionless expression: second / (ohm * farad)
    # This simplifies to dimensionless (time / (impedance * capacitance))
    expr = units.second / (units.ohm * units.farad)

    # Verify the base expression is recognized as dimensionless
    factor, dim = SI._collect_factor_and_dimension(expr)
    assert SI.get_dimension_system().is_dimensionless(dim), \
        f"Base expression should be dimensionless, got dimension {dim}"

    # Create the compound expression that triggers the bug
    buggy_expr = 100 + exp(expr)

    # This should NOT raise ValueError:
    # "Dimension of "exp(second/(farad*ohm))" is Dimension(time/(capacitance*impedance)),
    # but it should be Dimension(1)"
    factor, dim = SI._collect_factor_and_dimension(buggy_expr)

    # The result should be dimensionless
    # (100 is dimensionless, exp(dimensionless) is dimensionless)
    assert SI.get_dimension_system().is_dimensionless(dim), \
        f"Result of 100 + exp(dimensionless) should be dimensionless, got {dim}"
