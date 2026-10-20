import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { gzipSync } from "node:zlib";
import { fetchBytes } from "../lib/served-bytes.mjs";

// Fixture: 4 non-ASCII characters (2 x "é" = 2 bytes each, 1 x "→" = 3 bytes)
// so the string is shorter than its byte count by exactly 4 — the 2026-10-20 disagreement.
const css = "a{content:\"é→é\"}\n";

test("fetchBytes counts decoded bytes, not characters, and ignores compression", async () => {
  const raw = Buffer.from(css, "utf8");
  assert.equal(raw.length - css.length, 4);
  const server = createServer((req, res) => {
    const gz = req.url === "/gz";
    res.writeHead(200, { "content-type": "text/css", ...(gz ? { "content-encoding": "gzip" } : {}) });
    res.end(gz ? gzipSync(raw) : raw);
  }).listen(0);
  try {
    const { port } = server.address();
    for (const path of ["/plain", "/gz"]) {
      const { bytes } = await fetchBytes(`http://127.0.0.1:${port}${path}`);
      assert.equal(bytes.length, raw.length, path);
      assert.ok(bytes.equals(raw), path);
    }
  } finally { server.close(); }
});
