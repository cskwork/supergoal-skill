from sympy.physics.units import milli, W


def test_milli_times_watt_is_not_one():
    """milli*W should give milliwatts, not the number 1 (sympy issue: Prefix*Quantity).

    Reproduces: https://github.com/sympy/sympy/issues (milli prefix bug)
    In [1]: milli*W == 1  -> True  (buggy)
    """
    result = milli * W
    assert result != 1
    # The multiplication should be commutative and produce the same
    # (correct) milliwatt quantity regardless of operand order.
    assert result == W * milli
