from sympy.physics.units import milli, W

def test_repro():
    assert (milli * W == 1) is False
