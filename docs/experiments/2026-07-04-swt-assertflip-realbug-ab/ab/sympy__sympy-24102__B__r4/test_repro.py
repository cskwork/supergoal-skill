from sympy.parsing.mathematica import parse_mathematica
from sympy import Symbol


def test_repro():
    """Test that parse_mathematica can parse Greek characters like λ (lambda).

    Regression test for: Cannot parse Greek characters (and possibly others) in parse_mathematica
    The old mathematica parser could parse Greek characters, but parse_mathematica fails with SyntaxError.
    """
    result = parse_mathematica('λ')
    expected = Symbol('λ')
    assert result == expected
