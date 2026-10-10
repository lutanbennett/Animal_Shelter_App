// The place-on-map editor (step 3 of the facility map), against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-facility-map-editor.mjs [http://localhost:<port>]
//
// Part 1 is the drawing maths, pure. Part 2 makes a throwaway admin, a throwaway volunteer, a
// throwaway zone with two enclosures and a plan row for it, then checks as those logins:
//   - /admin/facility-map opens for the admin, lists the throwaway zone, and is refused to the volunteer
//   - the admin's own login can write a shape and the volunteer's cannot (RLS is the real boundary: the
//     server action only adds a message in front of it)
//   - a stored shape reads back through parseShape, which is what the read-only map draws with
//   - the database still refuses what the editor's own checks would have caught first
// Everything it made is deleted at the end, whatever happened. Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const geo = await import(pathToFileURL(join(root, "src/lib/facility-map/geometry.ts")).href);
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
const ref = projectRef(env);
if (ref !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${ref} is not the dev project`);

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

// ---- 1. the maths ----
console.log("drawing maths");
const rect = geo.rectShape([60, 40], [20, 10]);
expect(JSON.stringify(rect) === "[[20,10],[60,10],[60,40],[20,40]]", "a rectangle from any two corners is clockwise from the top left");
expect(geo.parseShape(rect) !== null, "a drawn rectangle is a shape the map accepts");
expect(geo.shapeArea(rect) === 1200, "its area is width x height in percent squared");
// A 1000x500 plan draws in a 100x50 space: a click at drawing (50, 25) is the middle of the image.
expect(JSON.stringify(geo.drawingToPercent(50, 25, 1000, 500)) === "[50,50]", "a click in drawing space becomes percent of the image (y scaled by the aspect)");
expect(JSON.stringify(geo.drawingToPercent(-5, 80, 1000, 500)) === "[0,100]", "a click off the edge is clamped onto the image");
expect(geo.drawingToPercent(33.3333333, 10, 1000, 500)[0] === 33.33, "points are rounded to two decimals");
expect(geo.shapeArea([[10, 10], [20, 20], [30, 30]]) < geo.MIN_SHAPE_AREA, "a collinear scribble is below the minimum area");
expect(geo.shapeArea(geo.rectShape([10, 10], [10.1, 10.1])) < geo.MIN_SHAPE_AREA, "a slip of the finger is below the minimum area");
expect(geo.shapeArea(geo.rectShape([10, 10], [12, 12])) > geo.MIN_SHAPE_AREA, "a 2% square is a place");
const pts = geo.pointsAttr(rect, 1000, 500);
expect(pts === "20,5 60,5 60,20 20,20", `pointsAttr puts y in drawing space (${pts})`);

// ---- 2. against dev ----
const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");
const emails = { admin: `harness-mapeditor-admin-${tag}@example.invalid`, volunteer: `harness-mapeditor-vol-${tag}@example.invalid` };
const zoneName = `Harness Zone ${tag}`;

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
  return { db: ssr, cookie: [...jar].map(([n, v]) => `${n}=${v}`).join("; ") };
}
async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

console.log("against dev");
const users = [];
let zoneId = null;
try {
  for (const [role, email] of Object.entries(emails)) {
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    users.push(data.user.id);
    const { error: roleErr } = await service.from("user_roles").insert({ user_id: data.user.id, role });
    if (roleErr) throw roleErr;
  }
  const admin = await signIn(emails.admin);
  const volunteer = await signIn(emails.volunteer);

  const { data: zone, error: zErr } = await service.from("zones").insert({ name: zoneName, internal: true }).select("id").single();
  if (zErr) throw zErr;
  zoneId = zone.id;
  const { data: encl, error: eErr } = await service
    .from("enclosures")
    .insert([{ name: `Harness A ${tag}`, zone_id: zoneId, capacity: 2 }, { name: `Harness B ${tag}`, zone_id: zoneId, capacity: 2 }])
    .select("id, name");
  if (eErr) throw eErr;
  const [a, b] = encl;

  const adminPage = await page("/admin/facility-map", admin.cookie);
  expect(adminPage.status === 200 && adminPage.html.includes("Facility map"), `the admin opens /admin/facility-map (${adminPage.status})`);
  expect(adminPage.html.includes(zoneName), "the editor lists a new on-site zone, with no map work to make it appear");
  const volPage = await page("/admin/facility-map", volunteer.cookie);
  expect(!volPage.html.includes("Add a plan") && !volPage.html.includes(zoneName), `a volunteer is refused the editor (${volPage.status})`);
  const anon = await page("/admin/facility-map", "");
  expect(anon.status >= 300 && anon.status < 400, `signed out is redirected (${anon.status} -> ${anon.location})`);

  // A plan for the throwaway zone, as the admin would add it.
  const plan = await admin.db.from("facility_maps").insert({ kind: "zone", zone_id: zoneId, image_path: "storage:plans/harness/harness.webp", width: 1492, height: 1054 }).select("id").single();
  expect(!plan.error, `the admin's login can add a plan (${plan.error?.message ?? "ok"})`);
  const volPlan = await volunteer.db.from("facility_maps").insert({ kind: "zone", zone_id: zoneId, image_path: "x.webp", width: 10, height: 10 });
  expect(Boolean(volPlan.error), "a volunteer's login cannot add a plan");
  const dup = await admin.db.from("facility_maps").insert({ kind: "zone", zone_id: zoneId, image_path: "y.webp", width: 10, height: 10 });
  expect(dup.error?.code === "23505", `a second plan for one zone is refused (${dup.error?.code}), which addPlan turns into a sentence`);

  // A drawn shape, as saveShape writes it.
  const drawn = geo.rectShape([12.34, 20], [30, 45.5]);
  const w = await admin.db.from("enclosures").update({ map_shape: drawn }).eq("id", a.id).select("id");
  expect(!w.error && w.data?.length === 1, `the admin's login can place an enclosure (${w.error?.message ?? "ok"})`);
  const vw = await volunteer.db.from("enclosures").update({ map_shape: drawn }).eq("id", b.id).select("id");
  expect(!vw.error && vw.data?.length === 0, "a volunteer's write changes nothing (RLS filters it)");
  const back = await service.from("enclosures").select("map_shape").eq("id", a.id).single();
  expect(JSON.stringify(geo.parseShape(back.data.map_shape)) === JSON.stringify(drawn), "the stored shape reads back through parseShape unchanged");
  const unplaced = (await service.from("enclosures").select("id").eq("zone_id", zoneId).is("map_shape", null)).data.map((r) => r.id);
  expect(unplaced.length === 1 && unplaced[0] === b.id, "placing one shrinks the unplaced list to the other");

  // Clearing, and what the database refuses even if a client skipped the checks.
  const cleared = await admin.db.from("enclosures").update({ map_shape: null }).eq("id", a.id).select("id");
  expect(!cleared.error && cleared.data?.length === 1, "an enclosure can be taken off the plan");
  const bad = await admin.db.from("enclosures").update({ map_shape: [[1, 1], [2, 2]] }).eq("id", a.id);
  expect(bad.error?.code === "23514", `two points are refused by the database (${bad.error?.code})`);
  const off = await admin.db.from("enclosures").update({ map_shape: [[1, 1], [200, 2], [3, 3]] }).eq("id", a.id);
  expect(off.error?.code === "23514", `a point off the plan is refused by the database (${off.error?.code})`);

  // Removing the plan keeps the shapes, as removePlan promises.
  await admin.db.from("enclosures").update({ map_shape: drawn }).eq("id", a.id);
  const del = await admin.db.from("facility_maps").delete().eq("zone_id", zoneId).select("id");
  expect(!del.error && del.data?.length === 1, "the admin can remove a plan");
  const kept = await service.from("enclosures").select("map_shape").eq("id", a.id).single();
  expect(kept.data.map_shape !== null, "its shapes stay on their enclosures");
} catch (e) {
  console.error(e);
  failures.push(String(e?.message ?? e));
} finally {
  if (zoneId) {
    await service.from("enclosures").delete().eq("zone_id", zoneId);
    await service.from("zones").delete().eq("id", zoneId);
  }
  for (const id of users) {
    await service.from("user_roles").delete().eq("user_id", id);
    await service.auth.admin.deleteUser(id);
  }
  console.log("cleaned up");
}
console.log(failures.length ? `\n${failures.length} FAILED` : "\nall ok");
process.exit(failures.length ? 1 : 0);
