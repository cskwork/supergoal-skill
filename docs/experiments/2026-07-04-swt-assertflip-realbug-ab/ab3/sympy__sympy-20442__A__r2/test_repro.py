from sympy.physics.units import convert_to, joule, second


def test_repro():
    # joule*second cannot be expressed purely in terms of joule (orthogonal
    # units); convert_to should return the unchanged original expression,
    # not fabricate a fractional power of joule.
    result = convert_to(joule * second, joule)
    assert result == joule * second
