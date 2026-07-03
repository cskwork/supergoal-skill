from sympy import Integer, oo, zoo


def test_zero_pow_negative_infinity_is_zoo():
    # Documented behavior of Pow: 0**-oo -> zoo (ComplexInfinity), not 0.
    assert Integer(0) ** (-oo) is zoo
