import test from "node:test";
import assert from "node:assert/strict";
import { bookingReturnPath } from "./booking-return.ts";

const CLINIC = "/clinics/0a1b2c3d-0000-4000-8000-123456789abc";

test("the known pages are accepted exactly", () => {
  for (const p of ["/upcoming-visits", "/appointments", CLINIC]) assert.equal(bookingReturnPath(p), p);
});

test("anything else is refused", () => {
  for (const p of [
    "https://example.com",
    "//evil.example",
    "/\evil.example",
    "/",
    "/residents",
    "/upcoming-visits/",
    "/upcoming-visits?x=1",
    "/upcoming-visits/../admin",
    "/appointments#a",
    " /appointments",
    "/clinics/not-a-uuid",
    `${CLINIC}/../..`,
    `${CLINIC}?x`,
    "",
    null,
    undefined,
    ["/appointments"],
  ]) {
    assert.equal(bookingReturnPath(p), null, String(p));
  }
});
