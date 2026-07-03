from sympy import symbols, sin, cos, pretty
from sympy.vector import CoordSys3D


def test_repro():
    C = CoordSys3D('C')
    y = C.y
    t = symbols('t')
    ten = symbols('10', positive=True)
    # mirrors the report's expression shape: a nested fraction inside sin,
    # multiplied by cos(t) and divided by a power, all times a unit vector.
    Bx = 2 * ten**(-4) * cos(ten**5 * t) * sin(y / ten**3)
    v = Bx * C.i
    s = pretty(v)
    print(s)
    lines = s.split("\n")
    # the unit vector "i_C" should be attached only on one line, at the
    # vertical center of the whole printed expression block -- not appear
    # spliced into the interior of the expression on its own line, breaking
    # the fraction/cos term apart.
    ic_lines = [i for i, line in enumerate(lines) if "i_C" in line]
    assert len(ic_lines) == 1
    center = len(lines) // 2
    assert ic_lines[0] == center
