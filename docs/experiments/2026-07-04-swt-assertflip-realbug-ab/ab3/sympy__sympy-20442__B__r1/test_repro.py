from sympy.physics.units import joule, second, convert_to


def test_repro():
    # joule*second has dimension mass*length**2/time, which is not
    # expressible as a power of joule alone. convert_to should return the
    # original (unconvertible) expression unchanged, not a fractional power
    # of joule.
    result = convert_to(joule * second, joule)
    assert result == joule * second
