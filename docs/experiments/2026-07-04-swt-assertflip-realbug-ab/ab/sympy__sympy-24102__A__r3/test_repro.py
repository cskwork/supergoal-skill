def test_repro():
    """Test that parse_mathematica can parse Greek characters like the old mathematica function."""
    from sympy.parsing.mathematica import parse_mathematica
    from sympy import Symbol

    # The old mathematica('λ') returned Symbol('λ')
    # parse_mathematica should behave the same way
    result = parse_mathematica('λ')
    expected = Symbol('λ')
    assert result == expected
