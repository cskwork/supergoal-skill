from sympy.physics.units import convert_to, joule, second


def test_repro():
    # joule*second cannot be expressed purely in terms of joule
    # (joule = kg*m**2/s**2, so joule*second = kg*m**2/s, which is orthogonal
    # to joule alone). convert_to should return the expression unchanged
    # (or otherwise not fabricate a fractional power of joule).
    result = convert_to(joule * second, joule)
    assert result == joule * second, (
        "convert_to fabricated a bogus conversion: got %s" % result
    )
