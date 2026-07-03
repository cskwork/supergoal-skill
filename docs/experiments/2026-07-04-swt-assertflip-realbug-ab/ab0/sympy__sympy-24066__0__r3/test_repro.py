"""
Reproduces: SI._collect_factor_and_dimension() cannot properly detect that
exponent is dimensionless.

https://github.com/sympy/sympy/issues/24066

`exp(second/(farad*ohm))` should be recognized as dimensionless because
second/(farad*ohm) is itself dimensionless. Before the fix, adding this
term to a plain number (`100 + exp(expr)`) raises a ValueError instead of
resolving to Dimension(1).
"""

from sympy import exp
from sympy.physics import units
from sympy.physics.units.systems.si import SI


def test_exp_of_dimensionless_arg_is_dimensionless():
    expr = units.second / (units.ohm * units.farad)
    dim = SI._collect_factor_and_dimension(expr)[1]

    assert SI.get_dimension_system().is_dimensionless(dim)

    buggy_expr = 100 + exp(expr)
    factor, dimension = SI._collect_factor_and_dimension(buggy_expr)

    assert SI.get_dimension_system().is_dimensionless(dimension)
