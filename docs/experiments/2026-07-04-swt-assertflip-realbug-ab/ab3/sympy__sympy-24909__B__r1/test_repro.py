from sympy.physics.units import milli, W


def test_repro():
    # milli*W should be milli watts (mW), not evaluate to 1
    assert milli * W != 1
