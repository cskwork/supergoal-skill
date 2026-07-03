from sympy import symbols, sin, cos, pretty
from sympy.vector import CoordSys3D


def test_repro():
    # Reproduces: pretty-printing a sympy.vector expression whose scalar
    # coefficient is a multi-line fraction inserts the unit vector (e.g.
    # "i_C") in the middle of the scalar expression instead of appending
    # it after the complete expression.
    C = CoordSys3D("C")
    y, t = symbols("y t")
    ten = symbols("10", positive=True)

    Bx = 2 * ten ** (-4) * cos(ten ** 5 * t) * sin(ten ** (-3) * y)
    vecB = Bx * C.i

    p = pretty(vecB)

    # The scalar factors "sin(...)" and "cos(...)" are multiplied together
    # and must stay adjacent; the unit vector "i_C" must not be spliced in
    # between them (this is exactly the jumbling described in the bug
    # report: the unit vector appears in the middle of the output).
    assert "i_C⋅cos" not in p, (
        "unit vector 'i_C' was inserted in the middle of the scalar "
        "expression instead of after it:\n" + p
    )
