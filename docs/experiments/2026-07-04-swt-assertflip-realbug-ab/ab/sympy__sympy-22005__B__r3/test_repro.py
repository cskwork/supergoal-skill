def test_repro():
    """
    Reproduces bug: solve_poly_system with univariate polynomial and multiple
    variables should raise NotImplementedError (infinite solutions), but currently
    returns incorrect result for case (y - 1,), (x, y).

    Expected: Both cases raise NotImplementedError.
    Bug: Case 2 returns [(1,)] instead.
    """
    from sympy import symbols, solve_poly_system

    x, y = symbols('x y')

    # Case 1: univariate poly (x - 1) with two variables (x, y)
    # Has infinite solutions for y, so must raise NotImplementedError
    try:
        result = solve_poly_system((x - 1,), x, y)
        assert False, f"Case 1: Expected NotImplementedError but got {result}"
    except NotImplementedError:
        pass  # Expected behavior

    # Case 2: univariate poly (y - 1) with two variables (x, y)
    # Has infinite solutions for x, so must raise NotImplementedError
    # BUG: Currently returns [(1,)] instead of raising
    try:
        result = solve_poly_system((y - 1,), x, y)
        assert False, f"Case 2: Expected NotImplementedError but got {result}"
    except NotImplementedError:
        pass  # Expected behavior after fix
