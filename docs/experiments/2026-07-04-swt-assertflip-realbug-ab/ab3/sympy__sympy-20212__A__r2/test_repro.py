from sympy import Integer, oo, zoo

def test_repro():
    assert Integer(0)**(-oo) == zoo
