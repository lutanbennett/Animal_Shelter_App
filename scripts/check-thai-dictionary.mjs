#!/usr/bin/env node
/**
 * The Thai dictionary says something, and the app's wording comes from it.
 *
 * Two rules, and they are at different stages on purpose. Read the second
 * one's note before wiring anything new onto it.
 *
 * RULE 1 — a Thai entry is not its English (FAILS the build).
 *   `th.ts` is typed against `en.ts`, so a MISSING key already fails the
 *   typecheck and is not a fault this can see. What the typecheck cannot see
 *   is a key whose Thai is the English string copied across. On 2026-10-31
 *   the whole file held 96 of those, and judging them one by one found 3 that
 *   were genuinely untranslated — among them the donation receipt's email
 *   subject and body, so a Thai staff member pressing *Email the receipt*
 *   composed an English letter to the donor.
 *
 *   It compares at RUNTIME, walking both dictionaries in parallel, so a
 *   templated entry (`(n) => \`...\``) and an entry written across several
 *   lines are reached too. A regex over the source text reached only 2,632 of
 *   8,051 lines and missed all 33 of the templated ones.
 *
 *   The deliberate cases are handled two ways, neither of which is a count:
 *
 *   - STRUCTURALLY, with no list to keep: an entry whose English has no
 *     letters left once placeholders, digits and punctuation are taken out is
 *     not translatable at all. That is the em dash, the ellipsis, "4:5", and
 *     every entry that is only placeholders and spacing — 33 of the 96.
 *   - By NAME, in ALLOWED below, one line per entry with its reason. A brand
 *     is not a permanent red, and the reason is there so the next reader does
 *     not have to work out why LINE is in Latin. `CLAUDE.md` is explicit that
 *     a baseline count rots; a named record does not, and removing an entry
 *     from the dictionary makes its line here fail as unused.
 *
 * RULE 2 — English typed into a .tsx instead of going through the dictionary
 *          (REPORTS ONLY; does not fail the build. Read why.)
 *   `CLAUDE.md`'s test for a check worth building is that a PASSING TREE HAS
 *   NONE. This tree does not pass: there is a real backlog of literal English
 *   copy in components, which is why the sweep that found it was told to
 *   measure rather than fix. A rule that went red today would be red for
 *   weeks, and a red people are emailed about hourly is one they filter — the
 *   exact fault `test-plan` was rescued from.
 *
 *   So this rule PRINTS its count and its grouped list and returns no verdict.
 *   It carries NO stored number, so it cannot rot and it cannot quietly accept
 *   a new one. When the backlog item (*English typed straight into a page or
 *   component*, under `## Architecture`) has cleared the list, set
 *   RULE_2_BLOCKS to true — one line — and it becomes an ordinary gate.
 *
 *   docs/decisions/2026-10-31-thai-dictionary-check.md
 *
 *   node scripts/check-thai-dictionary.mjs           both rules
 *   node scripts/check-thai-dictionary.mjs --list    rule 2's full list, not the top groups
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exitWith } from "./lib/exit.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const src = path.join(root, "src");
const showAll = process.argv.includes("--list");

/** Rule 2 reports rather than blocks until the backlog item has cleared it. */
const RULE_2_BLOCKS = false;

/**
 * Entries whose Thai is deliberately the English string. One line each, with
 * the reason, because a brand name must not be a permanent red. A path listed
 * here that is no longer identical (or no longer exists) is reported as stale,
 * so this list cannot drift away from the dictionary.
 */
const ALLOWED = {
  // The foundation's own name, and the short forms of it. Used untranslated
  // inside Thai sentences throughout th.ts, so these agree with the file.
  "header.appName": "the foundation's registered name, a proper noun",
  "header.shortName": "initials of the foundation's name",
  "publicNav.shortName": "short form of the foundation's name",
  "login.heading": "the foundation's name on the sign-in screen",
  // Which deployment the reader is looking at. Short Latin badges by design.
  "header.devBadge": "environment badge, the same three letters in both",
  "header.uatBadge": "environment badge, the same three letters in both",
  // Platform and payment brands. Thai writes these in Latin.
  "publicNav.line": "LINE, a brand",
  "publicNav.messenger": "Messenger, a brand",
  "publicNav.whatsapp": "WhatsApp, a brand",
  "contactChannels.name.line": "LINE, a brand",
  "contactChannels.us.line": "LINE plus the account name, both unchanged in Thai",
  "shelterFriends.line": "LINE plus the account name, both unchanged in Thai",
  "contactChannels.name.messenger": "Messenger, a brand",
  "contactChannels.name.whatsapp": "WhatsApp, a brand",
  "contactChannels.name.instagram": "Instagram, a brand",
  "appeals.socialNames.facebook": "Facebook, a brand",
  "appeals.socialNames.instagram": "Instagram, a brand",
  "appeals.socialNames.line": "LINE, a brand",
  "admin.website.settings.contactLine": "LINE, a brand",
  "admin.website.settings.instagramUrl": "Instagram, a brand",
  "admin.website.settings.xUrl": "X (Twitter), a brand",
  "admin.website.settings.messengerUrl": "Facebook Messenger, a brand",
  "admin.website.donate.ways.paypal": "PayPal, a brand",
  "admin.website.donate.ways.donorbox": "DonorBox, a brand",
  "admin.website.donate.ways.wise": "Wise, a brand",
  "management.contacts.createForm.lineId": "LINE ID, as Thai users write it",
  "management.contacts.createForm.messenger": "Messenger, a brand",
  "management.contacts.createForm.whatsapp": "WhatsApp, a brand",
  "contacts.actions.line": "LINE, a brand",
  "contacts.actions.messenger": "Messenger, a brand",
  "contacts.actions.whatsapp": "WhatsApp, a brand",
  "memes.platforms.facebook": "Facebook, a brand",
  "memes.platforms.instagram": "Instagram, a brand",
  "memes.platforms.line": "LINE, a brand",
  "memes.platforms.tiktok": "TikTok, a brand",
  "photos.posted.platforms.facebook": "Facebook, a brand",
  "photos.posted.platforms.instagram": "Instagram, a brand",
  "photos.posted.platforms.line": "LINE, a brand",
  "photos.posted.platforms.tiktok": "TikTok, a brand",
  "photos.posted.platformShort.facebook": "two-letter brand short form",
  "photos.posted.platformShort.instagram": "two-letter brand short form",
  "photos.posted.platformShort.line": "LINE, a brand",
  "photos.posted.platformShort.tiktok": "two-letter brand short form",
  "adoptionUpdates.channels.line": "LINE, a brand",
  "adoptionUpdates.channels.facebook": "Facebook, a brand",
  "shelterFriends.facebook": "Facebook, a brand",
  "shelterFriends.card.optIns.show_line": "LINE, a brand",
  "donations.methods.donorbox": "DonorBox, a brand",
  "donations.donors.form.line": "LINE, a brand",
  "donations.form.line": "LINE, a brand",
  "residents.rehome.newCarer.lineId": "LINE ID, as Thai users write it",
  "vetVisits.record.reports.pdf": "PDF, a file format",
  // Things that are not prose: a filename, a path, a URL or address shape.
  "admin.whoDoesWhat.csvFilename": "the downloaded file's name, not shown as words",
  "management.recurringJobs.form.linkPlaceholder": "an in-app path typed into the field",
  "management.contacts.createForm.emailPlaceholder": "an example email address",
  "management.contacts.createForm.mapUrlPlaceholder": "an example Google Maps URL",
  "shelterFriends.card.websitePlaceholder": "an example URL",
  "shelterFriends.card.facebookPlaceholder": "an example URL",
};

/* ---------------------------------------------------------------- rule 1 */

// Markers the sampler feeds a templated entry. Identical for both languages,
// so any difference in the result is the wording and not the arguments.
const MARKS = ["\u0001one\u0001", 7, "\u0001two\u0001", 3, "\u0001three\u0001", 1];

// An entry may take a scalar, an array of them, or an object it reads named
// fields off. The object stands in for any field name, so an entry like
// `(v) => \`${v.address}: ${v.reason}\`` samples as its wording rather than
// as "undefined: undefined", which would read as an untranslated entry.
const anyFields = new Proxy({}, { get: (_, key) => (key === Symbol.toPrimitive ? undefined : MARKS[0]) });

function sample(fn) {
  const scalars = Array.from({ length: fn.length }, (_, i) => MARKS[i % MARKS.length]);
  const shapes = [
    scalars,
    scalars.map(() => [MARKS[0], MARKS[2]]),
    scalars.map(() => anyFields),
  ];
  for (const attempt of shapes) {
    try {
      const out = fn(...attempt);
      if (typeof out === "string" && !out.includes("undefined")) return out;
    } catch {
      // try the next shape
    }
  }
  return null;
}

/** The entry's English with placeholders, digits and punctuation taken out. */
function translatableLetters(text) {
  return text
    .replaceAll(/\u0001[a-z]+\u0001/g, " ")
    .replaceAll(/[^A-Za-z]/g, "")
    .trim();
}

function walk(en, th, prefix, hits) {
  for (const [key, ev] of Object.entries(en ?? {})) {
    const tv = th?.[key];
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof ev === "string") {
      if (typeof tv === "string" && tv === ev) hits.push({ path: p, text: ev });
    } else if (typeof ev === "function") {
      if (typeof tv === "function") {
        const a = sample(ev);
        const b = sample(tv);
        if (a !== null && a === b) hits.push({ path: p, text: a });
      }
    } else if (Array.isArray(ev)) {
      ev.forEach((item, i) => {
        if (typeof item === "string") {
          if (tv?.[i] === item) hits.push({ path: `${p}[${i}]`, text: item });
        } else if (item && typeof item === "object") walk(item, tv?.[i], `${p}[${i}]`, hits);
      });
    } else if (ev && typeof ev === "object") {
      walk(ev, tv, p, hits);
    }
  }
}

async function ruleOne() {
  const load = async (name) =>
    (await import(pathToFileURL(path.join(src, "lib/i18n/dictionaries", `${name}.ts`)).href)).default;
  const en = await load("en");
  const th = await load("th");

  const hits = [];
  walk(en, th, "", hits);

  const structural = [];
  const allowed = [];
  const faults = [];
  for (const hit of hits) {
    if (!translatableLetters(hit.text)) structural.push(hit);
    else if (ALLOWED[hit.path]) allowed.push(hit);
    else faults.push(hit);
  }

  const seen = new Set(hits.map((h) => h.path));
  const stale = Object.keys(ALLOWED).filter((p) => !seen.has(p));

  for (const { path: p, text } of faults) {
    console.log(`FAIL ${p} — Thai is the English string: ${JSON.stringify(text)}`);
    console.log(`     translate it, or add it to ALLOWED in this script with the reason`);
  }
  for (const p of stale) {
    console.log(`FAIL ALLOWED["${p}"] is stale — that entry's Thai is no longer its English; drop the line`);
  }

  console.log(
    `\nrule 1: ${hits.length} Thai values identical to their English — ` +
      `${structural.length} hold no translatable words, ${allowed.length} allowed by name, ${faults.length} to translate` +
      (stale.length ? `, ${stale.length} stale allow-list ${stale.length === 1 ? "entry" : "entries"}` : ""),
  );
  return faults.length + stale.length;
}

/* ---------------------------------------------------------------- rule 2 */

function tsxFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFiles(full));
    else if (entry.endsWith(".tsx")) out.push(full);
  }
  return out;
}

// Text a reader sees: a JSX text child, and the handful of attributes that
// carry words rather than values.
const JSX_TEXT = /[>}]([^<>{}\n][^<>{}\n]*)</g;
const ATTRS = /\b(?:placeholder|title|aria-label|aria-description|alt|label|summary)="([^"\n]{2,})"/g;
// Two or more words, each starting with a letter: one token could be an
// identifier, a unit or a CSS value, and flagging those drowns the real copy.
const ENGLISH = /^(?=(?:[^฀-๿])*$)[A-Z(]?[A-Za-z][A-Za-z'’]*(?:[\s,:;.!?()-]+[A-Za-z][A-Za-z'’]*){1,}[\s.!?]*$/;
// A TypeScript generic's `<` closes a JSX_TEXT match just as a tag's does, so
// `: Promise<Metadata>` reads as the words "export async function …". Copy a
// reader sees carries none of this punctuation, and does not end on the name
// of a generic type. Both tests apply to JSX text only: an attribute's value
// is already delimited by its quotes, and "HH:MM" is real copy.
const CODE_PUNCTUATION = /[(){};=]|:\s|=>|\.\w/;
const GENERIC_TAIL =
  /\b(?:Map|Record|Promise|PromiseLike|Set|Array|NonNullable|Partial|Awaited|Readonly|Required|Omit|Pick|Dictionary|Props|Ref)$/;

function englishIn(source) {
  const found = new Set();
  for (const [re, isJsxText] of [
    [JSX_TEXT, true],
    [ATTRS, false],
  ]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source))) {
      const text = m[1].trim();
      if (text.length < 4 || text.length > 160) continue;
      if (/^[A-Z][A-Z_]+$/.test(text)) continue; // a constant, not copy
      if (/https?:|[/\\]{1,2}[a-z]|@|\$\{/.test(text)) continue; // URL, path, template
      if (isJsxText && (CODE_PUNCTUATION.test(text) || GENERIC_TAIL.test(text))) continue;
      if (ENGLISH.test(text)) found.add(text);
    }
  }
  return [...found];
}

function ruleTwo() {
  const files = tsxFiles(src).filter((f) => !f.includes(`${path.sep}i18n${path.sep}`));
  const byArea = new Map();
  let total = 0;
  const rows = [];

  for (const file of files) {
    const hits = englishIn(readFileSync(file, "utf8"));
    if (!hits.length) continue;
    const rel = path.relative(root, file).replaceAll("\\", "/");
    const area = rel.split("/").slice(0, 3).join("/");
    byArea.set(area, (byArea.get(area) ?? 0) + hits.length);
    total += hits.length;
    rows.push({ rel, hits });
  }

  console.log(
    `\nrule 2 (reports only): ${total} pieces of English text written into ` +
      `${rows.length} of ${files.length} .tsx files instead of the dictionary`,
  );
  if (!total) return 0;

  if (showAll) {
    for (const { rel, hits } of rows.sort((a, b) => b.hits.length - a.hits.length)) {
      console.log(`  ${rel} (${hits.length})`);
      for (const h of hits) console.log(`      ${JSON.stringify(h)}`);
    }
  } else {
    const areas = [...byArea].sort((a, b) => b[1] - a[1]);
    for (const [area, n] of areas.slice(0, 15)) console.log(`  ${String(n).padStart(4)}  ${area}`);
    if (areas.length > 15) console.log(`        … and ${areas.length - 15} more areas`);
    console.log(`  (--list prints every line; the backlog item under ## Architecture owns the fixing)`);
  }
  return total;
}

/* ------------------------------------------------------------------ run */

const faults = await ruleOne();
const reported = ruleTwo();

if (faults) {
  console.log(`\nNOT CLEAN — ${faults} Thai ${faults === 1 ? "entry needs" : "entries need"} attention above`);
} else {
  console.log(`\nevery Thai entry is either translated, wordless or allowed by name`);
}
await exitWith(faults || (RULE_2_BLOCKS && reported) ? 1 : 0);
