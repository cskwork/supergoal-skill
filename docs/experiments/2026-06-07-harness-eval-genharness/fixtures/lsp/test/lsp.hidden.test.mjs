import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MiniLangServer } from '../src/server.mjs';

function request(method, params = {}, id = 1) {
  return { jsonrpc: '2.0', id, method, params };
}

function notification(method, params = {}) {
  return { jsonrpc: '2.0', method, params };
}

function doc(uri, text, version = 1) {
  return { uri, languageId: 'minilang', version, text };
}

function itemsFrom(response) {
  const result = response.result;
  return Array.isArray(result) ? result : result.items;
}

function positionOf(text, line, needle, offset = 0) {
  const lines = text.split('\n');
  const character = lines[line].indexOf(needle);
  assert.notEqual(character, -1, `missing ${needle} on line ${line}`);
  return { line, character: character + offset };
}

test('didChange reparses incrementally and clears stale diagnostics', async () => {
  const uri = 'file:///hidden-change.mini';
  const good = ['fn main() {', '  let ok = 1', '  return ok', '}'].join('\n');
  const bad = ['fn main() {', '  let ok = 1', '  return missing', '}'].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, good, 1) }));
  assert.deepEqual(server.getDiagnostics(uri), []);
  server.takeNotifications();

  await server.handle(notification('textDocument/didChange', {
    textDocument: { uri, version: 2 },
    contentChanges: [{ text: bad }],
  }));
  assert.match(server.getDiagnostics(uri).map((diag) => diag.message).join('\n').toLowerCase(), /undefined.*missing|missing.*undefined/);

  await server.handle(notification('textDocument/didChange', {
    textDocument: { uri, version: 3 },
    contentChanges: [{ text: good }],
  }));
  assert.deepEqual(server.getDiagnostics(uri), []);
});

test('completion filters by prefix and exposes function signatures', async () => {
  const uri = 'file:///hidden-completion.mini';
  const text = [
    'fn double(value) {',
    '  return value',
    '}',
    'fn main() {',
    '  return dou',
    '}',
  ].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, text) }));
  const response = await server.handle(request('textDocument/completion', {
    textDocument: { uri },
    position: { line: 4, character: 12 },
  }, 11));
  const items = itemsFrom(response);
  const labels = items.map((item) => item.label);
  assert.deepEqual(labels, ['double']);
  assert.match(JSON.stringify(items[0]), /double\(value\)|double\(\$\{1:value\}\)/);
});

test('definition prefers local scope over same-name symbols elsewhere', async () => {
  const uri = 'file:///hidden-scope.mini';
  const text = [
    'fn first() {',
    '  let target = 1',
    '  return target',
    '}',
    'fn second() {',
    '  let target = 2',
    '  return target',
    '}',
  ].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, text) }));
  const response = await server.handle(request('textDocument/definition', {
    textDocument: { uri },
    position: positionOf(text, 6, 'target', 1),
  }, 12));
  assert.equal(response.result.range.start.line, 5);
});

test('parser recovers from syntax errors and still reports semantic diagnostics', async () => {
  const uri = 'file:///hidden-recovery.mini';
  const text = [
    'fn add(a, b) {',
    '  return a',
    '}',
    'fn main() {',
    '  let x = add(1, 2, 3)',
    '  return missing',
  ].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: doc(uri, text) }));
  const messages = server.getDiagnostics(uri).map((diag) => diag.message).join('\n').toLowerCase();
  assert.match(messages, /syntax|brace|expected.*\}/);
  assert.match(messages, /arity|argument|expected 2/);
  assert.match(messages, /undefined.*missing|missing.*undefined/);
});
