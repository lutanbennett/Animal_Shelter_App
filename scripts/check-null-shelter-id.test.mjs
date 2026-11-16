// Plants a violation in a stub PostgREST and proves check-null-shelter-id.mjs goes red on it and green without it.
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

function serve(nulls) {
  const spec = { definitions: { residents: { properties: { shelter_id: {} } }, animals_x: { properties: { shelter_id: {} } }, lookup: { properties: { id: {} } } } };
  const srv = http.createServer((req, res) => {
    if (req.url === "/rest/v1/") return res.end(JSON.stringify(spec));
    const t = /\/rest\/v1\/([a-z_]+)\?/.exec(req.url)?.[1];
    res.setHeader("content-range", `*/${nulls[t] ?? 0}`);
    res.end();
  });
  return new Promise((r) => srv.listen(0, () => r(srv)));
}
async function run(nulls) {
  const srv = await serve(nulls);
  const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${srv.address().port}`, SUPABASE_SERVICE_ROLE_KEY: "k" };
  const out = await new Promise((resolve) => {
    import("node:child_process").then(({ execFile }) =>
      execFile(process.execPath, ["scripts/check-null-shelter-id.mjs"], { env }, (e, stdout, stderr) => resolve({ code: e ? e.code : 0, stdout, stderr })));
  });
  srv.close();
  return out;
}
test("clean: exit 0, one summary line, only tables with the column counted", async () => {
  const r = await run({});
  assert.equal(r.code, 0);
  assert.match(r.stdout, /2 objects/);
});
test("planted null: exit 1 and the table is named", async () => {
  const r = await run({ animals_x: 3 });
  assert.equal(r.code, 1);
  assert.match(r.stdout, /FAIL  animals_x: 3 row/);
  assert.doesNotMatch(r.stdout, /residents:/);
});
