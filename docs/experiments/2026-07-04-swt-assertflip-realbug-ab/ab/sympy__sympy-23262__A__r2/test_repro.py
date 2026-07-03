def test_repro():
    import inspect
    from sympy import lambdify

    # Reproduce: Python code printer not respecting tuple with one element
    # Bug in SymPy 1.10: single-element tuples lose their trailing comma
    # (1) is an integer in Python, while (1,) is a tuple with one element

    func = lambdify([], tuple([1]))

    # Check generated source code contains correct tuple syntax
    source = inspect.getsource(func)
    # On buggy code: source contains "return (1)"
    # On fixed code: source contains "return (1,)"
    assert "(1,)" in source, f"Expected '(1,)' in generated source but got:\n{source}"

    # Check execution result is actually a tuple
    result = func()
    # On buggy code: result is 1 (int) due to missing comma
    # On fixed code: result is (1,) (tuple)
    assert result == (1,), f"Expected (1,) but got {result}"
    assert isinstance(result, tuple), f"Expected tuple but got {type(result).__name__}"
