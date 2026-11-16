import test from "node:test";
import assert from "node:assert/strict";
import { scriptShelterHeaders } from "./lib/shelter-env.mjs";
const A = "11111111-1111-4111-8111-111111111111";
test("test env reads DEV_SHELTER_ID; other envs never inherit it", () => {
  assert.deepEqual(scriptShelterHeaders({ DEV_SHELTER_ID: A }, "test"), { "x-shelter-id": A });
  assert.deepEqual(scriptShelterHeaders({ DEV_SHELTER_ID: A }, "production"), {});
  assert.deepEqual(scriptShelterHeaders({ SHELTER_ID: A }, "production"), { "x-shelter-id": A });
});
test("unset or junk sends nothing", () => {
  assert.deepEqual(scriptShelterHeaders({}, "test"), {});
  assert.deepEqual(scriptShelterHeaders({ DEV_SHELTER_ID: "x" }, "test"), {});
});
