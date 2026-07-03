from sympy import Symbol
from sympy.parsing.mathematica import parse_mathematica


def test_parse_mathematica_greek_character():
    # Bug: parse_mathematica raised SyntaxError on non-ASCII identifiers
    # (e.g. Greek letters) that the older, now-deprecated `mathematica`
    # parser could handle fine.
    result = parse_mathematica('λ')  # 'λ'
    assert result == Symbol('λ')
