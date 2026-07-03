import sympy as sp
from sympy.polys.orderings import monomial_key


def test_repro():
    x1, x2, x3 = sp.symbols('x1, x2, x3')
    states = [x1, x2, x3]
    max_degrees = 3
    min_degrees = 3
    monomials = sorted(sp.itermonomials(states, max_degrees, min_degrees=min_degrees),
                        key=monomial_key('grlex', states))
    assert x1 * x2**2 in monomials
