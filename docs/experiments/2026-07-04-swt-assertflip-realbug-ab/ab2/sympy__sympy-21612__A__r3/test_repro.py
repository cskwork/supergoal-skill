from sympy.parsing.latex import parse_latex


def test_repro():
    expr = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")
    assert str(expr) == "((a**3 + b)/c)/(1/(c**2))"
