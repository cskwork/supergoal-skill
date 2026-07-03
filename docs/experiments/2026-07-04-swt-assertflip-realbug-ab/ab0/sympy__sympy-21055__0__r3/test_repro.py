"""
Reproduces: refine() does not understand how to simplify Abs(x) and arg(x)
for real/positive x.

Bug report (sympy):
    >>> refine(abs(a), Q.positive(a))
    a
    >>> refine(arg(a), Q.positive(a))
    arg(a)          # should be 0

This test FAILS on the buggy code (arg(a) is left unrefined) and PASSES
once refine() gains a handler for `arg` that uses the assumptions.
"""
from sympy import Symbol, Q, refine, arg, S


def test_refine_arg_positive():
    a = Symbol('a')
    assert refine(arg(a), Q.positive(a)) == 0


def test_refine_arg_negative():
    a = Symbol('a')
    assert refine(arg(a), Q.negative(a)) == S.Pi


if __name__ == "__main__":
    test_refine_arg_positive()
    test_refine_arg_negative()
    print("OK")
