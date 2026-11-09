import test from "node:test";
import assert from "node:assert/strict";
import { readSiteContent, loadSiteContent } from "./content.ts";

// A stand-in for the query chain: whatever it resolves to is what the database "answered".
const client = (answer) => ({
  from: () => ({ select: () => ({ eq: () => ({ limit: () => ({ returns: async () => answer }) }) }) }),
});

test("a row is the content", async () => {
  const r = await readSiteContent(client({ data: [{ tagline: "x" }], error: null }));
  assert.deepEqual(r, { state: "ok", content: { tagline: "x" } });
});

test("no row and no error is 'missing', not a failure", async () => {
  assert.deepEqual(await readSiteContent(client({ data: [], error: null })), { state: "missing" });
});

test("an error is 'failed' and carries what failed", async () => {
  const r = await readSiteContent(client({ data: null, error: { message: "boom" } }));
  assert.deepEqual(r, { state: "failed", message: "boom" });
});

test("public pages still get null for both, never an error", async () => {
  assert.equal(await loadSiteContent(client({ data: [], error: null })), null);
  assert.equal(await loadSiteContent(client({ data: null, error: { message: "boom" } })), null);
});
