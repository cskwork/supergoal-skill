def test_repro():
    """
    Test that LaTeX parsing of nested fractions preserves correct structure.

    Bug: \frac{\frac{a^3+b}{c}}{\frac{1}{c^2}} should parse to ((a**3 + b)/c)/(1/(c**2))
    but currently parses to ((a**3 + b)/c)/1/(c**2), losing the grouping of the denominator.
    """
    from sympy.parsing.latex import parse_latex
    from sympy import symbols

    a, b, c = symbols('a b c')

    latex_expr = "\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}"
    result = parse_latex(latex_expr)

    # Expected: numerator is (a**3 + b)/c, denominator is 1/(c**2)
    # The full expression divides numerator by denominator
    expected = ((a**3 + b)/c) / (1/(c**2))

    assert result == expected
