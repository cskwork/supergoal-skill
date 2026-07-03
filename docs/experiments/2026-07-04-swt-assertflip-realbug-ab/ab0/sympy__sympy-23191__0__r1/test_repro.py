"""
Regression test for: pretty printing of a sympy.vector expression inserts the
unit vector symbol (e.g. ``i_C``) into the middle of the scalar coefficient's
pretty form instead of appending it after the coefficient.

Bug report: pretty_print/pprint jumbles output for expressions like
    (2*sin(y/3)*cos(t**5)/4) * CoordSys3D("C").i
placing "i_C" in between two factors of the coefficient's product instead of
at the end of the printed coefficient.
"""
from sympy import symbols, sin, cos, pretty
from sympy.vector import CoordSys3D


def test_vector_pretty_print_unit_vector_not_jumbled_into_coefficient():
    CC = CoordSys3D("C")
    y = CC.y
    t = symbols("t")

    expr = (2 * sin(y / 3) * cos(t ** 5) / 4) * CC.i

    s = pretty(expr)
    lines = s.split("\n")

    unit_vector_lines = [line for line in lines if "i_C" in line]
    assert unit_vector_lines, "unit vector 'i_C' not found in pretty output"

    for line in unit_vector_lines:
        after = line.split("i_C", 1)[1]
        # Whatever follows "i_C" on its line must only be box-drawing /
        # padding characters (closing brackets or spaces) -- never another
        # operator or function call, which would mean the unit vector got
        # inserted in the middle of the coefficient instead of trailing it.
        stray = after.strip(" ")  # only trailing padding spaces are allowed
        assert stray == "", (
            f"unit vector 'i_C' is jumbled into the middle of the "
            f"expression instead of trailing it; line was: {line!r}"
        )
