import test from "node:test";
import assert from "node:assert/strict";
import { withShelter, clearShelterCache } from "./shelter.mjs";

const env = { SUPABASE_URL: "https://x.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" };
const ID = "11111111-2222-3333-4444-555555555555";

test("sends the resolved shelter, replacing one the visitor supplied", async () => {
  clearShelterCache();
  let body;
  const f = async (_u, init) => ((body = init.body), new Response(JSON.stringify({ id: ID, site: "open" })));
  const r = await withShelter(new Request("https://site.example/adopt", { headers: { "x-shelter-id": "evil" } }), env, f);
  assert.equal(r.headers.get("x-shelter-id"), ID);
  assert.equal(body, JSON.stringify({ p_host: "site.example" }));
});

test("unknown host or failed lookup sends no header, and a failure is not remembered", async () => {
  clearShelterCache();
  const none = await withShelter(new Request("https://a.example/", { headers: { "x-shelter-id": "evil" } }), env, async () => new Response("null"));
  assert.equal(none.headers.get("x-shelter-id"), null);
  clearShelterCache();
  let calls = 0;
  const bad = async () => (calls++, new Response("no", { status: 500 }));
  await withShelter(new Request("https://b.example/"), env, bad);
  await withShelter(new Request("https://b.example/"), env, bad);
  assert.equal(calls, 2);
});

test("a hit is remembered", async () => {
  clearShelterCache();
  let calls = 0;
  const f = async () => (calls++, new Response(JSON.stringify({ id: ID, site: "locked" })));
  await withShelter(new Request("https://c.example/"), env, f);
  await withShelter(new Request("https://c.example/x"), env, f);
  assert.equal(calls, 1);
});

test("the shelter's website state is forwarded, replacing one the visitor supplied, and is cached with the host", async () => {
  clearShelterCache();
  let calls = 0;
  const f = async () => (calls++, new Response(JSON.stringify({ id: ID, site: "off" })));
  const r = await withShelter(new Request("https://d.example/", { headers: { "x-public-site": "open" } }), env, f);
  assert.equal(r.headers.get("x-public-site"), "off");
  const again = await withShelter(new Request("https://d.example/adopt"), env, f);
  assert.equal(again.headers.get("x-public-site"), "off");
  assert.equal(calls, 1, "the state rides on the lookup that was already cached: no extra read");
});

test("no shelter, or a state that is not one of the three, sends no x-public-site (only the deployment floor applies)", async () => {
  clearShelterCache();
  const front = await withShelter(new Request("https://front.example/", { headers: { "x-public-site": "open" } }), env, async () => new Response(JSON.stringify({ id: null, site: null })));
  assert.equal(front.headers.get("x-public-site"), null);
  clearShelterCache();
  const odd = await withShelter(new Request("https://odd.example/"), env, async () => new Response(JSON.stringify({ id: ID, site: "weird" })));
  assert.equal(odd.headers.get("x-public-site"), null);
  assert.equal(odd.headers.get("x-shelter-id"), ID);
});

test("a closed shelter sends no shelter id, a website that is off, and a header saying why", async () => {
  clearShelterCache();
  const r = await withShelter(new Request("https://gone.example/", { headers: { "x-shelter-archived": "evil" } }), env, async () => new Response(JSON.stringify({ id: null, site: null, archived: true })));
  assert.equal(r.headers.get("x-shelter-id"), null);
  assert.equal(r.headers.get("x-public-site"), "off");
  assert.equal(r.headers.get("x-shelter-archived"), "1");
  clearShelterCache();
  const open = await withShelter(new Request("https://ok.example/", { headers: { "x-shelter-archived": "1" } }), env, async () => new Response(JSON.stringify({ id: ID, site: "open", archived: false })));
  assert.equal(open.headers.get("x-shelter-archived"), null, "a visitor cannot claim a shelter is closed");
});
