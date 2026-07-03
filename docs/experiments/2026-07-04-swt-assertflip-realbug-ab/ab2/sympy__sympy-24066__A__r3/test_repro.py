from sympy import exp
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_repro():
    expr = units.second / (units.ohm * units.farad)
    dim = SI._collect_factor_and_dimension(expr)[1]

    assert SI.get_dimension_system().is_dimensionless(dim)

    buggy_expr = 100 + exp(expr)
    # Once fixed, SI should recognize that the exponent of exp() is
    # dimensionless and successfully compute a factor/dimension pair
    # instead of raising ValueError.
    factor, result_dim = SI._collect_factor_and_dimension(buggy_expr)
    assert SI.get_dimension_system().is_dimensionless(result_dim)
