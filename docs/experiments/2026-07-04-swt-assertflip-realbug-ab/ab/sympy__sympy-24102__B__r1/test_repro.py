"""
Test reproduction for sympy issue: Cannot parse Greek characters in parse_mathematica

The old mathematica parser could parse Greek characters:
    mathematica('λ') → Symbol('λ')

The new parse_mathematica function fails with:
    SyntaxError: unable to create a single AST for the expression

This test verifies the fix works correctly.
"""
from sympy.parsing.mathematica import parse_mathematica
from sympy import Symbol


def test_repro():
    """Test that parse_mathematica can parse Greek characters like λ."""
    # Parse the Greek lambda character
    result = parse_mathematica('λ')

    # Expected behavior: should return a Symbol with name 'λ'
    expected = Symbol('λ')

    # Verify result matches expected
    assert result == expected
