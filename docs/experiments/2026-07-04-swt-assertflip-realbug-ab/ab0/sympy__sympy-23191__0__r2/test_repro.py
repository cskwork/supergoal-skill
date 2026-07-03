"""
Regression test for: pretty printing of a sympy.vector expression jumbles
the output by inserting the unit vector in the middle of a multi-line,
parenthesized coefficient instead of placing it right after the closing
parenthesis.

See bug report: pprint(vecB) where vecB = Bx * xhat and Bx contains a
product of a sin(...) term (itself needing its own parentheses) and a
cos(...) term. The buggy printer replaces the *first* occurrence of the
paren-character it is looking for, which happens to belong to the nested
sin(...) parenthesis rather than the outer coefficient parenthesis, so the
unit vector symbol ends up wedged between "sin(...)" and "*cos(...)"
instead of appearing after the whole coefficient.
"""
from sympy import Integer, cos, sin, symbols, pretty
from sympy.vector import CoordSys3D


def test_basis_dependent_pretty_print_unit_vector_not_jumbled():
    C = CoordSys3D("C")
    y = C.y
    xhat = C.i
    t = symbols("t")

    # Coefficient is a product of two trig terms, one of which (sin) has
    # its own parenthesized argument -- this is what triggers the bug.
    Bx = 2 * Integer(10) ** (-4) * cos(Integer(10) ** 5 * t) * sin(Integer(10) ** (-3) * y)
    vecB = Bx * xhat

    pretty_str = pretty(vecB)
    lines = pretty_str.split("\n")

    unit_vector_symbol = xhat._pretty_form  # e.g. "i_C"

    lines_with_unit_vector = [line for line in lines if unit_vector_symbol in line]
    assert len(lines_with_unit_vector) == 1, (
        f"expected the unit vector {unit_vector_symbol!r} to appear on exactly "
        f"one line, got: {lines_with_unit_vector!r}\nfull output:\n{pretty_str}"
    )

    line = lines_with_unit_vector[0]

    # The unit vector must be the last thing printed on its line (immediately
    # following the closing parenthesis of the whole coefficient), not
    # inserted in the middle of the coefficient's own sub-expressions.
    assert line.rstrip().endswith(unit_vector_symbol), (
        "unit vector was inserted in the middle of the coefficient instead "
        f"of appearing after it.\nline: {line!r}\nfull output:\n{pretty_str}"
    )

    # Also make sure it wasn't inserted right after a nested/inner
    # parenthesis close followed by more coefficient content (the concrete
    # symptom from the bug report).
    idx = line.find(unit_vector_symbol)
    remainder = line[idx + len(unit_vector_symbol):]
    assert remainder.strip() == "", (
        f"found trailing content {remainder!r} after the unit vector on the "
        f"same line -- it was jumbled into the middle of the expression.\n"
        f"full output:\n{pretty_str}"
    )


if __name__ == "__main__":
    test_basis_dependent_pretty_print_unit_vector_not_jumbled()
    print("OK")
