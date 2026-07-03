"""
Reproduction test for parse_mathematica Greek character parsing bug.

Bug: parse_mathematica('λ') raises SyntaxError, but should parse Greek characters
like the old mathematica() function did.
"""


def test_repro():
    """Test that parse_mathematica can parse Greek characters like lambda."""
    from sympy.parsing.mathematica import parse_mathematica
    from sympy import Symbol

    # This should not raise a SyntaxError
    result = parse_mathematica('λ')

    # The result should be a Symbol named 'λ', matching the old mathematica() behavior
    assert result == Symbol('λ')
