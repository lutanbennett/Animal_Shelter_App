// check-control-activity.mjs must resolve a control to the activity its action really asks, and must still flag a
// genuinely ungated one. Each test builds a tiny src/ tree in a temp folder and runs the script with that as cwd.
// The allow-list is absent there, so ANY finding is NEW and exits 1.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const script = resolve("scripts/check-control-activity.mjs");

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
