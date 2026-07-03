from sympy import Symbol, refine, Q, arg


def test_repro():
    a = Symbol('a')
    result = refine(arg(a), Q.positive(a))
    assert result == 0
