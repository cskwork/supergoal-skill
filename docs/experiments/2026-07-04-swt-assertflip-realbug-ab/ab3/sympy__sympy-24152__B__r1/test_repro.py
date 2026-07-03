from sympy.physics.quantum import TensorProduct, Operator


def test_repro():
    U = Operator('U')
    V = Operator('V')
    P = TensorProduct(2 * U - V, U + V)
    expanded = P.expand(tensorproduct=True)

    expected = (
        2 * TensorProduct(U, U) + 2 * TensorProduct(U, V)
        - TensorProduct(V, U) - TensorProduct(V, V)
    )

    assert expanded == expected
