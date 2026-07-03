from sympy import symbols
from sympy.solvers.polysys import solve_poly_system
from sympy.testing.pytest import raises


def test_repro():
    x, y = symbols('x y')
    # system involves x, y but only constrains y -> infinite solutions in x
    # must raise NotImplementedError, not silently return a partial solution
    raises(NotImplementedError, lambda: solve_poly_system((y - 1,), x, y))
