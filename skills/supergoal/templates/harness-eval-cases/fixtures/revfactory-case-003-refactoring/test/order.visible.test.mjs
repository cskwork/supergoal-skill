import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateInvoice } from '../src/order.mjs';

test('basic US order with no coupon', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 10, qty: 2 }, { price: 5, qty: 1 }], region: 'US' }),
    { subtotal: 25, discount: 0, tax: 1.75, shipping: 7.5, total: 34.25 });
});

test('SAVE10 coupon applies 10%', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 100, qty: 1 }], region: 'US', coupon: 'SAVE10' }),
    { subtotal: 100, discount: 10, tax: 6.3, shipping: 3, total: 99.3 });
});

test('HALF coupon for VIP applies 50%', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 200, qty: 1 }], region: 'EU', coupon: 'HALF', vip: true }),
    { subtotal: 200, discount: 100, tax: 20, shipping: 0, total: 120 });
});

test('EU tax rate is 20%', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 40, qty: 1 }], region: 'EU' }),
    { subtotal: 40, discount: 0, tax: 8, shipping: 7.5, total: 55.5 });
});

test('empty order still charges base shipping', () => {
  assert.deepEqual(calculateInvoice({ items: [], region: 'US' }),
    { subtotal: 0, discount: 0, tax: 0, shipping: 7.5, total: 7.5 });
});
