def test_repro():
    """Test that LaTeX parsing of nested fractions produces correct expression.

    Bug: \frac{\frac{a^3+b}{c}}{\frac{1}{c^2}} was incorrectly parsed,
    treating the denominator \frac{1}{c^2} as separate division operations
    instead of a single fraction, yielding wrong operator precedence.
    """
    from sympy.parsing.latex import parse_latex
    from sympy import symbols

    a, b, c = symbols('a b c')

    # Problematic LaTeX expression from bug report
    latex_expr = "\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}"
    result = parse_latex(latex_expr)

    # The correct interpretation: a fraction with
    # numerator = (a^3+b)/c and denominator = 1/c^2
    # So the result should be: ((a**3 + b)/c) / (1/c**2)
    expected = ((a**3 + b)/c) / (1/(c**2))

    # The bug caused it to parse as ((a**3 + b)/c)/1/(c**2)
    # which mathematically is (a**3+b)/c^3, not (a**3+b)*c
    assert result == expected
