from sympy import Symbol, Q, refine, arg, S


def test_refine_arg_positive():
    a = Symbol('a')
    # arg() of a positive real number is 0
    assert refine(arg(a), Q.positive(a)) == 0


def test_refine_arg_negative():
    a = Symbol('a')
    # arg() of a negative real number is pi
    assert refine(arg(a), Q.negative(a)) == S.Pi
