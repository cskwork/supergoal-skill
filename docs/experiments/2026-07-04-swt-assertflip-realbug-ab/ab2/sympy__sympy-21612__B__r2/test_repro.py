from sympy.parsing.latex import parse_latex


def test_repro():
    parsed = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")
    # The denominator (1/c^2) must stay bracketed as a whole, giving
    # ((a**3 + b)/c)/(1/(c**2)) rather than the mis-parenthesized
    # ((a**3 + b)/c)/1/(c**2).
    assert str(parsed) == "((a**3 + b)/c)/(1/(c**2))"
