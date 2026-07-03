from sympy.physics.quantum import Operator, TensorProduct


def test_repro():
    U = Operator('U')
    V = Operator('V')
    P = TensorProduct(2 * U - V, U + V)
    result = P.expand(tensorproduct=True)
    # Correct behavior: expansion should fully distribute both tensor
    # factors, not just the first one.
    expected = (2 * TensorProduct(U, U) + 2 * TensorProduct(U, V)
                - TensorProduct(V, U) - TensorProduct(V, V))
    assert result == expected
