from sympy import symbols, refine, Q, arg, S


def test_repro():
    a = symbols('a')
    # For a positive real number, arg(a) should simplify to 0
    assert refine(arg(a), Q.positive(a)) == 0
