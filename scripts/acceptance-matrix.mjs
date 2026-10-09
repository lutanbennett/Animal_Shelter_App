#!/usr/bin/env node
// Generates the acceptance matrix — the checklist the shelter signs to say the
// system does what they need — from what already exists, so it stays true as
// features land instead of rotting as a typed list would.
//
//   node scripts/acceptance-matrix.mjs                 # the whole document, to stdout
//   node scripts/acceptance-matrix.mjs --out <file>    # ...or to a file (see below)
//   node scripts/acceptance-matrix.mjs --role doctor   # one tester's sheet only
//   node scripts/acceptance-matrix.mjs --check         # validate; write nothing
//   node scripts/acceptance-matrix.mjs --pdf <file>    # the printable A4 sign-off edition (with --role too)
//   node scripts/acceptance-matrix.mjs --json <file>   # the document as data, for checks
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
const ROLES = ["admin", "management", "staff", "doctor", "volunteer", "public_viewer", "visitor"];
const SIGNED_IN_FIVE = ROLES.slice(0, 5);
const ROLE_LABEL = {
  admin: "Admin",
  management: "Management",
  staff: "Staff",
  doctor: "Doctor",
  volunteer: "Volunteer",
  public_viewer: "Public viewer",
  visitor: "Signed-out visitor",
};
/** The pass in docs/role-walkthrough.md that holds each role's "must not" lines. */
const PASS_ROLE = { 1: "doctor", 2: "staff", 3: "admin", 4: "management", 5: "volunteer", 6: "public_viewer" };
const DEVICES = ["phone", "desktop", "both"];
const DEVICE_LABEL = { phone: "Phone", desktop: "Desktop", both: "Phone and desktop" };

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? null : args[i + 1] ?? null;
};
if (flag("--help") || flag("-h")) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 35).map((l) => l.replace(/^\/\/ ?/, "")).join("\n"));
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
  const held = holders(t.activityLevel === "read" ? `${t.activity}:read` : t.activity);
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

// ── The document, as data ───────────────────────────────────────────────────
// Both editions are drawn from this one object, words included: the Markdown
// below and the printable A4 PDF (--pdf, scripts/lib/acceptance-matrix-pdf.mjs).
// So the PDF cannot test anything the Markdown does not, and a role added,
// removed or renamed in ROLES / ROLE_LABEL reaches both with neither renderer
// changing — the PDF lays out whatever roles it is given and names none itself.
// Prose may carry **bold** and `code`; each renderer turns those into its own.

/** Said at the top of a role's sheet, for the roles tested in an unusual way. */
const ROLE_NOTE = {
  visitor: `The signed-out visitor has no account: test these in a private browser window, not signed in.`,
  public_viewer: `The public viewer signs in but sees only the public website: test these signed in as that account.`,
};
const CELL_TEXT = { does: "does", "must not": "must not", "n/a": "–" };
const BLANK = "____________________";

const roleList = onlyRole ? [onlyRole] : ROLES;
const doc = {
  title: `Acceptance checklist — Lanna Care for Animals`,
  version,
  summary,
  generated: `**Generated** by \`node scripts/acceptance-matrix.mjs\` from the user manual, the role walkthrough and the Admin-on-mobile decision (${summary}). Do not edit a generated copy to change what is tested; change the manual, \`${ENTRIES_FILE}\` or the walkthrough, and generate again. A **signed** edition is kept as \`docs/uat/acceptance-<date>.md\` and is never edited afterwards: any later change to a signed activity starts a new edition.`,
  blank: BLANK,
  cover: [
    ["Edition", "acceptance-____-__-__"],
    ["System version (from Release notes)", `${BLANK} (this checklist was generated from ${version})`],
    ["Site tested on", BLANK],
    ["Data", "disposable test data only — nothing recorded here is a real animal or person"],
    ["First test date / last test date", `${BLANK} / ${BLANK}`],
    ["Director", BLANK],
  ],
  howToRead: {
    intro: `Every activity the manual describes is a row, and every role is a column. **does** means that role is meant to do it; **must not** means the role must be refused; **–** means it does not apply to that role.`,
    points: [
      `**Language.** Every activity is tried in English and in Thai, so text left untranslated and Thai that does not fit are found.`,
      `**Device.** Each activity is tried where it is really done: a **phone** for field work, a **desktop** for setup and reporting, both where the work is done either way. A dash in a box means the activity is not done on that device.`,
      `**Who tests.** Each role's sheet is tried by a person who really does that job, signed in as that role.`,
      `**A failure** is written in the Failures list at the end with what was done about it. It is either fixed and tried again, or accepted by the Director and written down as such.`,
    ],
  },
  /** The matrix's columns, in order. */
  roles: ROLES.map((key) => ({ key, label: ROLE_LABEL[key], does: count(key, "does") })),
  cellText: CELL_TEXT,
  sections: [],
  sheet: {
    testerLine: [`Tester`, `Account used`, `Date(s)`],
    doesHeading: `What this role does`,
    doesIntro: `Try each once on every device it lists, in **English (EN)** and again in **Thai (ไทย)**. Write **P** (pass) or **F** (fail) in the box; say what you saw in Notes — especially any English left in Thai mode, or Thai text that is cut off or overlaps.`,
    caseColumns: ["EN phone", "EN desktop", "ไทย phone", "ไทย desktop"],
    mustNotHeading: `What this role must NOT be able to do`,
    mustNotIntro: `For each, look for it in the menu or on the page (it should not be offered), then try to reach it by typing its address or following an old link (it should be refused, with a page saying you do not have access — not a blank page, an error, or the public home page). Write **P** if it is properly out of reach, **F** if you could do it.`,
    mustNotColumns: ["Not offered", "Refused if reached"],
    boundariesHeading: `Boundaries to try`,
    oath: `I tried every line above myself, in the role named, and wrote down what I saw.`,
  },
  sheets: roleList.map((role) => ({
    key: role,
    label: ROLE_LABEL[role],
    note: ROLE_NOTE[role] ?? null,
    does: rows
      .filter((r) => r.cells[role] === "does")
      .map((r) => ({
        n: r.n,
        activity: r.activity,
        do: r.do,
        expect: r.expect,
        forRole: r.notes?.[role] ?? null,
        // One box per language and device, absent where the activity is not done on that device.
        cases: [r.device !== "desktop", r.device !== "phone", r.device !== "desktop", r.device !== "phone"],
      })),
    mustNot: SIGNED_IN_FIVE.includes(role) ? rows.filter((r) => r.cells[role] === "must not").map((r) => ({ n: r.n, activity: r.activity })) : [],
    boundaries: [...BOUNDARIES, ...VISITOR_BOUNDARIES].filter((b) => b.role === role).map((b, i) => ({ n: `B${i + 1}`, text: b.text })),
  })),
  /** The failures list and the sign-off belong to the whole document, not to one tester's sheet. */
  closing: onlyRole
    ? null
    : {
        failuresHeading: `Failures and how each was resolved`,
        failureColumns: ["#", "Row or boundary", "Role", "Language / device", "What went wrong", "Resolved or accepted", "By whom, when"],
        failuresNote: `**Resolved** = fixed and tried again, with the date. **Accepted** = the shelter agrees to go live with it, and the Director has initialled it.`,
        signOffColumns: ["Role", "Tested by", "Date", "Signature"],
        director: `**Director:** I have read the failures list. The system does what the shelter needs, apart from the accepted issues written above.`,
        directorLine: [`Name`, `Signature`, `Date`],
      },
};
for (const r of rows) {
  if (doc.sections.at(-1)?.id !== r.topic.section.id) doc.sections.push({ id: r.topic.section.id, title: r.topic.section.title, rows: [] });
  doc.sections.at(-1).rows.push({ n: r.n, activity: r.activity, device: DEVICE_LABEL[r.device], cells: ROLES.map((role) => r.cells[role]) });
}

// ── Output: the data, and the PDF ───────────────────────────────────────────
const jsonDest = option("--json");
if (jsonDest) {
  writeFileSync(path.resolve(process.cwd(), jsonDest), JSON.stringify(doc, null, 2), "utf8");
  console.error(`acceptance-matrix: wrote ${jsonDest} — ${summary}`);
  process.exit(0);
}
const pdfDest = option("--pdf");
if (pdfDest) {
  const { renderAcceptancePdf } = await import(pathToFileURL(path.join(here, "lib/acceptance-matrix-pdf.mjs")).href);
  writeFileSync(path.resolve(process.cwd(), pdfDest), await renderAcceptancePdf(doc, repo));
  console.error(`acceptance-matrix: wrote ${pdfDest} — ${summary}`);
  process.exit(0);
}

// ── Output: Markdown ────────────────────────────────────────────────────────
const box = "[ ]";
const out = [];
const line = (s = "") => out.push(s);
const fillIn = (labels) => labels.map((l) => `${l}: ${BLANK}`).join("  ");

function sectionRole(s) {
  const t = doc.sheet;
  line(`## ${s.label} — tester's sheet`);
  line();
  line(fillIn(t.testerLine));
  line();
  if (s.note) line(s.note);
  if (s.does.length) {
    line(`### ${t.doesHeading}`);
    line();
    line(t.doesIntro);
    line();
    line(`| # | Activity | What to do | You should see | ${t.caseColumns.join(" | ")} | Notes |`);
    line(`|---|---|---|---|---|---|---|---|---|`);
    for (const r of s.does) {
      const extra = r.forRole ? ` **For this role:** ${r.forRole}` : "";
      line(`| ${r.n} | ${r.activity} | ${r.do} | ${r.expect}${extra} | ${r.cases.map((c) => (c ? box : "–")).join(" | ")} | |`);
    }
    line();
  }
  if (s.mustNot.length) {
    line(`### ${t.mustNotHeading}`);
    line();
    line(t.mustNotIntro);
    line();
    line(`| # | Activity | ${t.mustNotColumns.join(" | ")} | Notes |`);
    line(`|---|---|---|---|---|`);
    for (const r of s.mustNot) line(`| ${r.n} | ${r.activity} | ${box} | ${box} | |`);
    line();
  }
  if (s.boundaries.length) {
    line(`### ${t.boundariesHeading}`);
    line();
    line(`| # | Try this | Result | Notes |`);
    line(`|---|---|---|---|`);
    for (const b of s.boundaries) line(`| ${b.n} | ${b.text} | ${box} | |`);
    line();
  }
  line(`**Tester's signature:** ${BLANK}  **Date:** ${BLANK}`);
  line();
  line(t.oath);
  line();
}

line(`# ${doc.title}`);
line();
line(`> ${doc.generated}`);
line();
line(`## Cover`);
line();
line(`| | |`);
line(`|---|---|`);
for (const [k, v] of doc.cover) line(`| ${k} | ${v} |`);
line();
line(`## How to read this`);
line();
line(doc.howToRead.intro);
line();
for (const p of doc.howToRead.points) line(`- ${p}`);
line();
line(`## The matrix`);
line();
line(`| # | Activity | Device | ${doc.roles.map((r) => r.label).join(" | ")} |`);
line(`|---|---|---|${doc.roles.map(() => "---").join("|")}|`);
for (const s of doc.sections) {
  line(`| | **${s.title}** | | ${doc.roles.map(() => "").join(" | ")} |`);
  for (const r of s.rows) line(`| ${r.n} | ${r.activity} | ${r.device} | ${r.cells.map((c) => CELL_TEXT[c]).join(" | ")} |`);
}
line();
line(`Rows each role does: ${doc.roles.map((r) => `${r.label} ${r.does}`).join(" · ")}.`);
line();

for (const s of doc.sheets) {
  line(`---`);
  line();
  sectionRole(s);
}

if (doc.closing) {
  const c = doc.closing;
  line(`---`);
  line();
  line(`## ${c.failuresHeading}`);
  line();
  line(`| ${c.failureColumns.join(" | ")} |`);
  line(`|${c.failureColumns.map(() => "---").join("|")}|`);
  line(`|${c.failureColumns.map(() => " ").join("|")}|`);
  line();
  line(c.failuresNote);
  line();
  line(`## Sign-off`);
  line();
  line(`| ${c.signOffColumns.join(" | ")} |`);
  line(`|${c.signOffColumns.map(() => "---").join("|")}|`);
  for (const r of doc.roles) line(`| ${r.label} | | | |`);
  line();
  line(c.director);
  line();
  line(fillIn(c.directorLine));
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
