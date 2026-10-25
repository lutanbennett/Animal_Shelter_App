// Hard-coded security is forbidden (Lutan, 2026-10-24): a role is exactly the set of cards it holds, and nothing keyed by role may
// change what a card does or whether it shows. This check ASSERTS ZERO. There are no baselines and no counts of rules.
//
//   node scripts/check-hard-coded-security.mjs
//
// When it holds it prints one line:   no coded security outside the Admin bypass
// When something decides access outside a card it says NOT CLEAN and lists each rule first, in plain words.
//
// What it looks at (docs/decisions/2026-10-25-no-coded-security-inventory.md is the full inventory behind these):
//   1. The Admin bypass is intact (src/lib/permissions/can.ts answers isAdmin before it reads a cell). The ONE declared exception.
//   2. Source (src/, worker/): any read of a role by its key or by a retired role column, any read of the roles table, any new
//      service-role call site, any new environment variable. Each hit must match a record in the registry that says what it is
//      (stillDecidesAccess / notAccess / serviceRoleSites / environment). An unrecorded hit FAILS. A record that no longer
//      matches anything FAILS too, so a fixed rule cannot linger as a record.
//   3. Migrations after DB_SCANNED_FROM: every new policy resolves through has_permission() or is_admin(); no new function or
//      policy reads a role column; every new security definer function states its gate; nothing new is granted to anon/public.
//
// stillDecidesAccess is not a baseline: it is a list of NAMED rules (file + exact text) that exist today, each with a backlog item.
// While it is non-empty the output says NOT CLEAN and the one clean line is never printed. It only shrinks: an entry whose text is gone
// must be deleted (the check fails until it is).
//
// WHAT IT CANNOT SEE (say so rather than imply otherwise):
//   - The LIVE database. It reads migration files, not pg_policies; a policy changed by hand in the SQL editor is invisible. Use
//     `node scripts/check-production.mjs` for live reads (cards-union, role-cards-coverage).
//   - A role-keyed rule written in a shape the patterns below do not match (a role key built from pieces, held in a variable, or
//     compared through a lookup table). The patterns are broad on purpose but they are patterns.
//   - Whether each service-role call site is properly guarded; it only insists that each is named.
//   - Data: a row in a table that code treats as a switch. The `roles` and `features` tables are checked by name only.
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const root = process.cwd();
const registry = JSON.parse(readFileSync(join(root, "docs/hard-coded-security-registry.json"), "utf8"));
const rel = (p) => relative(root, p).split(sep).join("/");
const NL = String.fromCharCode(10);

// ---------------------------------------------------------------- reading files
const walk = (dir, test, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, test, out);
    else if (test(name)) out.push(p);
  }
  return out;
};
const sourceFiles = [...walk(join(root, "src"), (n) => /\.tsx?$/.test(n) && !/\.test\./.test(n)), ...walk(join(root, "worker"), (n) => /\.mjs$/.test(n) && !/\.test\./.test(n))];

// Blank comments, keeping every newline so line numbers stay honest. Strings and template literals are skipped over so a "//" inside
// one is not mistaken for a comment.
const keepNewlines = (s) => s.split(NL).map(() => "").join(NL);
function stripComments(src) {
  let out = "";
  for (let i = 0; i < src.length; ) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { while (i < src.length && src[i] !== NL) i++; }
    else if (c === "/" && d === "*") {
      const end = src.indexOf("*/", i + 2);
      const stop = end < 0 ? src.length : end + 2;
      out += keepNewlines(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c && !(c !== "`" && src[j] === NL)) j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1);
      i = j + 1;
    } else { out += c; i++; }
  }
  return out;
}

// Blank a registry-listed diagnostic: from its `function <name>` to the first closing brace in column 0.
function blankFunction(src, name) {
  const at = src.search(new RegExp("function[ ]+" + name + "[(<]"));
  if (at < 0) return null;
  const close = src.indexOf(NL + "}", at);
  const end = close < 0 ? src.length : close + 2;
  return src.slice(0, at) + keepNewlines(src.slice(at, end)) + src.slice(end);
}

const text = new Map(sourceFiles.filter((f) => !rel(f).startsWith("src/lib/i18n/dictionaries/")).map((f) => [rel(f), stripComments(readFileSync(f, "utf8"))]));

let failed = 0;
const problems = [];
const fail = (m) => { failed++; problems.push(m); };

for (const d of registry.diagnostics ?? []) {
  const blanked = text.has(d.file) ? blankFunction(text.get(d.file), d.function) : null;
  if (blanked === null) fail(`diagnostic ${d.id}: ${d.function} not found in ${d.file}. It moved or was renamed; its exemption must follow it, or go.`);
  else text.set(d.file, blanked);
}

// ---------------------------------------------------------------- 1. the Admin bypass
const ADMIN = registry.outsideTheCardSystem;
let adminOk = false;
{
  const can = text.get("src/lib/permissions/can.ts") ?? "";
  const bypass = can.indexOf("if (perms.isAdmin) return true;");
  const firstCell = can.indexOf("perms.cells[activity]");
  adminOk = bypass >= 0 && firstCell >= 0 && bypass < firstCell;
  if (!adminOk) fail("the Admin bypass is not intact: src/lib/permissions/can.ts must answer `if (perms.isAdmin) return true;` before it reads any cell. Admin is the declared exception (Lutan, 2026-10-25); do not reimplement it as 'Admin holds every card'.");
  if (!ADMIN || ADMIN.counted !== false) fail("registry.outsideTheCardSystem must stay, with counted: false. Admin is not debt and is never counted.");
}

// ---------------------------------------------------------------- 2. source scan
const ROLE_KEYS = "admin|management|volunteer|doctor|public_viewer|second_in_command|head_of_medical|head_of_maintenance|staff";
const RULES = [
  {
    id: "role-key",
    what: "a role is read by its key",
    re: new RegExp(
      [
        String.raw`\b[A-Za-z_.]*(?:role|Role|key)\w*\s*[!=]==?\s*["'\`](?:${ROLE_KEYS})["'\`]`, // role.key === "management"
        String.raw`\.roles\??\.(?:includes|some|indexOf|find)\(`, // perms.roles.includes(...)
        String.raw`\.includes\(\s*["'](?:${ROLE_KEYS})["']\s*\)`, // [...].includes("doctor")
        String.raw`\.(?:eq|neq|in)\(\s*["']roles?\.key["']`, // .eq("roles.key", ...)
        String.raw`\.not\(\s*["']role_key["']`, // .not("role_key", "in", ...)
        String.raw`\b(?:NEVER_ASSIGNABLE|ASSIGNABLE_KEY_FILTER|PUBLIC_VIEWER_ROLE)\b`,
      ].join("|"),
    ),
  },
  {
    id: "role-column",
    what: "a role column is read (retired columns must be read by nothing)",
    re: /\b(?:opens_app|scope_residents|scope_clinical|scope_contacts|scope_photos|sees_login_emails|role_extras|roleExtras)\b/,
  },
  { id: "role-setting", what: "a role setting is read", re: /\b(?:show_menu|home_path|homePath)\b/ },
  { id: "roles-table", what: "the roles table is read", re: /\.from\(\s*["']roles["']\s*\)/ },
];

const hits = []; // { rule, file, line, code }
for (const [file, src] of text) {
  const lines = src.split(NL);
  for (const r of RULES) lines.forEach((code, i) => { if (r.re.test(code)) hits.push({ rule: r.id, file, line: i + 1, code: code.trim() }); });
}

// every hit must be accounted for by exactly one kind of record
const sees = (e, code) => (e.matches ?? [e.match]).some((m) => code.includes(m));
const stillDecides = registry.stillDecidesAccess ?? [];
const notAccess = registry.notAccess ?? [];
const unrecorded = [];
const usedStill = new Set(), usedNot = new Set();
for (const h of hits) {
  const s = stillDecides.findIndex((e) => e.file === h.file && sees(e, h.code));
  const n = notAccess.findIndex((e) => e.file === h.file && sees(e, h.code));
  if (s >= 0) usedStill.add(s);
  else if (n >= 0) usedNot.add(n);
  else unrecorded.push(h);
}
for (const h of unrecorded) {
  fail(`${h.file}:${h.line} ${RULES.find((r) => r.id === h.rule).what}: \`${h.code.slice(0, 110)}\`. ` +
    `If it decides what a login can see or do it must be a card, not this. If it does not, record it under notAccess in docs/hard-coded-security-registry.json and say why.`);
}
stillDecides.forEach((e, i) => { if (!usedStill.has(i)) fail(`stillDecidesAccess "${e.id}": its text is gone from ${e.file}. The rule is fixed: delete the record.`); });
notAccess.forEach((e, i) => { if (!usedNot.has(i)) fail(`notAccess record "${(e.matches ?? [e.match])[0]}" in ${e.file} matches nothing now. Delete it.`); });

// service-role call sites (they bypass RLS, so each is named)
const serviceFiles = [...text].filter(([, src]) => /createAdminClient\(|SUPABASE_SERVICE_ROLE_KEY/.test(src)).map(([f]) => f).sort();
const declaredService = new Map((registry.serviceRoleSites ?? []).map((e) => [e.file, e]));
for (const f of serviceFiles) if (!declaredService.has(f) && !(registry.serviceRoleHelpers ?? []).includes(f)) fail(`${f} uses the service role (it bypasses every policy) and is not named under serviceRoleSites in the registry. Add it with what it is for and what guards it.`);
for (const f of declaredService.keys()) if (!serviceFiles.includes(f)) fail(`serviceRoleSites names ${f}, which no longer uses the service role. Delete the record.`);

// environment variables read by the app
const envSeen = new Set();
for (const [, src] of text) for (const m of src.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) envSeen.add(m[1]);
const declaredEnv = new Set((registry.environment ?? []).map((e) => e.name));
for (const n of envSeen) if (!declaredEnv.has(n)) fail(`process.env.${n} is read by the app and is not named under environment in the registry. Say what it gates (it must not gate what a role may do).`);
for (const n of declaredEnv) if (!envSeen.has(n)) fail(`environment names ${n}, which nothing reads now. Delete the record.`);

// ---------------------------------------------------------------- 3. migrations
const migDir = join(root, "supabase/migrations");
const FROM = registry.database?.scannedFrom ?? 262;
const declaredDb = new Map((registry.database?.declared ?? []).map((e) => [`${e.migration}|${e.item}`, e]));
const usedDb = new Set();
const migFiles = existsSync(migDir) ? readdirSync(migDir).filter((n) => /^\d{4}_.*\.sql$/.test(n) && Number(n.slice(0, 4)) >= FROM).sort() : [];
const declare = (mig, item, msg) => { const k = `${mig}|${item}`; if (declaredDb.has(k)) usedDb.add(k); else fail(`${mig}: ${msg} (declare it under database.declared as "${item}" with a reason, or make it a card)`); };
for (const mig of migFiles) {
  const sql = readFileSync(join(migDir, mig), "utf8").split(NL).map((l) => l.replace(/--.*$/, "")).join(NL);
  for (const m of sql.matchAll(/create\s+policy\s+("[^"]+"|\w+)\s+on\s+([\w."]+)([\s\S]*?);/gi)) {
    const body = m[3];
    if (!/has_permission\s*\(|is_admin\s*\(/i.test(body)) declare(mig, `policy ${m[2]}.${m[1].replace(/"/g, "")}`, `policy ${m[1]} on ${m[2]} does not resolve through has_permission() or is_admin()`);
  }
  for (const m of sql.matchAll(/\b(opens_app|scope_residents|scope_clinical|scope_contacts|scope_photos|sees_login_emails|role_extras)\b/gi)) {
    const around = sql.slice(Math.max(0, m.index - 80), m.index + 40);
    if (!/drop\s+(column|table|constraint)|alter\s+table[\s\S]*drop/i.test(around)) declare(mig, `column ${m[1].toLowerCase()}`, `reads or writes the retired role column ${m[1]}`);
  }
  const fnParts = sql.split(/create\s+(?:or\s+replace\s+)?function\s+/i).slice(1);
  for (const part of fnParts) {
    const name = (part.match(/^([\w."]+)/) ?? [, "?"])[1];
    const definer = /security\s+definer/i.test(part.slice(0, 1500));
    const trigger = /returns\s+trigger/i.test(part.slice(0, 600));
    const body = part.slice(0, part.search(/\n\s*create\s/i) > 0 ? part.search(/\n\s*create\s/i) : part.length);
    if (/\b(?:\w+\.)?roles\b[\s\S]{0,120}\.(?:key|kind|show_menu|home_path)\b|\br\.key\b/i.test(body) && !/is_admin|has_permission/i.test(name)) declare(mig, `function ${name} reads a role`, `function ${name} reads a role by key/kind`);
    if (definer && !trigger && !/has_permission\s*\(|is_admin\s*\(|role_can\s*\(/i.test(body)) declare(mig, `function ${name} definer`, `security definer function ${name} does not call has_permission(), is_admin() or role_can()`);
  }
  for (const m of sql.matchAll(/grant\s+[\w\s,]+\s+on\s+[\s\S]*?\s+to\s+(anon|public)\b/gi)) declare(mig, `grant to ${m[1].toLowerCase()}`, `grants to ${m[1]}, which needs no login at all`);
}
for (const k of declaredDb.keys()) if (!usedDb.has(k)) fail(`database.declared "${k}" matches nothing now. Delete the record.`);

// ---------------------------------------------------------------- counters (informational)
const DIAG_COUNTERS = registry.counters ?? [];
const counted = DIAG_COUNTERS.map((c) => {
  const re = new RegExp(c.pattern);
  const scope = c.files ?? [...text.keys()];
  let n = 0;
  for (const f of scope) for (const line of (text.get(f) ?? "").split(NL)) if (re.test(line)) n++;
  return { id: c.id, n, what: c.what };
});

// ---------------------------------------------------------------- report
const open = [...new Map(stillDecides.map((e) => [e.id, e])).values()];
if (open.length) {
  console.log(`NOT CLEAN: ${open.length} rule${open.length === 1 ? "" : "s"} still decide${open.length === 1 ? "s" : ""} access outside a card.`);
  for (const e of open) console.log(`  - ${e.plain}
    (${e.file}, backlog: ${e.backlog})`);
  console.log("");
}
console.log("Admin bypass (the one declared exception, kept on purpose):");
console.log(`  ${adminOk ? "ok  " : "FAIL"} can.ts answers isAdmin before it reads any cell. Admin holds no cards and is never given any.`);
console.log("");
console.log("Where the scan looked:");
console.log(`  source files read: ${text.size}; role reads recorded as not access: ${notAccess.length}; named service-role sites: ${serviceFiles.length}; environment variables: ${envSeen.size}`);
console.log(`  migrations from ${String(FROM).padStart(4, "0")} on: ${migFiles.length === 0 ? "none yet" : migFiles.join(", ")}`);
console.log("");
console.log("Counts of card-derived code (callers and pages, NOT rules and NOT security; a rise or fall means nothing here):");
for (const c of counted) console.log(`  ${c.id}: ${c.n}   ${c.what}`);
console.log("");
if (problems.length) {
  console.log("FAILED:");
  for (const p of problems) console.log(`  FAIL ${p}`);
  console.log(`\n${failed} failed. See CLAUDE.md, "Hard-coded security is forbidden": make it a card; do not patch around it and do not add another.`);
  process.exit(1);
}
if (open.length) {
  console.log("Result: ok (nothing NEW), but NOT CLEAN. Each rule above is named, owned by a backlog item, and may only be removed.");
  process.exit(0);
}
console.log("no coded security outside the Admin bypass");
process.exit(0);
