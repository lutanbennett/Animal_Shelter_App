// The manual follows the cards: a topic is a reader's when they hold a card that gives it, and a topic with no card is
// never silently dropped. No role name appears anywhere below on purpose: a shelter may call its roles anything.
import test from "node:test";
import assert from "node:assert/strict";
import { cardsOfTopic, holdsCard, topicView } from "./for-topic.ts";
import { bundleJson } from "../permissions/cards.ts";
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
  const topic = { id: "s", title: "s", activity: "audit.view" };
  assert.deepEqual(cardsOfTopic(topic), { kind: "cards", cards: [] });
  assert.equal(topicView(topic, holding("record_weight")), "notMine");
  assert.equal(topicView(topic, admin), "mine");
});

test("a card that grants nothing is held by no one", () => {
  assert.equal(holdsCard(holding("record_weight"), "my_tasks"), false);
});

test("no permissions at all sees everything", () => {
  assert.equal(topicView({ id: "a", title: "a", activity: "medical.weight" }, null), "mine");
});

test("every manual topic is either derived, explicit, for everyone, or on the unassigned worklist", () => {
  const topics = manual.sections.flatMap((s) => s.topics);
  for (const t of topics) {
    const kind = cardsOfTopic(t).kind;
    if (kind === "unassigned") assert.ok(t.awaitingCard, `${t.id} has no card, is not for everyone and is not on the worklist`);
    assert.equal(t.roles, undefined, `${t.id} still carries a role tag`);
  }
});
