import test from "node:test";
import assert from "node:assert/strict";
import { shelterSenderName } from "./mail-sender.ts";

test("the sender names the shelter, carried by CooperJaidee", () => {
  assert.equal(shelterSenderName("Hillside Animal Rescue"), "Hillside Animal Rescue (via CooperJaidee)");
});

test("a qualifier follows the shelter name", () => {
  assert.equal(shelterSenderName(" Other Shelter ", "status"), "Other Shelter status (via CooperJaidee)");
});
