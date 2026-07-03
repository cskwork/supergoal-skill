import pytest
from sympy import symbols
from sympy.solvers.polysys import solve_poly_system

x, y = symbols('x y')


def test_repro():
    # y - 1 = 0 with gens (x, y) is a 1-dimensional system (infinite solutions
    # for x), so it should be rejected like solve_poly_system((x - 1,), x, y)
    # is, instead of incorrectly returning a finite solution.
    with pytest.raises(NotImplementedError):
        solve_poly_system((y - 1,), x, y)
