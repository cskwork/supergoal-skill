"""
Reproduces: pretty printing of a sympy.vector expression inserts the unit
vector symbol (e.g. "i_C") in the middle of the numerator instead of at the
end of the expression.

See bug report: pprint(vecB) jumbles output by putting "i_C" between the
sin(...) and cos(...) factors of the numerator (and drops the "*" dot
between them), instead of appending "i_C" after the whole numerator.
"""
from sympy import cos, sin, symbols, pretty
from sympy.vector import CoordSys3D


def test_pretty_print_basis_dependent_places_unit_vector_at_end():
    CC = CoordSys3D("C")
    y = CC.y
    xhat = CC.i

    t = symbols("t")
    ten = symbols("10", positive=True)

    Bx = 2 * ten ** (-4) * cos(ten ** 5 * t) * sin(ten ** (-3) * y)
    vecB = Bx * xhat

    result = pretty(vecB)
    lines = result.split("\n")

    # The unit vector label must appear exactly once, and only on a single
    # line of the multi-line pretty output.
    lines_with_ihat = [line for line in lines if "i_C" in line]
    assert len(lines_with_ihat) == 1, (
        "expected the unit vector 'i_C' to appear on exactly one line, "
        f"got: {result!r}"
    )

    # Bug: "i_C" gets spliced in between the sin(...) and cos(...) factors,
    # e.g. "...sin(y_C/10**3) i_C*cos(10**5*t)...", which also breaks the
    # multiplication dot between the two factors. The fixed behaviour keeps
    # "sin(...)*cos(...)" together and appends " i_C" after it.
    line = lines_with_ihat[0]
    assert "cos" in line and "sin" in line
    sin_idx = line.index("sin")
    cos_idx = line.index("cos")
    ihat_idx = line.index("i_C")

    # The unit vector must come after both trig factors, not between them.
    assert ihat_idx > sin_idx and ihat_idx > cos_idx, (
        "unit vector 'i_C' was inserted before/between the numerator's "
        f"factors instead of after them: {line!r}"
    )

    # The multiplication dot between sin(...) and cos(...) must be intact
    # (the bug drops it when splicing in the unit vector).
    assert "⋅cos" in result or "*cos" in result, (
        f"multiplication operator between sin(...) and cos(...) was lost: {result!r}"
    )
