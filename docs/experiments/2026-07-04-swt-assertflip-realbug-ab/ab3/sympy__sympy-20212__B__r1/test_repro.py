from sympy import S, oo, zoo


def test_repro():
    # 0**-oo should evaluate to zoo (ComplexInfinity), per Pow docs,
    # not 0.
    assert S.Zero**(-oo) is zoo
