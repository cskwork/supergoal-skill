# MiniLang LSP server — required behavior

Complete `src/server.mjs` so the MiniLang Language Server satisfies all of the following. The visible
tests cover only part of this; implement the full spec.

1. **JSON-RPC transport**: `encodeMessage` frames with `Content-Length` headers; `MessageBuffer.push`
   parses streamed/split frames and returns complete messages.
2. **Lifecycle**: `initialize` returns capabilities (textDocumentSync, completion, definition, hover);
   `shutdown`/`exit` behave per LSP.
3. **Diagnostics** (`didOpen`/`didChange` publish via `getDiagnostics`/notifications):
   - undefined symbol references,
   - wrong function arity (argument count mismatch),
   - **syntax / brace recovery**: a malformed program (e.g. a missing `}`) still parses with error
     recovery AND still reports the semantic diagnostics (undefined, arity) it can find.
4. **didChange** updates the document incrementally and **clears stale diagnostics** that no longer apply.
5. **Completion** filters by the current prefix and by scope, and exposes function signatures.
6. **Go-to-definition** resolves to the correct symbol, preferring the **local scope** over a same-name
   symbol elsewhere.
7. **Hover** resolves function/symbol info.
