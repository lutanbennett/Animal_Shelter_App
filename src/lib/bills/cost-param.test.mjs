import test from "node:test";
import assert from "node:assert/strict";
import { billCostParam } from "./cost-param.ts";

// The Bills page links to /deliveries?cost=1250.50; the pattern once lost its backslashes and rejected every amount.
test("a bill's cost survives the link", () => {
  assert.equal(billCostParam("1250"), "1250");
  assert.equal(billCostParam("1250.5"), "1250.5");
  assert.equal(billCostParam("1250.50"), "1250.50");
});

test("anything else is dropped", () => {
  for (const bad of ["", "abc", "12.345", "-5", "1,250", "12d", undefined, ["1"]]) assert.equal(billCostParam(bad), "");
});
