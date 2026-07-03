"""
Regression test for: convert_to combines orthogonal (dimensionally
incompatible) units into a nonsensical fractional power instead of
leaving the expression unchanged (or erroring).

Bug report example: J = kg*m**2/s**2, so J*s has dimension energy*time,
which cannot be expressed as a pure power of joule (energy). The buggy
implementation nonetheless returns joule**(7/9), which is wrong.
"""
from sympy import Pow
from sympy.physics.units import convert_to, joule, second


def test_convert_to_does_not_combine_orthogonal_units():
    result = convert_to(joule * second, joule)

    # The buggy behavior collapses the expression into a fractional
    # power of joule alone (e.g. joule**(7/9) or 10**(2/3)*joule**(7/9)).
    # That is dimensionally nonsensical: joule*second is not expressible
    # as any power of joule. Fixed behavior should leave the expression
    # unchanged (joule*second) since the target unit does not span the
    # dimension of the source expression.
    assert result == joule * second

    # Guard against the specific manifestation of the bug: a fractional
    # (non-integer) power of joule appearing in the result.
    for term in result.atoms(Pow):
        base, exp = term.as_base_exp()
        if base == joule:
            assert exp.is_integer, (
                f"convert_to produced a fractional power of joule: {result}"
            )
