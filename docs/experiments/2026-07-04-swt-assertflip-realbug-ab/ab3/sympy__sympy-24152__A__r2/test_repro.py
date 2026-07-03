from sympy.physics.quantum import Operator, TensorProduct


def test_repro():
    U = Operator('U')
    V = Operator('V')
    P = TensorProduct(2 * U - V, U + V)
    result = P.expand(tensorproduct=True)
    # Correct behavior: a single expand(tensorproduct=True) call should fully
    # expand both tensor factors, not stop after only the second factor.
    assert str(result) == '2*UxU + 2*UxV - VxU - VxV'
