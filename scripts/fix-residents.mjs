// Correct residents' names, Thai names and enclosures from a small file.
//
//   node scripts/fix-residents.mjs --file corrections.json
//       dry run: reads every resident named in the file, checks each one,
//       runs the whole change inside begin…rollback and prints, per resident,
//       what would change from and to
//
//   node scripts/fix-residents.mjs --env production --file corrections.json --apply --confirm 18
//       does it: writes the "before" of every resident it is about to change to
//       a receipt on the Desktop FIRST, then makes every change in one
//       begin…commit. --confirm is the number of residents in the file.
//
// Without --env it works on the test database, as the other scripts do.
//
// THE FILE is JSON, one entry per resident. "was" says what you expect to find
// today; the run refuses if the database says something else, because someone
// may have fixed it by hand in the meantime:
//
//   { "residents": [
//     { "code": "R-0197", "name": "Mon (2)", "thai_name": "ม่อน 2",
//       "was": { "name": "Mon", "thai_name": "มอม" } },
//     { "code": "R-0010", "enclosure": "Main Zone / Enclosure 1 (Main Room)",
//       "was": { "enclosure": "Right Zone / Enclosure 1" } }
//   ] }
//
// An enclosure is written "Zone / Enclosure", exactly as the other scripts and
// the app print a resident's place. Anything left out of an entry is not touched.
//
// ONE SCRIPT, NOT TWO. A rename and a move are different operations underneath,
// but a correction round is one list the shelter answered, and one file with one
// receipt and one all-or-nothing transaction is easier to review than two.
// (docs/decisions/2026-10-19-resident-renames-script.md)
//
// A MOVE is made the way the app's "move" does it (src/lib/placements/move.ts):
// one new ChangeEnclosure row in placement_history, and the
// placement_history_close_prior trigger ends the old one. placement_history is
// never edited. The same refusals apply: not into the Lifecycle zone, not a
// deceased, hospitalised, fostered or adopted resident, not to where it already is.
//
// A RENAME touches residents.name and residents.thai_name only. Names are not in
// the translations table (translatable_fields lists bio, temperament_notes and
// past_story_notes), so nothing there goes stale and nothing is dropped.
//
// WHAT MAKES IT REFUSE (nothing is changed unless every row passes):
//   - a code that does not exist, or a resident recorded as deceased
//   - today's value is neither the "was" nor already the new one
//   - a new name another resident already has (case ignored), or two entries
//     asking for the same name. A different dog with that name is a person's call.
//   - an enclosure that does not exist, is ambiguous, or is in the Lifecycle zone
//   - a move for a resident in hospital, fostered or adopted
// A row that is already done (the app was used first) is skipped and said so.
//
// WHICH DATABASE. Same guards as scripts/correct-resident.mjs: --env test must
// reach the dev project, --env production must reach LIVE_REF, both checked
// against the Supabase URL itself; --env uat is refused.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { appEnvForSupabaseUrl } from "../src/lib/app-env.ts";

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const flag = (name) => args.includes(name);
const value = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? null) : null;
};

const VALUED = ["--file", "--receipt", "--confirm"];
const KNOWN = new Set([...VALUED, "--apply"]);
const unknown = args.filter((a, i) => a.startsWith("--") && !KNOWN.has(a) && !VALUED.includes(args[i - 1]));
if (unknown.length) {
  console.error(`Unknown option(s): ${unknown.join(" ")}. See the top of scripts/fix-residents.mjs.`);
  process.exit(2);
}
const apply = flag("--apply");

// ---------------------------------------------------------------------------
// The file
// ---------------------------------------------------------------------------

const code = (raw) => (raw && /^r-?\d+$/i.test(String(raw).trim()) ? `R-${String(raw).trim().replace(/^r-?/i, "").padStart(4, "0")}` : null);
const SETTABLE = ["name", "thai_name", "enclosure"];

if (!value("--file")) {
  console.error("Say which file holds the corrections:\n  node scripts/fix-residents.mjs --file corrections.json");
  process.exit(2);
}
const filePath = resolve(value("--file"));
if (!existsSync(filePath)) {
  console.error(`${filePath} does not exist.`);
  process.exit(2);
}
let entries;
try {
  entries = JSON.parse(readFileSync(filePath, "utf8")).residents;
} catch (error) {
  console.error(`Could not read ${filePath} as JSON: ${error.message}`);
  process.exit(2);
}
if (!Array.isArray(entries) || entries.length === 0) {
  console.error('The file must look like { "residents": [ { "code": "R-0001", "name": "New name", "was": { "name": "Old name" } } ] }.');
  process.exit(2);
}
const fileProblems = [];
const seenCodes = new Set();
for (const [i, e] of entries.entries()) {
  const c = code(e?.code);
  const label = c ?? `entry ${i + 1}`;
  if (!c) fileProblems.push(`Entry ${i + 1} has no usable "code" (like R-0197).`);
  else if (seenCodes.has(c)) fileProblems.push(`${c} appears twice.`);
  else seenCodes.add(c);
  e.code = c;
  const changes = SETTABLE.filter((f) => e?.[f] !== undefined);
  if (changes.length === 0) fileProblems.push(`${label} asks for no change (give "name", "thai_name" or "enclosure").`);
  for (const f of changes) {
    if (typeof e[f] !== "string" || e[f].trim() === "") fileProblems.push(`${label}: "${f}" must be some text (clearing a detail is not done here).`);
    else e[f] = e[f].trim();
    if (e.was?.[f] === undefined) fileProblems.push(`${label}: "${f}" needs a matching "was" so the run can tell if it has changed since.`);
  }
  const extra = Object.keys(e ?? {}).filter((k) => !["code", "was", ...SETTABLE].includes(k));
  if (extra.length) fileProblems.push(`${label}: unknown field(s) ${extra.join(", ")}.`);
}
if (fileProblems.length) {
  console.error(`The file has ${fileProblems.length} problem(s):`);
  for (const p of fileProblems) console.error(`  - ${p}`);
  console.error("\nNothing was changed.");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Which database
// ---------------------------------------------------------------------------

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
if (live && apply && String(value("--confirm")) !== String(entries.length)) {
  console.error(
    `Refusing: changing the LIVE database needs --confirm ${entries.length} (the number of residents in the file) as well as --apply.\n` +
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

// The receipt goes on the Desktop, not in the repo (the repo is public). Never overwritten.
const desktop = [join(homedir(), "OneDrive", "Desktop"), join(homedir(), "Desktop")].find(existsSync) ?? homedir();
function receiptFile() {
  if (value("--receipt")) return resolve(value("--receipt"));
  const base = join(desktop, `corrected-residents-${live ? "live" : "test"}-${new Date().toISOString().slice(0, 10)}`);
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

console.log(`\nCorrect ${entries.length} resident(s) from ${filePath} — ${dbLabel} (${projectRef})`);

// process.exit() trips a libuv assertion on Windows while fetch holds a socket,
// so past here the script sets process.exitCode and returns.
try {
  await run();
} catch (error) {
  console.error(`\nCould not read the database: ${error.message}\nNothing was changed.`);
  process.exitCode = 1;
}

async function run() {
  const codes = entries.map((e) => q(e.code)).join(", ");
  const [found] = await query(`select json_build_object(
    'residents', coalesce((select json_agg(json_build_object(
        'row', to_jsonb(r),
        'deceased', resident_is_deceased(r.id),
        'status', (select s.current_status from resident_current_state s where s.resident_id = r.id),
        'open', (select to_jsonb(p) from placement_history p where p.resident_id = r.id and p.end_date is null
                  order by p.start_date desc, p.created_at desc limit 1)))
      from residents r where r.resident_code in (${codes})), '[]'::json),
    'names', (select json_agg(json_build_object('code', resident_code, 'name', name)) from residents),
    'enclosures', (select json_agg(json_build_object('id', e.id, 'zone_id', e.zone_id, 'zone', z.name, 'name', e.name))
                   from enclosures e join zones z on z.id = e.zone_id)
  ) as data`);
  const { residents, names, enclosures } = found.data;
  const byCode = new Map(residents.map((r) => [r.row.resident_code, r]));
  const placeName = (e) => `${e.zone} / ${e.name}`;
  const placeOf = (open) => {
    if (!open) return null;
    const e = enclosures.find((x) => x.id === open.enclosure_id);
    return e ? placeName(e) : open.placement_type;
  };

  const refusals = [];
  const plans = [];
  for (const entry of entries) {
    const r = byCode.get(entry.code);
    if (!r) {
      refusals.push(`${entry.code} does not exist in the ${dbLabel}.`);
      continue;
    }
    const plan = { code: entry.code, before: r.row, place: placeOf(r.open), changes: [], moveTo: null, closes: r.open };
    const current = { name: r.row.name, thai_name: r.row.thai_name, enclosure: plan.place };
    for (const f of SETTABLE) {
      if (entry[f] === undefined) continue;
      if (current[f] === entry[f]) {
        plan.changes.push({ field: f, from: current[f], to: entry[f], done: true });
      } else if (current[f] !== entry.was[f]) {
        refusals.push(
          `${entry.code} ${f} is "${current[f] ?? "(blank)"}", not "${entry.was[f]}" as the file expects, and not "${entry[f]}" either. ` +
            "Someone may have changed it: check the resident in the app and update the file.",
        );
      } else {
        plan.changes.push({ field: f, from: current[f], to: entry[f], done: false });
      }
    }
    const pending = plan.changes.filter((c) => !c.done);
    if (pending.length && r.deceased) {
      refusals.push(`${entry.code} is recorded as deceased, so its record is locked. Withdraw the death in the app first if that was a mistake.`);
    }
    const move = pending.find((c) => c.field === "enclosure");
    if (move) {
      const matches = enclosures.filter((e) => placeName(e) === move.to);
      if (matches.length !== 1) {
        refusals.push(`${entry.code}: "${move.to}" matches ${matches.length} enclosures (it must match exactly one). Write it as "Zone / Enclosure".`);
      } else if (matches[0].zone === "Lifecycle") {
        refusals.push(`${entry.code}: "${move.to}" is a Lifecycle place, not a real enclosure. Leaving or returning is done in the app.`);
      } else if (["Hospitalised", "Fostered", "Adopted"].includes(r.status)) {
        refusals.push(`${entry.code} is ${r.status.toLowerCase()}, so it cannot be moved to an enclosure. Use the app's return step first.`);
      } else {
        plan.moveTo = matches[0];
      }
    }
    plans.push(plan);
  }

  // A new name another resident already has (the loader's check, and why it exists:
  // two dogs with one name get mixed up on every list). Judged on the final state.
  const finalNames = new Map(names.map((n) => [n.code, n.name]));
  for (const p of plans) {
    const c = p.changes.find((x) => x.field === "name");
    if (c) finalNames.set(p.code, c.to);
  }
  for (const p of plans) {
    const c = p.changes.find((x) => x.field === "name" && !x.done);
    if (!c) continue;
    const clash = [...finalNames].find(([other, n]) => other !== p.code && n.trim().toLowerCase() === c.to.toLowerCase());
    if (clash) {
      refusals.push(`${p.code} cannot be called "${c.to}": ${clash[0]} already has that name. If they really are the same dog, that is a duplicate to remove, not a rename.`);
    }
  }

  // -------------------------------------------------------------------------
  // What will happen
  // -------------------------------------------------------------------------

  console.log("");
  for (const p of plans) {
    console.log(`${p.code}  ${p.before.name}${p.before.thai_name ? ` (${p.before.thai_name})` : ""}  — now in ${p.place ?? "no open placement"}`);
    for (const c of p.changes) {
      console.log(`    ${c.field === "enclosure" ? "moves" : c.field}: ${c.from ?? "(blank)"}  →  ${c.to}${c.done ? "   (already done — skipped)" : ""}`);
    }
  }

  if (refusals.length) {
    console.error(`\nNot done — ${refusals.length} reason(s):`);
    for (const r of refusals) console.error(`  - ${r}`);
    console.error("\nNothing was changed.");
    process.exitCode = 1;
    return;
  }

  const todo = plans.filter((p) => p.changes.some((c) => !c.done));
  if (todo.length === 0) {
    console.log("\nEvery change in the file is already in place. Nothing to do.");
    return;
  }

  // -------------------------------------------------------------------------
  // The transaction
  // -------------------------------------------------------------------------

  const stmts = [];
  for (const p of todo) {
    const id = `${q(p.before.id)}::uuid`;
    const sets = p.changes.filter((c) => !c.done && c.field !== "enclosure");
    const unchanged = `array[${sets.map((c) => q(c.field)).concat(["'updated_at'"]).join(", ")}]::text[]`;
    if (sets.length) {
      stmts.push(`  select to_jsonb(r) into v_before from residents r where r.id = ${id};
  update residents set ${sets.map((c) => `${c.field} = ${q(c.to)}`).join(", ")} where id = ${id};
  get diagnostics v_n = row_count;
  if v_n <> 1 then raise exception 'expected to update ${p.code}, updated %', v_n; end if;
  select to_jsonb(r) into v_after from residents r where r.id = ${id};
  if (v_after - ${unchanged}) is distinct from (v_before - ${unchanged}) then
    raise exception '${p.code} changed in a detail it should not have';
  end if;`);
    }
    if (p.moveTo) {
      // The app's own move: one ChangeEnclosure row; the close_prior trigger ends the old one.
      const prior = p.closes;
      const start = prior
        ? `greatest(now(), ${q(prior.start_date)}::timestamptz + interval '1 second')`
        : "now()";
      stmts.push(`  insert into placement_history (resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, notes)
    values (${id}, 'ChangeEnclosure', ${start}, ${q(p.moveTo.zone_id)}::uuid, ${q(p.moveTo.id)}::uuid, ${prior?.enclosure_id ? `${q(prior.enclosure_id)}::uuid` : "null"},
    'Corrected by scripts/fix-residents.mjs');
  select count(*) into v_n from placement_history where resident_id = ${id} and end_date is null;
  if v_n <> 1 then raise exception '${p.code} has % open placements after the move', v_n; end if;
  if (select enclosure_id from placement_history where resident_id = ${id} and end_date is null) is distinct from ${q(p.moveTo.id)}::uuid then
    raise exception '${p.code} is not in the new enclosure after the move';
  end if;`);
    }
  }
  const block = `do $$
declare
  v_before jsonb;
  v_after jsonb;
  v_n int;
begin
${stmts.join("\n\n")}
end $$;`;

  const receipt = {
    note: "Residents changed by scripts/fix-residents.mjs. 'before' is each resident row as it was; 'closed_placement' is the placement the move ended.",
    written_at: new Date().toISOString(),
    database: `${dbLabel} (${projectRef})`,
    command: `node scripts/fix-residents.mjs ${process.argv.slice(2).join(" ")}`,
    residents: todo.map((p) => ({
      code: p.code,
      before: p.before,
      closed_placement: p.moveTo ? p.closes : null,
      changes: p.changes.filter((c) => !c.done).map(({ field, from, to }) => ({ field, from, to })),
    })),
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
    console.error("Nothing was changed.");
    process.exitCode = 1;
    return;
  }

  if (!apply) {
    const line = [
      "node scripts/fix-residents.mjs",
      live ? "--env production" : "",
      `--file ${value("--file")}`,
      "--apply",
      live ? `--confirm ${entries.length}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    console.log(`\nNothing was changed; it runs cleanly. To do it:\n\n  ${line}\n`);
    return;
  }

  const [after] = await query(`select coalesce(json_agg(json_build_object('code', r.resident_code, 'name', r.name, 'thai_name', r.thai_name,
      'place', (select z.name || ' / ' || e.name from placement_history p join enclosures e on e.id = p.enclosure_id join zones z on z.id = e.zone_id
                where p.resident_id = r.id and p.end_date is null order by p.start_date desc limit 1)) order by r.resident_code), '[]'::json) as data
    from residents r where r.resident_code in (${todo.map((p) => q(p.code)).join(", ")})`);
  console.log("\nNow:");
  for (const r of after.data) console.log(`  ${r.code}  ${r.name}${r.thai_name ? ` (${r.thai_name})` : ""}  — ${r.place ?? "no open placement"}`);
}
