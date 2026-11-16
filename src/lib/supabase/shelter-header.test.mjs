import test from "node:test";
import assert from "node:assert/strict";
import { devShelterId, requestShelterHeaders } from "./shelter-header.ts";

// #ujqr5: `next dev` has no Worker, so it sends its own shelter; nothing else may.
const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("development with a uuid sends it", () => {
  assert.deepEqual(requestShelterHeaders(null, { NODE_ENV: "development", DEV_SHELTER_ID: A }), { "x-shelter-id": A });
});
test("production ignores the variable, however it got there", () => {
  assert.deepEqual(requestShelterHeaders(null, { NODE_ENV: "production", DEV_SHELTER_ID: A }), {});
  assert.equal(devShelterId({ NODE_ENV: "test", DEV_SHELTER_ID: A }), null);
  assert.equal(devShelterId({ DEV_SHELTER_ID: A }), null);
});
test("no variable or a junk one sends nothing: no fallback to any shelter", () => {
  assert.deepEqual(requestShelterHeaders(null, { NODE_ENV: "development" }), {});
  assert.deepEqual(requestShelterHeaders(null, { NODE_ENV: "development", DEV_SHELTER_ID: "lanna" }), {});
});
test("a header that arrived wins over the dev one", () => {
  assert.deepEqual(requestShelterHeaders(B, { NODE_ENV: "development", DEV_SHELTER_ID: A }), { "x-shelter-id": B });
  assert.deepEqual(requestShelterHeaders(B, { NODE_ENV: "production", DEV_SHELTER_ID: A }), { "x-shelter-id": B });
});
