"""Reproduction test for sympy issue #21612: LaTeX parsing of nested fractions."""

from sympy.parsing.latex import parse_latex
from sympy import symbols


def test_repro():
    """Test that nested fractions in LaTeX are parsed with correct bracketing.

    Bug: parse_latex("\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}")
    incorrectly parses the denominator \\frac{1}{c^2} as separate
    division operations instead of a single fraction unit.

    Current (buggy): ((a**3 + b)/c)/1/(c**2)
    Expected:       ((a**3 + b)/c)/(1/(c**2))
    """
    latex_expr = "\\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}"
    result = parse_latex(latex_expr)

    a, b, c = symbols('a b c')
    # Expected: numerator / denominator where:
    #   numerator = (a^3 + b) / c
    #   denominator = 1 / c^2
    expected = ((a**3 + b) / c) / (1 / c**2)

    assert result == expected, (
        f"LaTeX nested fraction parsed incorrectly.\n"
        f"Got:      {result}\n"
        f"Expected: {expected}"
    )
