def test_repro():
    """
    Reproduction test for sympy issue #22005.

    solve_poly_system should raise NotImplementedError when given
    an infinite-dimensional system (fewer equations than variables).

    Bug: solve_poly_system((y - 1,), x, y) incorrectly returns [(1,)]
    Expected: should raise NotImplementedError

    The system has 1 equation and 2 variables, which means infinite solutions
    are possible (x can be any value). Only zero-dimensional systems
    (finite number of solutions) are supported.
    """
    from sympy import symbols, solve_poly_system

    x, y = symbols('x y')

    # This system has 1 equation and 2 variables => infinite solutions
    # Should raise NotImplementedError, not return [(1,)]
    try:
        result = solve_poly_system((y - 1,), x, y)
        assert False, f"Expected NotImplementedError but got: {result}"
    except NotImplementedError:
        pass  # Expected behavior - test passes
