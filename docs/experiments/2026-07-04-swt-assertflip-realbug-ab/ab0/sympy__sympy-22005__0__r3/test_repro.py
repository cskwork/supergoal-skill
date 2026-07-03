from sympy import symbols
from sympy.solvers.polysys import solve_poly_system
from sympy.testing.pytest import raises


def test_solve_poly_system_infinite_solutions_detection():
    x, y = symbols('x y')

    # (x - 1,) with gens (x, y) is not zero-dimensional (y is free) -> must raise
    raises(NotImplementedError, lambda: solve_poly_system((x - 1,), x, y))

    # (y - 1,) with gens (x, y) is likewise not zero-dimensional (x is free)
    # This previously slipped past the univariate check and returned [(1,)]
    # incorrectly instead of raising NotImplementedError.
    raises(NotImplementedError, lambda: solve_poly_system((y - 1,), x, y))
