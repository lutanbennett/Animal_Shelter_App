// Zones and enclosures in the shelter's order (0161 + claude/place-order-settings), by role, against DEV
// and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-place-order-roles.mjs [http://localhost:<port>]
//
// Makes a throwaway staff login and a throwaway vet login, then checks what the browser pass could not:
//
//   - staff cannot open Settings → Zones or Settings → Enclosures, and the database refuses them an
//     order write (the server, not just a hidden button);
//   - staff see /enclosures's zones in the order the tables hold, not A-Z;
//   - the vet, who cannot read the zones and enclosures tables, still gets /enclosures and /residents
//     (name order, no error);
//   - the Lifecycle pseudo-enclosures refuse an order even to the service role (0161's trigger).
//
// Both logins are deleted at the end, whatever happened. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

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

async function makeLogin(role) {
  const email = `harness-place-order-${role}-${tag}@example.invalid`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  made.push(data.user.id);
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: data.user.id, role });
  if (roleErr) throw roleErr;
  return signIn(email);
}

const made = [];
try {
  // The order the tables hold, read as the service role: physical zones by sort_order.
  const { data: zones, error: zErr } = await service.from("zones").select("id, name, sort_order");
  if (zErr) throw zErr;
  const ordered = zones
    .filter((z) => z.sort_order != null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((z) => z.name);

  const staff = await makeLogin("staff");

  for (const path of ["/admin/zones", "/admin/enclosures"]) {
    const r = await page(path, staff.cookie);
    expect(redirected(r) && !r.html.includes("Sort A-Z"), `staff are turned away from ${path} (${r.status})`);
  }

  const { data: oneEnclosure } = await service
    .from("enclosures")
    .select("id, sort_order, zones!inner(name)")
    .neq("zones.name", "Lifecycle")
    .not("sort_order", "is", null)
    .limit(1)
    .single();
  const { data: wrote, error: writeErr } = await staff.client
    .from("enclosures")
    .update({ sort_order: oneEnclosure.sort_order + 1000 })
    .eq("id", oneEnclosure.id)
    .select("id");
  expect(Boolean(writeErr) || (wrote ?? []).length === 0, `the database refuses staff an enclosure order write (${writeErr?.message ?? "0 rows"})`);
  const { data: after } = await service.from("enclosures").select("sort_order").eq("id", oneEnclosure.id).single();
  expect(after.sort_order === oneEnclosure.sort_order, "the enclosure's order is unchanged");

  const enclosuresPage = await page("/enclosures", staff.cookie);
  expect(enclosuresPage.status === 200, `staff open /enclosures (${enclosuresPage.status})`);
  // Each zone heading's first appearance in the page, in page order.
  const positions = ordered
    .map((name) => ({ name, at: enclosuresPage.html.indexOf(`>${name}<`) }))
    .filter((z) => z.at !== -1);
  const inPage = [...positions].sort((a, b) => a.at - b.at).map((z) => z.name);
  expect(
    positions.length > 1 && inPage.join("|") === positions.map((z) => z.name).join("|"),
    `staff see the zones in the tables' order (${inPage.slice(0, 5).join(", ")}, …)`,
  );

  const vet = await makeLogin("vet");
  const { data: vetZones } = await vet.client.from("zones").select("id");
  console.log(`  (the vet reads ${vetZones?.length ?? 0} zones from the table)`);
  for (const path of ["/enclosures", "/residents"]) {
    const r = await page(path, vet.cookie);
    expect(r.status === 200 && !/Application error|Internal Server Error/.test(r.html), `the vet opens ${path} without an error (${r.status})`);
  }

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
  console.log(`  deleted ${made.length} throwaway login(s)`);
}

if (failures.length) {
  console.log(`\n${failures.length} failed`);
  process.exit(1);
}
console.log("\nall held");
