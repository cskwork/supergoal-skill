from sympy import exp
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    """
    Reproduce: SI._collect_factor_and_dimension() cannot properly
    detect that exponent is dimensionless.

    The expression second/(ohm*farad) simplifies to dimensionless (1),
    and should work correctly within exp() and addition.
    """
    # Create an expression with dimensions that simplify to dimensionless
    # second / (ohm * farad) = time / (resistance * capacitance) = time / time = 1
    expr = units.second / (units.ohm * units.farad)

    # Verify that this expression is indeed dimensionless
    dim = SI._collect_factor_and_dimension(expr)[1]
    assert SI.get_dimension_system().is_dimensionless(dim), \
        f"expr should be dimensionless, got {dim}"

    # The bug occurs here: SI._collect_factor_and_dimension(100 + exp(expr))
    # currently raises ValueError claiming that exp(expr) has non-trivial dimensions,
    # but it should recognize that expr is dimensionless and exp() is valid.
    #
    # Once fixed, this should not raise ValueError and should return
    # a dimensionless result.
    buggy_expr = 100 + exp(expr)
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    # The result should be dimensionless
    assert SI.get_dimension_system().is_dimensionless(dimension), \
        f"result should be dimensionless, got {dimension}"
