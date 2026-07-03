from sympy import Rational, Symbol
from sympy.parsing.latex import parse_latex


def test_nested_fraction_denominator_gets_brackets():
    a, c = Symbol('a'), Symbol('c')
    b = Symbol('b')

    expr = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")

    expected = ((a**3 + b) / c) / (1 / (c**2))

    assert expr == expected
    # Sanity check against the reported wrong result: the buggy parser
    # produces ((a**3 + b)/c)/1/(c**2) which simplifies to
    # ((a**3+b)/c) * c**2 / 1, i.e. c**2*(a**3+b)/c -- different from expected.
    assert expr != ((a**3 + b) / c) / 1 / (c**2)
