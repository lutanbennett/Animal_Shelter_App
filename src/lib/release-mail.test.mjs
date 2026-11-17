// Lanna's release mail, built from the default names, is the text the code said before the names were read per shelter.
import test from "node:test";
import assert from "node:assert/strict";
import { buildReleaseMail } from "./release-mail.ts";
import { DEFAULT_SHELTER_NAMES } from "./shelter-names-default.ts";

const one = [{ version: "1.2.0", title: "T", date: "2026-01-01", notes: ["a"] }];
test("default names reproduce the old subject and footer", () => {
  const m = buildReleaseMail(one, "https://x.example", DEFAULT_SHELTER_NAMES);
  assert.equal(m.subject, "Lanna Care release 1.2.0: T");
  assert.ok(m.text.endsWith("You get this because you are an admin in Lanna Care for Animals."));
  assert.ok(m.html.includes("You get this because you are an admin in Lanna Care for Animals.</p>"));
  assert.equal(buildReleaseMail([...one, ...one], "https://x.example", DEFAULT_SHELTER_NAMES).subject, "Lanna Care releases 1.2.0, 1.2.0");
});
test("another shelter's names appear instead", () => {
  const m = buildReleaseMail(one, "https://x.example", { displayName: "Other Shelter", shortName: "Other" });
  assert.equal(m.subject, "Other release 1.2.0: T");
  assert.ok(!/Lanna/.test(m.text + m.html));
});
