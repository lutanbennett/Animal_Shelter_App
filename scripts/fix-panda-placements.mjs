// Cut one resident's placement history back to "Intake, then fostered" —
// written for Panda, whose AppSheet history came across with placements
// that never happened (docs/data-migration.md; confirmed with the shelter
// 2026-09-22: intake, then fostered to Lutan in June, nothing else).
//
//   node scripts/fix-panda-placements.mjs --env production              # report, change nothing
//   node scripts/fix-panda-placements.mjs --env production --dry-run    # the whole fix inside begin…rollback
//   node scripts/fix-panda-placements.mjs --env production --apply      # commit it
//   … --resident "Panda" | --resident R-0042      # who (name or code; default Panda)
//   … --carer Lutan                               # the foster carer to match on (default Lutan)
//   … --month 06                                  # the foster month to match on (default June)
//   … --intake <uuid> --foster <uuid>             # pick the two rows by hand when the match is ambiguous
//   … --relink-previous-enclosure                 # also repoint the Foster row at the intake enclosure
//
// It only ever DELETES the rows that shouldn't be there and adjusts
// `end_date` on the two that should. It never invents a placement: if the
// June Foster row is missing, it says so and stops — record the foster
// through the app (resident hub → Foster), which writes the row with the
// right zone, enclosure and carer, then re-run this.
//
// Why SQL and not the app: placement_history is append-only by design
// (0001's immutability trigger, and the app has no "delete a placement"
// action), so removing history that never happened can only be done here.
// Everything runs as one transaction through the Management API — the same
// route apply-migrations.mjs and import-appsheet.mjs use — with assertions
// at the end, so a wrong plan leaves the database untouched. Re-running
// after a successful run is a no-op.

import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";

// Placement days are read in the shelter's timezone: the migrated rows are
// stamped 00:00+07 (import-appsheet.mjs), so a 1 June placement is 31 May in
// UTC and "is this the June foster?" has to be asked in Bangkok time.
const SHELTER_TZ = "Asia/Bangkok";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const env = loadEnv(envName);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const token = env.SUPABASE_ACCESS_TOKEN;
if (!url || !token) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ACCESS_TOKEN are required.");
  process.exit(2);
}
const projectRef = refOf(env);

const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const value = args[i + 1];
  if (!value || value.startsWith("--")) {
    console.error(`${name} needs a value.`);
    process.exit(2);
  }
  return value;
};

const apply = args.includes("--apply");
const dryRun = args.includes("--dry-run");
const relinkPrevious = args.includes("--relink-previous-enclosure");
const residentArg = flag("--resident", "Panda");
const carerArg = flag("--carer", "Lutan");
const monthArg = String(flag("--month", "06")).padStart(2, "0");
const intakeArg = flag("--intake");
const fosterArg = flag("--foster");

if (apply && dryRun) {
  console.error("--apply and --dry-run are mutually exclusive.");
  process.exit(2);
}

const q = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};

async function query(statement) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: statement }),
  });
  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      message = JSON.parse(text).message ?? text;
    } catch {
      // not JSON — keep the raw body
    }
    throw new Error(message);
  }
  return text ? JSON.parse(text) : [];
}

const die = (message) => {
  console.error(`\n${message}`);
  process.exit(1);
};

// ---------------------------------------------------------------------------
// Read the current state
// ---------------------------------------------------------------------------

console.log(`Project ${projectRef} (${envName}).\n`);

// A resident code (R-nnnn) is exact; anything else is matched on any of the
// three name columns, so "Panda" finds her whichever one the shelter uses.
const residentWhere = /^R-\d+$/i.test(residentArg)
  ? `r.resident_code = upper(${q(residentArg)})`
  : `(r.name ilike ${q(residentArg)} or r.thai_name ilike ${q(residentArg)} ` +
    `or r.other_names ilike ${q(`%${residentArg}%`)})`;

const residents = await query(`
  select r.id, r.resident_code, r.name, s.current_status
  from residents r
  join resident_current_state s on s.resident_id = r.id
  where ${residentWhere}
  order by r.resident_code;
`);

if (residents.length === 0) die(`No resident matches ${residentArg}.`);
if (residents.length > 1) {
  console.error("More than one resident matches — re-run with --resident <code>:");
  for (const r of residents) console.error(`  ${r.resident_code}  ${r.name}`);
  process.exit(1);
}
const resident = residents[0];
console.log(`Resident: ${resident.resident_code} ${resident.name} — currently ${resident.current_status}.\n`);

const rows = await query(`
  select
    p.id,
    p.placement_type,
    -- Postgres, not JS, renders the timestamps: start_day is the calendar
    -- day at the shelter, and start_utc is a fixed-width UTC form that is
    -- safe to compare as a string and to send straight back as a literal.
    to_char(p.start_date at time zone ${q(SHELTER_TZ)}, 'YYYY-MM-DD') as start_day,
    to_char(p.end_date at time zone ${q(SHELTER_TZ)}, 'YYYY-MM-DD') as end_day,
    to_char(p.start_date at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US+00') as start_utc,
    to_char(p.end_date at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US+00') as end_utc,
    p.carer_id,
    p.enclosure_id,
    p.previous_enclosure_id,
    p.notes,
    p.created_by,
    to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US+00') as created_utc,
    e.name as enclosure,
    c.name as carer
  from placement_history p
  left join enclosures e on e.id = p.enclosure_id
  left join contacts c on c.id = p.carer_id
  where p.resident_id = ${q(resident.id)}
  order by p.start_date, p.created_at;
`);

const describe = (r) =>
  `  ${r.start_day} → ${(r.end_day ?? "open").padEnd(10)} ${r.placement_type.padEnd(18)} ` +
  `${(r.enclosure ?? "—").padEnd(12)} ${r.carer ? `carer ${r.carer}` : ""}`.trimEnd();

console.log(`Placement history — ${rows.length} row(s):`);
for (const r of rows) console.log(describe(r));

// ---------------------------------------------------------------------------
// Work out the two rows that should survive
// ---------------------------------------------------------------------------

const byId = (id) => rows.find((r) => r.id === id);

let intake;
if (intakeArg) {
  intake = byId(intakeArg);
  if (!intake) die(`--intake ${intakeArg} is not one of this resident's placements.`);
} else {
  const intakes = rows.filter((r) => r.placement_type === "Intake");
  if (intakes.length !== 1) {
    die(
      `Expected exactly one Intake row, found ${intakes.length}. ` +
        "Pick the one to keep with --intake <uuid>.",
    );
  }
  intake = intakes[0];
}

let foster;
if (fosterArg) {
  foster = byId(fosterArg);
  if (!foster) die(`--foster ${fosterArg} is not one of this resident's placements.`);
} else {
  const carerNeedle = carerArg.toLowerCase();
  const fosters = rows.filter(
    (r) =>
      r.placement_type === "Foster" &&
      (r.carer ?? "").toLowerCase().includes(carerNeedle) &&
      r.start_day.slice(5, 7) === monthArg,
  );
  if (fosters.length === 0) {
    die(
      `No Foster row in month ${monthArg} with a carer matching "${carerArg}".\n` +
        "This script never invents a placement. Record the foster through the app\n" +
        "(resident hub → Foster) so the row gets the right zone, enclosure and\n" +
        "carer, then run this again — or name the row with --foster <uuid>.",
    );
  }
  if (fosters.length > 1) {
    console.error(`\n${fosters.length} Foster rows match "${carerArg}" — pick one with --foster <uuid>:`);
    for (const r of fosters) console.error(`  ${r.id}  ${r.start_day}  carer ${r.carer}`);
    process.exit(1);
  }
  foster = fosters[0];
}

if (intake.id === foster.id) die("The Intake and Foster rows must be different.");
if (foster.start_utc <= intake.start_utc) {
  die(
    `The Foster row (${foster.start_day}) does not start after the Intake row ` +
      `(${intake.start_day}) — end_after_start would reject the result.`,
  );
}
if (!foster.carer_id) die("The Foster row has no carer on it — name the right row with --foster <uuid>.");

const doomed = rows.filter((r) => r.id !== intake.id && r.id !== foster.id);
const intakeNeedsEnd = intake.end_utc !== foster.start_utc;
const fosterNeedsOpen = foster.end_utc !== null;
const previousWrong =
  String(foster.previous_enclosure_id ?? "") !== String(intake.enclosure_id ?? "");
const previousNeedsRelink = relinkPrevious && previousWrong;

console.log("\nPlan:");
console.log(`  keep    ${intake.start_day} Intake`);
console.log(`  keep    ${foster.start_day} Foster to ${foster.carer}`);
for (const r of doomed) console.log(`  DELETE  ${r.start_day} ${r.placement_type}`);
if (intakeNeedsEnd) {
  console.log(`  end the Intake row at ${foster.start_day} (was ${intake.end_day ?? "open"})`);
}
if (fosterNeedsOpen) console.log(`  reopen the Foster row (end_date was ${foster.end_day})`);
if (previousNeedsRelink) {
  console.log("  repoint the Foster row's previous_enclosure_id at the Intake enclosure");
}

if (previousWrong && !relinkPrevious) {
  console.log(
    "\nNote: the Foster row remembers a different enclosure as the one she left,\n" +
      "      which is where a later Return to shelter would offer to put her back.\n" +
      "      That column is immutable, so fixing it means rewriting the row —\n" +
      "      re-run with --relink-previous-enclosure if you want that too.",
  );
}

if (!doomed.length && !intakeNeedsEnd && !fosterNeedsOpen && !previousNeedsRelink) {
  console.log("\nNothing to do — the history already reads Intake then Foster.");
  process.exit(0);
}

if (!apply && !dryRun) {
  console.log("\nReport only. Re-run with --dry-run to rehearse it, or --apply to commit.");
  process.exit(0);
}

// ---------------------------------------------------------------------------
// The fix, as one transaction
// ---------------------------------------------------------------------------

const sql = [];

// Deleting a wrong Deceased row — or any row of a resident the database
// still reads as dead — trips the read-only lock (0026). Same bypass the
// import uses: transaction-local, with the resulting state asserted below.
sql.push(`select set_config('app.deceased_lock_bypass', 'on', true);`);

if (doomed.length) {
  sql.push(
    `delete from placement_history where resident_id = ${q(resident.id)} ` +
      `and id not in (${[intake.id, foster.id].map(q).join(", ")});`,
  );
}

// Close the Intake row before reopening the Foster row: setting an end_date
// can never open a second placement, so
// placement_history_one_active_per_resident holds after every statement.
if (intakeNeedsEnd) {
  sql.push(`update placement_history set end_date = ${q(foster.start_utc)} where id = ${q(intake.id)};`);
}
// Skipped when the row is about to be rewritten anyway, below.
if (fosterNeedsOpen && !previousNeedsRelink) {
  sql.push(`update placement_history set end_date = null where id = ${q(foster.id)};`);
}

if (previousNeedsRelink) {
  // previous_enclosure_id is immutable (0001), so the row is rewritten under
  // its own id, keeping its author and created_at. The delete leaves the
  // resident with no open placement, and the insert's close-prior trigger
  // finds nothing to close — the Intake row is already ended above.
  sql.push(`delete from placement_history where id = ${q(foster.id)};`);
  sql.push(`insert into placement_history
    (id, resident_id, placement_type, start_date, end_date, zone_id, enclosure_id,
     previous_enclosure_id, carer_id, notes, created_by, created_at)
    values (${q(foster.id)}, ${q(resident.id)}, 'Foster', ${q(foster.start_utc)}, null,
      (select zone_id from enclosures where id = ${q(foster.enclosure_id)}),
      ${q(foster.enclosure_id)}, ${q(intake.enclosure_id)}, ${q(foster.carer_id)},
      ${q(foster.notes)}, ${q(foster.created_by)}, ${q(foster.created_utc)});`);
  // The insert's close-prior trigger re-ends any open row at the foster date;
  // the Intake row is already closed there, so this only restates it.
  sql.push(`update placement_history set end_date = ${q(foster.start_utc)} where id = ${q(intake.id)};`);
}

sql.push(`select set_config('app.deceased_lock_bypass', 'off', true);`);

// Assertions — a failure here aborts the whole transaction.
sql.push(`do $$
declare
  v_rows int;
  v_open int;
  v_status text;
begin
  select count(*) into v_rows from placement_history where resident_id = ${q(resident.id)};
  if v_rows <> 2 then raise exception '% placement row(s) left, expected 2', v_rows; end if;

  select count(*) into v_open from placement_history
    where resident_id = ${q(resident.id)} and end_date is null;
  if v_open <> 1 then raise exception '% open placement(s), expected 1', v_open; end if;

  if not exists (
    select 1 from placement_history
    where id = ${q(foster.id)} and placement_type = 'Foster' and end_date is null
      and carer_id = ${q(foster.carer_id)}
  ) then raise exception 'the Foster row is not the open one'; end if;

  if not exists (
    select 1 from placement_history
    where id = ${q(intake.id)} and placement_type = 'Intake'
      and end_date = ${q(foster.start_utc)}
  ) then raise exception 'the Intake row does not end where the Foster row starts'; end if;

  select current_status into v_status from resident_current_state
    where resident_id = ${q(resident.id)};
  if v_status <> 'Fostered' then raise exception 'resident reads as %, expected Fostered', v_status; end if;
end $$;`);

const transaction = `begin;\n${sql.join("\n")}\n${dryRun ? "rollback" : "commit"};`;

process.stdout.write(`\n${dryRun ? "Dry run" : "Applying"} — ${sql.length} statements … `);
try {
  await query(transaction);
  console.log("ok");
} catch (error) {
  console.log("FAILED");
  console.error(error.message);
  console.error("Nothing was changed.");
  process.exit(1);
}

if (dryRun) {
  console.log("Rolled back — nothing was kept. Re-run with --apply to commit it.");
} else {
  console.log(
    `\nDone. ${resident.name} now reads: Intake ${intake.start_day} → ` +
      `${foster.start_day}, then fostered to ${foster.carer}.`,
  );
}
