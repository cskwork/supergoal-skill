import pytest
from sympy import symbols, solve_poly_system


def test_repro():
    """
    Test that solve_poly_system raises NotImplementedError for underdetermined systems.

    Bug: When the system has fewer equations than variables (infinite solutions),
    solve_poly_system should raise NotImplementedError, but (y - 1,) with variables
    (x, y) incorrectly returns [(1,)] instead of raising.

    This test FAILS on buggy code (returns [(1,)] instead of raising).
    This test PASSES on fixed code (raises NotImplementedError as expected).
    """
    x, y = symbols('x y')

    # This should raise NotImplementedError because we have an underdetermined system:
    # one equation (y - 1) with two variables (x, y) leads to infinite solutions
    with pytest.raises(NotImplementedError):
        solve_poly_system((y - 1,), x, y)
