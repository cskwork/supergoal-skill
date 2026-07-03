from sympy import sin, pretty
from sympy.vector import CoordSys3D


def test_repro():
    CC_ = CoordSys3D("C")
    y = CC_.y
    xhat = CC_.i

    expr = (2 * sin(y / 3) / 10 + 1) * xhat
    result = pretty(expr)

    # CORRECT behavior: the "i_C" unit vector label should NOT be spliced
    # into the middle of the fraction's numerator line; it belongs with
    # the vertically-centered row of the whole multi-line expression.
    lines = result.split("\n")
    assert "i_C" not in lines[1]
    assert "i_C" in lines[-2]
