import test from "node:test";
import assert from "node:assert/strict";
import { calendarNoticeFooter } from "./calendar-notice.ts";
import { DEFAULT_SHELTER_NAMES } from "../shelter-names-default.ts";

test("default short name reproduces the old calendar notice footer", () => {
  assert.equal(
    calendarNoticeFooter("production", DEFAULT_SHELTER_NAMES.shortName, "https://x.example"),
    "It is a change made in the shelter calendar, picked up by the production Lanna Care system (https://x.example). If this was a mistake, open the visit and set it back to scheduled.",
  );
});
test("another shelter's short name appears instead", () => {
  assert.ok(!/Lanna/.test(calendarNoticeFooter("uat", "Other", "https://x.example")));
});
