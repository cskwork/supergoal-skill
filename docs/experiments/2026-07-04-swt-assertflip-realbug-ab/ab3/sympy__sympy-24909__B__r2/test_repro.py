from sympy.physics.units import milli, W


def test_repro():
    # milli*W should produce milliwatts (a Quantity/expression), not the number 1
    result = milli * W
    assert result != 1
