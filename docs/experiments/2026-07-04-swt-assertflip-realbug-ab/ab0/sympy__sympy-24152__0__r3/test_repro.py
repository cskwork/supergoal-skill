from sympy import Add
from sympy.physics.quantum import Operator, TensorProduct


def test_tensorproduct_expand_full():
    U = Operator('U')
    V = Operator('V')
    P = TensorProduct(2 * U - V, U + V)

    expanded = P.expand(tensorproduct=True)

    # Fully expanded result should be a sum of 4 simple tensor product terms:
    # 2*(UxU) + 2*(UxV) - (VxU) - (VxV)
    expected = (
        2 * TensorProduct(U, U)
        + 2 * TensorProduct(U, V)
        - TensorProduct(V, U)
        - TensorProduct(V, V)
    )

    assert expanded == expected

    # The buggy implementation leaves the second tensor factor unexpanded,
    # producing terms like `2*Ux(U + V) - Vx(U + V)` instead of 4 separate
    # terms. Ensure no Add remains nested inside any TensorProduct argument.
    terms = Add.make_args(expanded)
    for term in terms:
        for factor in term.args:
            if isinstance(factor, TensorProduct):
                for arg in factor.args:
                    assert not isinstance(arg, Add), (
                        f"TensorProduct argument {arg} was not fully expanded"
                    )
