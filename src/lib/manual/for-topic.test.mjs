// The manual follows the cards: a topic is a reader's when they hold a card that gives it, and a topic with no card is
// never silently dropped. No role name appears anywhere below on purpose: a shelter may call its roles anything.
import test from "node:test";
import assert from "node:assert/strict";
import { cardsForTable, cardsOfTopic, holdsCard, mayViewAll, topicView } from "./for-topic.ts";
import { bundleJson, CARD_KEYS } from "../permissions/cards.ts";
import { parsePermissions } from "../permissions/can.ts";
import manual from "./en.ts";

/** A login whose access is exactly these cards' bundles, under a role name the code has never heard of. */
const holding = (...cards) =>
  parsePermissions({
    role: { key: "any_name_a_shelter_picks", name: "Anything", name_th: null, home_path: null },
    is_admin: false,
    permissions: Object.fromEntries(bundleJson(cards).map((b) => [b.activity, b.level])),
  });
const admin = parsePermissions({ role: { key: "x", name: "x", name_th: null, home_path: null }, is_admin: true, permissions: {} });

test("an activity topic derives its cards from cards.ts, with no edit to the manual", () => {
  const own = cardsOfTopic({ id: "a", title: "a", activity: "medical.weight" });
  assert.equal(own.kind, "cards");
  assert.ok(own.cards.includes("record_weight"));
});

test("a reader sees the topic of a card they hold and not another's", () => {
  const topic = { id: "a", title: "a", activity: "medical.weight" };
  assert.equal(topicView(topic, holding("record_weight")), "mine");
  assert.equal(topicView(topic, holding("add_medical_photos")), "notMine");
});

test("holding more than one card shows the topics of each", () => {
  const weight = { id: "a", title: "a", activity: "medical.weight" };
  const photos = { id: "b", title: "b", cards: ["add_medical_photos"] };
  const both = holding("record_weight", "add_medical_photos");
  assert.equal(topicView(weight, both), "mine");
  assert.equal(topicView(photos, both), "mine");
});

test("a topic for everyone is everyone's; one with no card is shown and marked, never hidden", () => {
  const nobody = holding("record_weight");
  assert.equal(topicView({ id: "e", title: "e", everyone: true }, nobody), "mine");
  assert.equal(topicView({ id: "u", title: "u" }, nobody), "unassigned");
  assert.equal(topicView({ id: "u", title: "u", awaitingCard: ["admin"] }, nobody), "unassigned");
});

test("Admin sees every topic without holding any card", () => {
  assert.equal(topicView({ id: "a", title: "a", activity: "medical.weight" }, admin), "mine");
  assert.equal(topicView({ id: "a", title: "a", cards: ["record_weight"] }, admin), "mine");
});

test("an activity no card grants is Admin's alone, not shown to everyone as unassigned", () => {
  const topic = { id: "s", title: "s", activity: "no.card.grants.this" };
  assert.deepEqual(cardsOfTopic(topic), { kind: "cards", cards: [] });
  assert.equal(topicView(topic, holding("record_weight")), "notMine");
  assert.equal(topicView(topic, admin), "mine");
});

test("a card that grants nothing is held by no one", () => {
  assert.equal(holdsCard(holding("administer_medication"), "my_tasks"), false);
});

test("no permissions at all sees everything", () => {
  assert.equal(topicView({ id: "a", title: "a", activity: "medical.weight" }, null), "mine");
});

test("every manual topic is either derived, explicit, for everyone, or unassigned (shown and marked, never hidden)", () => {
  const topics = manual.sections.flatMap((s) => s.topics);
  for (const t of topics) {
    // An unassigned topic is the visible gap (no card, not `everyone`): it needs no role worklist, and none is written.
    assert.equal(t.roles, undefined, `${t.id} still carries a role tag`);
  }
});

test("a login holding only the three photo, reel and meme cards is shown those topics and the universal ones", () => {
  const mine = holding("add_photos", "meme_library", "reel_add");
  const shown = manual.sections.flatMap((s) => s.topics).filter((t) => topicView(t, mine) === "mine").map((t) => t.id);
  for (const id of ["add-photos-unknown", "memes", "meme-maker", "reels-add"]) assert.ok(shown.includes(id), `${id} should be shown`);
  // Nothing that teaches a screen a card controls: the work of the full resident record, the menu, the public pages.
  for (const id of ["hub", "residents-list", "public-pages", "reels-view", "memes-view"]) assert.ok(!shown.includes(id), `${id} should not be shown`);
});

test("the topics that teach the full record are not tagged for everyone", () => {
  const by = Object.fromEntries(manual.sections.flatMap((s) => s.topics).map((t) => [t.id, t]));
  for (const id of ["hub", "residents-list", "name-card", "public-pages", "shelter-operations", "home-covering-another-role"]) {
    assert.notEqual(cardsOfTopic(by[id]).kind, "everyone", `${id} must not be tagged everyone`);
  }
});

test("an admin-only topic is Admin's alone, and decided rather than unassigned", () => {
  const topic = { id: "s", title: "s", adminOnly: true };
  assert.deepEqual(cardsOfTopic(topic), { kind: "cards", cards: [] });
  assert.equal(topicView(topic, holding("record_weight")), "notMine");
  assert.equal(topicView(topic, admin), "mine");
});

test("?view=all is honoured for Admin alone, on the page and on the PDF route", () => {
  assert.equal(mayViewAll(admin, "all"), true);
  assert.equal(mayViewAll(admin, null), false);
  assert.equal(mayViewAll(holding("record_weight"), "all"), false);
  assert.equal(mayViewAll(holding(), "all"), false, "a login whose cards open nothing is not handed the manual either");
  assert.equal(mayViewAll(null, "all"), false);
});

test("a topic about the menu is hidden from a login with no menu, and nobody else's view changes", () => {
  const t = { id: "m", title: "m", everyone: true, needsMenu: true };
  assert.equal(topicView(t, holding("record_weight"), false), "notMine");
  assert.equal(topicView(t, holding("record_weight"), true), "mine");
  assert.equal(topicView(t, holding("record_weight")), "mine");
  assert.equal(topicView({ id: "n", title: "n", everyone: true }, holding("record_weight"), false), "mine");
});

test("Cards at a glance lists only the cards held; Admin sees the whole catalogue", () => {
  const two = cardsForTable(holding("record_weight", "add_medical_photos"), CARD_KEYS);
  assert.ok(two.includes("record_weight") && two.includes("add_medical_photos"));
  assert.ok(two.length < CARD_KEYS.length / 2, "far fewer than the whole catalogue");
  assert.ok(two.every((k) => holdsCard(holding("record_weight", "add_medical_photos"), k)));
  assert.deepEqual(cardsForTable(admin, CARD_KEYS), [...CARD_KEYS]);
  assert.deepEqual(cardsForTable(holding(), CARD_KEYS), []);
  assert.deepEqual(cardsForTable(null, CARD_KEYS), []);
});
