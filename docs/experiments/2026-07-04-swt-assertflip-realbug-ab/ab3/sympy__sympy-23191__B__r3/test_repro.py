from sympy import cos, sin, pi, symbols, pretty
from sympy.vector import CoordSys3D


def test_repro():
    C = CoordSys3D("C")
    y = C.y
    ten = symbols("10", positive=True)

    Bx = 2 * ten**(-4) * cos(ten**5) * sin(ten**(-3) * y)
    vecB = Bx * C.i

    s = pretty(vecB)

    # The unit vector "i_C" must appear after the full scalar coefficient,
    # not spliced into the middle of it (e.g. inside a numerator/denominator
    # fraction or between factors of a product).
    assert s.rstrip().endswith("i_C")
