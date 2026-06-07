import assert from 'node:assert/strict';
import { test } from 'node:test';
import { encodeMessage, MessageBuffer, MiniLangServer } from '../src/server.mjs';

function request(method, params = {}, id = 1) {
  return { jsonrpc: '2.0', id, method, params };
}

function notification(method, params = {}) {
  return { jsonrpc: '2.0', method, params };
}

function textDocument(uri, text, version = 1) {
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

test('JSON-RPC transport frames and streams Content-Length messages', () => {
  const message = { jsonrpc: '2.0', id: 7, result: { ok: true } };
  const framed = encodeMessage(message);
  assert.match(framed, /^Content-Length: \d+\r\n\r\n/);

  const buffer = new MessageBuffer();
  assert.deepEqual(buffer.push(framed.slice(0, 9)), []);
  const decoded = buffer.push(framed.slice(9) + framed);
  assert.equal(decoded.length, 2);
  assert.deepEqual(decoded[0], message);
  assert.deepEqual(decoded[1], message);
});

test('initialize, shutdown, and exit expose expected LSP lifecycle', async () => {
  const server = new MiniLangServer();
  const init = await server.handle(request('initialize', { capabilities: {} }, 1));
  assert.equal(init.id, 1);
  assert.equal(init.result.capabilities.textDocumentSync, 2);
  assert.ok(init.result.capabilities.completionProvider);
  assert.equal(init.result.capabilities.definitionProvider, true);
  assert.equal(init.result.capabilities.hoverProvider, true);

  const shutdown = await server.handle(request('shutdown', {}, 2));
  assert.deepEqual(shutdown, { jsonrpc: '2.0', id: 2, result: null });
  assert.equal(await server.handle(notification('exit')), null);
});

test('didOpen publishes diagnostics for undefined symbols and wrong arity', async () => {
  const uri = 'file:///visible-diagnostics.mini';
  const text = [
    'fn add(a, b) {',
    '  return a',
    '}',
    'fn main() {',
    '  let answer = add(1)',
    '  return missing',
    '}',
  ].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: textDocument(uri, text) }));
  const publish = server.takeNotifications().find((item) => item.method === 'textDocument/publishDiagnostics');
  assert.ok(publish, 'expected publishDiagnostics notification');
  const diagnostics = publish.params.diagnostics;
  const messages = diagnostics.map((diag) => diag.message).join('\n').toLowerCase();
  assert.match(messages, /undefined.*missing|missing.*undefined/);
  assert.match(messages, /arity|argument|expected 2/);
  assert.equal(server.getDiagnostics(uri).length, diagnostics.length);
});

test('completion includes keywords, in-scope symbols, functions, and snippets', async () => {
  const uri = 'file:///visible-completion.mini';
  const text = [
    'fn add(a, b) {',
    '  return a',
    '}',
    'fn main() {',
    '  let local = 1',
    '  return ',
    '}',
  ].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: textDocument(uri, text) }));
  const response = await server.handle(request('textDocument/completion', {
    textDocument: { uri },
    position: { line: 5, character: 9 },
  }, 3));
  const items = itemsFrom(response);
  const labels = items.map((item) => item.label);
  assert.ok(labels.includes('fn'));
  assert.ok(labels.includes('let'));
  assert.ok(labels.includes('return'));
  assert.ok(labels.includes('add'));
  assert.ok(labels.includes('local'));
  assert.ok(items.some((item) => item.label === 'return' && /return/.test(JSON.stringify(item))));
});

test('definition and hover resolve function symbols', async () => {
  const uri = 'file:///visible-definition.mini';
  const text = [
    'fn inc(value) {',
    '  return value',
    '}',
    'fn main() {',
    '  let total = inc(1)',
    '  return total',
    '}',
  ].join('\n');
  const server = new MiniLangServer();
  await server.handle(notification('textDocument/didOpen', { textDocument: textDocument(uri, text) }));
  const definition = await server.handle(request('textDocument/definition', {
    textDocument: { uri },
    position: positionOf(text, 4, 'inc', 1),
  }, 4));
  assert.equal(definition.result.uri, uri);
  assert.equal(definition.result.range.start.line, 0);

  const hover = await server.handle(request('textDocument/hover', {
    textDocument: { uri },
    position: positionOf(text, 4, 'inc', 1),
  }, 5));
  assert.match(JSON.stringify(hover.result.contents), /fn inc\(value\)/);
});
