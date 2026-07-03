"""
Reproduces: itermonomials returns incorrect monomials when using min_degrees argument.

Bug report: with max_degrees == min_degrees == 3 and three symbols, itermonomials
should return every monomial of total degree exactly 3 (e.g. x1*x2**2, x1*x2*x3, ...),
not just the pure powers x1**3, x2**3, x3**3.
"""
from sympy import itermonomials, symbols
from sympy.polys.orderings import monomial_key


def test_itermonomials_min_degrees_total_degree():
    x1, x2, x3 = symbols('x1, x2, x3')
    states = [x1, x2, x3]
    max_degrees = 3
    min_degrees = 3

    monomials = set(itermonomials(states, max_degrees, min_degrees=min_degrees))

    # Every monomial of total degree 3 in x1, x2, x3 (there are C(3+2,2) = 10 of them).
    expected = {
        x1**3, x2**3, x3**3,
        x1**2 * x2, x1**2 * x3,
        x2**2 * x1, x2**2 * x3,
        x3**2 * x1, x3**2 * x2,
        x1 * x2 * x3,
    }

    assert monomials == expected

    # Sanity check against the buggy behaviour: it wrongly returns only the
    # three pure powers, missing the seven mixed-degree monomials.
    missing = expected - monomials
    assert not missing, f"itermonomials missing monomials with total degree {min_degrees}: {missing}"
