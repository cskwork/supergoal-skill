"""
Reproduction test for: Cannot parse Greek characters in parse_mathematica

Issue: parse_mathematica() fails to parse Greek characters (e.g., λ) that the
deprecated mathematica() function successfully parsed.

Expected: parse_mathematica('λ') should return a Symbol('λ')
Current:  SyntaxError: unable to create a single AST for the expression
"""

from sympy.parsing.mathematica import parse_mathematica


def test_repro():
    """Test that parse_mathematica can parse Greek characters."""
    # The old mathematica() function could parse Greek characters like λ
    # The new parse_mathematica() should support the same
    result = parse_mathematica('λ')

    # The result should be a symbol with the name 'λ'
    assert str(result) == 'λ'
