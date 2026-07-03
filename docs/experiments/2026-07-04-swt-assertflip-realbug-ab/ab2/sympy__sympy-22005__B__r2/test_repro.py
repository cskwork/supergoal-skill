from sympy.abc import x, y
from sympy.solvers.polysys import solve_poly_system
from sympy.testing.pytest import raises


def test_repro():
    # (x - 1,) with gens (x, y) correctly raises NotImplementedError since
    # y is unconstrained (infinite solutions). (y - 1,) with gens (x, y)
    # should behave the same way -- x is unconstrained -- but the buggy
    # code only checks univariate-count, not gens-count, so it wrongly
    # returns a finite-looking solution instead of raising.
    raises(NotImplementedError, lambda: solve_poly_system((y - 1,), x, y))
