from sympy.physics.quantum import Operator, TensorProduct


def test_repro():
    U = Operator('U')
    V = Operator('V')
    P = TensorProduct(2 * U - V, U + V)
    result = P.expand(tensorproduct=True)
    expected_str = "2*UxU + 2*UxV - VxU - VxV"
    assert str(result) == expected_str
