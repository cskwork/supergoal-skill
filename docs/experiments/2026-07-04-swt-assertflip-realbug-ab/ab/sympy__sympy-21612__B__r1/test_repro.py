"""Test for sympy LaTeX parsing of nested fractions with correct denominator grouping."""

from sympy.parsing.latex import parse_latex
from sympy import symbols


def test_repro():
    """
    Test that nested fractions in LaTeX are parsed with proper denominator grouping.

    Bug: \frac{\frac{a^3+b}{c}}{\frac{1}{c^2}} was incorrectly parsed as
    ((a**3 + b)/c)/1/(c**2) instead of ((a**3 + b)/c)/(1/(c**2)).

    The denominator \frac{1}{c^2} must be grouped as (1/(c**2)), not left as 1/(c**2)
    which causes incorrect operator precedence.
    """
    a, b, c = symbols('a b c')

    # Parse the nested fraction LaTeX expression
    result = parse_latex("\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}")

    # Construct the expected expression with correct grouping
    # Numerator: \frac{a^3+b}{c} → (a**3 + b)/c
    # Denominator: \frac{1}{c^2} → 1/(c**2)  [must be grouped]
    # Full expression: numerator / denominator
    expected = ((a**3 + b)/c) / (1/(c**2))

    # The parsed result should match the expected expression
    assert result == expected, (
        f"LaTeX parsing failed for nested fractions.\n"
        f"Got: {result}\n"
        f"Expected: {expected}"
    )
