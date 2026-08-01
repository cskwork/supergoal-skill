import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCsvLine } from '../src/csv.mjs';

test('a quoted field may contain commas', () => {
  assert.deepEqual(parseCsvLine('a,"b,c",d'), ['a', 'b,c', 'd']);
});

test('doubled quotes inside a quoted field are an escaped quote', () => {
  assert.deepEqual(parseCsvLine('"a""b",c'), ['a"b', 'c']);
});

test('empty and trailing fields are preserved', () => {
  assert.deepEqual(parseCsvLine('a,,c'), ['a', '', 'c']);
  assert.deepEqual(parseCsvLine('a,'), ['a', '']);
});

test('a quoted field preserves surrounding spaces', () => {
  assert.deepEqual(parseCsvLine('"  x  ",y'), ['  x  ', 'y']);
});

test('a single field with no comma returns one element', () => {
  assert.deepEqual(parseCsvLine('hello'), ['hello']);
});
