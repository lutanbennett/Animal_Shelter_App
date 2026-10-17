import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, CARD_KEYS, bundleOfCards, includedCards, cardOpens } from "./cards.ts";
import { JOBS, JOBS_OF_ROLE, bundleOfRole } from "./jobs.ts";
import { ACTIVITIES } from "./catalogue.ts";
import { ROUTES } from "./routes.ts";

test("the agreed set is twenty-two cards, the eight jobs among them", () => {
  assert.equal(CARD_KEYS.length, 22);
  for (const k of Object.keys(JOBS)) assert.ok(CARDS[k], k);
});

test("every bundle names a catalogue activity, and a yes/no activity carries no level", () => {
  const kinds = new Map(ACTIVITIES.map((a) => [a.key, a.kind]));
  for (const c of Object.values(CARDS)) {
    for (const e of c.bundle) {
      assert.ok(kinds.has(e.activity), `${c.key}: ${e.activity}`);
      assert.equal(kinds.get(e.activity) === "yesno", e.level === undefined, `${c.key}: ${e.activity}`);
    }
  }
});

test("includes are real cards and never loop", () => {
  for (const k of CARD_KEYS) {
    for (const i of CARDS[k].includes) assert.ok(CARDS[i], `${k} includes ${i}`);
    assert.ok(!includedCards(k).includes(k), `${k} includes itself`);
  }
});

test("a card's tile opens a page in the registry", () => {
  const paths = new Set(ROUTES.map((r) => r.path));
  const pages = CARD_KEYS.flatMap((k) => [CARDS[k].opens, CARDS[k].opensAny ?? CARDS[k].opens]);
  const unknown = pages.filter((p) => !paths.has(p) && !["/residents", "/bills", "/assistant"].includes(p));
  assert.deepEqual(unknown, []);
});

test("levels flow down: Residents gives everything View residents does, and more", () => {
  const low = bundleOfCards(["view_residents"]);
  const high = bundleOfCards(["residents"]);
  assert.equal(low.get("resident.record"), "read");
  assert.equal(high.get("resident.record"), "edit");
  assert.ok(high.has("photos.resident_add"));
  assert.ok(!low.has("photos.resident_add"));
  for (const k of ["medical_records", "book_clinic_visits"]) assert.equal(bundleOfCards([k]).get("resident.record"), "read");
});

test("the eight jobs as cards give what the jobs give", () => {
  for (const [role, jobs] of Object.entries(JOBS_OF_ROLE)) assert.deepEqual(bundleOfCards(jobs), bundleOfRole(role), role);
});

test("Enclosures is narrow: Read on the enclosures and nothing of maintenance", () => {
  assert.deepEqual([...bundleOfCards(["enclosures"])], [["facility.enclosures", "read"]]);
});

test("Management is not handed a power it does not hold: Residents leaves death withdrawal out", () => {
  assert.ok(!bundleOfCards(["residents"]).has("placement.death_withdraw"));
});

test("Book clinic visits opens the clinic login's page for a clinic login and the shelter's list for everyone else", () => {
  assert.equal(cardOpens(CARDS.book_clinic_visits, "own_clinic"), "/appointments");
  assert.equal(cardOpens(CARDS.book_clinic_visits, "any"), "/upcoming-visits");
  assert.equal(cardOpens(CARDS.contacts, "any"), CARDS.contacts.opens);
});
