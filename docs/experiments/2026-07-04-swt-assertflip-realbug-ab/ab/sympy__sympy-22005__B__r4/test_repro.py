def test_repro():
    """
    Reproduce bug: solve_poly_system should raise NotImplementedError for
    under-constrained systems (infinite solutions).

    The system (y - 1,) with variables (x, y) has infinite solutions
    (any value of x is valid when y=1), so it should raise NotImplementedError.

    On buggy code: returns [(1,)] - WRONG (ignores that x is unconstrained)
    On fixed code: raises NotImplementedError - CORRECT
    """
    from sympy import solve_poly_system, symbols

    x, y = symbols('x y')

    # This under-constrained system should raise NotImplementedError
    # because it has infinite solutions (one equation, two variables)
    error_raised = False
    try:
        result = solve_poly_system((y - 1,), x, y)
    except NotImplementedError:
        error_raised = True

    assert error_raised, (
        "Expected NotImplementedError for under-constrained system "
        "(one univariate equation with multiple variables)"
    )
