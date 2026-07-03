from sympy import itermonomials, symbols
from sympy.polys.orderings import monomial_key


def test_itermonomials_min_degrees_equal_max_degrees():
    """itermonomials with min_degree == max_degree must return every
    monomial of that total degree, not just the pure powers.

    Regression test for sympy issue: itermonomials returns incorrect
    monomials when using the min_degrees argument (only x1**3, x2**3,
    x3**3 were produced instead of all monomials of total degree 3,
    such as x1*x2**2).
    """
    x1, x2, x3 = symbols('x1, x2, x3')
    states = [x1, x2, x3]
    max_degrees = 3
    min_degrees = 3

    monomials = sorted(
        itermonomials(states, max_degrees, min_degrees=min_degrees),
        key=monomial_key('grlex', states),
    )

    expected = sorted(
        [
            x1**3, x2**3, x3**3,
            x1**2*x2, x1**2*x3,
            x2**2*x1, x2**2*x3,
            x3**2*x1, x3**2*x2,
            x1*x2*x3,
        ],
        key=monomial_key('grlex', states),
    )

    assert monomials == expected
