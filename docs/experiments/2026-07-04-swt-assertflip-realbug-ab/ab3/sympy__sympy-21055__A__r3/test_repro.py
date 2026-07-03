from sympy import Symbol, Q, refine, arg


def test_repro():
    a = Symbol('a')
    # Bug: refine() does not simplify arg(a) for a known-positive symbol.
    # It should return 0, since arg of a positive real number is 0.
    assert refine(arg(a), Q.positive(a)) == 0
