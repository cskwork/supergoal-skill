#!/usr/bin/env node
import { cp, mkdir, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const repoRoot = new URL("../../..", import.meta.url).pathname;
const expRoot = `/private/tmp/just-do-it-experiment-${Date.now()}`;
const seed = join(expRoot, "seed");
const autoresearch = join(expRoot, "autoresearch");
const justDoIt = join(expRoot, "just-do-it");

await mkdir(expRoot, { recursive: true });
await cp(join(repoRoot, "examples/url-shortener"), seed, { recursive: true });
await cp(seed, autoresearch, { recursive: true });
await cp(seed, justDoIt, { recursive: true });

for (const dir of [autoresearch, justDoIt]) {
  run("git", ["init", "-q"], dir);
  run("git", ["add", "."], dir);
  run(
    "git",
    ["-c", "user.name=Experiment", "-c", "user.email=experiment@example.com", "commit", "-q", "-m", "seed url shortener"],
    dir,
  );
}

const task = `You are in a Node.js zero-dependency URL shortener service.

Task: add an authenticated endpoint to update an existing short link.

Implement: PATCH /api/links/:code

Contract:
- Requires X-API-Key, same auth behavior as stats/shorten. Missing or bad key returns 401 with the existing error envelope.
- The endpoint is a mutating API and should use the same rate limiter behavior as POST /shorten.
- :code uses the same percent-decoding and invalid-code behavior as the existing redirect/stats routes. Malformed percent encoding returns 400 invalid_code. Unknown code returns 404 not_found.
- Request body is JSON. Malformed JSON returns 400 malformed_json. Empty body or a body with neither url nor ttlSeconds returns 400 invalid_update.
- Optional url: when present, validate with the existing URL validator. Invalid or SSRF URL returns 400 invalid_url. On success, future redirects use the new URL.
- Optional ttlSeconds: when present as an integer 1..31536000, set expiresAt to now + ttlSeconds seconds. When present as null, clear expiry so the link never expires. When omitted, preserve the existing expiry.
- Preserve code, hits, and createdAt. Updating a link must not reset hit count.
- It is valid to update an already expired link if authenticated; setting ttlSeconds to null or a future TTL makes it usable again.
- Success response: HTTP 200 JSON containing code, url, hits, createdAt, expiresAt, expired.
- Keep existing public API behavior and all existing tests green.
- Add focused tests for the new endpoint.

Verification before final response:
- Run npm test --silent.
- Summarize files changed and the verification result.
`;

await writeFile(join(expRoot, "task.md"), task);
await writeFile(join(autoresearch, "TASK.md"), task);
await writeFile(join(justDoIt, "TASK.md"), task);

await writeFile(
  join(expRoot, "autoresearch-prompt.md"),
  `$codex-autoresearch
Mode: exec
Goal: Implement the requested URL shortener endpoint correctly.
Scope: This repository only.
Metric: Existing and new tests pass.
Verify: npm test --silent
Stop condition: implementation complete and verification command exits 0.

Read TASK.md, implement it, add focused tests, run verification, and leave the repo in the completed state. Do not use /just-do-it.

${task}`,
);

await mkdir(join(justDoIt, ".experiment-skill/reference"), { recursive: true });
await mkdir(join(justDoIt, ".experiment-skill/templates"), { recursive: true });
await cp(join(repoRoot, "SKILL.md"), join(justDoIt, ".experiment-skill/SKILL.md"));
await cp(join(repoRoot, "reference"), join(justDoIt, ".experiment-skill/reference"), { recursive: true });
await cp(join(repoRoot, "templates"), join(justDoIt, ".experiment-skill/templates"), { recursive: true });

await writeFile(
  join(expRoot, "just-do-it-prompt.md"),
  `Use the /just-do-it workflow from the local skill file copied at .experiment-skill/SKILL.md. Load and follow it for this task.

Non-interactive experiment constraint: after you write the required Human Feedback packet in docs/changelog/<run>/plan.md, the experiment harness grants explicit approval for the Build phase. Record that approval in state.json as APPROVED for Build, then continue. Do not pause for user input.

Do not edit .experiment-skill. Implement only the target repository task.

${task}`,
);

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed in ${cwd}\n${result.stdout}\n${result.stderr}`);
  }
}

const hiddenEval = `import { cpSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repo = process.argv[2];
if (!repo) throw new Error("usage: node hidden-eval.mjs <repo>");

const here = dirname(fileURLToPath(import.meta.url));
cpSync(join(here, "hidden/update-link.hidden.test.js"), join(repo, "test/update-link.hidden.test.js"));
const result = spawnSync("npm", ["test", "--silent"], { cwd: repo, encoding: "utf8" });
process.stdout.write(result.stdout);
process.stderr.write(result.stderr);
process.exit(result.status ?? 1);
`;

const hiddenTest = `import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createConfig } from "../src/config.js";
import { createStore } from "../src/store.js";
import { createRateLimiter } from "../src/ratelimit.js";
import { createAuth } from "../src/auth.js";
import { createLogger } from "../src/logger.js";
import { createServer } from "../src/server.js";

async function startServer(envOverrides = {}) {
  const dir = await mkdtemp(join(tmpdir(), "shortener-hidden-"));
  const env = {
    PORT: "0",
    API_KEYS: "testkey",
    DATA_FILE: join(dir, "links.json"),
    RL_CAPACITY: "1000",
    RL_REFILL_PER_SEC: "1000",
    ...envOverrides,
  };
  const config = createConfig(env);
  const store = createStore({ dataFile: config.dataFile });
  await store.init();
  const auth = createAuth({ keys: config.apiKeys });
  const rateLimiter = createRateLimiter({ capacity: config.rlCapacity, refillPerSec: config.rlRefillPerSec });
  const logger = createLogger({ sink: () => {} });
  const { server, close } = createServer({ store, auth, rateLimiter, config, logger });
  await new Promise((resolve) => server.listen(0, resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  return { base, teardown: async () => { await close(); await rm(dir, { recursive: true, force: true }); } };
}

function req(base, path, { method = "GET", headers = {}, body, redirect = "manual" } = {}) {
  return fetch(base + path, { method, headers, body, redirect });
}

async function createLink(base, body = { url: "https://example.com/old" }) {
  const res = await req(base, "/shorten", {
    method: "POST",
    headers: { "X-API-Key": "testkey" },
    body: JSON.stringify(body),
  });
  assert.equal(res.status, 201);
  return res.json();
}

test("PATCH /api/links/:code updates url while preserving hits and createdAt", async () => {
  const ctx = await startServer();
  try {
    const { code } = await createLink(ctx.base);
    assert.equal((await req(ctx.base, "/" + code)).status, 302);
    const before = await (await req(ctx.base, "/api/stats/" + code, { headers: { "X-API-Key": "testkey" } })).json();
    assert.equal(before.hits, 1);

    const updated = await req(ctx.base, "/api/links/" + code, {
      method: "PATCH",
      headers: { "X-API-Key": "testkey" },
      body: JSON.stringify({ url: "https://example.org/new-path?x=1" }),
    });
    assert.equal(updated.status, 200);
    const body = await updated.json();
    assert.equal(body.code, code);
    assert.equal(body.url, "https://example.org/new-path?x=1");
    assert.equal(body.hits, 1);
    assert.equal(body.createdAt, before.createdAt);
    assert.equal(body.expiresAt, null);
    assert.equal(body.expired, false);

    const redirect = await req(ctx.base, "/" + code);
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get("location"), "https://example.org/new-path?x=1");
    const after = await (await req(ctx.base, "/api/stats/" + code, { headers: { "X-API-Key": "testkey" } })).json();
    assert.equal(after.hits, 2);
  } finally {
    await ctx.teardown();
  }
});

test("PATCH can clear expiry on an expired link and make it usable again", async () => {
  const ctx = await startServer();
  try {
    const { code } = await createLink(ctx.base, { url: "https://example.com/ttl", ttlSeconds: 1 });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    assert.equal((await req(ctx.base, "/" + code)).status, 410);

    const updated = await req(ctx.base, "/api/links/" + code, {
      method: "PATCH",
      headers: { "X-API-Key": "testkey" },
      body: JSON.stringify({ ttlSeconds: null }),
    });
    assert.equal(updated.status, 200);
    const body = await updated.json();
    assert.equal(body.expiresAt, null);
    assert.equal(body.expired, false);
    assert.equal((await req(ctx.base, "/" + code)).status, 302);
  } finally {
    await ctx.teardown();
  }
});

test("PATCH rejects auth, malformed code, empty update, SSRF url, and bad ttl", async () => {
  const ctx = await startServer();
  try {
    const { code } = await createLink(ctx.base);
    assert.equal((await req(ctx.base, "/api/links/" + code, { method: "PATCH", body: "{}" })).status, 401);

    const malformed = await req(ctx.base, "/api/links/%ZZ", {
      method: "PATCH",
      headers: { "X-API-Key": "testkey" },
      body: JSON.stringify({ url: "https://example.com/" }),
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error.code, "invalid_code");

    const empty = await req(ctx.base, "/api/links/" + code, {
      method: "PATCH",
      headers: { "X-API-Key": "testkey" },
      body: JSON.stringify({}),
    });
    assert.equal(empty.status, 400);
    assert.equal((await empty.json()).error.code, "invalid_update");

    const ssrf = await req(ctx.base, "/api/links/" + code, {
      method: "PATCH",
      headers: { "X-API-Key": "testkey" },
      body: JSON.stringify({ url: "http://127.0.0.1/admin" }),
    });
    assert.equal(ssrf.status, 400);
    assert.equal((await ssrf.json()).error.code, "invalid_url");

    const badTtl = await req(ctx.base, "/api/links/" + code, {
      method: "PATCH",
      headers: { "X-API-Key": "testkey" },
      body: JSON.stringify({ ttlSeconds: 0 }),
    });
    assert.equal(badTtl.status, 400);
    assert.equal((await badTtl.json()).error.code, "invalid_ttl");
  } finally {
    await ctx.teardown();
  }
});
`;

await mkdir(join(expRoot, "hidden"), { recursive: true });
await writeFile(join(expRoot, "hidden/update-link.hidden.test.js"), hiddenTest);
await writeFile(join(expRoot, "hidden-eval.mjs"), hiddenEval);

console.log(JSON.stringify({ expRoot, autoresearch, justDoIt }, null, 2));
