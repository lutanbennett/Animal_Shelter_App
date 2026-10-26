// Zones and enclosures in the shelter's order (0161 + claude/place-order-settings), by role, against DEV
// and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-place-order-roles.mjs [http://localhost:<port>]
//
// Makes a throwaway login on a throwaway custom role that holds facility.enclosures at Read and nothing else
// (it was a Staff login until 0173 retired that role; Staff is not to be recreated, so the reader is a cell,
// not a role name), then checks what the browser pass could not:
//
//   - the reader cannot open Settings → Zones or Settings → Enclosures, and the database refuses them an
//     order write (the server, not just a hidden button);
//   - the reader sees /enclosures's zones in the order the tables hold, not A-Z;
//   - the Lifecycle pseudo-enclosures refuse an order even to the service role (0161's trigger).
//
// The doctor part is gone: it asked whether a login that cannot read the zones and enclosures tables still
// gets /enclosures and /residents, but the doctor's cells are live (Settings → Who does what), so what that
// login may open is a card question, not this check's. Nothing narrows a cell by role since 0259/0264.
//
// The login, its role and its cell are deleted at the end, whatever happened. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { giveRole } from "./lib/user-role.mjs";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");

/** The session cookies the app's own SSR client would set, and that client, for a password sign-in. */
async function signIn(email) {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return { client: ssr, cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; ") };
}

async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

/** A 3xx before anything streams, or a 200 whose body carries the redirect once loading.tsx has. */
const redirected = (r) =>
  (r.status >= 300 && r.status < 400) || /NEXT_REDIRECT|NEXT_HTTP_ERROR_FALLBACK;40[34]/.test(r.html);

const roleKey = `harness_place_order_${tag}`;
let roleId = null;

/** A login on a throwaway custom role that holds one cell: facility.enclosures at Read. */
async function makeReader() {
  const email = `harness-place-order-reader-${tag}@example.invalid`;
  const { data: role, error: roleInsErr } = await service.from("roles").insert({ key: roleKey, name: `Harness place order ${tag}`, kind: "custom" }).select("id").single();
  if (roleInsErr) throw roleInsErr;
  roleId = role.id;
  const { error: cellErr } = await service.from("role_permissions").insert({ role_id: roleId, activity: "facility.enclosures", level: 1 });
  if (cellErr) throw cellErr;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  made.push(data.user.id);
  const { error: roleErr } = await giveRole(service, data.user.id, roleKey);
  if (roleErr) throw roleErr;
  return signIn(email);
}

const made = [];
try {
  // The order the tables hold, read as the service role: physical zones by sort_order.
  // Off-site zones are not drawn as zones: /enclosures folds them into the one Offsite chip and lists them after the rest (2026-10-08),
  // so the order is asserted over the internal ones.
  const { data: zones, error: zErr } = await service.from("zones").select("id, name, sort_order, internal");
  if (zErr) throw zErr;
  const ordered = zones
    .filter((z) => z.sort_order != null && z.internal)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((z) => z.name);

  const reader = await makeReader();

  for (const path of ["/admin/zones", "/admin/enclosures"]) {
    const r = await page(path, reader.cookie);
    expect(redirected(r) && !r.html.includes("Sort A-Z"), `the Read-only reader is turned away from ${path} (${r.status})`);
  }

  const { data: oneEnclosure } = await service
    .from("enclosures")
    .select("id, sort_order, zones!inner(name)")
    .neq("zones.name", "Lifecycle")
    .not("sort_order", "is", null)
    .limit(1)
    .single();
  const { data: wrote, error: writeErr } = await reader.client
    .from("enclosures")
    .update({ sort_order: oneEnclosure.sort_order + 1000 })
    .eq("id", oneEnclosure.id)
    .select("id");
  expect(Boolean(writeErr) || (wrote ?? []).length === 0, `the database refuses the reader an enclosure order write (${writeErr?.message ?? "0 rows"})`);
  const { data: after } = await service.from("enclosures").select("sort_order").eq("id", oneEnclosure.id).single();
  expect(after.sort_order === oneEnclosure.sort_order, "the enclosure's order is unchanged");

  const enclosuresPage = await page("/enclosures", reader.cookie);
  expect(enclosuresPage.status === 200, `the reader opens /enclosures (${enclosuresPage.status})`);
  // Each zone heading's first appearance in the page, in page order.
  const positions = ordered
    .map((name) => ({ name, at: enclosuresPage.html.indexOf(`>${name}<`) }))
    .filter((z) => z.at !== -1);
  const inPage = [...positions].sort((a, b) => a.at - b.at).map((z) => z.name);
  expect(
    positions.length > 1 && inPage.join("|") === positions.map((z) => z.name).join("|"),
    `the reader sees the zones in the tables' order (page: ${inPage.join(", ")} / tables: ${ordered.join(", ")})`,
  );

  const { data: lifecycle } = await service
    .from("enclosures")
    .select("id, zones!inner(name)")
    .eq("zones.name", "Lifecycle")
    .limit(1)
    .single();
  const { error: lcErr } = await service.from("enclosures").update({ sort_order: 1 }).eq("id", lifecycle.id);
  expect(/takes no order/.test(lcErr?.message ?? ""), `a Lifecycle pseudo-enclosure refuses an order (${lcErr?.message ?? "accepted!"})`);
} finally {
  for (const id of made) await service.auth.admin.deleteUser(id);
  if (roleId) {
    await service.from("user_roles").delete().eq("role_id", roleId);
    await service.from("role_permissions").delete().eq("role_id", roleId);
    await service.from("roles").delete().eq("id", roleId);
  }
  console.log(`  deleted ${made.length} throwaway login(s) and the throwaway role`);
}

if (failures.length) {
  console.log(`\n${failures.length} failed`);
  process.exit(1);
}
console.log("\nall held");
