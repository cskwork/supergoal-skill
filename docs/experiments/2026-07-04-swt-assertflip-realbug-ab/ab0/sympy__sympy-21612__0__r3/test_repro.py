from sympy import Symbol
from sympy.parsing.latex import parse_latex


def test_nested_fraction_denominator_has_brackets():
    a = Symbol("a")
    b = Symbol("b")
    c = Symbol("c")

    result = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")

    expected = ((a ** 3 + b) / c) / (1 / (c ** 2))

    # Without brackets around the denominator's own fraction, the parser
    # produces ((a**3 + b)/c)/1/(c**2), which simplifies to
    # (a**3 + b) * c, not the intended (a**3 + b) * c**3.
    assert result == expected
