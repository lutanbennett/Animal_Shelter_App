// The Address / Map link split (0164 + contacts-address-fields), against DEV and
// a running dev server:
//
//   node scripts/worktree.mjs dev                              (in another terminal)
//   node scripts/check-contact-address-fields.mjs [http://localhost:<port>]
//
// Makes a throwaway management login (password only) and four throwaway
// contacts, then fetches the pages as that login and as a visitor:
//
//   A  address + map_url               hub and lists print the words, never the link
//   B  link still at the front of the  the same, before the row move: the link
//      address, no map_url (pre-0164)  makes the map and is not printed
//   C  published Friend, show_map on,  /friends shows the map, and the written
//      show_address off                address appears nowhere in the response
//   D  published Friend, show_address  /friends prints the words, and the map
//      on, show_map off                link appears nowhere in the response
//
// C and D are the privacy half: the public map comes only from map_location,
// never from the address, and the address only from show_address.
//
// Map links are full Google Maps URLs, so nothing here asks Google anything.
// Everything made is deleted at the end, whatever happened. Exit 0 when every
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
const email = `harness-address-${tag}@example.invalid`;
const password = randomBytes(18).toString("base64url");
const mapsUrl = (place) => `https://www.google.com/maps/place/${place}/@18.61,98.76,17z`;

const A = { name: `Harness Addr ${tag} A`, type: "Carer", address: `12 Moo 3 Mae Wang A${tag}`, map_url: mapsUrl(`PlaceA${tag}`) };
const B = { name: `Harness Addr ${tag} B`, type: "Carer", address: `${mapsUrl(`PlaceB${tag}`)} 34 Moo 5 Legacy B${tag}`, map_url: null };
const C = { name: `Harness Addr ${tag} C`, type: "Vendor", address: `PRIVATE-ADDR-C${tag} Moo 9`, map_url: mapsUrl(`PlaceC${tag}`) };
const D = { name: `Harness Addr ${tag} D`, type: "Vendor", address: `88 Moo 1 Public D${tag}`, map_url: mapsUrl(`HiddenMapD${tag}`) };

async function signInCookies() {
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
  const res = await fetch(`${base}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  return { status: res.status, html: await res.text() };
}

/** What a person sees: the markup without scripts (the RSC payload carries props, which are not printed). */
const visible = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
const embedFor = (html, place) => html.includes(`q=${encodeURIComponent(place)}`) && html.includes("output=embed");

const madeUsers = [];
const madeContacts = [];
try {
  const { data: u, error: uErr } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (uErr) throw uErr;
  madeUsers.push(u.user.id);
  const { error: roleErr } = await service.from("user_roles").insert({ user_id: u.user.id, role: "management" });
  if (roleErr) throw roleErr;

  const { data: rows, error: cErr } = await service.from("contacts").insert([A, B, C, D]).select("id, name");
  if (cErr) throw cErr;
  for (const r of rows) madeContacts.push(r.id);
  const id = Object.fromEntries(rows.map((r) => [r.name, r.id]));
  const { error: fErr } = await service.from("shelter_friends").insert([
    { contact_id: id[C.name], published: true, show_map: true, show_address: false, sort_order: 9999 },
    { contact_id: id[D.name], published: true, show_map: false, show_address: true, sort_order: 9999 },
  ]);
  if (fErr) throw fErr;

  // The constraint 0164 put on the column: one link, nothing else.
  const { error: badErr } = await service.from("contacts").update({ map_url: `${mapsUrl("X")} words` }).eq("id", id[A.name]);
  expect(Boolean(badErr), "the database refuses a map_url with words after the link");

  const cookie = await signInCookies();

  console.log("Contact page, A (address + Map link):");
  const hubA = await page(`/contacts/${id[A.name]}`, cookie);
  const seenA = visible(hubA.html);
  expect(hubA.status === 200, `loads (${hubA.status})`);
  expect(seenA.includes(A.address), "prints the written address");
  expect(!seenA.includes("google.com/maps"), "prints no link as text");
  expect(embedFor(hubA.html, `PlaceA${tag}`), "the map is drawn from the Map link");

  console.log("Contact page, B (link still in the address):");
  const hubB = await page(`/contacts/${id[B.name]}`, cookie);
  const seenB = visible(hubB.html);
  expect(seenB.includes(`34 Moo 5 Legacy B${tag}`), "prints the words after the link");
  expect(!seenB.includes("google.com/maps"), "prints no link as text");
  expect(embedFor(hubB.html, `PlaceB${tag}`), "the map is still drawn from the old link");

  console.log("Contact list:");
  const list = visible((await page("/contacts", cookie)).html);
  expect(!list.includes("google.com/maps"), "no link printed as text");

  console.log("Management → Contacts:");
  const mgmt = await page("/management/contacts", cookie);
  const seenM = visible(mgmt.html);
  expect(seenM.includes(A.address) && seenM.includes(`34 Moo 5 Legacy B${tag}`), "both written addresses printed");
  expect(!seenM.includes("google.com/maps"), "no link printed as text");
  expect(mgmt.html.includes(`href="${A.map_url}"`), "A's Map link is a link, not text");
  expect(seenM.includes("Map link"), "the Map link box is on the create form");

  console.log("Public /friends (signed out):");
  const pub = await page("/friends");
  expect(pub.status === 200, `loads (${pub.status})`);
  expect(visible(pub.html).includes(C.name) && visible(pub.html).includes(D.name), "both Friends listed");
  expect(embedFor(pub.html, `PlaceC${tag}`), "C: map shown from the Map link (show_map)");
  expect(!pub.html.includes(`PRIVATE-ADDR-C${tag}`), "C: the written address is nowhere in the response (show_address off)");
  expect(visible(pub.html).includes(D.address), "D: the written address is printed (show_address)");
  expect(!pub.html.includes(`HiddenMapD${tag}`), "D: the Map link is nowhere in the response (show_map off)");
} finally {
  if (madeContacts.length) {
    const { error } = await service.from("contacts").delete().in("id", madeContacts);
    if (error) console.error(`  could not delete contacts: ${error.message}`);
  }
  for (const uid of madeUsers) {
    const { error } = await service.auth.admin.deleteUser(uid);
    if (error) console.error(`  could not delete ${uid}: ${error.message}`);
  }
  console.log(`  deleted ${madeContacts.length} throwaway contact(s) and ${madeUsers.length} login(s)`);
}

if (failures.length) {
  console.error(`\n${failures.length} expectation(s) failed.`);
  process.exit(1);
}
console.log("\nAll expectations held.");
