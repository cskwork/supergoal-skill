from sympy.parsing.latex import parse_latex
from sympy import symbols


def test_repro():
    """Test that nested fractions in LaTeX are parsed correctly.

    Bug: Latex parsing of fractions yields wrong expression due to missing brackets.
    Input: \\frac{\\frac{a^3+b}{c}}{\\frac{1}{c^2}}
    Buggy result: ((a**3 + b)/c)/1/(c**2)  [which is (a**3 + b)/c**3]
    Expected: ((a**3 + b)/c)/(1/(c**2))     [which is (a**3 + b)*c]
    """
    a, b, c = symbols('a b c')

    # The problematic LaTeX expression from the bug report
    latex_expr = r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}"

    # Parse the LaTeX
    parsed = parse_latex(latex_expr)

    # Expected: the numerator is (a**3+b)/c and the denominator is 1/(c**2)
    # So the full expression is: ((a**3 + b)/c) / (1/(c**2))
    expected = ((a**3 + b)/c) / (1/(c**2))

    # These should be equal
    assert parsed == expected
