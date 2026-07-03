from sympy import symbols, solve_poly_system

def test_repro():
    """Test that solve_poly_system correctly rejects infinite solution sets.

    The equation (y - 1,) with variables (x, y) represents y = 1 with x free.
    This has infinite solutions, so should raise NotImplementedError.

    On buggy code: returns [(1,)] instead of raising
    On fixed code: raises NotImplementedError as expected
    """
    x, y = symbols('x y')

    exception_raised = False
    try:
        solve_poly_system((y - 1,), x, y)
    except NotImplementedError:
        exception_raised = True

    assert exception_raised
