from sympy import S
from sympy.physics.units import convert_to, joule, second


def test_convert_to_does_not_fabricate_fractional_powers():
    """convert_to(joule*second, joule) must not combine orthogonal units.

    joule*second has dimension energy*time, which is not expressible as a
    power of joule (dimension energy) alone. convert_to should therefore
    return the original (unconvertible) expression rather than fabricating
    a bogus result like joule**(7/9) (or 10**(2/3)*joule**(7/9)).
    """
    result = convert_to(joule * second, joule)

    # The buggy behavior produces a Pow of joule with a non-integer,
    # non-1 exponent (e.g. joule**(7/9)), possibly with a numeric
    # coefficient like 10**(2/3). Since joule*second cannot be expressed
    # purely in terms of joule, convert_to should leave the expression
    # unconverted (equal to the original joule*second), not synthesize
    # a fractional power of joule.
    assert result == joule * second, (
        f"convert_to fabricated an invalid conversion: {result}"
    )
