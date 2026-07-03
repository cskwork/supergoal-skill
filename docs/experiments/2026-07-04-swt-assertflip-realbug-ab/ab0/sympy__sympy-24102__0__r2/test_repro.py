from sympy import Symbol
from sympy.parsing.mathematica import parse_mathematica


def test_parse_mathematica_greek_character():
    # Greek letters (and other Unicode letters) should parse to a Symbol,
    # matching the behavior of the old (deprecated) `mathematica` parser.
    result = parse_mathematica('λ')
    assert result == Symbol('λ')
