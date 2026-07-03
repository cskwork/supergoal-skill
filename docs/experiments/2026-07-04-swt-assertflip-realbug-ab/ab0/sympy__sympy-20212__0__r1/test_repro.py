from sympy import oo, zoo, Integer


def test_zero_pow_neg_oo_is_zoo():
    # 0**-oo should evaluate to ComplexInfinity (zoo), per Pow docs,
    # not 0.
    assert Integer(0) ** -oo == zoo
