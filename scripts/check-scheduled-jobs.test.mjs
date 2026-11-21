import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { findProblems, readJobs } from "./lib/scheduled-jobs.mjs";

test("the real repository is clean, and the four jobs read as the decision file says", () => {
  assert.deepEqual(findProblems("."), []);
  const by = Object.fromEntries(readJobs(".").jobs.map((j) => [j.fn, j]));
  for (const f of ["runCalendarSweep", "runMerchSupplierEmails", "runLabelDrafts"]) {
    assert.ok(by[f].outside && by[f].archived, f + " acts outside and skips a closed shelter");
  }
  assert.ok(by.runReportPhotoRetention.outside && !by.runReportPhotoRetention.archived && by.runReportPhotoRetention.exempt);
});

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), "schedjobs-"));
  for (const [f, t] of Object.entries(files)) {
    mkdirSync(dirname(join(root, f)), { recursive: true });
    writeFileSync(join(root, f), t);
  }
  return root;
}
const worker = (marker = "") => `const w = {
  async scheduled(c, env) {
    ${marker}
    await reportStage(env, "x", await runNewMail(env));
  },
};
async function runNewMail(env) {
  const r = new Request(env.STATUS_ALERT_SITE + "/api/new/mail", { method: "POST" });
  return openNext.fetch(r);
}`;
const route = (extra) => `import { go } from "@/lib/new/mail";\nexport async function POST() { await go(); }\n${extra}`;

test("a NEW job that sends mail and never reads archived_at goes red", () => {
  const root = repo({ "worker/index.mjs": worker(), "src/app/api/new/mail/route.ts": route(""), "src/lib/new/mail.ts": "await sendEmail(to); await db.from('shelters').select()" });
  const p = findProblems(root);
  assert.equal(p.length, 1);
  assert.match(p[0], /runNewMail \(sends mail\) never considers archived_at/);
});
test("the same job passes once it reads archived_at", () => {
  const root = repo({ "worker/index.mjs": worker(), "src/app/api/new/mail/route.ts": route(""), "src/lib/new/mail.ts": "await sendEmail(to); db.from('shelters').is('archived_at', null)" });
  assert.deepEqual(findProblems(root), []);
});
test("a recorded exemption with a reason passes; one with no reason does not", () => {
  const files = { "src/app/api/new/mail/route.ts": route(""), "src/lib/new/mail.ts": "await sendEmail(to)" };
  assert.deepEqual(findProblems(repo({ ...files, "worker/index.mjs": worker("// writer-outside-db: no-archived-skip — retention still purges") })), []);
  assert.equal(findProblems(repo({ ...files, "worker/index.mjs": worker("// writer-outside-db: no-archived-skip —") })).length, 1);
});
test("a job that stays inside the database is not flagged", () => {
  const root = repo({ "worker/index.mjs": worker(), "src/app/api/new/mail/route.ts": route(""), "src/lib/new/mail.ts": "await db.from('t').delete()" });
  assert.deepEqual(findProblems(root), []);
});
test("a reader that finds no jobs says it is blind rather than clean", () => {
  assert.match(findProblems(repo({ "worker/index.mjs": "export default {};" })).join(), /blind/);
});
