import test from "node:test";
import assert from "node:assert/strict";
import { parseRequest } from "./parse.ts";

/**
 * The two keyword parsers stream 5 added, and the order they sit in. The
 * order is the only thing parse.ts decides, and both of these are tried
 * before "where is …", so these tests are really about what they decline.
 */
const ctx = {
  residents: [
    { id: "r1", name: "Panda", thaiName: null, code: "D-001", enclosureId: "e1", enclosureName: "A3", enclosureNameTh: null, status: "Resident" },
    { id: "r2", name: "Mango", thaiName: null, code: "D-002", enclosureId: "e1", enclosureName: "A3", enclosureNameTh: null, status: "Resident" },
  ],
  enclosures: [{ id: "e1", name: "A3", nameTh: null }],
  zones: [{ id: "z1", name: "Cat zone", nameTh: null }],
  clinics: [{ id: "c1", name: "Dr Somchai" }],
  carers: [],
  immunizationTypes: [],
  medications: [{ id: "m1", name: "Amoxicillin", nameTh: null, doseUnit: "tablet" }],
  now: new Date("2026-10-31T09:00:00+07:00"),
};

test("'which enclosure has space' is the free-space question, with the zone and the number", () => {
  assert.deepEqual(parseRequest("which enclosure has space?", ctx), {
    intent: "find-enclosure",
    draft: { kind: "find-enclosure", zoneId: null, places: null },
    residentCandidates: [],
  });
  assert.equal(parseRequest("is there room for 2 dogs in the cat zone?", ctx).draft.zoneId, "z1");
  assert.equal(parseRequest("is there room for 2 dogs in the cat zone?", ctx).draft.places, 2);
  assert.equal(parseRequest("any empty enclosures?", ctx).draft.places, null);
  // "where is there room" must not be read as a resident's whereabouts.
  assert.equal(parseRequest("where is there room for a new dog?", ctx).intent, "find-enclosure");
});

test("a sentence that names a resident is not the free-space question", () => {
  // "where can I put Panda" is a move, and the move parser should have it.
  const parsed = parseRequest("where is there room for Panda?", ctx);
  assert.notEqual(parsed?.intent, "find-enclosure");
});

test("'tell me about X' is the summary, and needs a resident", () => {
  assert.deepEqual(parseRequest("tell me about Panda", ctx), {
    intent: "summary",
    draft: { kind: "summary", residentId: "r1" },
    residentCandidates: [],
  });
  assert.equal(parseRequest("how is Mango doing?", ctx).intent, "summary");
  assert.equal(parseRequest("summary of Panda please", ctx).intent, "summary");
  // Nothing to summarise: not this parser's sentence.
  assert.notEqual(parseRequest("how is it going?", ctx)?.intent, "summary");
  assert.notEqual(parseRequest("tell me about the shelter", ctx)?.intent, "summary");
});

test("the questions the summary must not steal", () => {
  assert.equal(parseRequest("where is Panda?", ctx).intent, "where");
  assert.equal(parseRequest("who is in A3?", ctx).intent, "who");
  assert.equal(parseRequest("what is due this week?", ctx).intent, "due");
});

test("no keyword parser claims a prescription: that sentence is the model's", () => {
  // Deliberate (decision file, 2026-10-31): a wrong guess at a dose is worse
  // than no guess, so with no model the sentence reads as unmatched or as
  // something else, never as a prescription.
  assert.notEqual(parseRequest("start Panda on amoxicillin 1 tablet twice a day", ctx)?.intent, "prescription");
});
