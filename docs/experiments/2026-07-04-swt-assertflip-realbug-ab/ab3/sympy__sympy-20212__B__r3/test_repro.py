from sympy import S, oo, zoo


def test_repro():
    assert S(0)**(-oo) == zoo
