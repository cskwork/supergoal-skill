import pytest
from sympy import symbols
from sympy.solvers.polysys import solve_poly_system

x, y = symbols('x y')


def test_solve_poly_system_infinite_solutions_detected():
    # (y - 1,) with gens (x, y) has infinitely many solutions (x is free),
    # so it must raise NotImplementedError just like (x - 1,) with gens (x, y) does.
    with pytest.raises(NotImplementedError):
        solve_poly_system((y - 1,), x, y)
