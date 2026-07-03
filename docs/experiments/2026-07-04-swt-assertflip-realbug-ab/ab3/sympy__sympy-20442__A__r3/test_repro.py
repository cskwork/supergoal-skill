from sympy import Rational
from sympy.physics.units import convert_to, joule, second


def test_repro():
    result = convert_to(joule * second, joule)
    assert result == joule * second
