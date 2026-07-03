from sympy import symbols, solve_poly_system

def test_repro():
    """
    Test that solve_poly_system correctly detects infinite solution systems.

    When a polynomial system has fewer equations than variables,
    it has infinite solutions and should raise NotImplementedError.

    Bug: solve_poly_system((y - 1,), x, y) incorrectly returns [(1,)]
    instead of raising NotImplementedError.
    """
    x, y = symbols('x y')

    # Case 1: one equation in x, two variables (x, y)
    # y is unconstrained, so infinite solutions
    try:
        solve_poly_system((x - 1,), x, y)
        assert False, "Expected NotImplementedError for (x - 1,) with (x, y)"
    except NotImplementedError:
        pass

    # Case 2: one equation in y, two variables (x, y)
    # x is unconstrained, so infinite solutions
    # BUG: currently returns [(1,)] instead of raising NotImplementedError
    try:
        solve_poly_system((y - 1,), x, y)
        assert False, "Expected NotImplementedError for (y - 1,) with (x, y)"
    except NotImplementedError:
        pass
