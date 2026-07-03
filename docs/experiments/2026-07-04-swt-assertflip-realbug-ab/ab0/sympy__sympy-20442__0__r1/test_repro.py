from sympy import S
from sympy.physics.units import convert_to, joule, second


def test_convert_to_does_not_combine_orthogonal_units():
    """convert_to(joule*second, joule) has no valid representation since
    joule*second is not expressible purely in terms of joule (the units
    are orthogonal). It must not silently produce something like
    joule**(7/9); it should instead leave the expression unevaluated
    (return joule*second unchanged).
    """
    result = convert_to(joule * second, joule)

    # The buggy behavior invents a fractional power of joule, e.g.
    # 10**(2/3)*joule**(7/9), which is not dimensionally meaningful.
    assert result == joule * second, (
        f"convert_to combined orthogonal units into a nonsensical result: {result}"
    )

    # Extra guard against the specific nonsensical fractional-power output.
    assert not result.has(S(7) / 9)
