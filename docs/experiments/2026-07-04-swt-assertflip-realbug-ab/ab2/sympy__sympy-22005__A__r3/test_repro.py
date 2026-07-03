import pytest

from sympy import symbols
from sympy.solvers.polysys import solve_poly_system

x, y = symbols('x y')


def test_repro():
    # (y - 1,) has infinitely many solutions in x for the given gens (x, y):
    # the system is not zero-dimensional, so this should raise NotImplementedError.
    # Currently (buggy) it incorrectly returns a finite-looking result [(1,)].
    with pytest.raises(NotImplementedError):
        solve_poly_system((y - 1,), x, y)
