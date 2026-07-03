from sympy import symbols
from sympy.parsing.latex import parse_latex


def test_repro():
    """
    Test that LaTeX parsing of nested fractions preserves correct grouping.

    Bug: parsing \\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}} yields
    ((a**3 + b)/c)/1/(c**2) instead of ((a**3 + b)/c)/(1/(c**2))

    The denominator \\frac{1}{c^2} must be treated as a single unit,
    not split into separate division operations.
    """
    a, b, c = symbols('a b c')

    # Parse the problematic LaTeX expression
    result = parse_latex("\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}")

    # Expected: the outer fraction has numerator (a**3 + b)/c
    # and denominator 1/(c**2), giving ((a**3 + b)/c)/(1/(c**2))
    expected = ((a**3 + b)/c) / (1/(c**2))

    assert result == expected
