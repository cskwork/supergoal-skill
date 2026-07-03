def test_repro():
    """Test that parse_mathematica can parse Greek characters like λ."""
    from sympy.parsing.mathematica import parse_mathematica
    from sympy import Symbol

    # The old mathematica() function could parse Greek characters.
    # The new parse_mathematica() should also support this.
    result = parse_mathematica('λ')

    # Should return a Symbol with name 'λ'
    assert result == Symbol('λ')
