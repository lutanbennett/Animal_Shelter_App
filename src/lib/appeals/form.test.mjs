import test from "node:test";
import assert from "node:assert/strict";
import { checkAppeal, publishBlocker } from "./form.ts";

const base = {
  residentId: "11111111-2222-3333-4444-555555555555",
  title: "  Chao Guay 2 needs a   biopsy ",
  whatIsWrong: "A lump",
  treatmentNeeded: "",
  costCovers: "",
  target: "15,000",
  deadline: "",
  displayStyle: "bar",
  socialLinks: "",
};

test("a good form is tidied", () => {
  const r = checkAppeal(base);
  assert.equal(r.ok, true);
  assert.equal(r.appeal.title, "Chao Guay 2 needs a biopsy");
  assert.equal(r.appeal.target_amount, 15000);
  assert.equal(r.appeal.treatment_needed, null);
  assert.equal(r.appeal.deadline, null);
});

test("the target must be real money", () => {
  for (const target of ["", "0", "-5", "abc", "1.234"]) assert.equal(checkAppeal({ ...base, target }).problem, "target");
});

test("links are https only, de-duplicated, and named by line", () => {
  const ok = checkAppeal({ ...base, socialLinks: "https://facebook.com/p/1\n\nhttps://facebook.com/p/1\nwww.instagram.com/p/2" });
  assert.deepEqual(ok.appeal.social_links, ["https://facebook.com/p/1", "https://www.instagram.com/p/2"]);
  const bad = checkAppeal({ ...base, socialLinks: "https://a.co/x\nhttp://a.co/y" });
  assert.equal(bad.problem, "link");
  assert.equal(bad.line, 1);
  assert.equal(checkAppeal({ ...base, socialLinks: "javascript:alert(1)" }).problem, "link");
});

test("title, resident, style and date are checked", () => {
  assert.equal(checkAppeal({ ...base, title: "  " }).problem, "title");
  assert.equal(checkAppeal({ ...base, residentId: "nope" }).problem, "resident");
  assert.equal(checkAppeal({ ...base, displayStyle: "pie" }).problem, "style");
  assert.equal(checkAppeal({ ...base, deadline: "2026-13-45" }).problem, "deadline");
  assert.equal(checkAppeal({ ...base, deadline: "2026-10-20" }).ok, true);
});

test("publishing needs a reason to be asking", () => {
  assert.equal(publishBlocker({ what_is_wrong: null, treatment_needed: " " }), "story");
  assert.equal(publishBlocker({ what_is_wrong: "x", treatment_needed: null }), null);
});
