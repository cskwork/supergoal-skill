from sympy import Integer, oo, zoo


def test_repro():
    result = Integer(0) ** (-oo)
    assert result == zoo
