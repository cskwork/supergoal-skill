from sympy.parsing.latex import parse_latex
from sympy import symbols

def test_repro():
    a, b, c = symbols('a b c')
    result = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")
    expected = ((a**3 + b)/c)/(1/(c**2))
    assert result == expected
