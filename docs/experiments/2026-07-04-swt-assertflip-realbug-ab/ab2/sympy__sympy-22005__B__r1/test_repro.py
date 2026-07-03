from sympy import symbols
from sympy.solvers.polysys import solve_poly_system
from sympy.testing.pytest import raises


def test_repro():
    x, y = symbols('x, y')
    # solve_poly_system((x - 1,), x, y) correctly raises NotImplementedError
    # since the system is not zero-dimensional (y is free). The same should
    # hold for (y - 1,) with generators (x, y), but the buggy code returns
    # [(1,)] instead of detecting the infinite solution set.
    raises(NotImplementedError, lambda: solve_poly_system((y - 1,), x, y))
