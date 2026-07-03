from sympy import symbols, solve_poly_system


def test_repro():
    """Test that solve_poly_system raises NotImplementedError for infinite solutions.

    Bug: When solving a polynomial system with more variables than equations,
    the system is underdetermined and has infinite solutions. This should raise
    NotImplementedError, but currently solve_poly_system((y - 1,), x, y)
    incorrectly returns [(1,)] instead.
    """
    x, y = symbols('x y')

    # The equation (y - 1,) only constrains y, leaving x free
    # With 2 variables and 1 equation, we have infinite solutions
    # This should raise NotImplementedError
    exception_raised = False
    try:
        solve_poly_system((y - 1,), x, y)
    except NotImplementedError:
        exception_raised = True

    assert exception_raised, (
        "Expected NotImplementedError for underdetermined system "
        "(2 variables but only 1 equation)"
    )
