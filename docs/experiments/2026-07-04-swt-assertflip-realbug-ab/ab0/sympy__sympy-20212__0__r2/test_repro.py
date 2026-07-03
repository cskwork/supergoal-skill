from sympy import Integer, oo, zoo


def test_zero_to_negative_infinity_is_zoo():
    # Per Pow documentation, 0**-oo should evaluate to ComplexInfinity (zoo),
    # not 0. See https://github.com/sympy/sympy/issues/20212
    assert Integer(0)**(-oo) is zoo
