from sympy import Symbol
from sympy.parsing.mathematica import parse_mathematica


def test_repro():
    assert parse_mathematica('λ') == Symbol('λ')
