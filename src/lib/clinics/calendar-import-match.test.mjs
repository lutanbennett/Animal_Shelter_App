import test from "node:test";
import assert from "node:assert/strict";
import { parseTitle, matchClinic, matchResident, decideImport } from "./calendar-import-match.ts";

const clinics = [
  { id: "c1", name: "Novel Vet Clinic" },
  { id: "c2", name: "Pet Care Hospital" },
];
const res = (id, name, extra = {}) => ({ id, name, thaiName: null, code: null, status: "On-site", ...extra });
const residents = [
  res("r1", "Blackie", { code: "R-0042" }),
  res("r2", "Mom", { thaiName: "แม่" }),
  res("r3", "Whitey"),
  res("r4", "Spot"),
  res("r5", "Spot"),
  res("r6", "Ghost", { status: "Deceased" }),
  res("r7", "Rex", { status: "Adopted" }),
];
const ev = (summary, hasTime = true) => ({ summary, hasTime });

test("parseTitle: clinic, then residents split on commas", () => {
  assert.deepEqual(parseTitle("Novel - Blackie, Mom"), { clinicText: "Novel", residentTexts: ["Blackie", "Mom"] });
  assert.deepEqual(parseTitle("Novel – R-0042"), { clinicText: "Novel", residentTexts: ["R-0042"] });
  assert.equal(parseTitle("Novel Blackie"), null);
  assert.equal(parseTitle("Novel-Blackie"), null);
  assert.equal(parseTitle(undefined), null);
});

test("clinic: a whole word of its name matches; a typo or a stranger does not", () => {
  assert.equal(matchClinic("Novel", clinics).picked.id, "c1");
  assert.equal(matchClinic("novel vet clinic", clinics).picked.id, "c1");
  assert.equal(matchClinic("Novle", clinics).picked, null);
  assert.equal(matchClinic("Nobel", clinics).problem, "unknown_clinic");
  assert.equal(matchClinic("Vet", [...clinics, { id: "c3", name: "Dr Vet" }]).problem, "ambiguous_clinic");
});

test("resident: name, Thai name and R-code each find one; two of a name is never picked", () => {
  assert.equal(matchResident("blackie", residents).picked.id, "r1");
  assert.equal(matchResident("แม่", residents).picked.id, "r2");
  assert.equal(matchResident("R42", residents).picked.id, "r1");
  const spot = matchResident("Spot", residents);
  assert.equal(spot.picked, null);
  assert.equal(spot.problem, "ambiguous_resident");
  assert.equal(spot.candidates.length, 2);
});

test("resident: deceased or adopted is never picked; a typo gets candidates, not a pick", () => {
  assert.equal(matchResident("Ghost", residents).problem, "not_live_resident");
  assert.equal(matchResident("Rex", residents).picked, null);
  const typo = matchResident("Blakie", residents);
  assert.equal(typo.picked, null);
  assert.equal(typo.candidates[0].id, "r1");
});

test("decideImport: one clinic and one live resident each imports", () => {
  const d = decideImport(ev("Novel - Blackie"), clinics, residents);
  assert.equal(d.kind, "import");
  assert.deepEqual(d.residents.map((r) => r.id), ["r1"]);
  const two = decideImport(ev("Novel - Blackie, Mom"), clinics, residents);
  assert.deepEqual(two.residents.map((r) => r.id), ["r1", "r2"]);
  assert.equal(decideImport(ev("Novel - Blackie, blackie"), clinics, residents).residents.length, 1);
});

test("decideImport: everything doubtful goes to confirm, whole", () => {
  const reason = (s, t = true) => decideImport(ev(s, t), clinics, residents).reason;
  assert.equal(reason("Novel - Blackie", false), "all_day");
  assert.equal(reason("Lunch with Sam"), "no_dash");
  assert.equal(reason("Novel - "), "no_dash");
  assert.equal(reason("Novel - ,"), "no_resident");
  assert.equal(reason("Elsewhere - Blackie"), "unknown_clinic");
  assert.equal(reason("Novel - Blakie"), "unknown_resident");
  assert.equal(reason("Novel - Spot"), "ambiguous_resident");
  assert.equal(reason("Novel - Ghost"), "not_live_resident");
  // one good name does not carry a bad one: nothing is created
  assert.equal(reason("Novel - Blackie, Spot"), "ambiguous_resident");
});
