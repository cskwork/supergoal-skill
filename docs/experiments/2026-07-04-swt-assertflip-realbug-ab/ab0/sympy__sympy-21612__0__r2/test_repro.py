from sympy.parsing.latex import parse_latex


def test_nested_fraction_denominator_needs_parens():
    # \frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}
    #
    # The denominator of the outer fraction is itself a fraction
    # (\frac{1}{c^2}). Without wrapping it in brackets when printed, the
    # result reads as "((a**3 + b)/c)/1/(c**2)", which -- read left to
    # right as chained division -- means ((a**3+b)/c) / 1 / (c**2), i.e.
    # ((a**3+b)/c) * c**-2. That is NOT what the LaTeX expression means:
    # dividing by \frac{1}{c^2} should multiply by c**2, giving
    # ((a**3+b)/c) * c**2.
    #
    # The correctly bracketed/printed form is
    # "((a**3 + b)/c)/(1/(c**2))".
    parsed = parse_latex(r"\frac{\frac{a^3+b}{c}}{\frac{1}{c^2}}")

    result_str = str(parsed)

    assert result_str == "((a**3 + b)/c)/(1/(c**2))"
    assert result_str != "((a**3 + b)/c)/1/(c**2)"
