"""
Regression test for: Python code printer not respecting tuple with one element.

lambdify([], (1,)) should generate code that returns a one-element tuple
`(1,)`, not a plain int `(1)`. The bug dropped the trailing comma needed
to disambiguate a single-element tuple from a parenthesized expression.
"""
from sympy import lambdify


def test_lambdify_single_element_tuple_returns_tuple():
    f = lambdify([], tuple([1]))
    result = f()
    assert isinstance(result, tuple), (
        f"expected a tuple, got {type(result)!r} (value={result!r}); "
        "the generated source likely lost the trailing comma, e.g. "
        "'return (1)' instead of 'return (1,)'"
    )
    assert result == (1,)


def test_lambdify_multi_element_tuple_still_correct():
    # Sanity check: multi-element tuples were never affected by this bug.
    f = lambdify([], tuple([1, 2]))
    result = f()
    assert isinstance(result, tuple)
    assert result == (1, 2)
