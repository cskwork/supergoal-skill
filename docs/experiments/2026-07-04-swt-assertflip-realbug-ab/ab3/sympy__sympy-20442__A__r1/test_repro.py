from sympy.physics.units import convert_to, joule, second


def test_repro():
    # joule and second are orthogonal units (joule has no time-only component
    # that reduces cleanly against the leftover `second` factor), so
    # convert_to(joule*second, joule) should NOT be able to express the result
    # purely in powers of joule. The buggy implementation instead fabricates
    # a fractional power of joule (joule**(7/9) with an irrational-looking
    # coefficient), which is not a meaningful unit conversion.
    result = convert_to(joule * second, joule)
    assert result == joule * second
