from sympy.parsing.mathematica import parse_mathematica
from sympy import Symbol


def test_repro():
    """Test that parse_mathematica can parse Greek characters like 'λ'.

    This functionality was supported by the old mathematica() function
    and should be preserved in parse_mathematica().
    """
    result = parse_mathematica('λ')
    expected = Symbol('λ')
    assert result == expected
