import sympy as sp
from sympy.polys.orderings import monomial_key


def test_repro():
    x1, x2, x3 = sp.symbols('x1, x2, x3')
    states = [x1, x2, x3]
    max_degrees = 3
    min_degrees = 3
    monomials = set(sp.itermonomials(states, max_degrees, min_degrees=min_degrees))

    expected = {
        x1**3, x2**3, x3**3,
        x1**2*x2, x1**2*x3, x2**2*x1, x2**2*x3, x3**2*x1, x3**2*x2,
        x1*x2*x3,
    }

    assert monomials == expected
