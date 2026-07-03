from sympy.parsing.latex import parse_latex


def test_repro():
    result = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")
    assert str(result) == "((a**3 + b)/c)/(1/(c**2))"
