// Remove a resident that was created twice, keeping the original. Dev only.
//
//   node scripts/correct-resident.mjs --remove R-0240 --keep R-0220
//       dry run: checks everything, runs the delete inside begin…rollback,
//       prints what it would touch and the exact command to apply it
//
//   node scripts/correct-resident.mjs --remove R-0240 --keep R-0220 --apply --receipt <file.json>
//       writes every row it is about to delete to <file.json> FIRST, then
//       deletes them in one begin…commit
//
// Why this exists (backlog, filed 2026-10-06): bulk uploads bring duplicates,
// and fixing one depended on finding a chat session willing to do it. On
// 2026-10-05 one session deleted R-0240 and another refused the same request
// for R-0220. A fixed script anyone can read, run and re-run is the answer to
// that inconsistency, as load-residents.mjs was for loads
// (docs/decisions/2026-10-09-resident-corrections-script.md).
//
// It is meant to be boring. It refuses rather than guesses, and everything it
// cannot do safely is left out with a reason, not half done.
//
// WHAT IT REMOVES. Only a resident with no real history: exactly what the
// intake form (record_intake) creates, and nothing added since —
//   residents              the row itself
//   placement_history      exactly one row, the open Intake placement
//   resident_diets         at most one row (and its resident_diet_rounds,
//                          which go with it by ON DELETE CASCADE)
//   weight                 at most one row: the intake weight, dated the
//                          intake date, not from a vet visit, not archived
//   translations           the resident's machine translations, which the
//                          residents_drop_translations trigger removes
// The audit_log keeps its rows (it cannot be edited, 0121): the resident's
// creation and this deletion both stay on record there.
//
// WHAT MAKES IT REFUSE (each is history a human must look at, or a link
// that would silently go blank):
//   - vet appointments, blood tests, prescriptions, immunizations, procedures,
//     adoption updates, photos or files (attachments)
//   - a donation earmarked for it, or being the website's featured resident
//     (both of those links are ON DELETE SET NULL: a delete would not fail,
//     it would quietly lose the link, which is why they are checked here)
//   - a Drive folder, a profile photo, or a deceased archive
//   - more than one placement, or one that is not the open Intake (it has been
//     moved, fostered, adopted, sent to hospital or has died)
//   - more than one diet, or a weight that is not the intake weight
//   - names that do not look like the same animal (scripts/lib/near-names.mjs)
//     unless --force-names
//   - any environment but the dev database (below)
//
// WHY THERE IS NO --merge-into. Moving the duplicate's history onto the
// original is not clean: placement_history.resident_id cannot be changed
// (enforce_placement_history_immutability, 0001), so a merge would mean
// deleting and re-creating placements, which is rewriting the record this
// guard exists to protect. And deciding which of two names, sizes or notes is
// right is a human judgement. So a resident with any history is refused, and
// the fix is made by hand in the app. The original (--keep) is never edited:
// it is shown before and after, and the transaction checks it is unchanged.
//
// DEV ONLY, BY CONSTRUCTION. `--env` is accepted like the other scripts so
// that `--env production` gets a plain refusal instead of an unknown flag, but
// only `test` passes, and then the Supabase URL itself must be the dev project
// (src/lib/app-env.ts). A shell variable or a swapped .env.local pointing
// elsewhere is refused too. There is no override flag.
//
// THE FINDING behind "--remove" (2026-10-09): the brief asked how R-0240's
// delete got past 0119, which guards placement history. It never had to:
// 0119 and 0001 guard UPDATE only. Nothing guards DELETE on placement_history
// except the deceased lock, the foreign keys have no cascade but are satisfied
// by deleting children first, and the Management API runs as the database
// owner, so row security does not apply. This script relies on that, openly.
// Through the app, Admin's placement_history_admin_delete policy (0153) can
// do the same; that is filed on the backlog, not fixed here.

import { existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

const KNOWN = new Set(["--remove", "--keep", "--apply", "--receipt", "--force-names", "--merge-into"]);
const unknown = args.filter((a, i) => a.startsWith("--") && !KNOWN.has(a) && !["--remove", "--keep", "--receipt"].includes(args[i - 1]));
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(" ")}. See the top of scripts/correct-resident.mjs.`);
  process.exit(2);
}

if (flag("--merge-into")) {
  console.error(
    "--merge-into is not available, on purpose. Moving one resident's history onto another means\n" +
      "deleting and re-creating placement history, which the database protects from being changed.\n" +
      "If the duplicate has history, move what matters by hand in the app, then remove it.",
  );
  process.exit(2);
}

const code = (raw) => (raw && /^r-?\d+$/i.test(raw) ? `R-${raw.replace(/^r-?/i, "").padStart(4, "0")}` : null);
const removeCode = code(value("--remove"));
const keepCode = code(value("--keep"));
const apply = flag("--apply");
const forceNames = flag("--force-names");
const receiptArg = value("--receipt");

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

let receiptPath = null;
if (apply) {
  if (!receiptArg) {
    console.error("--apply needs --receipt <file.json>: the removed rows are written there before anything is deleted.");
    process.exit(2);
  }
  receiptPath = resolve(receiptArg);
  if (existsSync(receiptPath)) {
    console.error(`${receiptPath} already exists. Choose a new file name; a receipt is never overwritten.`);
    process.exit(2);
  }
  if (!existsSync(dirname(receiptPath))) {
    console.error(`The folder ${dirname(receiptPath)} does not exist.`);
    process.exit(2);
  }
}

// ---------------------------------------------------------------------------
// Dev only
// ---------------------------------------------------------------------------

if (envName !== "test") {
  console.error(`Refusing: this script only ever runs against the dev database, and --env ${envName} is not it.`);
  process.exit(2);
}
const env = loadEnv(envName);
if (!env.NEXT_PUBLIC_SUPABASE_URL || appEnvForSupabaseUrl(env.NEXT_PUBLIC_SUPABASE_URL) !== "dev") {
  console.error(
    `Refusing: NEXT_PUBLIC_SUPABASE_URL (${env.NEXT_PUBLIC_SUPABASE_URL ?? "not set"}) is not the dev database.`,
  );
  process.exit(2);
}
if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required (it is what reaches the Management API).");
  process.exit(2);
}
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

const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

// Each link that means "this resident has real history". `where` is SQL with
// :id for the resident's id. Used for the first check and again inside the
// transaction, so a row added between the two still stops the delete.
const BLOCKERS = [
  ["vet appointment(s)", "vet_appointments where resident_id = :id"],
  ["blood test(s)", "blood_tests where resident_id = :id"],
  ["prescription(s)", "prescriptions where resident_id = :id"],
  ["immunization(s)", "immunization_records where resident_id = :id"],
  ["procedure(s)", "procedures where resident_id = :id"],
  ["adoption update(s)", "adoption_updates where resident_id = :id"],
  ["photo(s) or file(s)", "attachments where owner_type = 'resident' and owner_id = :id"],
  ["donation(s) earmarked for it", "donations where designation_resident_id = :id"],
  ["the website's featured resident setting", "site_content where featured_resident_id = :id"],
];
const blockerSql = (id) =>
  BLOCKERS.map(([label, where]) => `${q(label)}, (select count(*) from ${where.replaceAll(":id", id)})`).join(",\n    ");

// Where a resident is now, for printing.
const placeSql = (id) => `(select coalesce(z.name || ' / ' || e.name, p.placement_type::text)
    from placement_history p
    left join enclosures e on e.id = p.enclosure_id
    left join zones z on z.id = e.zone_id
    where p.resident_id = ${id} and p.end_date is null
    order by p.start_date desc, p.created_at desc limit 1)`;

console.log(`\nRemove ${removeCode}, keep ${keepCode} — dev database (${projectRef})`);

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
    'remove', (select to_jsonb(r) || jsonb_build_object('place', ${placeSql("r.id")}) from residents r where r.resident_code = ${q(removeCode)}),
    'keep', (select to_jsonb(r) || jsonb_build_object('place', ${placeSql("r.id")}) from residents r where r.resident_code = ${q(keepCode)})
  ) as data`);
  const { remove, keep } = found.data;

  if (!remove || !keep) {
    for (const [c, row] of [[removeCode, remove], [keepCode, keep]]) {
      if (!row) console.error(`There is no resident ${c} in the dev database.`);
    }
    console.error("Nothing was changed.");
    process.exitCode = 1;
    return;
  }

  const id = `${q(remove.id)}::uuid`;
  const [detail] = await query(`select json_build_object(
    'placement_history', coalesce((select json_agg(to_jsonb(p) order by p.start_date, p.created_at) from placement_history p where p.resident_id = ${id}), '[]'::json),
    'resident_diets', coalesce((select json_agg(to_jsonb(d) || jsonb_build_object('diet_name', t.name) order by d.start_date) from resident_diets d left join diet_types t on t.id = d.diet_type_id where d.resident_id = ${id}), '[]'::json),
    'resident_diet_rounds', coalesce((select json_agg(to_jsonb(x)) from resident_diet_rounds x join resident_diets d on d.id = x.resident_diet_id where d.resident_id = ${id}), '[]'::json),
    'weight', coalesce((select json_agg(to_jsonb(w) order by w.date) from weight w where w.resident_id = ${id}), '[]'::json),
    'translations', coalesce((select json_agg(to_jsonb(t)) from translations t where t.table_name = 'residents' and t.row_id = ${q(remove.id)}), '[]'::json),
    'blockers', json_build_object(
    ${blockerSql(id)}),
    'origin_shared', (select count(*) from residents r where r.group_origin_id = ${remove.group_origin_id ? `${q(remove.group_origin_id)}::uuid` : "null"} and r.id <> ${id})
  ) as data`);
  const rows = detail.data;
  // The diet name is for printing only; the receipt holds the rows as stored.
  const diets = rows.resident_diets.map(({ diet_name, ...row }) => ({ row, diet_name }));

  // -------------------------------------------------------------------------
  // Refusals
  // -------------------------------------------------------------------------

  const refusals = [];

  const sameName = remove.name.trim().toLowerCase() === keep.name.trim().toLowerCase();
  const nameReason = sameName ? "the same name" : nearMatchReason(
    { name: remove.name, thaiName: remove.thai_name },
    { name: keep.name, thaiName: keep.thai_name },
  );
  if (!nameReason && !forceNames) {
    refusals.push(
      `"${remove.name}" and "${keep.name}" do not look like the same animal. If they are, add --force-names.`,
    );
  }

  for (const [label, count] of Object.entries(rows.blockers)) {
    if (Number(count) > 0) refusals.push(`${removeCode} has ${count} ${label}.`);
  }
  if (remove.drive_folder_id) refusals.push(`${removeCode} has a Google Drive folder.`);
  if (remove.profile_photo_drive_file_id) refusals.push(`${removeCode} has a profile photo.`);
  if (remove.deceased_summary_drive_file_id || remove.deceased_index_drive_file_id || remove.deceased_archived_at) {
    refusals.push(`${removeCode} has a deceased archive.`);
  }

  const placements = rows.placement_history;
  const intakeOnly =
    placements.length === 1 && placements[0].placement_type === "Intake" && placements[0].end_date === null;
  if (!intakeOnly) {
    refusals.push(
      `${removeCode} has ${placements.length} placement record(s) (${placements.map((p) => p.placement_type).join(", ") || "none"}); ` +
        "only a resident still on its single intake placement can be removed.",
    );
  }
  if (diets.length > 1) refusals.push(`${removeCode}'s diet has been changed (${diets.length} diet records).`);
  const weights = rows.weight;
  const intakeWeight =
    weights.length === 0 ||
    (weights.length === 1 &&
      weights[0].date === remove.intake_date &&
      !weights[0].vet_appointment_id &&
      !weights[0].archived_at);
  if (!intakeWeight) {
    refusals.push(`${removeCode} has weight records beyond its intake weight (${weights.length} in all).`);
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

  console.log(`\nTo remove:\n  ${describe(remove)}`);
  console.log(`\nTo keep (the original):\n  ${describe(keep)}`);
  console.log(
    nameReason
      ? `\nWhy they look like the same animal: ${nameReason}.`
      : `\nThe names do not look alike${forceNames ? " (going ahead: --force-names was given)" : ""}.`,
  );

  if (refusals.length) {
    console.error(`\nRefusing — ${refusals.length} reason(s):`);
    for (const r of refusals) console.error(`  - ${r}`);
    console.error("\nNothing was changed.");
    if (refusals.length > (nameReason || forceNames ? 0 : 1)) {
      console.error("A resident with history needs a person to decide what to keep: sort it out in the app instead.");
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nRows that will be deleted:");
  console.log(`  residents             1  ${removeCode} ${remove.name}`);
  console.log(`  placement_history     1  Intake from ${String(placements[0].start_date).slice(0, 10)}`);
  for (const d of diets) {
    console.log(`  resident_diets        1  ${d.diet_name ?? "diet"} from ${d.row.start_date}`);
  }
  if (rows.resident_diet_rounds.length) {
    console.log(`  resident_diet_rounds  ${rows.resident_diet_rounds.length}  (go with the diet)`);
  }
  for (const w of weights) console.log(`  weight                1  ${w.weight_kg} kg on ${w.date}`);
  if (rows.translations.length) {
    console.log(`  translations          ${rows.translations.length}  (machine translations of its text)`);
  }
  console.log("\nLeft as they are:");
  console.log(`  ${keepCode} — not edited in any way; checked unchanged inside the transaction.`);
  console.log("  audit_log — keeps the record of both the creation and this removal.");
  if (remove.group_origin_id && Number(rows.origin_shared) === 0) {
    console.log("  its group origin — no other resident uses it now; remove it in Settings if it is unwanted.");
  }

  // -------------------------------------------------------------------------
  // The transaction
  // -------------------------------------------------------------------------

  const ids = (list) => (list.length ? `array[${list.map((r) => q(r.id)).join(", ")}]::uuid[]` : "'{}'::uuid[]");
  const block = `do $$
declare
  v_keep_before jsonb;
  v_n int;
  v_blockers json;
begin
  select to_jsonb(r) into v_keep_before from residents r where r.resident_code = ${q(keepCode)};

  -- The same checks as before the run, in case something was added since.
  select json_build_object(
    ${blockerSql(id)}) into v_blockers;
  if exists (select 1 from json_each_text(v_blockers) where value::int > 0) then
    raise exception 'refused: % now has history (%)', ${q(removeCode)}, v_blockers;
  end if;

  delete from resident_diets where id = any(${ids(diets.map((d) => d.row))});
  get diagnostics v_n = row_count;
  if v_n <> ${diets.length} then raise exception 'expected to delete ${diets.length} diet row(s), deleted %', v_n; end if;

  delete from weight where id = any(${ids(weights)});
  get diagnostics v_n = row_count;
  if v_n <> ${weights.length} then raise exception 'expected to delete ${weights.length} weight row(s), deleted %', v_n; end if;

  delete from placement_history where id = any(${ids(placements)});
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'expected to delete 1 placement, deleted %', v_n; end if;

  -- Any row added since the check that the foreign keys know about makes this
  -- fail (none of them cascade), which rolls everything back.
  delete from residents where id = ${id} and resident_code = ${q(removeCode)};
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'expected to delete resident ${removeCode}, deleted %', v_n; end if;

  if (select to_jsonb(r) from residents r where r.resident_code = ${q(keepCode)}) is distinct from v_keep_before then
    raise exception '${keepCode} changed during the run';
  end if;
end $$;`;

  const receipt = {
    note: `Rows removed by scripts/correct-resident.mjs: ${removeCode} as a duplicate of ${keepCode}.`,
    written_at: new Date().toISOString(),
    database: projectRef,
    command: `node scripts/correct-resident.mjs ${process.argv.slice(2).join(" ")}`,
    removed: removeCode,
    kept: keep,
    rows: {
      residents: [Object.fromEntries(Object.entries(remove).filter(([k]) => k !== "place"))],
      placement_history: placements,
      resident_diets: diets.map((d) => d.row),
      resident_diet_rounds: rows.resident_diet_rounds,
      weight: weights,
      translations: rows.translations,
    },
  };
  // The kept resident without the printing-only field.
  delete receipt.kept.place;

  if (apply) {
    writeFileSync(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    console.log(`\nReceipt written first: ${receiptPath}`);
  }

  process.stdout.write(`\n${apply ? "Removing" : "Dry run (rolled back)"} … `);
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
    console.log("\nNothing was changed. The delete runs cleanly. To do it for real, copy this line:");
    const stamp = new Date().toISOString().slice(0, 10);
    console.log(
      `\n  node scripts/correct-resident.mjs --remove ${removeCode} --keep ${keepCode}${forceNames ? " --force-names" : ""} --apply --receipt removed-${removeCode}-${stamp}.json\n`,
    );
    return;
  }

  // Read back: the removed code is gone and the kept resident is as it was.
  const [after] = await query(`select json_build_object(
    'gone', not exists (select 1 from residents where resident_code = ${q(removeCode)}),
    'keep', (select to_jsonb(r) || jsonb_build_object('place', ${placeSql("r.id")}) from residents r where r.resident_code = ${q(keepCode)})
  ) as data`);
  console.log(`\n${removeCode} ${after.data.gone ? "is gone" : "IS STILL THERE — check by hand"}.`);
  console.log(`\n${keepCode} after:\n  ${describe(after.data.keep)}`);
}
