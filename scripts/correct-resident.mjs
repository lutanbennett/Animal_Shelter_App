// Remove a resident that was entered twice, keeping the original.
//
//   node scripts/correct-resident.mjs --env production --remove R-0208 --keep R-0063
//       dry run: reads both, checks everything, runs the whole change inside
//       begin…rollback and prints what it would do
//
//   node scripts/correct-resident.mjs --env production --remove R-0208 --keep R-0063 --copy thai_name --apply --confirm R-0208
//       does it: writes every row it is about to change to a receipt on the
//       Desktop FIRST, then copies the named details onto R-0063 and deletes
//       R-0208 in one begin…commit
//
//   node scripts/correct-resident.mjs --env production --restore-death R-0323 --date 2026-10-28 [--leave-cascade] [--apply --confirm R-0323]
//       the second job (backlog #dklvq): put back a death that was withdrawn, on its original date. Same shape: dry run by
//       default, --apply --confirm to commit. Its receipt is written FIRST to the main checkout's gitignored .local/, named
//       for the database and resident. See RESTORE A DEATH at the foot of this file.
//
// Without --env it works on the test database, as the other scripts do.
//
// WHO RUNS IT. Lutan asks a chat in plain words ("delete R-0208, it's a
// duplicate of R-0063, and copy its Thai name across") and the chat runs this.
// He decided on 2026-10-09 that he wants no manual step, and that a chat
// should do it the way the "Delete duplicate resident R-0240" chat did.
// The point of the script is that every chat then gives the same answer to
// the same request: on 2026-10-05 one chat deleted R-0240 and another refused
// R-0220, and the inconsistency was the complaint
// (docs/decisions/2026-10-09-resident-corrections-script.md).
//
// It is meant to be boring. It refuses rather than guesses, and each refusal
// says in plain words what to do instead.
//
// WHAT IT REMOVES — a resident with no real history:
//   residents              the row itself
//   placement_history      its Intake, plus a death recorded and then withdrawn
//                          (Deceased + DeceasedInError) if that happened, and
//                          its enclosure changes with --enclosure-moves
//   resident_diets         all of them, and their resident_diet_rounds (which
//                          go by ON DELETE CASCADE)
//   weight                 at most one: the intake weight, dated the intake
//                          date, not from a clinic visit, not archived
//   translations           its machine translations (residents_drop_translations
//                          removes them)
// audit_log keeps its rows (it cannot be edited, 0121), so the removal stays
// on record there as well as in the receipt.
//
// WHAT MAKES IT REFUSE:
//   - clinic visits, blood tests, prescriptions, immunizations, procedures,
//     adoption updates, photos or files: real history, a person must decide
//   - a donation earmarked for it, or being the website's featured resident:
//     those links are ON DELETE SET NULL, so a delete would quietly blank them
//   - it was moved, fostered, adopted or sent to hospital (any placement but
//     the ones above). --enclosure-moves lets enclosure changes through: a
//     duplicate often gets moved alongside the original before anyone notices
//     (R-0048, 2026-10-20), and its moves say nothing the original does not.
//     Foster, adoption and hospital stays are still refused.
//   - it is recorded as deceased: the database locks it. "Withdraw this death"
//     in the app (reason: duplicate) unlocks it, then run this again
//   - a Drive folder, profile photo or deceased archive, unless --drive-trashed
//     says those have already been moved to the Drive trash. This script does
//     not touch Drive; it prints the IDs so whoever runs it can trash them first
//   - names that do not look like the same animal (scripts/lib/near-names.mjs)
//     unless --force-names
//   - --copy onto a detail the original already has, with a different value
//
// --copy <field>[,<field>…] copies details from the duplicate onto the original,
// only into ones the original has blank (COPYABLE below). That is the one
// merge that is clean. There is no merging of history: placement_history rows
// cannot be moved to another resident (enforce_placement_history_immutability,
// 0001) without being deleted and re-created, which is rewriting the record.
//
// WHICH DATABASE. --env test (the default) must reach the dev project, and
// --env production must reach the project production is today (LIVE_REF),
// both checked against the Supabase URL itself (src/lib/app-env.ts), so a stray
// shell variable cannot aim it elsewhere. After the cutover that project is
// UAT, app-env.ts says so, and this refuses until LIVE_REF is updated: it fails
// closed. --apply on production also needs --confirm <the code being removed>,
// so a test command pasted with --env production added cannot delete on live
// by accident. --env uat is refused: there is no UAT project yet.
//
// How R-0240 was deleted on 2026-10-05 although 0119 guards placement history:
// 0119 and 0001 guard UPDATE only, and the Management API runs as the database
// owner, so row security does not apply either. This script relies on that
// openly. backlog: "Placement history can be deleted, though it cannot be edited".

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { nearMatchReason } from "./lib/near-names.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? null) : null;
};

const VALUED = ["--remove", "--keep", "--receipt", "--confirm", "--copy", "--restore-death", "--date"];
const KNOWN = new Set([...VALUED, "--apply", "--force-names", "--enclosure-moves", "--drive-trashed", "--merge-into", "--leave-cascade"]);
const unknown = args.filter((a, i) => a.startsWith("--") && !KNOWN.has(a) && !VALUED.includes(args[i - 1]));
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(" ")}. See the top of scripts/correct-resident.mjs.`);
  process.exit(2);
}

if (flag("--merge-into")) {
  console.error(
    "--merge-into is not available, on purpose. Moving one resident's history onto another means\n" +
      "deleting and re-creating placement history, which the database protects from being changed.\n" +
      "To carry details across, use --copy (for example --copy thai_name). History stays where it is.",
  );
  process.exit(2);
}

// Details --copy may carry from the duplicate to the original. Descriptive
// fields only: nothing that drives a workflow (placement, diet, deceased),
// nothing pointing at Drive, and not the name or code.
const COPYABLE = [
  "thai_name",
  "other_names",
  "breed",
  "sex",
  "colour",
  "size",
  "estimated_age_years",
  "age_estimated_on",
  "is_desexed",
  "microchip_number",
  "microchip_implanted_on",
  "bio",
  "temperament_notes",
  "past_story_notes",
  "behaviour_notes",
  "hook_line",
  "ideal_home",
  "good_with_dogs",
  "good_with_cats",
  "good_with_children",
  "energy_level",
];

const code = (raw) => (raw && /^r-?\d+$/i.test(raw) ? `R-${raw.replace(/^r-?/i, "").padStart(4, "0")}` : null);
const removeCode = code(value("--remove"));
const keepCode = code(value("--keep"));
const apply = flag("--apply");
const forceNames = flag("--force-names");
const enclosureMoves = flag("--enclosure-moves");
const driveTrashed = flag("--drive-trashed");
const copyFields = (value("--copy") ?? "")
  .split(",")
  .map((f) => f.trim().toLowerCase())
  .filter(Boolean);

// The second mode (backlog #dklvq): put back a death that was withdrawn, on its original date. See RESTORE A DEATH above.
const restoreCode = code(value("--restore-death"));
const restoreDate = value("--date");
const leaveCascade = flag("--leave-cascade");
if (flag("--restore-death") && !restoreCode) {
  console.error("--restore-death needs a resident code, for example --restore-death R-0323.");
  process.exit(2);
}
if (restoreCode && (removeCode || keepCode || copyFields.length || forceNames || enclosureMoves || driveTrashed)) {
  console.error("--restore-death is its own job: do not combine it with --remove, --keep, --copy or the removal flags.");
  process.exit(2);
}
if (restoreCode && !/^\d{4}-\d{2}-\d{2}$/.test(restoreDate ?? "")) {
  console.error(
    "--restore-death needs --date YYYY-MM-DD: the date the death was ORIGINALLY recorded on. The run checks it against the\n" +
      "database, so the wrong resident or the wrong death is refused instead of restored.",
  );
  process.exit(2);
}
if (!restoreCode && (!removeCode || !keepCode)) {
  console.error(
    "Say which resident to remove and which one it duplicates, by code:\n" +
      "  node scripts/correct-resident.mjs --remove R-0240 --keep R-0220\n" +
      "or which withdrawn death to put back:\n" +
      "  node scripts/correct-resident.mjs --restore-death R-0323 --date 2026-10-28",
  );
  process.exit(2);
}
if (!restoreCode && removeCode === keepCode) {
  console.error(`--remove and --keep are both ${removeCode}.`);
  process.exit(2);
}
const badCopy = copyFields.filter((f) => !COPYABLE.includes(f));
if (badCopy.length) {
  console.error(`--copy cannot carry ${badCopy.join(", ")}. It can carry: ${COPYABLE.join(", ")}.`);
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Which database (see WHICH DATABASE above)
// ---------------------------------------------------------------------------

// The live project today. Not taken from app-env.ts alone: that calls every
// unknown project "production", so on its own it cannot tell live from a typo.
const LIVE_REF = "dbkodyyxxhtygxcxmfcu";
const live = envName === "production";

if (envName === "uat") {
  console.error("Refusing: there is no UAT database yet. Use --env production for the live site, or leave --env out for test.");
  process.exit(2);
}
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const rightDatabase = live
  ? Boolean(url) && appEnvForSupabaseUrl(url) === "production" && refOf(env) === LIVE_REF
  : Boolean(url) && appEnvForSupabaseUrl(url) === "dev";
if (!rightDatabase) {
  console.error(`Refusing: NEXT_PUBLIC_SUPABASE_URL (${url ?? "not set"}) is not the ${live ? "live" : "test"} database.`);
  process.exit(2);
}
if (live && apply && code(value("--confirm")) !== (restoreCode ?? removeCode)) {
  console.error(
    `Refusing: changing the LIVE database needs --confirm ${restoreCode ?? removeCode} as well as --apply.\n` +
      "Run it without --apply first; the dry run prints the exact line.",
  );
  process.exit(2);
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required (it is what reaches the Management API).");
  process.exit(2);
}
const projectRef = refOf(env);
const dbLabel = live ? "LIVE database" : "test database";

// The receipt: --receipt if given, otherwise a new file on the Desktop. Not the
// repo folder: the repo is public, and a stray JSON file there is one
// `git add .` from being on it. Never overwritten.
const desktop = [join(homedir(), "OneDrive", "Desktop"), join(homedir(), "Desktop")].find(existsSync) ?? homedir();
function receiptFile() {
  if (value("--receipt")) return resolve(value("--receipt"));
  const stamp = new Date().toISOString().slice(0, 10);
  if (restoreCode) {
    // The restore mode's receipt goes to the main checkout's gitignored .local/ (the item's own wording), named for the
    // database and the resident. Found from git's common dir, so it is the same folder from any worktree. The repo is
    // public: .local/ is ignored at .gitignore:59, which is why it is safe for a receipt holding real rows.
    let mainCheckout = null;
    try {
      const common = execFileSync("git", ["rev-parse", "--path-format=absolute", "--git-common-dir"], { encoding: "utf8" }).trim();
      mainCheckout = dirname(common);
    } catch {
      // not in a git checkout: fall through to the Desktop
    }
    const dir = mainCheckout ? join(mainCheckout, ".local") : desktop;
    mkdirSync(dir, { recursive: true });
    const base = join(dir, `${live ? "production" : "test"}-${restoreCode}-restore-death-before-${stamp}`);
    let path = `${base}.json`;
    for (let n = 2; existsSync(path); n++) path = `${base}-${n}.json`;
    return path;
  }
  const base = join(desktop, `removed-${removeCode}-${live ? "live" : "test"}-${stamp}`);
  let path = `${base}.json`;
  for (let n = 2; existsSync(path); n++) path = `${base}-${n}.json`;
  return path;
}
const receiptPath = receiptFile();
if (apply && existsSync(receiptPath)) {
  console.error(`${receiptPath} already exists. Choose a new file name; a receipt is never overwritten.`);
  process.exit(2);
}
if (apply && !existsSync(dirname(receiptPath))) {
  console.error(`The folder ${dirname(receiptPath)} does not exist.`);
  process.exit(2);
}

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

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

// Each link that means "this resident has real history": [label, table, where]
// with :id for the resident's id. Run before, and again inside the
// transaction so a row added in between still stops the delete. A table the
// database does not have (production can be behind on migrations) is skipped
// and said so.
const BLOCKERS = [
  ["clinic visit(s)", "clinic_visits", "resident_id = :id"],
  ["blood test(s)", "blood_tests", "resident_id = :id"],
  ["prescription(s)", "prescriptions", "resident_id = :id"],
  ["immunization(s)", "immunization_records", "resident_id = :id"],
  ["procedure(s)", "procedures", "resident_id = :id"],
  ["adoption update(s)", "adoption_updates", "resident_id = :id"],
  ["photo(s) or file(s)", "attachments", "owner_type = 'resident' and owner_id = :id"],
  ["donation(s) earmarked for it", "donations", "designation_resident_id = :id"],
  ["the website's featured resident setting", "site_content", "featured_resident_id = :id"],
];
// History placements: anything but these means the resident has really moved.
const SEED_PLACEMENTS = new Set(["Intake", "Deceased", "DeceasedInError"]);
// Let through by --enclosure-moves: a move between enclosures, nothing else.
const ENCLOSURE_MOVES = new Set(["ChangeEnclosure"]);
const DRIVE_FIELDS = [
  ["drive_folder_id", "Drive folder"],
  ["profile_photo_drive_file_id", "profile photo"],
  ["deceased_summary_drive_file_id", "deceased summary file"],
  ["deceased_index_drive_file_id", "deceased index page"],
];

// Where a resident is now, for printing.
const placeSql = (id) => `(select coalesce(z.name || ' / ' || e.name, p.placement_type::text)
    from placement_history p
    left join enclosures e on e.id = p.enclosure_id
    left join zones z on z.id = e.zone_id
    where p.resident_id = ${id} and p.end_date is null
    order by p.start_date desc, p.created_at desc limit 1)`;
const residentSql = (c) =>
  `(select to_jsonb(r) || jsonb_build_object('place', ${placeSql("r.id")}, 'deceased', resident_is_deceased(r.id)) from residents r where r.resident_code = ${q(c)})`;

console.log(
  restoreCode
    ? `\nRestore the withdrawn death of ${restoreCode} (originally ${restoreDate}) — ${dbLabel} (${projectRef})`
    : `\nRemove ${removeCode}, keep ${keepCode} — ${dbLabel} (${projectRef})`,
);

// Everything past here talks to the database, and process.exit() trips a libuv
// assertion on Windows while fetch still holds a socket (load-residents.mjs
// has the same note). So the rest sets process.exitCode and returns instead.
try {
  await (restoreCode ? runRestoreDeath() : run());
} catch (error) {
  console.error(`\nCould not read the database: ${error.message}\nNothing was changed.`);
  process.exitCode = 1;
}

async function run() {
  const [found] = await query(`select json_build_object(
    'remove', ${residentSql(removeCode)},
    'keep', ${residentSql(keepCode)},
    'tables', (select json_agg(table_name) from information_schema.tables
               where table_schema = 'public' and table_type = 'BASE TABLE')
  ) as data`);
  const { remove, keep, tables } = found.data;
  const strip = ({ place, deceased, ...row }) => row;

  if (!remove || !keep) {
    for (const [c, row] of [[removeCode, remove], [keepCode, keep]]) {
      if (!row) console.error(`There is no resident ${c} in the ${dbLabel}.`);
    }
    console.error("Nothing was changed.");
    process.exitCode = 1;
    return;
  }

  const id = `${q(remove.id)}::uuid`;
  const blockers = BLOCKERS.filter(([, table]) => tables.includes(table));
  const skipped = BLOCKERS.filter(([, table]) => !tables.includes(table));
  const blockerSql = blockers
    .map(([label, table, where]) => `${q(label)}, (select count(*) from ${table} where ${where.replaceAll(":id", id)})`)
    .join(",\n    ");
  const hasTranslations = tables.includes("translations");

  const [detail] = await query(`select json_build_object(
    'placement_history', coalesce((select json_agg(to_jsonb(p) order by p.start_date, p.created_at) from placement_history p where p.resident_id = ${id}), '[]'::json),
    'resident_diets', coalesce((select json_agg(to_jsonb(d) order by d.start_date) from resident_diets d where d.resident_id = ${id}), '[]'::json),
    'resident_diet_rounds', coalesce((select json_agg(to_jsonb(x)) from resident_diet_rounds x join resident_diets d on d.id = x.resident_diet_id where d.resident_id = ${id}), '[]'::json),
    'weight', coalesce((select json_agg(to_jsonb(w) order by w.date) from weight w where w.resident_id = ${id}), '[]'::json),
    'translations', ${hasTranslations ? `coalesce((select json_agg(to_jsonb(t)) from translations t where t.table_name = 'residents' and t.row_id = ${q(remove.id)}), '[]'::json)` : "'[]'::json"},
    'blockers', json_build_object(${blockerSql})
  ) as data`);
  const rows = detail.data;
  const placements = rows.placement_history;
  const weights = rows.weight;

  // -------------------------------------------------------------------------
  // Refusals
  // -------------------------------------------------------------------------

  const refusals = [];

  const sameName = remove.name.trim().toLowerCase() === keep.name.trim().toLowerCase();
  const nameReason = sameName
    ? "the same name"
    : nearMatchReason({ name: remove.name, thaiName: remove.thai_name }, { name: keep.name, thaiName: keep.thai_name });
  if (!nameReason && !forceNames) {
    refusals.push(`"${remove.name}" and "${keep.name}" do not look like the same animal. If they are, add --force-names.`);
  }

  if (remove.deceased) {
    refusals.push(
      `${removeCode} is recorded as deceased, and the database locks a deceased resident. ` +
        `In the app, open ${removeCode} and use "Withdraw this death" (reason: duplicate), then run this again.`,
    );
  }
  for (const [label, count] of Object.entries(rows.blockers)) {
    if (Number(count) > 0) refusals.push(`${removeCode} has ${count} ${label}.`);
  }
  const moved = placements.filter(
    (p) => !SEED_PLACEMENTS.has(p.placement_type) && !(enclosureMoves && ENCLOSURE_MOVES.has(p.placement_type)),
  );
  const intakes = placements.filter((p) => p.placement_type === "Intake").length;
  if (moved.length || intakes !== 1) {
    const onlyEnclosure = intakes === 1 && moved.every((p) => ENCLOSURE_MOVES.has(p.placement_type));
    refusals.push(
      `${removeCode} has been moved since intake (${placements.map((p) => p.placement_type).join(", ") || "no placements"}). ` +
        (onlyEnclosure
          ? "They are only enclosure changes: if it is a duplicate, add --enclosure-moves and they go with it."
          : "That is history: sort it out in the app."),
    );
  }
  const intakeWeight =
    weights.length === 0 ||
    (weights.length === 1 &&
      weights[0].date === remove.intake_date &&
      !weights[0].clinic_visit_id &&
      !weights[0].archived_at);
  if (!intakeWeight) refusals.push(`${removeCode} has weights beyond its intake weight (${weights.length} in all).`);

  const drive = DRIVE_FIELDS.filter(([field]) => remove[field]).map(([field, label]) => ({ field, label, id: remove[field] }));
  if (drive.length && !driveTrashed) {
    refusals.push(
      `${removeCode} has things in Google Drive: ${drive.map((d) => `${d.label} ${d.id}`).join(", ")}. ` +
        "Move them to the Drive trash first, then run this again with --drive-trashed.",
    );
  }

  // --copy: only into a blank detail on the original.
  const copies = [];
  for (const field of copyFields) {
    const from = remove[field];
    const to = keep[field];
    const blankValue = (v) => v === null || v === undefined || String(v).trim() === "";
    if (blankValue(from)) {
      refusals.push(`--copy ${field}: ${removeCode} has no ${field} to copy.`);
    } else if (!blankValue(to) && String(to) !== String(from)) {
      refusals.push(
        `--copy ${field}: ${keepCode} already has "${to}", not "${from}". If "${from}" is right, change it in the app.`,
      );
    } else if (String(to) === String(from)) {
      console.log(`\n--copy ${field}: ${keepCode} already has "${to}" — nothing to copy.`);
    } else {
      copies.push({ field, from });
    }
  }
  if (copies.length && keep.deceased) {
    refusals.push(`${keepCode} is recorded as deceased, so its details are locked and --copy cannot change them.`);
  }

  // -------------------------------------------------------------------------
  // What will happen
  // -------------------------------------------------------------------------

  const describe = (r) =>
    [
      `${r.resident_code}  ${r.name}${r.thai_name ? ` (${r.thai_name})` : ""}`,
      `    ${[r.species, r.sex, r.size, r.breed].filter(Boolean).join(", ") || "no details"}; intake ${r.intake_date ?? "date not set"}, created ${String(r.created_at).slice(0, 10)}`,
      `    now in ${r.place ?? "no open placement"}`,
    ].join("\n");

  console.log(`\nTo remove (the duplicate):\n  ${describe(remove)}`);
  console.log(`\nTo keep (the original):\n  ${describe(keep)}`);
  console.log(
    nameReason
      ? `\nWhy they look like the same animal: ${nameReason}.`
      : `\nThe names do not look alike${forceNames ? " (going ahead: --force-names was given)" : ""}.`,
  );
  for (const [label, table] of skipped) {
    console.log(`  (not checked: ${label} — this database has no ${table} table yet)`);
  }

  if (refusals.length) {
    console.error(`\nNot done — ${refusals.length} reason(s):`);
    for (const r of refusals) console.error(`  - ${r}`);
    console.error("\nNothing was changed.");
    process.exitCode = 1;
    return;
  }

  console.log("\nWhat will be deleted:");
  console.log(`  the resident ${removeCode} ${remove.name}`);
  for (const p of placements) {
    console.log(`  placement: ${p.placement_type} on ${String(p.start_date).slice(0, 10)}`);
  }
  if (rows.resident_diets.length) {
    console.log(
      `  diet: ${rows.resident_diets.length} row(s)${rows.resident_diet_rounds.length ? `, with ${rows.resident_diet_rounds.length} meal round(s)` : ""}`,
    );
  }
  for (const w of weights) console.log(`  weight: ${w.weight_kg} kg on ${w.date}`);
  if (rows.translations.length) console.log(`  translations: ${rows.translations.length} (machine translations of its text)`);
  if (drive.length) {
    console.log(`  Drive (already trashed, --drive-trashed): ${drive.map((d) => `${d.label} ${d.id}`).join(", ")}`);
  }

  console.log(`\nWhat changes on ${keepCode}:`);
  if (copies.length) {
    for (const c of copies) console.log(`  ${c.field}: (blank) → "${c.from}"`);
  } else {
    console.log("  nothing — it is not edited.");
  }
  console.log("\naudit_log keeps the record of this removal.");

  // -------------------------------------------------------------------------
  // The transaction
  // -------------------------------------------------------------------------

  const ids = (list) => (list.length ? `array[${list.map((r) => q(r.id)).join(", ")}]::uuid[]` : "'{}'::uuid[]");
  const keepId = `${q(keep.id)}::uuid`;
  const copied = copies.map((c) => c.field);
  const copySql = copies.length
    ? `update residents k set ${copied.map((f) => `${f} = d.${f}`).join(", ")}
    from residents d where k.id = ${keepId} and d.id = ${id};`
    : "";
  const unchangedExcept = `array[${copied.map(q).join(", ")}]::text[]`;

  const block = `do $$
declare
  v_keep_before jsonb;
  v_keep_after jsonb;
  v_n int;
  v_blockers json;
begin
  select to_jsonb(r) into v_keep_before from residents r where r.id = ${keepId};

  -- The same checks as before the run, in case something was added since.
  select json_build_object(${blockerSql}) into v_blockers;
  if exists (select 1 from json_each_text(v_blockers) where value::int > 0) then
    raise exception 'refused: % now has history (%)', ${q(removeCode)}, v_blockers;
  end if;

  ${copySql}

  delete from resident_diets where resident_id = ${id};
  get diagnostics v_n = row_count;
  if v_n <> ${rows.resident_diets.length} then raise exception 'expected to delete ${rows.resident_diets.length} diet row(s), deleted %', v_n; end if;

  delete from weight where id = any(${ids(weights)});
  get diagnostics v_n = row_count;
  if v_n <> ${weights.length} then raise exception 'expected to delete ${weights.length} weight row(s), deleted %', v_n; end if;

  delete from placement_history where id = any(${ids(placements)});
  get diagnostics v_n = row_count;
  if v_n <> ${placements.length} then raise exception 'expected to delete ${placements.length} placement(s), deleted %', v_n; end if;

  -- A row added since the check that a foreign key knows about makes this
  -- fail (none of them cascade), which rolls everything back.
  delete from residents where id = ${id} and resident_code = ${q(removeCode)};
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'expected to delete resident ${removeCode}, deleted %', v_n; end if;

  -- The original changed in the copied details and nowhere else.
  select to_jsonb(r) into v_keep_after from residents r where r.id = ${keepId};
  if (v_keep_after - ${unchangedExcept}) is distinct from (v_keep_before - ${unchangedExcept}) then
    raise exception '${keepCode} changed in a detail it should not have';
  end if;
end $$;`;

  const receipt = {
    note: `Rows removed by scripts/correct-resident.mjs: ${removeCode} as a duplicate of ${keepCode}.`,
    written_at: new Date().toISOString(),
    database: `${dbLabel} (${projectRef})`,
    command: `node scripts/correct-resident.mjs ${process.argv.slice(2).join(" ")}`,
    removed: removeCode,
    kept_before: strip(keep),
    copied_to_kept: Object.fromEntries(copies.map((c) => [c.field, c.from])),
    drive_already_trashed: drive,
    rows: {
      residents: [strip(remove)],
      placement_history: placements,
      resident_diets: rows.resident_diets,
      resident_diet_rounds: rows.resident_diet_rounds,
      weight: weights,
      translations: rows.translations,
    },
  };

  if (apply) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(`\nReceipt written first: ${receiptPath}`);
  }

  process.stdout.write(`\n${apply ? "Doing it" : "Trying it (rolled back)"} … `);
  try {
    await query(`begin;\n${block}\n${apply ? "commit" : "rollback"};`);
    console.log("ok");
  } catch (error) {
    console.log("FAILED");
    console.error(error.message);
    console.error(`Nothing was changed.${apply ? " The receipt lists what would have been removed." : ""}`);
    process.exitCode = 1;
    return;
  }

  if (!apply) {
    const line = [
      "node scripts/correct-resident.mjs",
      live ? "--env production" : "",
      `--remove ${removeCode} --keep ${keepCode}`,
      copied.length ? `--copy ${copied.join(",")}` : "",
      forceNames ? "--force-names" : "",
      enclosureMoves ? "--enclosure-moves" : "",
      driveTrashed ? "--drive-trashed" : "",
      "--apply",
      live ? `--confirm ${removeCode}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    console.log(`\nNothing was changed; it runs cleanly. To do it:\n\n  ${line}\n`);
    return;
  }

  const [after] = await query(`select json_build_object(
    'gone', not exists (select 1 from residents where resident_code = ${q(removeCode)}),
    'keep', ${residentSql(keepCode)}
  ) as data`);
  console.log(`\n${removeCode} ${after.data.gone ? "is deleted" : "IS STILL THERE — check by hand"}.`);
  console.log(`\n${keepCode} now:\n  ${describe(after.data.keep)}`);
  for (const c of copies) console.log(`  ${c.field}: ${after.data.keep[c.field]}`);
}

// ---------------------------------------------------------------------------
// RESTORE A DEATH (--restore-death) — backlog #dklvq, the case R-0323 needed on 2026-11-02
// ---------------------------------------------------------------------------
//
// A death withdrawn in the app ("Withdraw this death", undo_deceased_placement(), 0049) does not erase it: the Deceased row is
// closed and a DeceasedInError row is written, putting the resident back where it was. Re-recording the death on its ORIGINAL date
// through the app is then refused, because a placement now sits after that date. This puts the withdrawn death back exactly as it
// was, which is not a deletion of a resident and so could not be done by the script before.
//
// It changes two placement_history rows and nothing else: it deletes the open DeceasedInError row and re-opens the Deceased row it
// had closed (end_date back to null). No row is created and no start_date is touched, so the death keeps its original date.
//
// WHAT IT READS FOR EACH GUARD (named, because a guard that tests the wrong property is reported as safety):
//   "is not deceased now"      resident_is_deceased(id), the same function the database lock uses (0026:124): the OPEN placement is in
//                              the Lifecycle zone. NOT placement_type alone.
//   "the Deceased row"         the placement_history row immediately before the open one (by start_date, created_at), with
//                              placement_type = 'Deceased', an enclosure in the Lifecycle zone, and end_date equal to the open row's start_date
//                              (close_prior_placement() sets exactly that).
//   "the open row to delete"   the resident's only row with end_date is null, with placement_type = 'DeceasedInError', and the LAST row.
//   "the original date"        --date must equal the Deceased row's start_date, as a UTC or an Asia/Bangkok calendar date.
// It refuses anything else: any placement after the withdrawal means the resident has really moved since.
//
// THE CASCADE. Recording a death cancelled the resident's future vet appointments and ended active prescriptions; withdrawing it put
// them back (deceased_cascade on the Deceased row says which). Re-opening the Deceased row does NOT cancel them again, because only
// INSERTING the row does that. So if any of them are live again the run refuses unless --leave-cascade says that is understood.
// ready_for_adoption is likewise not cleared. Neither is touched by this script.
async function runRestoreDeath() {
  const [found] = await query(`select json_build_object(
    'resident', ${residentSql(restoreCode)},
    'placements', coalesce((select json_agg(json_build_object('row', to_jsonb(p),
        'lifecycle', exists (select 1 from enclosures e join zones z on z.id = e.zone_id where e.id = p.enclosure_id and z.name = 'Lifecycle'),
        'start_utc', to_char(p.start_date at time zone 'UTC', 'YYYY-MM-DD'),
        'start_bkk', to_char(p.start_date at time zone 'Asia/Bangkok', 'YYYY-MM-DD'))
        order by p.start_date, p.created_at)
      from placement_history p join residents r on r.id = p.resident_id where r.resident_code = ${q(restoreCode)}), '[]'::json),
    'tables', (select json_agg(table_name) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE')
  ) as data`);
  const { resident, placements, tables } = found.data;
  if (!resident) {
    console.error(`There is no resident ${restoreCode} in the ${dbLabel}.\nNothing was changed.`);
    process.exitCode = 1;
    return;
  }

  const refusals = [];
  const open = placements.filter((p) => p.row.end_date === null);
  const last = placements[placements.length - 1];
  const openRow = open.length === 1 ? open[0] : null;
  const idx = openRow ? placements.indexOf(openRow) : -1;
  const deathEntry = idx > 0 ? placements[idx - 1] : null;

  if (resident.deceased) {
    refusals.push(`${restoreCode} is recorded as deceased right now (its open placement is in the Lifecycle zone). There is no withdrawn death to restore.`);
  }
  if (!openRow) {
    refusals.push(`${restoreCode} has ${open.length} open placement(s); this needs exactly one, the DeceasedInError row.`);
  } else {
    if (openRow.row.placement_type !== "DeceasedInError") {
      refusals.push(`${restoreCode}'s open placement is ${openRow.row.placement_type}, not DeceasedInError: its death was not withdrawn (or it has moved since).`);
    }
    if (openRow !== last) refusals.push(`${restoreCode} has placements after the withdrawal: it has really moved since. That is history; sort it out in the app.`);
    if (!deathEntry || deathEntry.row.placement_type !== "Deceased" || !deathEntry.lifecycle) {
      refusals.push(`The placement before the open one is not a Deceased row in the Lifecycle zone (it is ${deathEntry?.row.placement_type ?? "missing"}).`);
    } else if (deathEntry.row.end_date !== openRow.row.start_date) {
      refusals.push("The Deceased row was not closed by the withdrawal (its end date is not the DeceasedInError start): it is not the death that was withdrawn.");
    } else if (restoreDate !== deathEntry.start_utc && restoreDate !== deathEntry.start_bkk) {
      refusals.push(
        `--date ${restoreDate} is not the death's date. The Deceased row starts ${deathEntry.row.start_date} (${deathEntry.start_utc} UTC, ${deathEntry.start_bkk} in Thailand).`,
      );
    }
  }

  // The cascade the withdrawal put back (see THE CASCADE above).
  const cascade = deathEntry?.row.deceased_cascade ?? null;
  const apptIds = cascade?.vet_appointments ?? [];
  const rxItems = cascade?.prescriptions ?? [];
  let liveAppts = 0;
  if (apptIds.length && tables.includes("vet_appointments")) {
    const [r] = await query(`select count(*)::int as n from vet_appointments where status = 'scheduled' and id = any(array[${apptIds.map((x) => q(x)).join(", ")}]::uuid[])`);
    liveAppts = r.n;
  }
  const cascadeLive = liveAppts + rxItems.length;
  if (deathEntry && !cascade) {
    console.log("\n(This death has no cascade snapshot — it was recorded before 0049 — so there is nothing the withdrawal put back to compare.)");
  }
  if (cascadeLive > 0 && !leaveCascade) {
    refusals.push(
      `The withdrawal put back ${liveAppts} vet appointment(s) and ${rxItems.length} prescription(s). Restoring the death will NOT cancel or end them again, ` +
        "so they would stay live against a deceased resident. Sort them out in the app first, or add --leave-cascade if leaving them is right.",
    );
  }

  console.log(`\n${restoreCode}  ${resident.name}${resident.thai_name ? ` (${resident.thai_name})` : ""}`);
  console.log("  placement history, oldest first:");
  for (const p of placements) {
    console.log(`    ${p.row.placement_type.padEnd(16)} ${p.row.start_date} → ${p.row.end_date ?? "(open)"}`);
  }
  if (refusals.length) {
    console.error(`\nNot done — ${refusals.length} reason(s):`);
    for (const r of refusals) console.error(`  - ${r}`);
    console.error("\nNothing was changed.");
    process.exitCode = 1;
    return;
  }

  const death = deathEntry.row;
  const withdrawal = openRow.row;
  console.log(`\nWhat will happen (two placement rows, no other table):`);
  console.log(`  delete the DeceasedInError row of ${withdrawal.start_date} (${withdrawal.id})`);
  console.log(`  re-open the Deceased row that starts ${death.start_date} (${death.id}): end date → none`);
  console.log(`  ${restoreCode} then reads deceased on ${deathEntry.start_utc}${deathEntry.start_utc === deathEntry.start_bkk ? "" : ` UTC (${deathEntry.start_bkk} in Thailand)`}.`);
  if (cascadeLive > 0) console.log(`  NOT touched (--leave-cascade): ${liveAppts} vet appointment(s), ${rxItems.length} prescription(s) the withdrawal put back.`);
  console.log("\naudit_log keeps the record of this change.");

  const block = `do $$
declare
  v_n int;
begin
  -- The same checks as before the run, in case something changed since: still alive, and still exactly this open withdrawal.
  if resident_is_deceased(${q(resident.id)}::uuid) then raise exception 'refused: % is deceased now', ${q(restoreCode)}; end if;
  if (select count(*) from placement_history where resident_id = ${q(resident.id)}::uuid and end_date is null) <> 1
     or not exists (select 1 from placement_history where id = ${q(withdrawal.id)}::uuid and resident_id = ${q(resident.id)}::uuid
                    and placement_type = 'DeceasedInError' and end_date is null) then
    raise exception 'refused: the open placement is no longer the withdrawal I read';
  end if;
  if exists (select 1 from placement_history where resident_id = ${q(resident.id)}::uuid and created_at > ${q(withdrawal.created_at)}::timestamptz) then
    raise exception 'refused: a placement was recorded after the withdrawal I read';
  end if;

  -- end_date may only change while app.placement_close is on (enforce_placement_history_immutability, 0119).
  perform set_config('app.placement_close', 'on', true);
  delete from placement_history where id = ${q(withdrawal.id)}::uuid and placement_type = 'DeceasedInError' and end_date is null;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'expected to delete the withdrawal row, deleted %', v_n; end if;

  update placement_history set end_date = null
   where id = ${q(death.id)}::uuid and placement_type = 'Deceased' and end_date = ${q(withdrawal.start_date)}::timestamptz;
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'expected to re-open the Deceased row, changed %', v_n; end if;
  perform set_config('app.placement_close', 'off', true);

  if not resident_is_deceased(${q(resident.id)}::uuid) then raise exception 'the resident still does not read deceased'; end if;
  if (select start_date from placement_history where id = ${q(death.id)}::uuid) is distinct from ${q(death.start_date)}::timestamptz then
    raise exception 'the death date moved';
  end if;
end $$;`;

  const receipt = {
    note: `Rows changed by scripts/correct-resident.mjs --restore-death: the withdrawn death of ${restoreCode} put back on its original date.`,
    written_at: new Date().toISOString(),
    database: `${dbLabel} (${projectRef})`,
    command: `node scripts/correct-resident.mjs ${process.argv.slice(2).join(" ")}`,
    restored: restoreCode,
    deleted_row: withdrawal,
    reopened_row_before: death,
    cascade_left_alone: cascadeLive > 0 ? { live_vet_appointments: liveAppts, prescriptions: rxItems.length } : null,
    resident_before: (({ place, deceased, ...row }) => row)(resident),
    placement_history_before: placements.map((p) => p.row),
  };

  if (apply) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(`\nReceipt written first: ${receiptPath}`);
  }

  process.stdout.write(`\n${apply ? "Doing it" : "Trying it (rolled back)"} … `);
  try {
    await query(`begin;\n${block}\n${apply ? "commit" : "rollback"};`);
    console.log("ok");
  } catch (error) {
    console.log("FAILED");
    console.error(error.message);
    console.error(`Nothing was changed.${apply ? " The receipt lists what would have been changed." : ""}`);
    process.exitCode = 1;
    return;
  }

  if (!apply) {
    const line = [
      "node scripts/correct-resident.mjs",
      live ? "--env production" : "",
      `--restore-death ${restoreCode} --date ${restoreDate}`,
      leaveCascade ? "--leave-cascade" : "",
      "--apply",
      live ? `--confirm ${restoreCode}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    console.log(`\nNothing was changed; it runs cleanly. To do it:\n\n  ${line}\n`);
    return;
  }
  const [after] = await query(`select json_build_object('resident', ${residentSql(restoreCode)}) as data`);
  console.log(`\n${restoreCode} now ${after.data.resident.deceased ? "reads deceased (restored)" : "DOES NOT READ DECEASED — check by hand"}; place: ${after.data.resident.place ?? "none"}.`);
}
