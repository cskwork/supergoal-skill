from sympy import Symbol
from sympy.parsing.mathematica import parse_mathematica


def test_parse_mathematica_greek_symbol():
    # parse_mathematica should be able to parse a bare Greek-letter
    # identifier, matching the behavior of the deprecated `mathematica`
    # function it replaces.
    result = parse_mathematica('λ')  # lambda (Greek small letter)
    assert result == Symbol('λ')
