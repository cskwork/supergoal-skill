"""
Test for SI._collect_factor_and_dimension() with exp() of dimensionless exponent.
Bug: https://github.com/sympy/sympy/issues/24066
"""
from sympy import exp
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """
    Test that SI._collect_factor_and_dimension() properly detects that
    the exponent in exp() is dimensionless.

    The expression (second / (ohm * farad)) should be dimensionless,
    making exp(second / (ohm * farad)) valid.

    Current bug: ValueError is raised claiming the dimension of
    exp(second/(farad*ohm)) is non-dimensionless.
    """
    # Create an expression that should be dimensionless
    expr = units.second / (units.ohm * units.farad)

    # Verify that the exponent is indeed dimensionless
    factor, dim = SI._collect_factor_and_dimension(expr)
    assert SI.get_dimension_system().is_dimensionless(dim), \
        f"Expected dimensionless exponent, got {dim}"

    # Create an expression with exp() of the dimensionless quantity
    buggy_expr = 100 + exp(expr)

    # This should not raise ValueError.
    # On buggy code: ValueError: Dimension of "exp(second/(farad*ohm))"
    #                is Dimension(time/(capacitance*impedance)),
    #                but it should be Dimension(1)
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # The dimension of (100 + exp(dimensionless)) should be dimensionless
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        f"Expected dimensionless dimension for expression, got {dimension}"
