"""
Test for sympy issue: SI._collect_factor_and_dimension() cannot properly detect that exponent is dimensionless.

Expected behavior: exp(dimensionless) should return dimensionless.
Current behavior: raises ValueError claiming the result has wrong dimension.
"""

from sympy import exp
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """Test that exp of a dimensionless quantity is handled correctly."""

    # Create a dimensionless expression: second / (ohm * farad)
    expr = units.second / (units.ohm * units.farad)

    # Verify the base expression is dimensionless
    dim = SI._collect_factor_and_dimension(expr)[1]
    assert SI.get_dimension_system().is_dimensionless(dim), \
        "Base expression should be dimensionless"

    # Create expression with exp of dimensionless quantity
    # Current code: raises ValueError
    # Fixed code: should handle correctly and return dimensionless result
    buggy_expr = 100 + exp(expr)

    # This should NOT raise ValueError
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # The result should be dimensionless (exp of dimensionless is dimensionless)
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        "Result of 100 + exp(dimensionless) should be dimensionless"
