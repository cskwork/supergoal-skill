import pytest
from sympy import symbols
from sympy.solvers.polysys import solve_poly_system

x, y = symbols('x y')


def test_repro():
    with pytest.raises(NotImplementedError):
        solve_poly_system((y - 1,), x, y)
