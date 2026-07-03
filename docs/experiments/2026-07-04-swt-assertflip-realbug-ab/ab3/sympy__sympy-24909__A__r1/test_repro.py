from sympy.physics.units import milli, W


def test_repro():
    # milli*W should evaluate to milli watts (mW), not the number 1.
    assert milli * W != 1
