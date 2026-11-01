import test from "node:test";
import assert from "node:assert/strict";
import { checkOutput } from "./translate-engines.mjs";

const SRC = "Please adopt a dog today, or [donate](/donate) to help the shelter.";
const opts = { to: "th", tier: "reviewed" };

test("checkOutput accepts a translation carrying exactly the source's links", () => {
  const out = "กรุณารับเลี้ยงสุนัขวันนี้ หรือ [บริจาค](/donate) เพื่อช่วยศูนย์พักพิง";
  assert.equal(checkOutput(SRC, out, opts), out);
});

test("checkOutput rejects an invented link and names it", () => {
  const out = "กรุณา[รับเลี้ยง](/adopt)สุนัขวันนี้ หรือ [บริจาค](/donate) เพื่อช่วยศูนย์พักพิง";
  assert.throws(() => checkOutput(SRC, out, opts), /links differ.*added \/adopt/);
});

test("checkOutput rejects a dropped link and names it", () => {
  const out = "กรุณารับเลี้ยงสุนัขวันนี้ หรือบริจาคเพื่อช่วยศูนย์พักพิงของเรา";
  assert.throws(() => checkOutput(SRC, out, opts), /links differ.*dropped \/donate/);
});

test("checkOutput applies to the machine tier too", () => {
  const out = "กรุณารับเลี้ยงสุนัขวันนี้ หรือบริจาคเพื่อช่วยศูนย์พักพิงของเรา";
  assert.throws(() => checkOutput(SRC, out, { to: "th", tier: "machine" }), /links differ/);
});
