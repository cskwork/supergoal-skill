import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculateInvoice } from '../src/order.mjs';

test('SAVE20 over threshold applies 20%', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 60, qty: 2 }], region: 'US', coupon: 'SAVE20' }),
    { subtotal: 120, discount: 24, tax: 6.72, shipping: 3, total: 105.72 });
});

test('SAVE20 under threshold falls back to 10%', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 30, qty: 1 }], region: 'US', coupon: 'SAVE20' }),
    { subtotal: 30, discount: 3, tax: 1.89, shipping: 7.5, total: 36.39 });
});

test('HALF coupon is ignored for non-VIP', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 200, qty: 1 }], region: 'EU', coupon: 'HALF' }),
    { subtotal: 200, discount: 0, tax: 40, shipping: 0, total: 240 });
});

test('VIP floor gives 5% when no coupon', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 80, qty: 1 }], region: 'US', vip: true }),
    { subtotal: 80, discount: 4, tax: 5.32, shipping: 3, total: 84.32 });
});

test('VIP floor never reduces a larger coupon discount', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 200, qty: 1 }], region: 'US', coupon: 'SAVE10', vip: true }),
    { subtotal: 200, discount: 20, tax: 12.6, shipping: 0, total: 192.6 });
});

test('express fee is additive on free-shipping tier', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 120, qty: 1 }], region: 'US', express: true }),
    { subtotal: 120, discount: 0, tax: 8.4, shipping: 12, total: 140.4 });
});

test('express fee is additive on the lowest shipping tier', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 20, qty: 1 }], region: 'US', express: true }),
    { subtotal: 20, discount: 0, tax: 1.4, shipping: 19.5, total: 40.9 });
});

test('unknown region uses the 10% default tax', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 40, qty: 1 }], region: 'CA' }),
    { subtotal: 40, discount: 0, tax: 4, shipping: 7.5, total: 51.5 });
});

test('cent rounding on fractional line totals', () => {
  assert.deepEqual(calculateInvoice({ items: [{ price: 9.99, qty: 3 }], region: 'US' }),
    { subtotal: 29.97, discount: 0, tax: 2.1, shipping: 7.5, total: 39.57 });
});
