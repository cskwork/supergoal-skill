from sympy import S, oo, zoo


def test_repro():
    assert S.Zero ** -oo == zoo
