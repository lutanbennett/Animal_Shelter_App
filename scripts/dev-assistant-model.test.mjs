// node --test scripts/dev-assistant-model.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { reply, namesIn, MODEL_NAME } from "./dev-assistant-model.mjs";

const sentence = "Butter weighs 4.2 kg, bitten by Angsumalin";
const call = (r) => r.choices[0].message.tool_calls?.[0];

test("names are the capitalised words that are not days or fillers", () => {
  assert.deepEqual(namesIn(sentence), ["Butter", "Angsumalin"]);
  assert.deepEqual(namesIn("Test 1 weighs 4.2 kg, bitten by Test 2"), ["Test 1", "Test 2"]);
});

test("looks each name up, one per turn, then calls weight with the rest as mentions", () => {
  const first = call(reply({ messages: [{ role: "user", content: sentence }] }));
  assert.equal(first.function.name, "lookup");
  assert.deepEqual(JSON.parse(first.function.arguments), { kind: "resident", query: "Butter" });

  const asked = (q, id) => ({ role: "assistant", tool_calls: [{ id, function: { name: "lookup", arguments: JSON.stringify({ kind: "resident", query: q }) } }] });
  const m = [{ role: "user", content: sentence }, asked("Butter", "a"), { role: "tool", tool_call_id: "a", content: '[{"id":"B1"}]' }];
  assert.equal(JSON.parse(call(reply({ messages: m })).function.arguments).query, "Angsumalin");

  m.push(asked("Angsumalin", "b"), { role: "tool", tool_call_id: "b", content: '[{"id":"A1"}]' });
  const last = call(reply({ messages: m }));
  assert.equal(last.function.name, "weight");
  assert.deepEqual(JSON.parse(last.function.arguments), { residentId: "B1", weightKg: 4.2, date: null, mentions: ["A1"] });
});

test("a sentence it does not know is answered in words, with no tool call", () => {
  const r = reply({ messages: [{ role: "user", content: "Move Butter to Left Zone 3" }] });
  assert.equal(call(r), undefined);
  assert.equal(r.choices[0].finish_reason, "stop");
  assert.equal(MODEL_NAME, "scripted-dev");
});

test("when a name matches several rows it takes the one named exactly", () => {
  const s = "Test 1 weighs 4.2 kg, bitten by Test 2";
  const asked = (q, id) => ({ role: "assistant", tool_calls: [{ id, function: { name: "lookup", arguments: JSON.stringify({ kind: "resident", query: q }) } }] });
  const both = '[{"id":"T1","name":"Test 1"},{"id":"T2","name":"Test 2"}]';
  const m = [{ role: "user", content: s }, asked("Test 1", "a"), { role: "tool", tool_call_id: "a", content: both }, asked("Test 2", "b"), { role: "tool", tool_call_id: "b", content: both }];
  assert.deepEqual(JSON.parse(call(reply({ messages: m })).function.arguments), { residentId: "T1", weightKg: 4.2, date: null, mentions: ["T2"] });
});
