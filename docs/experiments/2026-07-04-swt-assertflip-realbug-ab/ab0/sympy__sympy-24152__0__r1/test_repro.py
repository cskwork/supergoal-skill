from sympy import Add
from sympy.physics.quantum import Operator, TensorProduct


def test_tensorproduct_expand_full():
    """TensorProduct.expand(tensorproduct=True) must fully distribute both
    factors, even when a summand of the first factor has a scalar
    coefficient that makes TensorProduct's constructor pull the scalar
    out front (e.g. 2*TensorProduct(U, ...) instead of TensorProduct(2*U, ...)).

    Regression test for sympy issue: expand of TensorProduct stops
    incomplete when summands have scalar factors.
    """
    U = Operator('U')
    V = Operator('V')

    P = TensorProduct(2 * U - V, U + V)
    result = P.expand(tensorproduct=True)

    expected = (
        2 * TensorProduct(U, U)
        + 2 * TensorProduct(U, V)
        - TensorProduct(V, U)
        - TensorProduct(V, V)
    )

    assert result == expected

    # The buggy implementation leaves an un-expanded TensorProduct(U, U + V)
    # term inside the result; make sure no bare TensorProduct with an Add
    # argument survives.
    for term in Add.make_args(result):
        for factor in term.args:
            if isinstance(factor, TensorProduct):
                for arg in factor.args:
                    assert not arg.is_Add, (
                        f"found un-expanded TensorProduct factor: {factor}"
                    )
