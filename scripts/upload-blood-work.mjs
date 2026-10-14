// Load lab reports from the Blood Work inbox on Drive into the app: the
// database half of the /upload-blood-work skill.
//
// The skill (.claude/skills/upload-blood-work/SKILL.md) reads each report and
// decides who, when, where and which panels. This script does everything that
// must come out the same every time: it looks things up, checks the decision
// against the database, and writes it. It refuses rather than guesses, and it
// prints JSON so the skill can read the answer.
//
//   node scripts/upload-blood-work.mjs inbox
//       the files waiting in the inbox
//   node scripts/upload-blood-work.mjs lookup --name "Mom" --name "Coffee" --date 2026-09-29
//       residents whose names match, each with the clinic visits on the day
//       and the day before and the blood tests already on that date; plus
//       every clinic and every blood test type
//   node scripts/upload-blood-work.mjs load --plan plan.json --as <email>
//       dry run: checks the plan, runs the whole write inside begin…rollback
//   node scripts/upload-blood-work.mjs load --plan plan.json --as <email> --apply
//       does it (see WHAT LOAD WRITES)
//   node scripts/upload-blood-work.mjs park --file <drive id> [--apply]
//       moves a report the skill could not place into "No match"
//   node scripts/upload-blood-work.mjs create-clinic --name "Siri Pet Hospital" --as <email> [--apply]
//   node scripts/upload-blood-work.mjs create-type --name "SDMA" [--apply]
//
// Add --env production for the live site; without it everything goes to the
// test database, as the other scripts do.
//
// THE PLAN (load --plan):
//   {
//     "file":    { "id": "<drive id in the inbox>", "name": "<file name>" },
//     "resident": "R-0062",
//     "date":     "2026-09-29",               the collection date on the report
//     "visit":    { "id": "<clinic_visits.id>" }
//              or { "create": { "clinic": "<clinics.id>", "at": "2026-09-29T09:17",
//                               "reason": "Blood test" } }     at = shelter time
//     "tests":   [ { "type": "CBC (Complete Blood Count)", "results": "…" }, … ]
//   }
//
// WHAT LOAD WRITES, in one transaction: the clinic visit if the plan creates
// one (status completed), one blood_tests row per panel linked to that visit,
// and one attachments row per blood test, all pointing at the same file.
// created_by and the audit actor are the --as person.
//
// DRIVE. Test and live share one Drive (the BWM account), so only --env
// production touches it: it copies the report into the resident's
// Residents/<Name> (<code>)/Blood Tests/<YYYYMMDD>/ folder — where the app's own
// upload puts it — attaches the copy, and only after the database has committed
// moves the original from the inbox to "Loaded into system". If the database
// refuses, the copy goes to the Drive trash and the original stays in the inbox.
// On test the original is attached where it is and nothing on Drive moves, so a
// trial run leaves the inbox exactly as it was.
//
// WHAT MAKES LOAD REFUSE:
//   - a resident code that does not exist, or a resident recorded as deceased
//     (the database locks their record; a person must decide)
//   - a date that is not a real date or is in the future
//   - a visit for another resident, archived, or not on the date or the day
//     before; creating a visit when one already exists on those days
//     (use it, or pass --new-visit if the user said a second visit is right)
//   - a test type that is not in blood_test_types (create-type, after asking)
//   - a blood test of the same type already on that date for that resident:
//     that is how a report loaded twice is caught
//   - on production, a file that is no longer in the inbox
//
// The database is reached through the Management API as the owner, like
// load-residents.mjs and correct-resident.mjs, so row security does not apply.
// The checks above are what stands in for the app's own.

import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { nearMatchReason, normaliseName } from "./lib/near-names.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";
import { readFileSync } from "node:fs";

// The skill's three Drive folders on the BWM account (2026-10-15).
export const FOLDERS = {
  inbox: "1eV7t2VXJjxqs3wSdvbYz1HO2K8YFwiqL",
  loaded: "1_1F3vebTZ6bp9u9GNvEpbmtD6J0pRzwD",
  noMatch: "1isyTC7XDIdf0s9xtaRKDUWLeFGitl-qw",
};
const SHELTER_TZ = "Asia/Bangkok";
const SHELTER_OFFSET = "+07:00";
const LIVE_REF = "dbkodyyxxhtygxcxmfcu";
const FOLDER_MIME = "application/vnd.google-apps.folder";

const { name: envName, rest: argv } = parseEnvArg(process.argv.slice(2));
const command = argv[0];
const values = (flag) => argv.flatMap((a, i) => (a === flag && argv[i + 1] !== undefined ? [argv[i + 1]] : []));
const value = (flag) => values(flag)[0];
const apply = argv.includes("--apply");

// Throws rather than exits: process.exit with a fetch still open trips a libuv
// assertion on Windows. The top level prints it.
class Refusal extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}
function fail(message, code = 1) {
  throw new Refusal(message, code);
}
/** Before any request is open, exiting outright is safe. */
function stop(message, code) {
  console.log(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(code);
}
function done(result) {
  console.log(JSON.stringify({ ok: true, env: envName, applied: apply, ...result }, null, 2));
}

// ---------------------------------------------------------------------------
// Which database: same guard as correct-resident.mjs
// ---------------------------------------------------------------------------

if (envName === "uat") stop("There is no UAT database yet. Use --env production for the live site, or leave --env out for test.", 2);
const live = envName === "production";
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const rightDatabase = live
  ? Boolean(url) && appEnvForSupabaseUrl(url) === "production" && refOf(env) === LIVE_REF
  : Boolean(url) && appEnvForSupabaseUrl(url) === "dev";
if (!rightDatabase) stop(`NEXT_PUBLIC_SUPABASE_URL (${url ?? "not set"}) is not the ${live ? "live" : "test"} database.`, 2);
if (!env.SUPABASE_ACCESS_TOKEN) stop("SUPABASE_ACCESS_TOKEN is required (it is what reaches the Management API).", 2);
const projectRef = refOf(env);

async function query(statement) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: statement }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// Drive: the app's own OAuth client (GOOGLE_OAUTH_*), the BWM account
// ---------------------------------------------------------------------------

let accessToken;
async function drive(path, init = {}, base = "https://www.googleapis.com/drive/v3") {
  if (!accessToken) {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_OAUTH_CLIENT_ID ?? "",
        client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
        refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN ?? "",
        grant_type: "refresh_token",
      }),
    });
    const body = await res.json();
    if (!body.access_token) throw new Error(`Google sign-in for Drive failed: ${body.error_description ?? body.error ?? res.status}`);
    accessToken = body.access_token;
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const res = await fetch(`${base}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`Drive ${init.method ?? "GET"} ${path.split("?")[0]} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

const fileMeta = (id) => drive(`/files/${encodeURIComponent(id)}?fields=id,name,mimeType,parents,trashed,createdTime`);

async function listChildren(parentId) {
  const search = new URLSearchParams({
    q: `'${parentId}' in parents and trashed = false and mimeType != '${FOLDER_MIME}'`,
    fields: "files(id,name,mimeType,createdTime,size)",
    orderBy: "createdTime",
    pageSize: "200",
  });
  return (await drive(`/files?${search}`)).files ?? [];
}

// Same lookup-by-name as findOrCreateFolder in src/lib/google/drive.ts: the
// oldest folder of that name wins, so a race never compounds.
async function findOrCreateFolder(parentId, name) {
  const escaped = name.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  const search = new URLSearchParams({
    q: `'${parentId}' in parents and name = '${escaped}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: "files(id)",
    orderBy: "createdTime",
  });
  const found = (await drive(`/files?${search}`)).files?.[0]?.id;
  if (found) return found;
  const created = await drive("/files?fields=id", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
  return created.id;
}

/** Residents/<Name> (<code>)/Blood Tests/<YYYYMMDD>/, as ensureResidentBloodTestFolder builds it. */
async function bloodTestFolder(resident, isoDate) {
  let residentFolderId = resident.drive_folder_id;
  const isNew = !residentFolderId;
  if (isNew) {
    if (!env.GOOGLE_DRIVE_ROOT_FOLDER_ID) throw new Error("GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured.");
    const residentsRoot = await findOrCreateFolder(env.GOOGLE_DRIVE_ROOT_FOLDER_ID, "Residents");
    residentFolderId = await findOrCreateFolder(residentsRoot, `${resident.name.trim().replace(/\//g, "-")} (${resident.resident_code})`);
  }
  const bloodTests = await findOrCreateFolder(residentFolderId, "Blood Tests");
  const folderId = await findOrCreateFolder(bloodTests, isoDate.replace(/-/g, ""));
  return { folderId, residentFolderId, isNew };
}

const moveFile = (id, from, to) =>
  drive(`/files/${encodeURIComponent(id)}?addParents=${to}&removeParents=${from}&fields=id,parents`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: "{}",
  });

// ---------------------------------------------------------------------------
// Dates, on the shelter's clock
// ---------------------------------------------------------------------------

const ISO = /^\d{4}-\d{2}-\d{2}$/;
function shelterToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHELTER_TZ }).format(new Date());
}
function isRealDate(iso) {
  if (!ISO.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}
function dayBefore(iso) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

async function actorId() {
  const email = value("--as");
  if (!email) fail("--as <email> is required: the person the records are created by.", 2);
  const rows = await query(`select id from auth.users where lower(email) = lower(${q(email)})`);
  if (!rows[0]) fail(`No user with the email given to --as in the ${live ? "live" : "test"} database.`, 2);
  return rows[0].id;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function inbox() {
  const files = await listChildren(FOLDERS.inbox);
  done({ files: files.map(({ id, name, mimeType, createdTime, size }) => ({ id, name, mimeType, createdTime, size })) });
}

async function lookup() {
  const names = values("--name").map((n) => n.trim()).filter(Boolean);
  const codes = values("--code").map((c) => c.trim().toUpperCase());
  const date = value("--date");
  if (!names.length && !codes.length) fail("Give at least one --name or --code.", 2);
  if (date && !isRealDate(date)) fail(`--date ${date} is not a YYYY-MM-DD date.`, 2);

  const residents = await query(`
    select r.id, r.resident_code, r.name, r.thai_name, r.other_names, r.species, r.sex,
           r.breed, r.colour, r.estimated_age_years, s.current_status, s.is_deceased
    from residents r left join resident_current_state s on s.resident_id = r.id`);

  const candidates = [];
  for (const r of residents) {
    const reasons = [];
    if (codes.includes(r.resident_code)) reasons.push("resident code");
    const others = String(r.other_names ?? "").split(/[,;/\n]/).map(normaliseName).filter(Boolean);
    for (const n of names) {
      // nearMatchReason is for near-duplicates, so it says nothing about a
      // name that is simply the same: check that first.
      const why =
        normaliseName(n) === normaliseName(r.name)
          ? "the same name"
          : nearMatchReason({ name: n, thaiName: n }, { name: r.name, thaiName: r.thai_name });
      if (why) reasons.push(`"${n}": ${why}`);
      else if (others.includes(normaliseName(n))) reasons.push(`"${n}": one of its other names`);
      else if (normaliseName(n) && normaliseName(n) === normaliseName(r.thai_name)) reasons.push(`"${n}": same Thai name`);
    }
    if (reasons.length) candidates.push({ ...r, matchedBecause: [...new Set(reasons)] });
  }

  if (date && candidates.length) {
    const ids = candidates.map((c) => q(c.id)).join(", ");
    const from = dayBefore(date);
    const visits = await query(`
      select v.id, v.resident_id, v.status, v.reason, c.name as clinic, v.clinic_id,
             to_char(v.appointment_date at time zone '${SHELTER_TZ}', 'YYYY-MM-DD HH24:MI') as at
      from clinic_visits v left join clinics c on c.id = v.clinic_id
      where v.resident_id in (${ids}) and v.archived_at is null
        and (v.appointment_date at time zone '${SHELTER_TZ}')::date between ${q(from)} and ${q(date)}
      order by v.appointment_date`);
    const tests = await query(`
      select b.id, b.resident_id, b.date, t.name as type, b.clinic_visit_id
      from blood_tests b join blood_test_types t on t.id = b.blood_test_type_id
      where b.resident_id in (${ids}) and b.date between ${q(from)} and ${q(date)}`);
    for (const c of candidates) {
      c.visitsOnDayOrDayBefore = visits.filter((v) => v.resident_id === c.id).map(({ resident_id: _r, ...v }) => v);
      c.bloodTestsOnDayOrDayBefore = tests.filter((t) => t.resident_id === c.id).map(({ resident_id: _r, ...t }) => t);
    }
  }

  const clinics = await query("select id, name, name_th from clinics order by name");
  const types = await query("select id, name from blood_test_types order by name");
  done({ candidates, clinics, bloodTestTypes: types });
}

async function load() {
  const planPath = value("--plan");
  if (!planPath) fail("--plan <file.json> is required.", 2);
  let plan;
  try {
    plan = JSON.parse(readFileSync(planPath, "utf8"));
  } catch (e) {
    fail(`Cannot read the plan: ${e.message}`, 2);
  }
  const problems = [];
  const { file, resident: code, date, visit, tests } = plan ?? {};

  if (!file?.id || !file?.name) problems.push("file.id and file.name are required.");
  if (!isRealDate(date ?? "")) problems.push(`date "${date}" is not a real YYYY-MM-DD date.`);
  else if (date > shelterToday()) problems.push(`date ${date} is in the future.`);
  if (!Array.isArray(tests) || !tests.length) problems.push("tests must list at least one panel.");
  if (!visit || (!visit.id && !visit.create)) problems.push("visit must be { id } or { create }.");
  if (problems.length) fail(problems.join(" "), 2);

  const actor = await actorId();

  // The resident
  const [resident] = await query(`
    select r.id, r.resident_code, r.name, r.drive_folder_id, s.is_deceased
    from residents r left join resident_current_state s on s.resident_id = r.id
    where r.resident_code = ${q(String(code ?? "").toUpperCase())}`);
  if (!resident) fail(`There is no resident ${code}.`);
  if (resident.is_deceased) fail(`${resident.name} (${resident.resident_code}) is recorded as deceased, so the database locks their record. Ask the user.`);

  // The visit
  const from = dayBefore(date);
  const sameDays = await query(`
    select v.id, v.resident_id, v.archived_at, c.name as clinic,
           (v.appointment_date at time zone '${SHELTER_TZ}')::date::text as day
    from clinic_visits v left join clinics c on c.id = v.clinic_id
    where v.resident_id = ${q(resident.id)}
      and (v.appointment_date at time zone '${SHELTER_TZ}')::date between ${q(from)} and ${q(date)}
      and v.archived_at is null`);
  let visitSql;
  let visitSummary;
  if (visit.id) {
    if (!UUID.test(visit.id)) fail(`visit.id ${visit.id} is not an id.`);
    const [v] = await query(`
      select v.id, v.resident_id, v.archived_at, c.name as clinic,
             (v.appointment_date at time zone '${SHELTER_TZ}')::date::text as day
      from clinic_visits v left join clinics c on c.id = v.clinic_id where v.id = ${q(visit.id)}`);
    if (!v) fail(`There is no clinic visit ${visit.id}.`);
    if (v.resident_id !== resident.id) fail(`Clinic visit ${visit.id} belongs to another resident.`);
    if (v.archived_at) fail(`Clinic visit ${visit.id} is archived.`);
    if (v.day !== date && v.day !== from) fail(`Clinic visit ${visit.id} is on ${v.day}, not ${date} or the day before.`);
    visitSql = `select ${q(v.id)}::uuid as id`;
    visitSummary = { used: v.id, clinic: v.clinic, day: v.day };
  } else {
    const { clinic, at, reason } = visit.create;
    if (sameDays.length && !argv.includes("--new-visit")) {
      fail(
        `${resident.name} already has a clinic visit on ${sameDays.map((v) => `${v.day} (${v.clinic ?? "no clinic"}, ${v.id})`).join(", ")}. ` +
          "Use it, or pass --new-visit if the user says a second visit is right.",
      );
    }
    if (!UUID.test(clinic ?? "")) fail("visit.create.clinic must be a clinic id (lookup lists them).");
    const [c] = await query(`select id, name from clinics where id = ${q(clinic)}`);
    if (!c) fail(`There is no clinic ${clinic}.`);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(at ?? "")) fail(`visit.create.at "${at}" must be YYYY-MM-DDTHH:MM, shelter time.`);
    const day = at.slice(0, 10);
    if (day !== date && day !== from) fail(`visit.create.at is on ${day}, not ${date} or the day before.`);
    visitSql = `insert into clinic_visits (resident_id, clinic_id, appointment_date, reason, notes, status, created_by)
      values (${q(resident.id)}, ${q(c.id)}, ${q(`${at}:00${SHELTER_OFFSET}`)}::timestamptz, ${q(reason || "Blood test")},
              ${q(`Added by /upload-blood-work from the lab report "${file.name}".`)}, 'completed', ${q(actor)})
      returning id`;
    visitSummary = { created: true, clinic: c.name, at };
  }

  // The panels
  const allTypes = await query("select id, name from blood_test_types");
  const resolved = [];
  for (const t of tests) {
    const type = allTypes.find((x) => x.name.toLowerCase() === String(t.type ?? "").trim().toLowerCase());
    if (!type) fail(`"${t.type}" is not a blood test type. The types are: ${allTypes.map((x) => x.name).join(", ")}.`);
    if (resolved.some((r) => r.type.id === type.id)) fail(`"${type.name}" is listed twice in the plan.`);
    resolved.push({ type, results: t.results ? String(t.results) : null });
  }
  const already = await query(`
    select t.name from blood_tests b join blood_test_types t on t.id = b.blood_test_type_id
    where b.resident_id = ${q(resident.id)} and b.date = ${q(date)}
      and b.blood_test_type_id in (${resolved.map((r) => q(r.type.id)).join(", ")})`);
  if (already.length) {
    fail(`${resident.name} already has ${already.map((a) => a.name).join(" and ")} on ${date}. Has this report been loaded before? Ask the user.`);
  }

  // The file
  const meta = await fileMeta(file.id);
  if (meta.trashed) fail(`The file ${file.name} is in the Drive trash.`);
  if (live && !(meta.parents ?? []).includes(FOLDERS.inbox)) fail(`The file ${file.name} is no longer in the Blood Work inbox.`);

  const summary = {
    resident: `${resident.name} (${resident.resident_code})`,
    date,
    visit: visitSummary,
    tests: resolved.map((r) => r.type.name),
    file: file.name,
  };

  const write = (attachId, folderUpdate) => `
    select set_config('app.actor', ${q(actor)}, true);
    ${folderUpdate}
    with v as (${visitSql}),
    t as (
      insert into blood_tests (resident_id, clinic_visit_id, blood_test_type_id, date, results, created_by)
      select ${q(resident.id)}, v.id, x.type_id::uuid, ${q(date)}::date, x.results, ${q(actor)}
      from v, (values ${resolved.map((r) => `(${q(r.type.id)}, ${q(r.results)})`).join(", ")}) as x(type_id, results)
      returning id, clinic_visit_id
    ),
    a as (
      insert into attachments (owner_type, owner_id, drive_file_id, file_name, date_taken, uploaded_by)
      select 'blood_test', t.id, ${q(attachId)}, ${q(meta.name)}, ${q(date)}::date, ${q(actor)} from t
      returning id
    )
    select (select clinic_visit_id from t limit 1) as visit_id,
           (select json_agg(id) from t) as blood_test_ids,
           (select json_agg(id) from a) as attachment_ids;`;

  if (!apply) {
    const [rows] = await query(`begin; ${write(file.id, "")} rollback;`);
    done({ dryRun: true, wouldWrite: summary, checkedAgainstDatabase: rows ? "the whole write ran and was rolled back" : "no rows" });
    return;
  }

  if (!live) {
    const [rows] = await query(`begin; ${write(file.id, "")} commit;`);
    done({ wrote: summary, ...rows, drive: "test: the original was attached where it is; nothing on Drive moved" });
    return;
  }

  // Live: copy into the resident's folder, write, then move the original.
  const folder = await bloodTestFolder(resident, date);
  const copy = await drive(`/files/${encodeURIComponent(file.id)}/copy?fields=id`, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=UTF-8" },
    body: JSON.stringify({ name: meta.name, parents: [folder.folderId] }),
  });
  const folderUpdate = folder.isNew
    ? `update residents set drive_folder_id = ${q(folder.residentFolderId)} where id = ${q(resident.id)} and drive_folder_id is null;`
    : "";
  let rows;
  try {
    [rows] = await query(`begin; ${write(copy.id, folderUpdate)} commit;`);
  } catch (e) {
    await drive(`/files/${encodeURIComponent(copy.id)}?fields=id`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ trashed: true }),
    }).catch(() => {});
    fail(`The database refused, so nothing was saved; the copy went to the Drive trash and the original is still in the inbox. ${e.message}`);
  }
  await moveFile(file.id, FOLDERS.inbox, FOLDERS.loaded);
  done({ wrote: summary, ...rows, drive: { copiedTo: `Residents/${resident.name} (${resident.resident_code})/Blood Tests/${date.replace(/-/g, "")}`, copyId: copy.id, originalMovedTo: "Loaded into system" } });
}

async function park() {
  const id = value("--file");
  if (!id) fail("--file <drive id> is required.", 2);
  const meta = await fileMeta(id);
  if (!(meta.parents ?? []).includes(FOLDERS.inbox)) fail(`${meta.name} is not in the Blood Work inbox.`);
  if (!live) return done({ wouldMove: meta.name, drive: "test: nothing on Drive moves" });
  if (!apply) return done({ dryRun: true, wouldMove: meta.name, to: "No match" });
  await moveFile(id, FOLDERS.inbox, FOLDERS.noMatch);
  done({ moved: meta.name, to: "No match" });
}

async function createClinic() {
  const name = value("--name")?.trim();
  const nameTh = value("--name-th")?.trim() || null;
  if (!name) fail("--name is required.", 2);
  const actor = await actorId();
  const near = await query(`select id, name, name_th from clinics where lower(name) = lower(${q(name)}) or (${q(nameTh)} is not null and name_th = ${q(nameTh)})`);
  if (near.length) fail(`A clinic by that name already exists: ${near.map((c) => `${c.name} (${c.id})`).join(", ")}.`);
  const sql = `select set_config('app.actor', ${q(actor)}, true);
    insert into clinics (name, name_th) values (${q(name)}, ${q(nameTh)}) returning id, name, name_th;`;
  const [row] = await query(apply ? `begin; ${sql} commit;` : `begin; ${sql} rollback;`);
  done(apply ? { created: row } : { dryRun: true, wouldCreate: { name, name_th: nameTh } });
}

async function createType() {
  const name = value("--name")?.trim();
  if (!name) fail("--name is required.", 2);
  const near = await query(`select id, name from blood_test_types where lower(name) = lower(${q(name)})`);
  if (near.length) fail(`That type already exists: ${near[0].name}.`);
  const sql = `insert into blood_test_types (name) values (${q(name)}) returning id, name;`;
  const [row] = await query(apply ? `begin; ${sql} commit;` : `begin; ${sql} rollback;`);
  done(apply ? { created: row } : { dryRun: true, wouldCreate: { name } });
}

const COMMANDS = { inbox, lookup, load, park, "create-clinic": createClinic, "create-type": createType };
try {
  if (!COMMANDS[command]) fail(`Command must be one of: ${Object.keys(COMMANDS).join(", ")}.`, 2);
  await COMMANDS[command]();
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }, null, 2));
  process.exitCode = e instanceof Refusal ? e.code : 1;
}
