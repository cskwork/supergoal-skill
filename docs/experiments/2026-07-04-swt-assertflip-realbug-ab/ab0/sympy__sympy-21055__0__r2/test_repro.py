from sympy import Q, Symbol, arg, refine


def test_refine_arg_positive():
    a = Symbol('a')
    assert refine(arg(a), Q.positive(a)) == 0
