import test from "node:test";
import assert from "node:assert/strict";
import { groupByPlace, matchesQuery } from "./residents.ts";

// groupByPlace is shared by Record Weight and /photos/add, so the off-site group added for
// "Weigh these first" changes both. These hold the shape both pages depend on.

const r = (name, status, enclosure, zone) => ({
  id: name,
  code: `R-${name}`,
  name,
  thaiName: null,
  photoFileId: null,
  status,
  enclosure: enclosure ? { name: enclosure, nameTh: null } : null,
  zone: zone ? { name: zone, nameTh: null, colour: null } : null,
});

test("zone then enclosure, in the order they were given", () => {
  const groups = groupByPlace([
    r("Panda", "Resident", "A1", "Blue"),
    r("Bella", "Resident", "A1", "Blue"),
    r("Coco", "Resident", "A2", "Blue"),
    r("Dot", "Resident", "B1", "Green"),
  ]);
  assert.deepEqual(
    groups.map((g) => [g.kind, g.zone?.name, g.enclosures.map((e) => [e.enclosure?.name, e.residents.map((x) => x.name)])]),
    [
      ["zone", "Blue", [["A1", ["Panda", "Bella"]], ["A2", ["Coco"]]]],
      ["zone", "Green", [["B1", ["Dot"]]]],
    ],
  );
});

test("anyone off site is one group at the end, keeping their place inside it", () => {
  const groups = groupByPlace([
    r("Hospitalised one", "Hospitalised", "Hospital", "Lifecycle"),
    r("Panda", "Resident", "A1", "Blue"),
    r("Fostered one", "Fostered", "Fostered", "Lifecycle"),
    r("Community one", "Outreach", "Village", "Outreach"),
  ]);
  assert.deepEqual(groups.map((g) => g.kind), ["zone", "offSite"]);
  assert.equal(groups[0].zone.name, "Blue", "the on-site zone is first");

  const away = groups.at(-1);
  assert.equal(away.zone, null, "the off-site group is not a zone");
  assert.deepEqual(
    away.enclosures.map((e) => [e.enclosure?.name, e.residents.map((x) => x.name)]),
    [["Hospital", ["Hospitalised one"]], ["Fostered", ["Fostered one"]], ["Village", ["Community one"]]],
  );
});

test("no enclosure on record is its own group, and is not the off-site one", () => {
  const groups = groupByPlace([
    r("Nowhere", "Unassigned", null, null),
    r("Panda", "Resident", "A1", "Blue"),
    r("Away", "Fostered", "Fostered", "Lifecycle"),
  ]);
  assert.deepEqual(groups.map((g) => g.kind), ["nowhere", "zone", "offSite"]);
  assert.deepEqual(
    groups.find((g) => g.kind === "nowhere").enclosures[0].residents.map((x) => x.name),
    ["Nowhere"],
  );
});

test("an Unassigned resident is on site: at the shelter, with no enclosure yet", () => {
  // residentPlace() calls Unassigned internal (0065), so it must not fall into the off-site group.
  const groups = groupByPlace([r("New arrival", "Unassigned", null, null)]);
  assert.deepEqual(groups.map((g) => g.kind), ["nowhere"]);
});

test("every resident given comes out exactly once", () => {
  const all = [
    r("Panda", "Resident", "A1", "Blue"),
    r("Nowhere", "Unassigned", null, null),
    r("Away", "Hospitalised", "Hospital", "Lifecycle"),
    r("Dot", "Resident", "B1", "Green"),
  ];
  const out = groupByPlace(all).flatMap((g) => g.enclosures.flatMap((e) => e.residents.map((x) => x.name)));
  assert.equal(out.length, all.length);
  assert.deepEqual([...out].sort(), all.map((x) => x.name).sort());
});

test("nobody at all gives no groups", () => {
  assert.deepEqual(groupByPlace([]), []);
});

test("the search matches name, R-code and enclosure, ignoring case", () => {
  const panda = r("Panda", "Resident", "A1", "Blue");
  for (const q of ["", "  ", "pan", "PANDA", "r-panda", "a1"]) {
    assert.equal(matchesQuery(panda, q), true, `expected a match for ${JSON.stringify(q)}`);
  }
  assert.equal(matchesQuery(panda, "bella"), false);
});

test("a code, a pasted card link or an older UUID link picks exactly that resident", () => {
  const panda = { ...r("Panda", "Resident", "A1", "Blue"), id: "0f0f0f0f-0000-4000-8000-000000000001", code: "R-0042" };
  for (const q of ["R-0042", "r0042", "r-0042", "https://test.lannacare.org/r/R-0042", "/r/r-0042?x=1", "https://x.org/r/0f0f0f0f-0000-4000-8000-000000000001"]) {
    assert.equal(matchesQuery(panda, q), true, q);
  }
  for (const q of ["R-0043", "https://x.org/r/R-0043", "https://x.org/r/0f0f0f0f-0000-4000-8000-000000000002"]) {
    assert.equal(matchesQuery(panda, q), false, q);
  }
  assert.equal(matchesQuery(panda, "R-00"), true, "half-typed code stays a substring search");
});
