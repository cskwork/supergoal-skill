def test_repro():
    """
    Test that parse_mathematica can parse Greek characters like λ.

    Reproduces issue where parse_mathematica('λ') raises SyntaxError,
    while the old mathematica('λ') function worked correctly.
    """
    from sympy.parsing.mathematica import parse_mathematica
    from sympy import Symbol

    # parse_mathematica should handle Greek characters like λ
    result = parse_mathematica('λ')

    # The result should be a Symbol representing λ
    expected = Symbol('λ')
    assert result == expected
