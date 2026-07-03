from sympy import cos, pretty, sin, symbols
from sympy.vector import CoordSys3D


def test_repro():
    """Pretty-printing a Vector must not interleave the unit vector (e.g. i_C)
    into the middle of the scalar coefficient's expression tree.

    The unit vector is a multiplicative factor of the *whole* coefficient,
    so it must appear after the coefficient is fully rendered (e.g. after
    the closing paren of an outer fraction), never wedged between two of the
    coefficient's own sub-factors such as sin(...) and cos(...).
    """
    CC_ = CoordSys3D("C")
    y = CC_.y
    xhat = CC_.i

    t = symbols("t")
    ten = symbols("10", positive=True)

    Bx = 2 * ten ** (-4) * cos(ten ** 5 * t) * sin(ten ** (-3) * y)
    vecB = Bx * xhat

    s = pretty(vecB)

    # Buggy rendering splices "i_C" directly between the sin(...) and
    # cos(...) factors of the numerator, e.g. "...sin(y_C/10**3) i_C*cos(...)".
    # Correct rendering keeps the unit vector outside/after the fully
    # rendered coefficient, so this substring must never occur.
    assert "i_C⋅cos" not in s, (
        "unit vector 'i_C' was jumbled into the middle of the scalar "
        "coefficient instead of appearing after it:\n" + s
    )
