def test_repro():
    """
    Test that LaTeX parsing of nested fractions preserves correct grouping.

    Bug: \frac{\frac{a^3+b}{c}}{\frac{1}{c^2}} was parsed as
    ((a**3 + b)/c)/1/(c**2) instead of ((a**3 + b)/c)/(1/(c**2))

    The missing parentheses around the denominator causes incorrect
    left-to-right division instead of proper fraction grouping.
    """
    from sympy.parsing.latex import parse_latex
    from sympy import symbols

    a, b, c = symbols('a b c')

    # Parse the LaTeX expression with nested fractions
    result = parse_latex("\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}")

    # Expected result: the denominator should be grouped as (1/(c**2))
    # not parsed as separate /1 and /(c**2) operations
    expected = ((a**3 + b)/c)/(1/(c**2))

    # Assert they are equal
    assert result == expected
