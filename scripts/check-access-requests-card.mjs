// The System status "Access requests" card and the admins' "Review access
// requests" task on My tasks, against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-access-requests-card.mjs [http://localhost:<port>]
//
// The base URL defaults to this checkout's .port. The card is readable at a
// normal sign-in, so the one thing that matters is that it says how many are
// waiting and never who (docs/decisions.md, 2026-09-28). This makes:
//
//   - a throwaway admin, signed in with a password only (aal1 — no 2-step),
//   - a throwaway login with no role (an access request) carrying a
//     distinctive name and email address,
//
// then fetches /admin/status, /my and /admin/security as that admin and checks:
// the card counts the request, the task is on My tasks, the nav badge counts
// it, Security still sends an aal1 admin to the step-up, and neither the
// name nor the email appears anywhere in any of those pages. Archiving is
// checked too: an archived login keeps its role row, so it must not count.
//
// Both logins are deleted at the end, whatever happened. Exits 0 when every
// expectation held.
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
const adminEmail = `harness-access-admin-${tag}@example.invalid`;
const adminPassword = randomBytes(18).toString("base64url");
const requesterEmail = `harness-access-request-${tag}@example.invalid`;
const requesterName = `Harness Requester ${tag}`;
const staffEmail = `harness-access-staff-${tag}@example.invalid`;

/** The session cookies the app's own SSR client would set, for a password sign-in. */
async function signInCookies(email, password) {
  const jar = new Map();
  const ssr = createServerClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: (list) => list.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))),
    },
  });
  const { error } = await ssr.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return [...jar].map(([n, v]) => `${n}=${v}`).join("; ");
}

async function page(path, cookie) {
  const res = await fetch(`${base}${path}`, { headers: { cookie }, redirect: "manual" });
  return { status: res.status, location: res.headers.get("location"), html: await res.text() };
}

/** Rendered text, roughly: tags and the RSC payload's escapes don't hide a name from this. */
const leaks = (html) => {
  const lower = html.toLowerCase();
  return [requesterEmail, requesterName, `access-request-${tag}`].filter((s) => lower.includes(s.toLowerCase()));
};

const countFrom = (html) => {
  const m = html.match(/(\d+) access requests? waiting/);
  return m ? Number(m[1]) : 0;
};

const made = [];
try {
  const { data: a, error: aErr } = await service.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });
  if (aErr) throw aErr;
  made.push(a.user.id);
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: a.user.id, role: "admin" });
  if (roleErr) throw roleErr;
  const cookie = await signInCookies(adminEmail, adminPassword);

  // Before: whatever dev already has waiting.
  const before = await page("/admin/status", cookie);
  expect(before.status === 200, `an aal1 admin opens /admin/status (${before.status}${before.location ? ` → ${before.location}` : ""})`);
  const baseline = countFrom(before.html);
  console.log(`  dev already has ${baseline} waiting`);

  const { data: r, error: rErr } = await service.auth.admin.createUser({
    email: requesterEmail,
    email_confirm: true,
    user_metadata: { full_name: requesterName },
  });
  if (rErr) throw rErr;
  made.push(r.user.id);

  // The card caches for a minute; "Check now" is a server action, so wait it out instead.
  console.log("  waiting 61 s for the status cache to expire…");
  await new Promise((done) => setTimeout(done, 61_000));

  const status = await page("/admin/status", cookie);
  expect(countFrom(status.html) === baseline + 1, `the card counts the new request (${countFrom(status.html)} = ${baseline} + 1)`);
  expect(status.html.includes("Review them on Settings → Security"), "the card links to Settings → Security");
  expect(status.html.includes('href="/admin/security"'), "the link goes to /admin/security");
  expect(leaks(status.html).length === 0, `no name or email on /admin/status (${leaks(status.html).join(", ") || "none"})`);

  const my = await page("/my", cookie);
  expect(my.status === 200, `the admin opens /my (${my.status})`);
  expect(my.html.includes("Review access requests"), "My tasks has Review access requests");
  expect(my.html.includes(`${baseline + 1} waiting for a role`), `the task says ${baseline + 1} waiting`);
  expect(leaks(my.html).length === 0, `no name or email on /my (${leaks(my.html).join(", ") || "none"})`);
  // A fresh admin has nothing else assigned, so the badge is this task alone.
  expect(my.html.includes("1 due today or overdue"), "the My tasks badge counts it");

  // Staff: no card, no task — the page is admin-only and the source is too.
  const { data: s, error: sErr } = await service.auth.admin.createUser({
    email: staffEmail,
    password: adminPassword,
    email_confirm: true,
  });
  if (sErr) throw sErr;
  made.push(s.user.id);
  const { error: sRoleErr } = await service.from("user_roles").insert({ user_id: s.user.id, role: "staff" });
  if (sRoleErr) throw sRoleErr;
  const staffCookie = await signInCookies(staffEmail, adminPassword);
  const staffStatus = await page("/admin/status", staffCookie);
  expect(
    !/access requests? waiting|Waiting for access/.test(staffStatus.html),
    `staff get no card on /admin/status (${staffStatus.status}${staffStatus.location ? ` → ${staffStatus.location}` : ""})`,
  );
  const staffMy = await page("/my", staffCookie);
  expect(staffMy.status === 200 && !staffMy.html.includes("Review access requests"), "staff have no Review access requests task");
  expect(leaks(staffStatus.html + staffMy.html).length === 0, "no name or email for staff either");

  const security = await page("/admin/security", cookie);
  // A 3xx before anything streams; once loading.tsx has started the stream,
  // Next sends a 200 whose body carries the redirect instead. Either way.
  const toStepUp =
    (security.status >= 300 && security.status < 400 && (security.location ?? "").includes("/admin/security/verify")) ||
    /NEXT_REDIRECT[^"]*\/admin\/security\/verify|url=\/admin\/security\/verify/.test(security.html);
  expect(toStepUp, `Security still sends an aal1 admin to the step-up (${security.status})`);
  expect(leaks(security.html).length === 0, "no name or email in Security's response to an aal1 admin");

  // An archived login keeps its role row (0063): never a request.
  const { error: archErr } = await service
    .from("user_roles")
    .insert({ user_id: r.user.id, role: "volunteer", archived_at: new Date().toISOString() });
  if (archErr) throw archErr;
  console.log("  archived the requester; waiting 61 s again…");
  await new Promise((done) => setTimeout(done, 61_000));
  const after = await page("/admin/status", cookie);
  expect(countFrom(after.html) === baseline, `an archived login is not counted (${countFrom(after.html)} = ${baseline})`);
} finally {
  for (const id of made) {
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) console.error(`  could not delete ${id}: ${error.message}`);
  }
  console.log(`  deleted ${made.length} throwaway login(s)`);
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
