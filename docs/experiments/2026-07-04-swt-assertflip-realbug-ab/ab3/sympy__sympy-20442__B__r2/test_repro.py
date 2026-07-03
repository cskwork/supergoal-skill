from sympy.physics.units import convert_to, joule, second


def test_repro():
    # convert_to should not silently combine orthogonal units into a
    # fractional power of a single unit when the target unit's dimension
    # does not match the expression's dimension. joule*second has
    # dimension energy*time, which is not expressible as any power of
    # joule (energy) alone, so convert_to should return the expression
    # essentially unchanged (i.e. still contain a `second` factor),
    # not something like joule**(7/9).
    result = convert_to(joule * second, joule)
    assert result.has(second), (
        "convert_to(joule*second, joule) incorrectly dropped the "
        "orthogonal `second` unit and returned %s" % result
    )
