from sympy import Symbol, Q, refine, arg


def test_repro():
    a = Symbol('a')
    # refine() should simplify arg(a) to 0 given that a is positive,
    # since positive reals have argument 0.
    assert refine(arg(a), Q.positive(a)) == 0
