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
//                          (Deceased + DeceasedInError) if that happened
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
//     the ones above)
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

import { existsSync, writeFileSync } from "node:fs";
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

const VALUED = ["--remove", "--keep", "--receipt", "--confirm", "--copy"];
const KNOWN = new Set([...VALUED, "--apply", "--force-names", "--drive-trashed", "--merge-into"]);
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
const driveTrashed = flag("--drive-trashed");
const copyFields = (value("--copy") ?? "")
  .split(",")
  .map((f) => f.trim().toLowerCase())
  .filter(Boolean);

if (!removeCode || !keepCode) {
  console.error(
    "Say which resident to remove and which one it duplicates, by code:\n" +
      "  node scripts/correct-resident.mjs --remove R-0240 --keep R-0220",
  );
  process.exit(2);
}
if (removeCode === keepCode) {
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
if (live && apply && code(value("--confirm")) !== removeCode) {
  console.error(
    `Refusing: deleting from the LIVE database needs --confirm ${removeCode} as well as --apply.\n` +
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

console.log(`\nRemove ${removeCode}, keep ${keepCode} — ${dbLabel} (${projectRef})`);

// Everything past here talks to the database, and process.exit() trips a libuv
// assertion on Windows while fetch still holds a socket (load-residents.mjs
// has the same note). So the rest sets process.exitCode and returns instead.
try {
  await run();
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
  const moved = placements.filter((p) => !SEED_PLACEMENTS.has(p.placement_type));
  const intakes = placements.filter((p) => p.placement_type === "Intake").length;
  if (moved.length || intakes !== 1) {
    refusals.push(
      `${removeCode} has been moved since intake (${placements.map((p) => p.placement_type).join(", ") || "no placements"}). ` +
        "That is history: sort it out in the app.",
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
