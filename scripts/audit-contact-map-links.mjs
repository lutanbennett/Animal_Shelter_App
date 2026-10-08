// Which contacts' maps don't work, in words the person fixing them can act on.
//
//   node scripts/audit-contact-map-links.mjs                    (dev — the default)
//   node scripts/audit-contact-map-links.mjs --env production   (only when Lutan asks)
//
// Reads every live contact with something in its address, and says for each
// one whose map is wrong what is in the field, what is wrong in plain words,
// and what to do. Shelter Friends have no map field of their own: a friend's
// map is its contact's address (public_shelter_friends.map_location, 0076,
// shown only where show_map is on), so a friend is reported once, as its
// contact, marked as shown on the public website where it is.
//
// It changes nothing — there is no --apply. The one database call is a
// SELECT; everything else is asking Google where each short link goes.
//
// Judging a link: a `goo.gl` link is not dead because of its shape (Google
// kept active ones working after August 2025, #461) — it is followed, by the
// same followShortLink() the app uses (src/lib/contacts/short-link.ts), and
// then read by the same contacts.ts helpers, so this report and the contact
// pages can't disagree about a link.
//
// Gentle with Google: one HEAD request per distinct short link (up to three if
// it redirects more than once), one at a time, a second apart. Full Google
// Maps links and plain text are judged without asking anyone.
//
// Exit code: 0 when it ran (however many rows need fixing — that is the
// report, not a failure), 1 when it couldn't read the database. No
// process.exit() after a fetch: libuv asserts on Windows (load-residents.mjs).
import { join } from "node:path";
import { pathToFileURL } from "node:url";

// Node warns that the .ts files have no package "type"; harmless, and noise
// to whoever reads the report.
process.removeAllListeners("warning");

const root = process.cwd();
const imp = (p) => import(pathToFileURL(join(root, p)).href);
const { loadEnv, parseEnvArg, projectRef, SITE_ORIGINS } = await imp("scripts/lib/env.mjs");
// Node strips the types itself; both files have no imports.
const { MAP_SHORT_LINK_HOSTS, addressMapNow, mapQueryFromUrl, splitAddress } = await imp("src/lib/contacts/contacts.ts");
const { followShortLink } = await imp("src/lib/contacts/short-link.ts");

const { name: envName } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const ref = projectRef(env);
const origin = SITE_ORIGINS[envName];
const PAUSE_MS = 1000;

const HOW_TO_FIX =
  "Open Google Maps, find the place, tap Share, tap Copy link, then paste the link into this contact's Address.";

async function readContacts() {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `select c.id, c.name, c.address, (c.archived_at is not null) as archived,
                     coalesce(sf.published and sf.show_map, false) as on_website,
                     (sf.id is not null) as is_friend
                from contacts c
                left join shelter_friends sf on sf.contact_id = c.id
               where nullif(trim(c.address), '') is not null
               order by c.name`,
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`database said ${res.status}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const followed = new Map();
let googleRequests = 0;

/** Where a short link goes: { query } for a place, { dead } for nowhere, { unreachable } for no answer. */
async function judgeShortLink(url) {
  if (followed.has(url)) return followed.get(url);
  if (googleRequests > 0) await sleep(PAUSE_MS);
  googleRequests++;
  let verdict;
  try {
    const { target, status } = await followShortLink(url, MAP_SHORT_LINK_HOSTS);
    const query = target ? mapQueryFromUrl(target) : null;
    verdict = query ? { query } : { dead: true, status };
  } catch {
    verdict = { unreachable: true };
  }
  followed.set(url, verdict);
  return verdict;
}

/**
 * One contact's address, judged. Returns null when the map works and
 * nothing needs doing, else { outcome, problem, fix }.
 *   dead       a link that leads to no place — Google answers "not found",
 *              or it goes somewhere that isn't a map
 *   plaintext  no link at all: the map is Google's guess from the words
 *              (typed coordinates and Plus Codes are exact, so they pass)
 *   trailing   a working link with words after it — the map is right, but
 *              the words belong in a written address, not the link field
 *   unchecked  Google couldn't be reached; run again later
 */
// Words that already name an exact spot: typed coordinates ("18.61, 98.76")
// and a Plus Code at the start ("7MW3QXQ7+2C", or the short "QXQ7+2C Mae
// Wang" with its town). Google places these where they say, not by guessing.
const COORDS = /^-?\d{1,2}\.\d+\s*,\s*-?\d{1,3}\.\d+$/;
const PLUS_CODE = /^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3}(\s|$)/i;

export async function judge(address) {
  const { link, text } = splitAddress(address);
  if (!link && (COORDS.test(text) || PLUS_CODE.test(text))) return null;
  if (!link) {
    const buried = /https?:\/\//i.test(text);
    return {
      outcome: "plaintext",
      problem: buried
        ? "There is a link here, but not at the start, so the app can't use it. The map shows Google's guess from the words, which in Thailand is often the wrong place."
        : "This is written as words, not a map link. The map shows Google's guess from the words, which in Thailand is often the wrong place.",
      fix: buried
        ? `Check the link still opens the right place, then paste it so it comes first. ${HOW_TO_FIX}`
        : `If the map on this contact's page is already the right place, nothing is needed. If not: ${HOW_TO_FIX}`,
    };
  }

  let query = mapQueryFromUrl(link.toString());
  const isShort = MAP_SHORT_LINK_HOSTS.includes(link.hostname);
  if (isShort) {
    const verdict = await judgeShortLink(link.toString());
    if (verdict.unreachable) {
      return {
        outcome: "unchecked",
        problem: "Google didn't answer when this link was checked, so it is not known whether it works.",
        fix: "Nothing yet — run the check again later.",
      };
    }
    query = verdict.query ?? null;
  }

  const map = addressMapNow(address, query);
  if (!query) {
    const what = isShort
      ? "This link no longer opens a place in Google Maps."
      : "This link is not a Google Maps place.";
    return {
      outcome: "dead",
      problem: map
        ? `${what} The app is showing Google's guess from the words after the link instead.`
        : `${what} The app shows no map for this contact.`,
      fix: HOW_TO_FIX,
    };
  }
  if (text) {
    return {
      outcome: "trailing",
      problem: "The link works, but there are words after it in the same box. The app opens only the link and ignores the words.",
      fix: "Nothing is broken. When contacts get a separate Address box, move the words there.",
    };
  }
  return null;
}

const GROUPS = [
  ["dead", "Links that no longer open a place — fix these first"],
  ["plaintext", "Written addresses with no map link — the map is Google's guess"],
  ["trailing", "Working links with words after them — nothing broken"],
  ["unchecked", "Could not be checked — Google didn't answer"],
];

async function main() {
  let rows;
  try {
    rows = await readContacts();
  } catch (e) {
    console.error(`Could not read contacts from ${envName} (${ref}): ${e.message}`);
    process.exitCode = 1;
    return;
  }

  const live = rows.filter((r) => !r.archived);
  const results = [];
  for (const row of live) {
    const verdict = await judge(row.address);
    if (verdict) results.push({ ...row, ...verdict });
  }

  const shortLinks = new Set(
    live.map((r) => splitAddress(r.address).link).filter((l) => l && MAP_SHORT_LINK_HOSTS.includes(l.hostname)).map(String),
  );
  console.log(`Contact map check — ${envName} (${ref}), ${new Date().toISOString().slice(0, 10)}`);
  console.log(
    `${live.length} live contacts have an address (${rows.length - live.length} archived ones skipped). ` +
      `${live.length - results.length} are fine. ${shortLinks.size} short links checked with Google, ${googleRequests} lookups.`,
  );
  for (const [key, title] of GROUPS) {
    const group = results.filter((r) => r.outcome === key);
    console.log(`\n== ${title}: ${group.length} ==`);
    for (const r of group) {
      const tags = [r.is_friend && "Shelter Friend", r.on_website && "map shown on the public website"].filter(Boolean);
      console.log(`\n• ${r.name}${tags.length ? ` (${tags.join(", ")})` : ""}`);
      console.log(`  In the Address box now: ${r.address.replace(/\s+/g, " ").trim()}`);
      console.log(`  What's wrong: ${r.problem}`);
      console.log(`  What to do: ${r.fix}`);
      console.log(`  Fix it here: ${origin}/contacts/${r.id}`);
    }
  }
  console.log(
    `\nSummary: ${GROUPS.map(([k]) => `${k} ${results.filter((r) => r.outcome === k).length}`).join(", ")}, ` +
      `fine ${live.length - results.length}.`,
  );
}

// Run as a script; imported (by a check), only judge() is wanted.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
