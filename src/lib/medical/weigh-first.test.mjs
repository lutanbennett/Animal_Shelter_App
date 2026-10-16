import test from "node:test";
import assert from "node:assert/strict";
import { loadWeighFirst } from "./weigh-first.ts";

// The real exported function against fixed instants, with the two reads stubbed. Nothing of the
// rule is re-typed here: the stub answers queries, it does not decide who is waiting.
//
// The window the SQL enforces (yesterday or today, not cancelled, not archived) is NOT re-tested
// here — a stub that returned a three-day-old visit would be testing the stub. That half is held
// against the real function on dev by scripts/check-weigh-first.mjs. What is tested here is the
// half that lives in TypeScript: which visit is picked, the weight comparison, and the shelter day.

const resident = (id, name) => ({
  id,
  code: `R${id}`,
  name,
  thaiName: null,
  photoFileId: null,
  status: "Resident",
  enclosure: { name: "A1", nameTh: null },
  zone: { name: "Blue", nameTh: null, colour: "blue" },
});

/** A supabase stand-in: `rpc` returns the visits, `from("weight")` the weight rows. */
function client({ visits = [], weights = [], rpcError = null, weightError = null } = {}) {
  const calls = { weightFilters: {} };
  const weightQuery = {
    select: () => weightQuery,
    is: () => weightQuery,
    in: (_col, ids) => ((calls.weightFilters.in = ids), weightQuery),
    gte: (_col, v) => ((calls.weightFilters.gte = v), weightQuery),
    returns: () => weightQuery,
    then: (resolve) => resolve({ data: weights, error: weightError }),
  };
  return {
    calls,
    rpc: () => ({ then: (resolve) => resolve({ data: visits, error: rpcError }) }),
    from: (table) => {
      assert.equal(table, "weight", "the only table this file may read is weight");
      return weightQuery;
    },
  };
}

const PANDA = resident("1", "Panda");
const BELLA = resident("2", "Bella");

// 2026-10-16 in Bangkok. 10:00Z is 17:00 Thai the same day; 23:00Z on the 15th is 06:00 Thai
// on the 16th — the window where a UTC reading is a day behind.
const MIDDAY_THAI = Date.parse("2026-10-16T10:00:00+07:00");
const EARLY_THAI = Date.parse("2026-10-16T06:00:00+07:00");

test("a visit at 01:00 Bangkok counts as today, not yesterday", async () => {
  // 01:00 on the 16th in Bangkok is 18:00Z on the 15th: the previous day in UTC.
  const visitAt = "2026-10-16T01:00:00+07:00";
  assert.equal(new Date(visitAt).toISOString().slice(0, 10), "2026-10-15", "premise: UTC says the 15th");

  for (const now of [MIDDAY_THAI, EARLY_THAI]) {
    const { waiting, error } = await loadWeighFirst(
      client({ visits: [{ resident_id: "1", visit_at: visitAt, clinic_name: "Novel" }] }),
      [PANDA],
      now,
    );
    assert.equal(error, null);
    assert.equal(waiting.length, 1);
    assert.equal(waiting[0].visitDay, "2026-10-16");
    assert.equal(waiting[0].when, "today");
  }
});

test("a visit yesterday reads as yesterday, and at 23:00 Bangkok it is still yesterday", async () => {
  const { waiting } = await loadWeighFirst(
    client({ visits: [{ resident_id: "1", visit_at: "2026-10-15T23:00:00+07:00", clinic_name: "Novel" }] }),
    [PANDA],
    MIDDAY_THAI,
  );
  assert.equal(waiting[0].visitDay, "2026-10-15");
  assert.equal(waiting[0].when, "yesterday");
});

test("a weight on or after the visit's day clears it; one the day before does not", async () => {
  const visits = [{ resident_id: "1", visit_at: "2026-10-16T09:30:00+07:00", clinic_name: "Novel" }];
  const waits = async (weights) =>
    (await loadWeighFirst(client({ visits, weights }), [PANDA], MIDDAY_THAI)).waiting.length;

  assert.equal(await waits([]), 1, "no weight at all: waiting");
  assert.equal(await waits([{ resident_id: "1", date: "2026-10-15" }]), 1, "the day before: still waiting");
  assert.equal(await waits([{ resident_id: "1", date: "2026-10-16" }]), 0, "the same day: cleared");
  assert.equal(await waits([{ resident_id: "1", date: "2026-10-17" }]), 0, "later: cleared");
  assert.equal(await waits([{ resident_id: "2", date: "2026-10-16" }]), 1, "another resident's weight: waiting");
});

test("two visits: the later one is tested and shown, so yesterday's weight does not clear today's visit", async () => {
  const visits = [
    { resident_id: "1", visit_at: "2026-10-15T09:00:00+07:00", clinic_name: "Novel" },
    { resident_id: "1", visit_at: "2026-10-16T14:00:00+07:00", clinic_name: "Thonglor" },
  ];
  const { waiting } = await loadWeighFirst(
    client({ visits, weights: [{ resident_id: "1", date: "2026-10-15" }] }),
    [PANDA],
    MIDDAY_THAI,
  );
  assert.equal(waiting.length, 1);
  assert.equal(waiting[0].clinicName, "Thonglor");
  assert.equal(waiting[0].when, "today");

  // And the same pair with today's weight in place clears both.
  const cleared = await loadWeighFirst(
    client({ visits, weights: [{ resident_id: "1", date: "2026-10-16" }] }),
    [PANDA],
    MIDDAY_THAI,
  );
  assert.equal(cleared.waiting.length, 0);
});

test("the longest wait is first: yesterday's visits before today's", async () => {
  const { waiting } = await loadWeighFirst(
    client({
      visits: [
        { resident_id: "1", visit_at: "2026-10-16T08:00:00+07:00", clinic_name: "Novel" },
        { resident_id: "2", visit_at: "2026-10-15T16:00:00+07:00", clinic_name: "Thonglor" },
      ],
    }),
    [PANDA, BELLA],
    MIDDAY_THAI,
  );
  assert.deepEqual(
    waiting.map((v) => [v.resident.name, v.when]),
    [["Bella", "yesterday"], ["Panda", "today"]],
  );
});

test("a visit whose resident the picker does not offer is dropped, and is not asked about", async () => {
  const c = client({ visits: [{ resident_id: "9", visit_at: "2026-10-16T09:00:00+07:00", clinic_name: "Novel" }] });
  const { waiting, error } = await loadWeighFirst(c, [PANDA], MIDDAY_THAI);
  assert.equal(error, null);
  assert.deepEqual(waiting, []);
  assert.equal(c.calls.weightFilters.in, undefined, "no weight read at all when nothing is a candidate");
});

test("the weight read is narrowed to the candidates and to the earliest day in play", async () => {
  const c = client({
    visits: [
      { resident_id: "1", visit_at: "2026-10-16T08:00:00+07:00", clinic_name: "Novel" },
      { resident_id: "2", visit_at: "2026-10-15T16:00:00+07:00", clinic_name: "Thonglor" },
    ],
  });
  await loadWeighFirst(c, [PANDA, BELLA], MIDDAY_THAI);
  assert.deepEqual(c.calls.weightFilters.in, ["1", "2"]);
  assert.equal(c.calls.weightFilters.gte, "2026-10-15");
});

test("a clinic with no name on record still produces a row", async () => {
  const { waiting } = await loadWeighFirst(
    client({ visits: [{ resident_id: "1", visit_at: "2026-10-16T09:00:00+07:00", clinic_name: null }] }),
    [PANDA],
    MIDDAY_THAI,
  );
  assert.equal(waiting.length, 1);
  assert.equal(waiting[0].clinicName, null);
});

test("either read failing reports the error and lists nobody", async () => {
  const rpcFailed = await loadWeighFirst(client({ rpcError: { message: "no permission" } }), [PANDA], MIDDAY_THAI);
  assert.deepEqual(rpcFailed, { waiting: [], error: "no permission" });

  const weightFailed = await loadWeighFirst(
    client({
      visits: [{ resident_id: "1", visit_at: "2026-10-16T09:00:00+07:00", clinic_name: "Novel" }],
      weightError: { message: "weight is unreadable" },
    }),
    [PANDA],
    MIDDAY_THAI,
  );
  assert.deepEqual(weightFailed, { waiting: [], error: "weight is unreadable" });
});

test("no visits at all: nobody waiting, no error, and no weight read", async () => {
  const c = client({ visits: [] });
  assert.deepEqual(await loadWeighFirst(c, [PANDA], MIDDAY_THAI), { waiting: [], error: null });
  assert.equal(c.calls.weightFilters.in, undefined);
});
