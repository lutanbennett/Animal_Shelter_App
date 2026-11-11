// check-control-activity.mjs must resolve a control to the activity its action really asks, and must still flag a
// genuinely ungated one. Each test builds a tiny src/ tree in a temp folder and runs the script with that as cwd.
// The allow-list is absent there, so ANY finding is NEW and exits 1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

// CCA_SCRIPT points the same tests at another copy of the script (e.g. the one before a pattern was taught) to prove they fail without it.
const script = resolve(process.env.CCA_SCRIPT ?? "scripts/check-control-activity.mjs");

function run(files) {
  const dir = mkdtempSync(join(tmpdir(), "ctlact-"));
  try {
    mkdirSync(join(dir, "supabase/migrations"), { recursive: true });
    const all = { "src/lib/permissions/routes.ts": "export const routes = [];\n", ...files };
    for (const [p, body] of Object.entries(all)) {
      mkdirSync(dirname(join(dir, p)), { recursive: true });
      writeFileSync(join(dir, p), body);
    }
    const r = spawnSync(process.execPath, [script], { cwd: dir, encoding: "utf8" });
    return { status: r.status, out: r.stdout + r.stderr };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// A page that guards on proj.write and renders <Form/>; Form's submit runs `action`.
const page = `import { Form } from "./Form";\nexport default async function P() { await requirePermission("proj.write"); return <Form />; }\n`;
const form = (fn) => `"use client";\nimport { ${fn} } from "./actions";\nexport function Form() { return <form onSubmit={() => ${fn}("1")} />; }\n`;

// ---- (i) a can() that only shapes what the action writes is not a requirement --------------------------------
test("(i) an optional can() in the action body is not demanded of the host page", () => {
  const r = run({
    "src/app/x/page.tsx": page,
    "src/app/x/Form.tsx": form("save"),
    "src/app/x/actions.ts": `"use server";
export async function save(id: string) {
  const canPublish = can(perms, "proj.publish");
  await db.update({ name: 1, ...(canPublish ? { is_public: true } : {}) });
}\n`,
  });
  assert.equal(r.status, 0, r.out);
});

test("(i) the same can() that REFUSES in an if is still a requirement, and the ungated control is still flagged", () => {
  const r = run({
    "src/app/x/page.tsx": page,
    "src/app/x/Form.tsx": form("save"),
    "src/app/x/actions.ts": `"use server";
export async function save(id: string) {
  const canPublish = can(perms, "proj.publish");
  if (!canPublish) return { ok: false };
  await db.update({ name: 1 });
}\n`,
  });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /do not imply proj\.publish/);
});

test("(i) a direct can() in an if is still a requirement", () => {
  const r = run({
    "src/app/x/page.tsx": page,
    "src/app/x/Form.tsx": form("save"),
    "src/app/x/actions.ts": `"use server";
export async function save(id: string) {
  if (!can(perms, "proj.publish")) return;
}\n`,
  });
  assert.equal(r.status, 1, r.out);
});

// ---- (iii) a shared component's callback is judged per caller, not as every caller's actions unioned ------------
// Picker only calls onPick. Two callers pass different actions; the pages that render each caller guard their own.
const picker = `"use client";\nexport function Picker({ onPick }: { onPick: (id: string) => void }) { return <button onClick={() => onPick("1")} />; }\n`;
const callerA = `"use client";\nimport { Picker } from "../shared/Picker";\nimport { doA } from "./actions";\nexport function CallerA() { return <Picker onPick={(id) => doA(id)} />; }\n`;
const callerB = `"use client";\nimport { Picker } from "../shared/Picker";\nimport { doB } from "./actions";\nexport function CallerB() { return <Picker onPick={(id) => doB(id)} />; }\n`;
const pageOf = (name, act) => `import { ${name} } from "./${name}";\nexport default async function P() { await requirePermission("${act}"); return <${name} />; }\n`;
const actionsAB = `"use server";\nexport async function doA(id: string) { if (!can(perms, "area.a")) return; }\nexport async function doB(id: string) { if (!can(perms, "area.b")) return; }\n`;

test("(iii) each caller of a shared picker is guarded by the page that renders THAT caller", () => {
  const r = run({
    "src/app/shared/Picker.tsx": picker,
    "src/app/a/CallerA.tsx": callerA, "src/app/a/actions.ts": actionsAB.split("export async function doB")[0], "src/app/a/page.tsx": pageOf("CallerA", "area.a"),
    "src/app/b/CallerB.tsx": callerB, "src/app/b/actions.ts": `"use server";\nexport async function doB(id: string) { if (!can(perms, "area.b")) return; }\n`, "src/app/b/page.tsx": pageOf("CallerB", "area.b"),
    // a third host that passes a callback running NO action, on a page guarding something else: the old union flagged it
    "src/app/c/CallerC.tsx": `"use client";
import { Picker } from "../shared/Picker";
export function CallerC() { return <Picker onPick={() => {}} />; }
`, "src/app/c/page.tsx": pageOf("CallerC", "area.c"),
  });
  assert.equal(r.status, 0, r.out);
});

test("(iii) a caller whose own page does NOT guard its action is still flagged, and named", () => {
  const r = run({
    "src/app/shared/Picker.tsx": picker,
    "src/app/a/CallerA.tsx": callerA, "src/app/a/actions.ts": actionsAB.split("export async function doB")[0], "src/app/a/page.tsx": pageOf("CallerA", "area.a"),
    // CallerB's page guards area.a, but doB asks area.b
    "src/app/b/CallerB.tsx": callerB, "src/app/b/actions.ts": `"use server";\nexport async function doB(id: string) { if (!can(perms, "area.b")) return; }\n`, "src/app/b/page.tsx": pageOf("CallerB", "area.a"),
  });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /passed by src\/app\/b\/CallerB\.tsx/);
  assert.doesNotMatch(r.out, /passed by src\/app\/a\/CallerA\.tsx/);
});

// ---- (ii) per-branch actions: `canEdit ? update : propose` ----------------------------------------------------
// Each arm is judged on its own; the true arm may lean on the condition (reached only when canEdit holds); a form
// whose submit buttons are ALL drawn under a gate is submitted only through them, so their gate is the form's.
const branchActions = `"use server";\nexport async function update(id: string) { if (!can(perms, "site.edit")) return; }\nexport async function propose(id: string) { if (!can(perms, "site.propose")) return; }\n`;
const branchPage = `import { Form } from "./Form";\nexport default async function P() { await requirePermission("site.view"); return <Form canEdit={can(perms, "site.edit")} canPropose={can(perms, "site.propose")} />; }\n`;
const branchForm = (submitGate) => `"use client";\nimport { update, propose } from "./actions";\nexport function Form({ canEdit = false, canPropose = false }) {\n  const [state, onSubmit] = useWriteForm(canEdit ? update : propose);\n  return <form onSubmit={onSubmit}>{${submitGate} && <button type="submit" />}</form>;\n}\n`;

test("(ii) each arm of a conditional action is covered: the true arm by its condition, the other by the submit button's gate", () => {
  const r = run({ "src/app/s/page.tsx": branchPage, "src/app/s/actions.ts": branchActions, "src/app/s/Form.tsx": branchForm("(canEdit || canPropose)") });
  assert.equal(r.status, 0, r.out);
});

test("(ii) an arm nothing covers is still flagged: the submit is drawn for canEdit only, but the other arm asks site.propose", () => {
  const r = run({ "src/app/s/page.tsx": branchPage, "src/app/s/actions.ts": branchActions, "src/app/s/Form.tsx": branchForm("canEdit") });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /its action asks site\.propose/);
});

test("(ii) a form with NO gated submit gets no borrowed gate: an ungated form is flagged", () => {
  const form = `"use client";\nimport { update, propose } from "./actions";\nexport function Form({ canEdit = false }) {\n  const [state, onSubmit] = useWriteForm(canEdit ? update : propose);\n  return <form onSubmit={onSubmit}><button type="submit" /></form>;\n}\n`;
  const r = run({ "src/app/s/page.tsx": branchPage, "src/app/s/actions.ts": branchActions, "src/app/s/Form.tsx": form });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /do not imply site\.propose/);
});

// ---- two causes found on the way, each with its own case -----------------------------------------------------------
test("an early return on `!a || !b || c` guards past it on BOTH a and b (the whole || chain, not its top two operands)", () => {
  const file = `"use client";\nimport { go } from "./actions";\nexport function Card({ canManage, kind, archived }) {\n  if (!canManage || !(kind === "x") || archived) return null;\n  return <button onClick={() => go("1")} />;\n}\n`;
  const r = run({
    "src/app/g/page.tsx": `import { Card } from "./Card";\nexport default async function P() { await requirePermission("g.view"); return <Card canManage={can(perms, "g.manage")} kind="x" archived={false} />; }\n`,
    "src/app/g/actions.ts": `"use server";\nexport async function go(id: string) { if (!can(perms, "g.manage")) return; }\n`,
    "src/app/g/Card.tsx": file,
  });
  assert.equal(r.status, 0, r.out);
});

test("two components in one file may both name their handler `onSubmit`: the second form is judged on ITS OWN action, not the first one's", () => {
  const forms = `"use client";\nimport { one, two } from "./actions";\nexport function One() { const [s, onSubmit] = useWriteForm(one); return <form onSubmit={onSubmit} />; }\nexport function Two() { const [s, onSubmit] = useWriteForm(two); return <form onSubmit={onSubmit}><button type="submit" /></form>; }\n`;
  const r = run({
    "src/app/h/page.tsx": `import { One, Two } from "./Forms";\nexport default async function P() { await requirePermission("h.one"); return <><One /><Two /></>; }\n`,
    "src/app/h/actions.ts": `"use server";\nexport async function one(id: string) { if (!can(perms, "h.one")) return; }\nexport async function two(id: string) { if (!can(perms, "h.two")) return; }\n`,
    "src/app/h/Forms.tsx": forms,
  });
  assert.equal(r.status, 1, r.out);
  assert.match(r.out, /<form onSubmit> two: .*imply h\.two/);
});
