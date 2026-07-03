"""Reproduce: TensorProduct.expand(tensorproduct=True) stops incomplete.

When a TensorProduct factor's expansion produces a term with a scalar
(commutative) coefficient, TensorProduct's constructor pulls that
coefficient out front, returning Mul(scalar, TensorProduct(...)) instead
of a bare TensorProduct. The recursive expansion check in
TensorProduct._eval_expand_tensorproduct() only recurses when the term
is a bare TensorProduct instance, so it misses these scalar-prefixed
terms and the second tensor factor is left unexpanded.
"""
from sympy import expand
from sympy.physics.quantum import Operator, TensorProduct


def test_tensorproduct_expand_with_scalar_factors():
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

    assert expand(result) == expand(expected)
