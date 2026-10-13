// The Donate page's ways to give (0191 + the donate-buttons app PR), against DEV and a running dev server:
//
//   node scripts/worktree.mjs dev                          (in another terminal)
//   node scripts/check-donate-buttons.mjs [http://localhost:<port>]
//
// Makes a throwaway admin and a throwaway volunteer, then checks as those logins and as a signed-out visitor:
//   - the admin opens Settings -> Website -> Donate; a volunteer does not
//   - the admin's login can add a PayPal, a DonorBox and a Wise link on the company's own address and a bank card
//   - the database refuses what a client that skipped the app's check would send: http, a look-alike host, a
//     subdomain trick, a user-info trick, and another company's address under the wrong kind
//   - a volunteer's login cannot add a way
//   - /donate shows each button pointing at the right site, the bank card's number, and NOT a hidden way
//   - a hidden way is absent from the public view for a signed-out reader and appears when shown again
// Everything it made is deleted at the end, whatever happened. Exits 0 when every expectation held.
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
if (projectRef(env) !== "qxkmhwybjggxvsfxsxbd") throw new Error(`refusing: ${projectRef(env)} is not the dev project`);

const failures = [];
const expect = (ok, what) => {
  console.log(`  ${ok ? "ok  " : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
};

const base = process.argv[2] ?? `http://localhost:${readFileSync(join(root, ".port"), "utf8").trim()}`;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const anon = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const tag = randomBytes(4).toString("hex");
const password = randomBytes(18).toString("base64url");
const emails = { admin: `harness-donate-admin-${tag}@example.invalid`, volunteer: `harness-donate-vol-${tag}@example.invalid` };

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
  return { status: res.status, html: await res.text() };
}

console.log("against dev");
const users = [];
const made = [];
try {
  for (const [role, email] of Object.entries(emails)) {
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    users.push(data.user.id);
    const { error: roleErr } = await giveRole(service, data.user.id, role);
    if (roleErr) throw roleErr;
  }
  const admin = await signIn(emails.admin);
  const volunteer = await signIn(emails.volunteer);

  const settings = await page("/admin/website?tab=donate", admin.cookie);
  expect(settings.status === 200 && settings.html.includes("Add a way to give"), `the admin opens the Donate tab (${settings.status})`);
  const volSettings = await page("/admin/website?tab=donate", volunteer.cookie);
  expect(!volSettings.html.includes("Add a way to give"), `a volunteer does not get the Donate tab (${volSettings.status})`);

  const add = async (row) => {
    const res = await admin.db.from("donation_channels").insert(row).select("id").single();
    if (res.data) made.push(res.data.id);
    return res;
  };
  const paypal = await add({ way: "paypal", label: `Harness PayPal ${tag}`, url: "https://www.paypal.com/donate/?hosted_button_id=HARNESS", sort_order: 9001 });
  const donorbox = await add({ way: "donorbox", label: `Harness DonorBox ${tag}`, url: "https://donorbox.org/harness", sort_order: 9002 });
  const wise = await add({ way: "wise", label: `Harness Wise ${tag}`, url: "https://wise.com/pay/me/harness", sort_order: 9003 });
  const bank = await add({ way: "bank_transfer", label: `Harness Bank ${tag}`, bank_name: "Harness Bank", account_name: "Harness Shelter", account_number: `99-${tag}-77`, sort_order: 9004 });
  const hidden = await add({ way: "other", label: `Harness Hidden ${tag}`, url: "https://example.org/hidden", shown: false, sort_order: 9005 });
  for (const [name, r] of Object.entries({ paypal, donorbox, wise, bank, hidden })) {
    expect(!r.error, `the admin's login can add a ${name} way (${r.error?.message ?? "ok"})`);
  }

  // What the database refuses even if a client skipped the app's own check.
  for (const [way, bad, why] of [
    ["paypal", "http://www.paypal.com/x", "plain http"],
    ["paypal", "https://paypal.com.evil.test/donate", "paypal.com.evil.test"],
    ["paypal", "https://paypal.com@evil.test/donate", "paypal.com@evil.test"],
    ["paypal", "https://evil.test/paypal.com", "evil.test/paypal.com"],
    ["paypal", "https://secure-paypal.com/donate", "secure-paypal.com"],
    ["donorbox", "https://donorbox.org.evil.test/x", "donorbox.org.evil.test"],
    ["wise", "https://wise.com.evil.test/pay", "wise.com.evil.test"],
    ["wise", "https://likewise.com/pay", "likewise.com"],
    ["wise", "https://paypal.com/x", "another company's address under Wise"],
  ]) {
    const r = await admin.db.from("donation_channels").insert({ way, label: `Harness bad ${tag}`, url: bad });
    if (!r.error) {
      // Should never happen; clean it up so the run does not leave a bad link behind.
      await service.from("donation_channels").delete().eq("label", `Harness bad ${tag}`);
    }
    expect(r.error?.code === "23514", `${why} is refused as a ${way} link (${r.error?.code})`);
  }

  const vol = await volunteer.db.from("donation_channels").insert({ way: "other", label: `Harness vol ${tag}`, url: "https://example.org/x" });
  expect(Boolean(vol.error), "a volunteer's login cannot add a way");

  // The public page, as a signed-in reader (the dev site is closed to visitors).
  const donate = await page("/donate", admin.cookie);
  const hrefOf = (label) => new RegExp(`href="([^"]+)"[^>]*>[^<]*${label}`).exec(donate.html)?.[1];
  expect(donate.status === 200, `/donate opens (${donate.status})`);
  expect(hrefOf(`Harness PayPal ${tag}`)?.startsWith("https://www.paypal.com/"), "the PayPal button points at paypal.com");
  expect(hrefOf(`Harness DonorBox ${tag}`) === "https://donorbox.org/harness", "the DonorBox button points at donorbox.org");
  expect(hrefOf(`Harness Wise ${tag}`) === "https://wise.com/pay/me/harness", "the Wise button points at wise.com");
  expect(donate.html.includes(`99-${tag}-77`), "the bank card shows the account number");
  expect(donate.html.includes('target="_blank"') && donate.html.includes("noopener"), "buttons open in a new tab without handing over the opener");
  expect(!donate.html.includes(`Harness Hidden ${tag}`), "a hidden way is not on /donate");

  // The public view, signed out.
  const pub = await anon.from("public_donation_channels").select("label, account_number");
  const labels = (pub.data ?? []).map((r) => r.label);
  expect(!pub.error && labels.includes(`Harness PayPal ${tag}`), "a signed-out reader can read a shown way");
  expect(!labels.includes(`Harness Hidden ${tag}`), "a signed-out reader cannot read a hidden way");
  const direct = await anon.from("donation_channels").select("id");
  expect((direct.data ?? []).length === 0, "a signed-out reader cannot read the table itself");

  // Show it again and it appears.
  await admin.db.from("donation_channels").update({ shown: true }).eq("id", hidden.data.id);
  const again = await page("/donate", admin.cookie);
  expect(again.html.includes(`Harness Hidden ${tag}`), "a way shown again appears on /donate");
} finally {
  if (made.length) await service.from("donation_channels").delete().in("id", made);
  await service.from("donation_channels").delete().like("label", `Harness %${tag}`);
  for (const id of users) await service.auth.admin.deleteUser(id);
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed`);
  process.exit(1);
}
console.log("\nall expectations held");
