from sympy.physics.units import milli, W


def test_repro():
    result = milli * W
    # milli*W should be milli watts (mW), not the bare number 1
    assert result != 1
