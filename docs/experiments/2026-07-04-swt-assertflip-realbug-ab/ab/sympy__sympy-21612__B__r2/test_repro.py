from sympy.parsing.latex import parse_latex
from sympy import symbols


def test_repro():
    """Test that LaTeX parsing of nested fractions correctly preserves denominator structure.

    Bug: Parsing \\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}} yields
    ((a**3 + b)/c)/1/(c**2) instead of ((a**3 + b)/c)/(1/(c**2))

    The missing brackets in the denominator cause incorrect operator precedence.
    """
    a, b, c = symbols('a b c')

    # Parse the problematic LaTeX expression
    result = parse_latex("\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}")

    # Expected: the complete numerator fraction divided by the complete denominator fraction
    # Numerator: (a**3 + b)/c
    # Denominator: 1/(c**2)
    expected = ((a**3 + b)/c) / (1/(c**2))

    # Assert the parsed result matches the expected structure
    assert result == expected
