#!/usr/bin/env node
// Generates the acceptance matrix — the checklist the shelter signs to say the
// system does what they need — from what already exists, so it stays true as
// features land instead of rotting as a typed list would.
//
//   node scripts/acceptance-matrix.mjs                 # the whole document, to stdout
//   node scripts/acceptance-matrix.mjs --out <file>    # ...or to a file (see below)
//   node scripts/acceptance-matrix.mjs --role vet      # one tester's sheet only
//   node scripts/acceptance-matrix.mjs --check         # validate; write nothing
//
// Three sources, only the first mechanical:
//   1. The manual (src/lib/manual/en.ts) says WHICH activities exist and WHICH
//      roles do them, read through isForRole like the manual page itself.
//   2. scripts/lib/acceptance-matrix-entries.mjs says what a tester is told to do
//      and see: the words, and the device each activity is really done on
//      (field work on a phone, setup and reporting on a desktop — the
//      2026-09-24 "Admin on mobile" decision for the admin and management pages).
//   3. docs/role-walkthrough.md supplies the "must NOT be able to" lines. They
//      are prose, so each bullet needs a plain-words boundary entry; one that
//      has none, or has been reworded, stops this script, so none is dropped.
//
// IT FAILS LOUDLY, and that is the point: a manual topic with no matrix entry,
// a walkthrough "must not" line with no boundary, an entry or boundary that no
// longer points at anything. Every message says exactly what to add and where.
// So a PR that adds a manual topic has to add its matrix row — `npm run lint`
// runs `--check`, so CI says so before merge.
//
// The generated document is NOT committed. A committed copy goes stale silently
// unless CI regenerates and diffs it, and with three streams adding manual topics
// that would be a conflict on one generated file in every PR. What is committed
// is the *signed edition*: copy the output to docs/uat/acceptance-<date>.md and
// fill it in (see docs/decisions/2026-10-02-acceptance-matrix.md). A signed
// edition is never edited; a later change to a signed activity starts a new one.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const load = (p) => import(pathToFileURL(path.join(repo, p)).href);

const ENTRIES_FILE = "scripts/lib/acceptance-matrix-entries.mjs";
const WALKTHROUGH = "docs/role-walkthrough.md";

/** The columns, in the order the shelter reads them. The first five are the app's app_role values. */
const ROLES = ["admin", "management", "staff", "vet", "volunteer", "public_viewer", "visitor"];
const SIGNED_IN_FIVE = ROLES.slice(0, 5);
const ROLE_LABEL = {
  admin: "Admin",
  management: "Management",
  staff: "Staff",
  vet: "Vet",
  volunteer: "Volunteer",
  public_viewer: "Public viewer",
  visitor: "Signed-out visitor",
};
/** The pass in docs/role-walkthrough.md that holds each role's "must not" lines. */
const PASS_ROLE = { 1: "vet", 2: "staff", 3: "admin", 4: "management", 5: "volunteer", 6: "public_viewer" };
const DEVICES = ["phone", "desktop", "both"];
const DEVICE_LABEL = { phone: "Phone", desktop: "Desktop", both: "Phone and desktop" };

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? null;
};
if (flag("--help") || flag("-h")) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 33).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
  process.exit(0);
}
const onlyRole = option("--role");
if (onlyRole && !ROLES.includes(onlyRole)) {
  console.error(`acceptance-matrix: --role must be one of ${ROLES.join(", ")}`);
  process.exit(2);
}

const { default: manual } = await load("src/lib/manual/en.ts");
const { isForRole } = await load("src/lib/manual/filter.ts");
const { loadSeed } = await load("scripts/lib/permission-seed.mjs");
const seed = loadSeed(repo);
/** "placement.move" or "resident.record:read" -> the roles that hold it today, or null when the key is unknown. */
const holders = (ref) => {
  const [key, level] = String(ref).split(":");
  return seed.has(key) && (level === undefined || level === "read" || level === "edit") ? seed.rolesHolding(key, level) : null;
};
const { ENTRIES, BOUNDARIES, VISITOR_BOUNDARIES } = await load(ENTRIES_FILE);
const version = JSON.parse(readFileSync(path.join(repo, "package.json"), "utf8")).version;

// ── Problems: collected, then reported together, so one run says everything ──
const problems = [];
const problem = (title, lines) => problems.push([title, ...lines.map((l) => `  ${l}`)].join("\n"));

// ── 1. Walkthrough "must not" bullets ───────────────────────────────────────
const norm = (s) => s.replace(/[*`]/g, "").replace(/\s+/g, " ").trim();

function walkthroughBullets() {
  const out = [];
  let pass = null;
  let inMust = false;
  for (const line of readFileSync(path.join(repo, WALKTHROUGH), "utf8").split(/\r?\n/)) {
    const h2 = line.match(/^## Pass (\d+) — (.+)$/);
    if (h2) {
      pass = Number(h2[1]);
      inMust = pass === 6; // Pass 6 has no "Must not" heading; its whole list is boundary
      if (pass !== 0 && !PASS_ROLE[pass]) {
        problem(`${WALKTHROUGH} has a "Pass ${pass} — ${h2[2]}" this script does not know.`, [
          `Add it to PASS_ROLE in scripts/acceptance-matrix.mjs (and to ROLES, if it is a new role).`,
        ]);
      }
      continue;
    }
    if (/^## /.test(line)) {
      pass = null;
      inMust = false;
      continue;
    }
    if (/^### /.test(line)) {
      inMust = pass === 6 || /^### Must not be able to/.test(line);
      continue;
    }
    if (pass && PASS_ROLE[pass] && inMust && /^- \[ \] /.test(line)) {
      out.push({ role: PASS_ROLE[pass], pass, text: norm(line.slice(6)) });
    }
  }
  return out;
}

const bullets = walkthroughBullets();
const claimed = new Map(); // boundary → bullets it matched
for (const b of bullets) {
  const hits = BOUNDARIES.filter((x) => x.role === b.role && b.text.startsWith(norm(x.starts)));
  if (hits.length === 0) {
    problem(`${WALKTHROUGH}, Pass ${b.pass} (${ROLE_LABEL[b.role]}): a "must not" line has no boundary entry.`, [
      `"${b.text.slice(0, 110)}${b.text.length > 110 ? "…" : ""}"`,
      `Add to BOUNDARIES in ${ENTRIES_FILE}, in plain words for the shelter tester:`,
      `{ role: "${b.role}", starts: ${JSON.stringify(b.text.slice(0, 40))}, text: "…" },`,
      `If the line was only reworded, change the existing entry's \`starts\` to match the new beginning.`,
    ]);
  } else if (hits.length > 1) {
    problem(`${WALKTHROUGH}, Pass ${b.pass}: one "must not" line matches ${hits.length} boundary entries.`, [
      `"${b.text.slice(0, 90)}…"`,
      `Make each \`starts\` in ${ENTRIES_FILE} longer so it matches one line only.`,
    ]);
  }
  for (const h of hits) claimed.set(h, [...(claimed.get(h) ?? []), b]);
}
for (const x of BOUNDARIES) {
  if (!ROLES.includes(x.role) || !x.text || !x.starts) {
    problem(`A boundary entry in ${ENTRIES_FILE} is malformed (needs role, starts, text).`, [JSON.stringify(x).slice(0, 100)]);
  } else if (!claimed.has(x)) {
    problem(`${ENTRIES_FILE}: a boundary no longer matches any "must not" line in ${WALKTHROUGH}.`, [
      `{ role: "${x.role}", starts: ${JSON.stringify(x.starts)} }`,
      `The line was reworded or removed. Update \`starts\` to the line's new beginning, or delete the entry if the check is gone.`,
    ]);
  }
}

// ── 2. Manual topics → activities ───────────────────────────────────────────
const topics = manual.sections.flatMap((s) => s.topics.map((t) => ({ ...t, section: s })));
const topicIds = new Set();
for (const t of topics) {
  if (topicIds.has(t.id)) problem(`The manual has two topics with the id "${t.id}".`, [`The matrix is keyed by topic id, so ids must be unique.`]);
  topicIds.add(t.id);
}

// A topic that names an activity: its `roles` tag (the "Who:" badge, which names the six roles that
// exist today) must be exactly the roles that hold that activity by default, so the words cannot drift
// from the cells. The manual page asks can() for the activity itself.
for (const t of topics) {
  if (!t.activity) continue;
  const held = holders(t.activity);
  if (!held) {
    problem(`The manual topic "${t.id}" names the activity "${t.activity}", which the seeded catalogue does not have.`, []);
    continue;
  }
  const got = held.filter((r) => SIGNED_IN_FIVE.includes(r)).join();
  const want = SIGNED_IN_FIVE.filter((r) => (t.roles ?? SIGNED_IN_FIVE).includes(r)).join();
  if (got !== want) {
    problem(`The manual topic "${t.id}" has roles [${want}] but ${t.activity} is held by [${got}].`, [
      "Either the `roles` tag or the activity is wrong: the cell is what the system does, so fix the tag unless the cell itself is to change.",
    ]);
  }
}

for (const t of topics) {
  if (!ENTRIES[t.id]?.length) {
    const roles = t.roles ? `roles: ${t.roles.join(", ")}` : "for everyone who signs in";
    problem(`The manual topic "${t.title}" (${t.section.id}/${t.id}, ${roles}) has no matrix entry.`, [
      `The matrix is what the shelter signs, so every thing a person can do needs a row. Add to ENTRIES in ${ENTRIES_FILE}:`,
      `${JSON.stringify(t.id)}: [`,
      `  { activity: "…", device: "phone" | "desktop" | "both", do: "one line a shelter worker can follow", expect: "what they should see" },`,
      `],`,
      `One entry per distinct thing done on that topic (a topic that covers three jobs is three rows). Fields are explained at the top of that file.`,
    ]);
  }
}
for (const id of Object.keys(ENTRIES)) {
  if (!topicIds.has(id)) {
    problem(`${ENTRIES_FILE} has an entry for "${id}", which is not a manual topic.`, [
      `The topic was renamed or removed. Rename the key to the topic's new id, or delete the entry.`,
    ]);
  }
}

// ── Build the rows ──────────────────────────────────────────────────────────
/** @typedef {"does"|"must not"|"n/a"} Cell */
const rows = [];
const usedKeys = new Set();
for (const t of topics) {
  const entries = ENTRIES[t.id] ?? [];
  entries.forEach((e, i) => {
    const where = `${ENTRIES_FILE}: ${t.id} #${i + 1}`;
    for (const f of ["activity", "do", "expect"]) {
      if (typeof e[f] !== "string" || !e[f].trim()) problem(`${where} has no \`${f}\`.`, [`Every row needs an activity name, a "do" line and an "expect" line.`]);
    }
    if (!DEVICES.includes(e.device)) problem(`${where} ("${e.activity}") has device ${JSON.stringify(e.device)}.`, [`Use "phone", "desktop" or "both".`]);
    if (e.roles && t.roles) {
      const extra = e.roles.filter((r) => !t.roles.includes(r));
      if (extra.length) {
        problem(`${where} ("${e.activity}") gives the activity to ${extra.join(", ")}, which the manual topic is not for.`, [
          `\`roles\` can only narrow the manual's roles (${t.roles.join(", ")}). To widen it, fix the topic's roles in the manual first.`,
        ]);
      }
    }
    // `needs`: the activity the row exercises. The does / must-not cells then come from who holds it,
    // not from a list of roles; where the entry or topic also lists roles, they must say the same thing.
    const needed = e.needs ? holders(e.needs) : null;
    if (e.needs && !needed) {
      problem(`${where} ("${e.activity}") needs "${e.needs}", which the seeded catalogue does not have.`, ['Use a key from src/lib/permissions/catalogue.ts, with ":read" for a read level.']);
    }
    if (needed) {
      const want = SIGNED_IN_FIVE.filter((r) => (e.roles ?? t.roles ?? SIGNED_IN_FIVE).includes(r)).join();
      const got = needed.filter((r) => SIGNED_IN_FIVE.includes(r)).join();
      if (want !== got) problem(`${where} ("${e.activity}") needs ${e.needs}, held by [${got}], but its roles are [${want}].`, ["Fix whichever is wrong; the cell is what the system does."]);
    }
    const key = i === 0 ? t.id : `${t.id}.${i + 1}`;
    if (usedKeys.has(key)) problem(`Duplicate matrix key ${key}.`, []);
    usedKeys.add(key);

    /** @type {Record<string, Cell>} */
    const cells = {};
    for (const role of ROLES) {
      let does;
      if (e.who) does = e.who.includes(role);
      else if (e.audience === "all") does = true;
      else if (e.audience === "signedin") does = role !== "visitor";
      else if (SIGNED_IN_FIVE.includes(role)) does = needed ? needed.includes(role) : isForRole(e.roles ?? t.roles, role);
      else does = false;
      cells[role] = does ? "does" : e.na?.includes(role) || e.naRest ? "n/a" : "must not";
    }
    rows.push({ key, topic: t, ...e, cells });
  });
}
rows.forEach((r, i) => (r.n = `R${String(i + 1).padStart(3, "0")}`));

if (problems.length) {
  console.error(`acceptance-matrix: ${problems.length} problem${problems.length === 1 ? "" : "s"} — the matrix cannot be generated.\n`);
  console.error(problems.join("\n\n"));
  console.error(`\nThe matrix is the checklist the shelter signs; it is checked on every PR so it cannot drift from the manual. See docs/decisions/2026-10-02-acceptance-matrix.md.`);
  process.exit(1);
}

const count = (role, cell) => rows.filter((r) => r.cells[role] === cell).length;
const summary = `${topics.length} manual topics → ${rows.length} activities, ${bullets.length} walkthrough lines + ${VISITOR_BOUNDARIES.length} visitor lines`;
if (flag("--check")) {
  console.log(`acceptance-matrix: ok — ${summary}`);
  process.exit(0);
}

// ── Output ──────────────────────────────────────────────────────────────────
const cellText = { does: "does", "must not": "must not", "n/a": "–" };
const box = "[ ]";
const out = [];
const line = (s = "") => out.push(s);

function cases(r) {
  // Four boxes, one per language and device, blank where the activity is not done on that device.
  const dev = (d) => (r.device === "both" || r.device === d ? box : "–");
  return [dev("phone"), dev("desktop"), dev("phone"), dev("desktop")];
}

function sectionRole(role) {
  const mine = rows.filter((r) => r.cells[role] === "does");
  line(`## ${ROLE_LABEL[role]} — tester's sheet`);
  line();
  line(`Tester: ____________________  Account used: ____________________  Date(s): ____________________`);
  line();
  if (role === "visitor") line(`The signed-out visitor has no account: test these in a private browser window, not signed in.`);
  if (role === "public_viewer") line(`The public viewer signs in but sees only the public website: test these signed in as that account.`);
  if (mine.length) {
    line(`### What this role does`);
    line();
    line(`Try each once on every device it lists, in **English (EN)** and again in **Thai (ไทย)**. Write **P** (pass) or **F** (fail) in the box; say what you saw in Notes — especially any English left in Thai mode, or Thai text that is cut off or overlaps.`);
    line();
    line(`| # | Activity | What to do | You should see | EN phone | EN desktop | ไทย phone | ไทย desktop | Notes |`);
    line(`|---|---|---|---|---|---|---|---|---|`);
    for (const r of mine) {
      const extra = r.notes?.[role] ? ` **For this role:** ${r.notes[role]}` : "";
      line(`| ${r.n} | ${r.activity} | ${r.do} | ${r.expect}${extra} | ${cases(r).join(" | ")} | |`);
    }
    line();
  }
  const refused = SIGNED_IN_FIVE.includes(role) ? rows.filter((r) => r.cells[role] === "must not") : [];
  if (refused.length) {
    line(`### What this role must NOT be able to do`);
    line();
    line(`For each, look for it in the menu or on the page (it should not be offered), then try to reach it by typing its address or following an old link (it should be refused, with a page saying you do not have access — not a blank page, an error, or the public home page). Write **P** if it is properly out of reach, **F** if you could do it.`);
    line();
    line(`| # | Activity | Not offered | Refused if reached | Notes |`);
    line(`|---|---|---|---|---|`);
    for (const r of refused) line(`| ${r.n} | ${r.activity} | ${box} | ${box} | |`);
    line();
  }
  const bounds = [...BOUNDARIES, ...VISITOR_BOUNDARIES].filter((b) => b.role === role);
  if (bounds.length) {
    line(`### Boundaries to try`);
    line();
    line(`| # | Try this | Result | Notes |`);
    line(`|---|---|---|---|`);
    bounds.forEach((b, i) => line(`| B${i + 1} | ${b.text} | ${box} | |`));
    line();
  }
  line(`**Tester's signature:** ____________________  **Date:** ____________________`);
  line();
  line(`I tried every line above myself, in the role named, and wrote down what I saw.`);
  line();
}

const roleList = onlyRole ? [onlyRole] : ROLES;
line(`# Acceptance checklist — Lanna Care for Animals`);
line();
line(`> **Generated** by \`node scripts/acceptance-matrix.mjs\` from the user manual, the role walkthrough and the Admin-on-mobile decision (${summary}). Do not edit a generated copy to change what is tested; change the manual, \`${ENTRIES_FILE}\` or the walkthrough, and generate again. A **signed** edition is kept as \`docs/uat/acceptance-<date>.md\` and is never edited afterwards: any later change to a signed activity starts a new edition.`);
line();
line(`## Cover`);
line();
line(`| | |`);
line(`|---|---|`);
line(`| Edition | acceptance-____-__-__ |`);
line(`| System version (from Release notes) | ____________________ (this checklist was generated from ${version}) |`);
line(`| Site tested on | ____________________ |`);
line(`| Data | disposable test data only — nothing recorded here is a real animal or person |`);
line(`| First test date / last test date | ____________________ / ____________________ |`);
line(`| Director | ____________________ |`);
line();
line(`## How to read this`);
line();
line(`Every activity the manual describes is a row, and every role is a column. **does** means that role is meant to do it; **must not** means the role must be refused; **–** means it does not apply to that role.`);
line();
line(`- **Language.** Every activity is tried in English and in Thai, so text left untranslated and Thai that does not fit are found.`);
line(`- **Device.** Each activity is tried where it is really done: a **phone** for field work, a **desktop** for setup and reporting, both where the work is done either way. A dash in a box means the activity is not done on that device.`);
line(`- **Who tests.** Each role's sheet is tried by a person who really does that job, signed in as that role.`);
line(`- **A failure** is written in the Failures list at the end with what was done about it. It is either fixed and tried again, or accepted by the Director and written down as such.`);
line();
line(`## The matrix`);
line();
line(`| # | Activity | Device | ${ROLES.map((r) => ROLE_LABEL[r]).join(" | ")} |`);
line(`|---|---|---|${ROLES.map(() => "---").join("|")}|`);
let section = null;
for (const r of rows) {
  if (r.topic.section.id !== section) {
    section = r.topic.section.id;
    line(`| | **${r.topic.section.title}** | | ${ROLES.map(() => "").join(" | ")} |`);
  }
  line(`| ${r.n} | ${r.activity} | ${DEVICE_LABEL[r.device]} | ${ROLES.map((role) => cellText[r.cells[role]]).join(" | ")} |`);
}
line();
line(`Rows each role does: ${ROLES.map((r) => `${ROLE_LABEL[r]} ${count(r, "does")}`).join(" · ")}.`);
line();

for (const role of roleList) {
  line(`---`);
  line();
  sectionRole(role);
}

if (!onlyRole) {
  line(`---`);
  line();
  line(`## Failures and how each was resolved`);
  line();
  line(`| # | Row or boundary | Role | Language / device | What went wrong | Resolved or accepted | By whom, when |`);
  line(`|---|---|---|---|---|---|---|`);
  line(`| | | | | | | |`);
  line();
  line(`**Resolved** = fixed and tried again, with the date. **Accepted** = the shelter agrees to go live with it, and the Director has initialled it.`);
  line();
  line(`## Sign-off`);
  line();
  line(`| Role | Tested by | Date | Signature |`);
  line(`|---|---|---|---|`);
  for (const role of ROLES) line(`| ${ROLE_LABEL[role]} | | | |`);
  line();
  line(`**Director:** I have read the failures list. The system does what the shelter needs, apart from the accepted issues written above.`);
  line();
  line(`Name: ____________________  Signature: ____________________  Date: ____________________`);
  line();
}

const text = out.join("\n");
const dest = option("--out");
if (dest) {
  writeFileSync(path.resolve(process.cwd(), dest), text, "utf8");
  console.error(`acceptance-matrix: wrote ${dest} — ${summary}`);
} else {
  console.log(text);
}
