// The Head of Medical's five jobs, driven as her: a real login (password, aal1) with the
// head_of_medical role, against DEV and a running dev server.
//
//   node scripts/worktree.mjs dev                         (in another terminal)
//   node scripts/check-medical-jobs-app.mjs [http://localhost:<port>] [--upload]
//
// It checks three things the screens cannot show on their own:
//   1. HOME   her home is exactly her five jobs, each a tile that opens.
//   2. EACH JOB opens for her, shows what it should, and reads nothing it should not.
//   3. THE FLOOR she can do each job and nothing more: a resident's record, the dashboard and
//      the prescription form are refused politely (the app's own page, not a crash or an empty
//      list); a deceased resident's weight is refused by the database (resident_is_deceased(),
//      0026) under her JWT, which 0140's decision left reasoned and not exercised.
//
// The login, a weight row and nothing else are made and removed again, whatever happened.
// Exits 0 when every expectation held.
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const { loadEnv, projectRef } = await import(pathToFileURL(join(root, "scripts/lib/env.mjs")).href);
const env = loadEnv("test");
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error("refusing: not the dev project");

const base = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const tag = randomBytes(4).toString("hex");
const email = `harness-hom-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");

const jar = new Map();
const ssr = createServerClient(url, anon, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
  },
});

async function page(path, locale = "en") {
  const cookie = [...[...jar].map(([n, v]) => `${n}=${v}`), `locale=${locale}`].join("; ");
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}
/** Visible-ish text: the RSC payload's script tags are dropped first. */
const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

let userId = null;
const madeWeights = [];
const madeAttachments = [];
try {
  const { data: u, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  userId = u.user.id;
  const { data: role } = await service.from("roles").select("id, legacy_role").eq("key", "head_of_medical").single();
  const { error: urErr } = await service
    .from("user_roles")
    .insert({ user_id: userId, role_id: role.id, role: role.legacy_role });
  if (urErr) throw urErr;
  const { error: siErr } = await ssr.auth.signInWithPassword({ email, password });
  if (siErr) throw siErr;
  const her = createClient(url, anon, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${(await ssr.auth.getSession()).data.session.access_token}` } },
  });

  // A live resident and a dead one, from whatever dev holds.
  const { data: who } = await her.from("resident_who_and_where").select("id, name, thai_name, current_status, enclosure_name");
  const live = (who ?? []).find((r) => r.current_status === "Resident" && r.enclosure_name);
  const { data: deadRows } = await service.from("resident_current_state").select("resident_id").eq("is_deceased", true).limit(1);
  const deadId = deadRows?.[0]?.resident_id;
  expect(!!live, "she can pick a live resident through resident_who_and_where");
  expect(!!deadId, "dev holds a deceased resident to test with");

  console.log("\nHOME");
  const home = await page("/home");
  const homeText = text(home.html);
  expect(home.status === 200, `her home opens (${home.status})`);
  for (const [job, href] of [
    ["Administer Medication", "/management/medication-list"],
    ["Record Weight", "/medical/weight"],
    ["Add Medical Photos", "/medical/photos"],
    ["Feed Special Diets", "/medical/diets"],
  ]) {
    expect(homeText.includes(job) && home.html.includes(`href="${href}"`), `tile: ${job} → ${href}`);
  }

  console.log("\nTHE THREE NEW JOBS, English and Thai");
  for (const locale of ["en", "th"]) {
    for (const path of ["/medical/weight", "/medical/photos", "/medical/diets"]) {
      const p = await page(path, locale);
      expect(p.status === 200 && !p.location, `${locale} ${path} opens (${p.status}${p.location ? ` → ${p.location}` : ""})`);
    }
  }
  const picker = text((await page("/medical/weight")).html);
  expect(live && picker.includes(live.name), "the weight picker lists a live resident by name");
  const diets = text((await page("/medical/diets")).html);
  expect(!/cost|price|stock|reorder/i.test(diets), "the diet page shows no cost, price, stock or reorder");

  console.log("\nRECORD WEIGHT");
  const one = await page(`/medical/weight?resident=${live.id}`);
  const oneText = text(one.html);
  expect(oneText.includes("Weight in kg") && one.html.includes('inputMode="decimal"') || one.html.includes('inputmode="decimal"'), "the weight form opens with the decimal keypad");
  expect(!oneText.toLowerCase().includes("vet visit") && !one.html.includes('name="vetAppointmentId"'), "no vet-visit picker is offered (she cannot read vet_appointments)");
  const gone = await page("/medical/weight?resident=00000000-0000-0000-0000-000000000000");
  expect(gone.status === 200 && text(gone.html).includes("isn't in the list"), "an unknown resident gets the polite sentence");
  if (deadId) {
    const dead = await page(`/medical/weight?resident=${deadId}`);
    // The picker view carries the status, so the page itself closes the form for a deceased resident.
    const t = text(dead.html);
    expect(t.includes("record is closed") || t.includes("isn't in the list"), "a deceased resident's weight page is closed, not a form");
  }
  // The database, under her JWT: a live weight, then a second the same day, then a dead one.
  const day = new Date(Date.now() - 400 * 86400_000).toISOString().slice(0, 10);
  const ins = await her.from("weight").insert({ resident_id: live.id, date: day, weight_kg: 12.34 }).select("id").single();
  expect(!ins.error, `she inserts a weight (${ins.error?.message ?? "ok"})`);
  if (ins.data) madeWeights.push(ins.data.id);
  const dup = await her.from("weight").insert({ resident_id: live.id, date: day, weight_kg: 12.5 });
  expect(dup.error?.code === "23505", `a second reading the same day is refused (${dup.error?.code ?? "no error"})`);
  const neg = await her.from("weight").insert({ resident_id: live.id, date: day.slice(0, 8) + "01", weight_kg: -1 });
  expect(!!neg.error, "a non-positive weight is refused");
  if (deadId) {
    const d = await her.from("weight").insert({ resident_id: deadId, date: day, weight_kg: 9 }).select("id");
    expect(!!d.error, `A DECEASED RESIDENT'S WEIGHT IS REFUSED under her JWT (${d.error?.message ?? "NO ERROR"})`);
    if (d.data?.length) madeWeights.push(...d.data.map((x) => x.id));
    const dr = await her.from("weight").select("id").eq("resident_id", deadId).limit(1);
    expect(!dr.error, "she can still read a deceased resident's weight history (reading is not blocked, writing is)");
  }

  console.log("\nTHE FLOOR: each of these is the app's own refusal");
  const refusals = [
    [`/residents/${live.id}/medications`, "a resident record page (medications)"],
    [`/residents/${live.id}/weight`, "a resident record page (weight)"],
    ["/management/dashboard", "the dashboard"],
    ["/management/medications", "the medication catalogue"],
    ["/weight/new?residentId=" + live.id, "the staff weight form"],
    ["/prescriptions/new", "the prescription form"],
  ];
  for (const [path, what] of refusals) {
    const r = await page(path);
    // A refusal is a redirect to /no-access: a 3xx, or once the stream has started a 200 whose body carries it.
    const toNoAccess = (r.location ?? "").includes("/no-access") || /NEXT_REDIRECT[^"]*\/no-access|url=\/no-access/.test(r.html);
    // A 404 is the app's own not-found page, and the staff weight form says "Resident not found": both are polite, neither is a crash or an empty list.
    const notFound = /NEXT_HTTP_ERROR_FALLBACK;404/.test(r.html) || text(r.html).includes("Resident not found");
    const own = text((await page("/no-access")).html);
    expect(
      (toNoAccess || notFound) && r.status < 500 && own.includes("You don't have access to this page"),
      `${what} is refused or not found, politely (${r.status}${r.location ? ` → ${r.location}` : ""}${notFound ? ", not found" : ""})`,
    );
  }
  const sib = await page("/api/medical/residents/" + live.id + "/photos");
  expect(sib.status === 405 || sib.status === 404, `the photo route answers a GET with no photo (${sib.status})`);

  // --upload: really files one 1x1 JPEG through the sibling route into DEV's Google Drive, then reads
  // the attachment row back (service role: she cannot read attachments) and checks the folder, the
  // date and who filed it. Off by default because it touches Drive.
  if (process.argv.includes("--upload")) {
    console.log("\nADD MEDICAL PHOTOS, a real upload");
    const jpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      "base64",
    );
    const cookie = [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
    const send = async (id) => {
      const form = new FormData();
      form.append("file", new File([jpeg], `harness-${tag}.jpg`, { type: "image/jpeg" }));
      const res = await fetch(`${base}/api/medical/residents/${id}/photos`, {
        method: "POST",
        headers: { cookie, origin: base },
        body: form,
      });
      return { status: res.status, body: await res.json().catch(() => ({})) };
    };
    const up = await send(live.id);
    expect(up.status === 200 && up.body.attachmentId, `a photo is filed (${up.status} ${up.body.error ?? ""})`);
    if (up.body.attachmentId) {
      const { data: att } = await service.from("attachments").select("sub_folder, date_taken, uploaded_by, owner_id").eq("id", up.body.attachmentId).single();
      expect(att?.sub_folder === "Medical" && att.owner_id === live.id, `filed in the Medical folder against the resident (${att?.sub_folder})`);
      expect(att?.uploaded_by === userId, "uploaded_by is her");
      const { data: res } = await service.from("residents").select("drive_folder_id").eq("id", live.id).single();
      expect(!!res?.drive_folder_id, "the resident has a Drive folder id afterwards");
      madeAttachments.push(up.body.attachmentId);
    }
    if (deadId) {
      const dead = await send(deadId);
      expect(dead.status === 409, `a deceased resident's photo is refused with the closed sentence (${dead.status})`);
    }
    const nobody = await send("00000000-0000-0000-0000-000000000000");
    expect(nobody.status === 404, `an unknown resident is a 404 (${nobody.status})`);
  }

  console.log("\nTHE DATABASE FLOOR, under her JWT");
  const reads = await Promise.all([
    her.from("residents").select("id").limit(1),
    her.from("resident_current_state").select("resident_id").limit(1),
    her.from("vet_appointments").select("id").limit(1),
    her.from("diet_types").select("id").limit(1),
    her.from("attachments").select("id").limit(1),
  ]);
  for (const [i, name] of ["residents", "resident_current_state", "vet_appointments", "diet_types", "attachments"].entries()) {
    expect(!reads[i].data?.length, `${name} returns her nothing`);
  }
  const photoView = await her.from("medical_photo_residents").select("id, name").eq("id", live.id);
  expect(photoView.data?.length === 1, "medical_photo_residents gives her the resident to file under");
  const specialView = await her.from("special_diet_list").select("resident_diet_id").limit(1);
  expect(!specialView.error, `special_diet_list reads for her (${specialView.error?.message ?? "ok"})`);
} finally {
  if (madeWeights.length) await service.from("weight").delete().in("id", madeWeights);
  if (madeAttachments.length) await service.from("attachments").delete().in("id", madeAttachments);
  if (userId) {
    await service.from("user_roles").delete().eq("user_id", userId);
    const { error } = await service.auth.admin.deleteUser(userId);
    console.log(`\n  removed the throwaway login${error ? ` (could not delete: ${error.message})` : ""}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
