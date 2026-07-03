from sympy import Symbol, Q, refine, arg


def test_repro():
    a = Symbol('a')
    # arg(a) for a positive real number should simplify to 0
    assert refine(arg(a), Q.positive(a)) == 0
