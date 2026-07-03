"""
Test for sympy bug: SI._collect_factor_and_dimension() cannot properly detect
that exponent is dimensionless.

Bug: When collecting factors and dimensions of an expression containing
exp(dimensionless_expr), the system should recognize that exp of a
dimensionless quantity is dimensionless. Currently it fails to simplify
the dimension and throws a ValueError.
"""

def test_repro():
    """
    Reproduce the bug where SI._collect_factor_and_dimension() fails on
    100 + exp(expr) where expr simplifies to dimensionless.
    """
    from sympy import exp
    from sympy.physics import units
    from sympy.physics.units.systems.si import SI

    # Create a dimensionless expression: second / (ohm * farad)
    # This is dimensionless because time / (capacitance * impedance) = 1
    expr = units.second / (units.ohm * units.farad)

    # Verify that expr is indeed dimensionless
    factor, dim = SI._collect_factor_and_dimension(expr)
    assert SI.get_dimension_system().is_dimensionless(dim), \
        f"expr should be dimensionless, but dimension is {dim}"

    # Create the buggy expression: 100 + exp(dimensionless_expr)
    # This should be valid since exp() requires dimensionless argument
    buggy_expr = 100 + exp(expr)

    # This call should NOT raise ValueError about dimension mismatch.
    # On buggy code: raises ValueError claiming exp(expr) has dimension
    #                time/(capacitance*impedance) instead of 1
    # On fixed code: succeeds and returns proper factors/dimensions
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # The resulting dimension should be dimensionless
    # (100 is dimensionless + exp(dimensionless) is dimensionless = dimensionless)
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        f"buggy_expr dimension should be dimensionless, but got {dimension}"
