from sympy import symbols, itermonomials
from sympy.polys.orderings import monomial_key


def test_itermonomials_min_degrees_total_degree():
    """itermonomials with min_degrees == max_degrees should return all
    monomials whose total degree equals that value, not just the pure
    powers of individual variables.

    See: itermonomials returns incorrect monomials when using
    min_degrees argument.
    """
    x1, x2, x3 = symbols('x1, x2, x3')
    states = [x1, x2, x3]
    max_degrees = 3
    min_degrees = 3

    monomials = set(itermonomials(states, max_degrees, min_degrees=min_degrees))

    expected = {
        x1**3, x2**3, x3**3,
        x1**2*x2, x1**2*x3,
        x2**2*x1, x2**2*x3,
        x3**2*x1, x3**2*x2,
        x1*x2*x3,
    }

    assert monomials == expected
