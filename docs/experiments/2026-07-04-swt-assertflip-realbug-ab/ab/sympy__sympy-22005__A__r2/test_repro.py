def test_repro():
    import pytest
    from sympy import symbols, solve_poly_system

    x, y = symbols('x y')

    # Bug: solve_poly_system((y - 1,), x, y) incorrectly returns [(1,)]
    # Should raise NotImplementedError because the system has infinite solutions:
    # y is constrained to 1, but x is free (not zero-dimensional).
    # The fix adds check: only treat univariate poly as sole constraint if len(gens) == 1
    with pytest.raises(NotImplementedError):
        solve_poly_system((y - 1,), x, y)
