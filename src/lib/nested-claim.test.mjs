import test from "node:test";
import assert from "node:assert/strict";
import { runWriteAction } from "./action-result.ts";
import { writeRequestIdFrom, WRITE_REQUEST_FIELD } from "./write-requests.ts";

// Nested claims (docs/decisions/2026-11-01-nested-claim-one-write.md). The assistant's immunization card used to call
// the form's own action, which claims too. This pins what 0292 does to two claims composed, with an in-memory model of
// claim_write_request()/finish_write_request() that follows the SQL branch for branch.

const messages = { somethingWentWrong: (r) => `wrong ${r}`, saveUnknown: "unknown", reloadToSave: "reload" };
const OUTER = "11111111-2222-4333-8444-555555555555";

function fakeDb() {
  const rows = new Map();
  return {
    rows,
    rpc(fn, args) {
      if (fn === "claim_write_request") {
        const row = rows.get(args.p_request_id);
        if (!row) {
          rows.set(args.p_request_id, { action: args.p_action, result: null, done: false });
          return Promise.resolve({ data: { status: "claimed" }, error: null });
        }
        if (row.action !== args.p_action) return Promise.resolve({ data: null, error: { message: "request id already used", code: "22023" } });
        if (!row.done) return Promise.resolve({ data: { status: "in_flight", action: row.action }, error: null });
        return Promise.resolve({ data: { status: "replay", action: row.action, result: row.result }, error: null });
      }
      const row = rows.get(args.p_request_id);
      if (!row || row.done) return Promise.resolve({ data: null, error: { message: "no open claim", code: "42501" } });
      row.result = args.p_result;
      row.done = true;
      return Promise.resolve({ data: null, error: null });
    },
  };
}
const quiet = (run) => {
  const real = console.error;
  console.error = () => {};
  return run().finally(() => { console.error = real; });
};

/** The old shape: outer claim, inner claim read from a FormData built without the id field. */
function nested(db, form, writes) {
  return runWriteAction("outer", messages, { id: OUTER, action: "assistant.immunization", db }, () =>
    runWriteAction("inner", messages, { id: writeRequestIdFrom(form), action: "immunizations.record", db }, async () => {
      writes.n++;
      return { ok: true };
    }),
  );
}

test("old shape: the assistant's FormData carries no id, so the inner claim refuses and nothing is written", async () => {
  const db = fakeDb();
  const writes = { n: 0 };
  const form = new FormData();
  assert.equal(writeRequestIdFrom(form), null);
  const result = await quiet(() => nested(db, form, writes));
  assert.deepEqual(result, { ok: false, error: "reload" });
  assert.equal(writes.n, 0);
  assert.deepEqual([...db.rows.keys()], [OUTER], "the inner claim never reached the database");
});

test("old shape, had the inner call been handed the outer's id: refused by the database, nothing written", async () => {
  const db = fakeDb();
  const writes = { n: 0 };
  const form = new FormData();
  form.set(WRITE_REQUEST_FIELD, OUTER);
  const result = await quiet(() => nested(db, form, writes));
  assert.equal(result.ok, false);
  assert.equal(writes.n, 0, "same id, different action name: 22023, so 'inner takes the outer id' cannot work");
});

test("old shape, inner given its own fresh id: the outer replay short-circuits and the inner never runs again", async () => {
  const db = fakeDb();
  const writes = { n: 0 };
  const form = new FormData();
  form.set(WRITE_REQUEST_FIELD, "99999999-2222-4333-8444-555555555555");
  assert.deepEqual(await nested(db, form, writes), { ok: true });
  assert.deepEqual(await nested(db, form, writes), { ok: true });
  assert.equal(writes.n, 1);
});

test("new shape: one claim, one write, and a replay answers from the stored result", async () => {
  const db = fakeDb();
  const writes = { n: 0 };
  const run = () => runWriteAction("outer", messages, { id: OUTER, action: "assistant.immunization", db }, async () => {
    writes.n++;
    return { ok: true };
  });
  assert.deepEqual(await run(), { ok: true });
  assert.deepEqual(await run(), { ok: true });
  assert.equal(writes.n, 1);
  assert.equal(db.rows.size, 1);
});
