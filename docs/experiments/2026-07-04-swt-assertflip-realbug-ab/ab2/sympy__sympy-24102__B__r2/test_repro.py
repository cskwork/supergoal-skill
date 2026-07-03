from sympy.parsing.mathematica import parse_mathematica
from sympy import Symbol


def test_repro():
    result = parse_mathematica('λ')
    assert result == Symbol('lambda')
