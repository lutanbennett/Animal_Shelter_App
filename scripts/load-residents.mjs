// Bulk-load residents into one environment's database from a reviewed CSV.
//
//   node scripts/load-residents.mjs --file residents.csv                       # dry run against dev
//   node scripts/load-residents.mjs --file residents.csv --env production      # dry run against production
//   node scripts/load-residents.mjs --file residents.csv --env production --apply
//
// Why this exists: the first two bulk loads (the Brown zone's 38 dogs and the
// Blue zone's 62, both 2026-10-04) were done with a throwaway script written
// into a scratch folder each time. That cost a fresh review of untested code
// on every load, and auto mode's classifier refused the second one outright
// ("Production Deploy") because a one-off path with a `commit` argument is
// indistinguishable from a deploy. A script that lives at a fixed path can be
// read once, permitted once, and reused
// (docs/decisions/2026-10-05-bulk-resident-loader.md).
//
// Nothing is written without --apply. The load goes through the app's own
// record_intake function, one statement per resident inside a single
// begin…commit, so every resident arrives with its placement, its diet and
// its intake weight exactly as the intake form would have created them, and
// any failure anywhere leaves the database untouched.
//
// CSV columns — the header row is matched case-insensitively and ignores
// spaces, underscores and punctuation, so "Thai name" and "thai_name" are the
// same column. Only `name` is required. Unknown columns are reported and
// ignored, so a review workbook's own columns (match notes, row colours) can
// stay in the file.
//
//   name                     the resident's name (required)
//   thai name                Thai name
//   other names
//   species                  Dog or Cat (default --species, itself Dog)
//   breed
//   sex                      Male, Female, M, F, or blank for unknown
//   age years                estimated age, e.g. 5.5
//   weight kg                recorded as the intake weight
//   size                     Small, Medium or Large (see --size-from-weight)
//   colour
//   desexed                  yes/no/true/false/y/n/1/0
//   zone                     only needed when two zones share an enclosure name
//   enclosure                enclosure name; blank means Lifecycle/Unassigned
//   intake date              yyyy-mm-dd or d/m/yyyy; blank means --intake-date
//   diet                     diet type name; blank means --diet, itself the standard diet
//   notes                    note on the intake placement
//   bio, temperament, past story, behaviour
//   ready for adoption       boolean, default false
//   public                   boolean, default false (is_public_visible)
//   good with dogs / cats / children    Yes, No or Unknown
//   energy                   Low, Medium or High
//   origin                   creates a group origin of this name, dated the intake date
//   blood test interval months          default 12, as the form's default is
//   hold                     any truthy value keeps the row OUT of the load
//
// The `hold` column is the duplicate-review workflow: rows a human has not
// cleared yet stay in the same file, marked, and are listed as held rather
// than silently dropped.
//
// Checks that refuse the whole load (nothing is sent):
//   - a name already in the target database (--allow-name-clash to override,
//     for the genuine case of two animals with the same name)
//   - the same name twice in the file
//   - an enclosure or zone name that doesn't resolve to exactly one enclosure
//   - a diet name that doesn't exist
//   - an unparseable date, number, boolean or enum value
//
// Checks that only warn: a missing size, a missing weight, a row landing in
// Lifecycle/Unassigned, and a possible duplicate (below).
//
// Possible duplicates: every row is compared with every resident already in
// the database — archived, adopted, deceased and Lifecycle/Unassigned ones
// included — by the rules in scripts/lib/near-names.mjs (the same name once a
// bracket tag is dropped, the same Thai name, or a close spelling). Each match
// is listed with the existing resident's code, where it is now and when it was
// created, so a human can rule same-dog or different-dog and mark the row
// `hold` if it is the same. It never refuses: "Noon" and "Noon (Daeng)" can be
// two dogs. The exact-name refusal above is separate and unchanged.
//
// Known limitation: rows load with created_by null, because record_intake
// takes the author from auth.uid() and the Management API has no user. Both
// earlier loads did the same. The audit trail therefore shows these rows as
// having no author; the intake date and this script's receipt are the record.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { parseCsvObjects } from "./lib/csv.mjs";
import { nearMatchReason } from "./lib/near-names.mjs";

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));

const flag = (name) => args.includes(name);
const value = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? fallback) : fallback;
};

const file = value("--file");
const apply = flag("--apply");
const defaultIntakeDate = value("--intake-date");
const defaultDietName = value("--diet");
const defaultSpecies = value("--species", "Dog");
const sizeFromWeight = flag("--size-from-weight");
const allowNameClash = flag("--allow-name-clash");
const receiptPath = value("--receipt");

if (!file) {
  console.error("--file <csv> is required. See the header of this script for the columns.");
  process.exit(2);
}
if (!existsSync(file)) {
  console.error(`No such file: ${file}`);
  process.exit(2);
}

const env = loadEnv(envName);
const projectRef = refOf(env);

if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required (it is what reaches the Management API).");
  process.exit(2);
}

// ---------------------------------------------------------------------------
// Value parsing. Every parser pushes onto `problems` instead of throwing, so
// one run reports everything wrong with the file rather than the first thing.
// ---------------------------------------------------------------------------

const problems = [];
const warnings = [];
const fail = (where, detail) => problems.push(`${where}: ${detail}`);
const warn = (where, detail) => warnings.push(`${where}: ${detail}`);

/** Header keys are compared with spaces, underscores and punctuation removed. */
const normaliseKey = (key) => key.toLowerCase().replace(/[^a-z0-9]/g, "");

const COLUMNS = {
  name: ["name"],
  thaiName: ["thainame", "thai"],
  otherNames: ["othernames"],
  species: ["species"],
  breed: ["breed"],
  sex: ["sex"],
  ageYears: ["ageyears", "age", "estimatedageyears", "estimatedage"],
  weightKg: ["weightkg", "weight"],
  size: ["size"],
  colour: ["colour", "color"],
  desexed: ["desexed", "isdesexed"],
  zone: ["zone"],
  enclosure: ["enclosure", "enclosurename"],
  intakeDate: ["intakedate", "intake"],
  diet: ["diet", "diettype", "diettypename"],
  notes: ["notes", "note", "placementnotes"],
  bio: ["bio"],
  temperament: ["temperament", "temperamentnotes"],
  pastStory: ["paststory", "paststorynotes", "story"],
  behaviour: ["behaviour", "behaviournotes", "behavior", "behaviornotes"],
  readyForAdoption: ["readyforadoption", "ready"],
  isPublicVisible: ["public", "ispublicvisible", "publiclyvisible"],
  goodWithDogs: ["goodwithdogs"],
  goodWithCats: ["goodwithcats"],
  goodWithChildren: ["goodwithchildren", "goodwithkids"],
  energyLevel: ["energy", "energylevel"],
  origin: ["origin", "grouporigin", "neworiginname", "intakeorigin"],
  bloodTestIntervalMonths: ["bloodtestintervalmonths", "bloodtestinterval"],
  hold: ["hold", "skip", "onhold"],
};

const blank = (v) => (v && String(v).trim() ? String(v).trim() : null);

function parseDate(raw, where) {
  const text = blank(raw);
  if (!text) return null;
  let iso = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) iso = text;
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slash) {
    const year = slash[3].length === 2 ? `20${slash[3]}` : slash[3];
    iso = `${year}-${slash[2].padStart(2, "0")}-${slash[1].padStart(2, "0")}`;
  }
  if (!iso) {
    fail(where, `"${text}" is not a date (use yyyy-mm-dd, or d/m/yyyy day-first)`);
    return null;
  }
  const [y, m, d] = iso.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    fail(where, `"${text}" is not a real date`);
    return null;
  }
  return iso;
}

function parseNumber(raw, where) {
  const text = blank(raw);
  if (!text) return null;
  const n = Number(text.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) {
    fail(where, `"${text}" is not a number`);
    return null;
  }
  return n;
}

function parseInteger(raw, where) {
  const n = parseNumber(raw, where);
  if (n === null) return null;
  if (!Number.isInteger(n)) {
    fail(where, `"${raw}" must be a whole number`);
    return null;
  }
  return n;
}

const TRUE = new Set(["yes", "y", "true", "t", "1", "x"]);
const FALSE = new Set(["no", "n", "false", "f", "0"]);

function parseBoolean(raw, where) {
  const text = blank(raw);
  if (!text) return null;
  const key = text.toLowerCase();
  if (TRUE.has(key)) return true;
  if (FALSE.has(key)) return false;
  fail(where, `"${text}" is not a yes/no value`);
  return null;
}

/** Match one of a fixed set, case-insensitively, and return the set's spelling. */
function parseEnum(raw, allowed, where, label) {
  const text = blank(raw);
  if (!text) return null;
  const hit = allowed.find((a) => a.toLowerCase() === text.toLowerCase());
  if (!hit) {
    fail(where, `"${text}" is not a ${label} (${allowed.join(", ")})`);
    return null;
  }
  return hit;
}

function parseSex(raw, where) {
  const text = blank(raw);
  if (!text) return null;
  const key = text.toLowerCase();
  if (key === "m" || key === "male") return "Male";
  if (key === "f" || key === "female") return "Female";
  if (key === "unknown" || key === "?") return null;
  fail(where, `"${text}" is not a sex (Male, Female, or blank for unknown)`);
  return null;
}

/**
 * Size from weight, used only for rows with a weight and no size. The limits
 * are the common vet-guide convention (Small under 10 kg, Medium 10–25 kg,
 * Large over 25 kg); there is no official standard, and this is the same
 * split the Brown zone load used on 2026-10-04.
 */
const sizeForWeight = (kg) => (kg < 10 ? "Small" : kg <= 25 ? "Medium" : "Large");

// ---------------------------------------------------------------------------
// Read the CSV
// ---------------------------------------------------------------------------

const rawRows = parseCsvObjects(readFileSync(file, "utf8"));
if (!rawRows.length) {
  console.error(`${file} has a header but no rows.`);
  process.exit(2);
}

const headerKeys = Object.keys(rawRows[0]);
const byNormalised = new Map(headerKeys.map((k) => [normaliseKey(k), k]));
const claimed = new Set();
const columnFor = {};
for (const [field, aliases] of Object.entries(COLUMNS)) {
  const hit = aliases.map((a) => byNormalised.get(a)).find(Boolean);
  if (hit) {
    columnFor[field] = hit;
    claimed.add(hit);
  }
}
const ignoredColumns = headerKeys.filter((k) => !claimed.has(k) && k !== "");

if (!columnFor.name) {
  console.error(`${file} has no "name" column. Columns found: ${headerKeys.join(", ")}`);
  process.exit(2);
}

const cell = (row, field) => (columnFor[field] ? row[columnFor[field]] : null);

const COMPATIBILITY = ["Yes", "No", "Unknown"];
const SIZES = ["Small", "Medium", "Large"];

const rows = [];
const held = [];

rawRows.forEach((raw, index) => {
  const line = index + 2; // +1 for the header, +1 because humans count from one
  const name = blank(cell(raw, "name"));
  if (!name) {
    warn(`row ${line}`, "no name — row ignored");
    return;
  }
  const where = `row ${line} (${name})`;

  const holdValue = blank(cell(raw, "hold"));
  if (holdValue && !FALSE.has(holdValue.toLowerCase())) {
    held.push({ line, name, reason: holdValue });
    return;
  }

  const weightKg = parseNumber(cell(raw, "weightKg"), `${where} weight`);
  let size = parseEnum(cell(raw, "size"), SIZES, `${where} size`, "size");
  if (!size && weightKg !== null && sizeFromWeight) size = sizeForWeight(weightKg);

  rows.push({
    line,
    where,
    name,
    thaiName: blank(cell(raw, "thaiName")),
    otherNames: blank(cell(raw, "otherNames")),
    species: parseEnum(cell(raw, "species"), ["Dog", "Cat"], `${where} species`, "species") ?? defaultSpecies,
    breed: blank(cell(raw, "breed")),
    sex: parseSex(cell(raw, "sex"), `${where} sex`),
    ageYears: parseNumber(cell(raw, "ageYears"), `${where} age`),
    weightKg,
    size,
    colour: blank(cell(raw, "colour")),
    desexed: parseBoolean(cell(raw, "desexed"), `${where} desexed`),
    zoneName: blank(cell(raw, "zone")),
    enclosureName: blank(cell(raw, "enclosure")),
    intakeDate: parseDate(cell(raw, "intakeDate"), `${where} intake date`) ?? defaultIntakeDate,
    dietName: blank(cell(raw, "diet")) ?? defaultDietName,
    notes: blank(cell(raw, "notes")),
    bio: blank(cell(raw, "bio")),
    temperament: blank(cell(raw, "temperament")),
    pastStory: blank(cell(raw, "pastStory")),
    behaviour: blank(cell(raw, "behaviour")),
    readyForAdoption: parseBoolean(cell(raw, "readyForAdoption"), `${where} ready for adoption`) ?? false,
    isPublicVisible: parseBoolean(cell(raw, "isPublicVisible"), `${where} public`) ?? false,
    goodWithDogs: parseEnum(cell(raw, "goodWithDogs"), COMPATIBILITY, `${where} good with dogs`, "compatibility"),
    goodWithCats: parseEnum(cell(raw, "goodWithCats"), COMPATIBILITY, `${where} good with cats`, "compatibility"),
    goodWithChildren: parseEnum(cell(raw, "goodWithChildren"), COMPATIBILITY, `${where} good with children`, "compatibility"),
    energyLevel: parseEnum(cell(raw, "energyLevel"), ["Low", "Medium", "High"], `${where} energy`, "energy level"),
    origin: blank(cell(raw, "origin")),
    bloodTestIntervalMonths: parseInteger(cell(raw, "bloodTestIntervalMonths"), `${where} blood test interval`),
  });
});

if (!rows.length) {
  console.error(`Nothing to load: ${rawRows.length} row(s) read, ${held.length} held, none left.`);
  process.exit(2);
}

for (const row of rows) {
  if (!row.intakeDate) fail(row.where, "no intake date, and no --intake-date given");
  if (!row.size) warn(row.where, "no size (the intake form requires one; this row will have none)");
  if (row.weightKg === null) warn(row.where, "no weight, so no intake weight record");
  if (!row.enclosureName) warn(row.where, "no enclosure, so it lands in Lifecycle/Unassigned");
}

const seen = new Map();
for (const row of rows) {
  const key = row.name.toLowerCase();
  if (seen.has(key)) fail(row.where, `the same name is on row ${seen.get(key)}`);
  else seen.set(key, row.line);
}

// ---------------------------------------------------------------------------
// The target database
// ---------------------------------------------------------------------------

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

console.log(`\n${file} → ${envName} (${projectRef})`);
console.log(`  ${rawRows.length} row(s) read, ${rows.length} to load, ${held.length} held.`);
if (ignoredColumns.length) console.log(`  columns ignored: ${ignoredColumns.join(", ")}`);

// Everything past here talks to the database, and process.exit() trips a libuv
// assertion on Windows while fetch still holds a socket (the same note is on
// import-appsheet.mjs). So the rest sets process.exitCode and returns instead.
await run();

async function run() {
const [reference] = await query(`select json_build_object(
  'zones', coalesce((select json_agg(json_build_object('id', id, 'name', name)) from zones), '[]'::json),
  'enclosures', coalesce((select json_agg(json_build_object('id', e.id, 'name', e.name, 'zone', z.name)) from enclosures e join zones z on z.id = e.zone_id), '[]'::json),
  'diets', coalesce((select json_agg(json_build_object('id', id, 'name', name, 'standard', is_standard)) from diet_types), '[]'::json),
  'residents', coalesce((select json_agg(json_build_object(
    'code', r.resident_code,
    'name', r.name,
    'thaiName', r.thai_name,
    'created', to_char(r.created_at, 'YYYY-MM-DD'),
    'place', (select coalesce(z.name || ' / ' || e.name, p.placement_type::text)
              from placement_history p
              left join enclosures e on e.id = p.enclosure_id
              left join zones z on z.id = e.zone_id
              where p.resident_id = r.id and p.end_date is null
              order by p.start_date desc, p.created_at desc
              limit 1)))
    from residents r), '[]'::json)
) as data`);

const { zones, enclosures, diets, residents } = reference.data;
const existingNames = new Set(residents.map((r) => r.name.toLowerCase()));

// Diet: a name if one was given or asked for per row, otherwise the standard one.
const standardDiet = diets.find((d) => d.standard);
const dietByName = new Map(diets.map((d) => [d.name.toLowerCase(), d]));
for (const row of rows) {
  if (row.dietName) {
    const hit = dietByName.get(row.dietName.toLowerCase());
    if (!hit) fail(row.where, `no diet type called "${row.dietName}"`);
    else row.dietId = hit.id;
  } else if (standardDiet) {
    row.dietId = standardDiet.id;
    row.dietName = standardDiet.name;
  } else {
    fail(row.where, "no diet given and the database has no standard diet — pass --diet <name>");
  }
}

// Enclosure: by name, inside a zone when the row names one.
for (const row of rows) {
  if (!row.enclosureName) continue;
  const candidates = enclosures.filter(
    (e) =>
      e.name.toLowerCase() === row.enclosureName.toLowerCase() &&
      (!row.zoneName || e.zone.toLowerCase() === row.zoneName.toLowerCase()),
  );
  if (candidates.length === 1) {
    row.enclosureId = candidates[0].id;
    row.zoneName = candidates[0].zone;
  } else if (!candidates.length) {
    const named = row.zoneName ? ` in zone "${row.zoneName}"` : "";
    fail(row.where, `no enclosure called "${row.enclosureName}"${named}`);
  } else {
    fail(
      row.where,
      `"${row.enclosureName}" exists in ${candidates.length} zones (${candidates.map((c) => c.zone).join(", ")}) — add a zone column`,
    );
  }
}
if (!zones.length) fail("database", "no zones — is this the right project?");

// Name clashes with what is already there.
const clashes = rows.filter((row) => existingNames.has(row.name.toLowerCase()));
if (clashes.length && !allowNameClash) {
  for (const row of clashes) fail(row.where, "a resident of this name already exists (--allow-name-clash to load anyway)");
} else if (clashes.length) {
  for (const row of clashes) warn(row.where, "a resident of this name already exists — loading anyway (--allow-name-clash)");
}

// Near-duplicates: warn only. nearMatchReason skips exact name matches, which
// the clash check above already refuses (or warns about under
// --allow-name-clash), so nothing is listed twice.
const nearDuplicates = rows.flatMap((row) =>
  residents.map((existing) => ({ row, existing, reason: nearMatchReason(row, existing) })).filter((m) => m.reason),
);
const withThai = (name, thai) => (thai ? `"${name}" (${thai})` : `"${name}"`);

if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}
if (nearDuplicates.length) {
  console.log(`\nPossible duplicates — check each one before loading (${nearDuplicates.length}):`);
  console.log(`  Same animal? Put "yes" in that row's hold column. Different animal? Nothing to do.`);
  for (const { row, existing, reason } of nearDuplicates) {
    console.log(
      `  - row ${row.line} ${withThai(row.name, row.thaiName)} looks like ` +
        `${existing.code ?? "(no code)"} ${withThai(existing.name, existing.thaiName)}: ${reason}. ` +
        `It is in ${existing.place ?? "no open placement"}, created ${existing.created}.`,
    );
  }
}
if (held.length) {
  console.log(`\nHeld, not loaded (${held.length}):`);
  for (const h of held) console.log(`  - row ${h.line} ${h.name} (hold: ${h.reason})`);
}
if (problems.length) {
  console.error(`\nRefusing to load — ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error("\nNothing was sent to the database.");
  process.exitCode = 1;
  return;
}

// ---------------------------------------------------------------------------
// What will be created
// ---------------------------------------------------------------------------

const column = (values, heading) => Math.max(heading.length, ...values.map((v) => String(v ?? "").length));
const show = (v) => (v === null || v === undefined || v === "" ? "-" : String(v));
const widths = {
  name: column(rows.map((r) => r.name), "name"),
  where: column(rows.map((r) => (r.enclosureName ? `${r.zoneName} / ${r.enclosureName}` : "Lifecycle / Unassigned")), "placed in"),
  size: 6,
};
console.log(`\nTo create (${rows.length}):`);
console.log(
  `  ${"name".padEnd(widths.name)}  ${"placed in".padEnd(widths.where)}  ${"size".padEnd(widths.size)}  intake      sex`,
);
for (const row of rows) {
  const place = row.enclosureName ? `${row.zoneName} / ${row.enclosureName}` : "Lifecycle / Unassigned";
  console.log(
    `  ${row.name.padEnd(widths.name)}  ${place.padEnd(widths.where)}  ${show(row.size).padEnd(widths.size)}  ${row.intakeDate}  ${show(row.sex)}`,
  );
}
const dietNames = [...new Set(rows.map((r) => r.dietName))];
console.log(`\n  diet: ${dietNames.join(", ")}`);
console.log(`  species: ${[...new Set(rows.map((r) => r.species))].join(", ")}`);
console.log(`  with a weight: ${rows.filter((r) => r.weightKg !== null).length} of ${rows.length}`);

// ---------------------------------------------------------------------------
// The transaction
// ---------------------------------------------------------------------------

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const num = (v) => (v === null || v === undefined ? "null" : String(v));
const bool = (v) => (v === null || v === undefined ? "null" : v ? "true" : "false");
const cast = (v, type) => (v === null || v === undefined ? "null" : `${q(v)}::${type}`);

const calls = rows.map(
  (row) => `  v_resident := record_intake(
    p_name => ${q(row.name)},
    p_intake_date => ${q(row.intakeDate)}::date,
    p_thai_name => ${q(row.thaiName)},
    p_other_names => ${q(row.otherNames)},
    p_species => ${q(row.species)},
    p_breed => ${q(row.breed)},
    p_sex => ${q(row.sex)},
    p_estimated_age_years => ${num(row.ageYears)},
    p_bio => ${q(row.bio)},
    p_temperament_notes => ${q(row.temperament)},
    p_past_story_notes => ${q(row.pastStory)},
    p_behaviour_notes => ${q(row.behaviour)},
    p_ready_for_adoption => ${bool(row.readyForAdoption)},
    p_is_public_visible => ${bool(row.isPublicVisible)},
    p_enclosure_id => ${row.enclosureId ? `${q(row.enclosureId)}::uuid` : "null"},
    p_notes => ${q(row.notes)},
    p_new_origin_name => ${q(row.origin)},
    p_weight_kg => ${num(row.weightKg)},
    p_size => ${cast(row.size, "resident_size")},
    p_diet_type_id => ${q(row.dietId)}::uuid,
    p_good_with_dogs => ${cast(row.goodWithDogs, "compatibility")},
    p_good_with_cats => ${cast(row.goodWithCats, "compatibility")},
    p_good_with_children => ${cast(row.goodWithChildren, "compatibility")},
    p_energy_level => ${cast(row.energyLevel, "energy_level")},
    p_colour => ${q(row.colour)},
    p_is_desexed => ${bool(row.desexed)}${
      row.bloodTestIntervalMonths === null ? "" : `,\n    p_blood_test_interval_months => ${num(row.bloodTestIntervalMonths)}`
    }
  );
  v_ids := array_append(v_ids, v_resident.id);`,
);

// Assertions run inside the transaction, so a failure rolls the whole load
// back: one resident per row, each with exactly one open placement and a
// current diet, and a weight for every row that carried one.
const withWeight = rows.filter((r) => r.weightKg !== null).length;
const block = `do $$
declare
  v_resident residents;
  v_ids uuid[] := '{}';
  v_bad int;
begin
${calls.join("\n")}

  if array_length(v_ids, 1) <> ${rows.length} then
    raise exception 'expected ${rows.length} residents, created %', array_length(v_ids, 1);
  end if;

  select count(*) into v_bad from residents r where r.id = any(v_ids)
    and (select count(*) from placement_history p where p.resident_id = r.id and p.end_date is null) <> 1;
  if v_bad > 0 then raise exception '% resident(s) without exactly one open placement', v_bad; end if;

  select count(*) into v_bad from residents r where r.id = any(v_ids)
    and not exists (select 1 from resident_diets d where d.resident_id = r.id);
  if v_bad > 0 then raise exception '% resident(s) without a diet', v_bad; end if;

  select count(*) into v_bad from weight w where w.resident_id = any(v_ids);
  if v_bad <> ${withWeight} then raise exception 'expected ${withWeight} weight record(s), found %', v_bad; end if;

  select count(*) into v_bad from residents r where r.id = any(v_ids) and r.resident_code is null;
  if v_bad > 0 then raise exception '% resident(s) without a code', v_bad; end if;
end $$;`;

const transaction = `begin;\n${block}\n${apply ? "commit" : "rollback"};`;

process.stdout.write(`\n${apply ? "Loading into" : "Dry run against"} ${envName} (${projectRef}) … `);
try {
  await query(transaction);
  console.log("ok");
} catch (error) {
  console.log("FAILED");
  console.error(error.message);
  console.error("Nothing was kept.");
  process.exitCode = 1;
  return;
}

if (!apply) {
  console.log(
    `\nRolled back — nothing was kept. ${rows.length} resident(s) would load cleanly. Re-run with --apply to keep them.`,
  );
  return;
}

// ---------------------------------------------------------------------------
// Receipt — read back what the commit created
// ---------------------------------------------------------------------------

const names = rows.map((r) => q(r.name)).join(", ");
const created = await query(`select resident_code, name, intake_date::text as intake_date
  from residents
  where name in (${names}) and created_at >= now() - interval '15 minutes'
  order by resident_code`);

console.log(`\nLoaded ${rows.length} resident(s):`);
for (const r of created) console.log(`  ${r.resident_code}  ${r.name}`);
if (created.length !== rows.length) {
  console.log(
    `\nNote: the read-back found ${created.length} row(s) for ${rows.length} loaded. That is expected only if a name was already in use (--allow-name-clash); otherwise check by hand.`,
  );
}

if (receiptPath) {
  const csv = ["resident_code,name,intake_date", ...created.map((r) => `${r.resident_code},"${r.name.replace(/"/g, '""')}",${r.intake_date}`)].join("\n");
  writeFileSync(receiptPath, `${csv}\n`);
  console.log(`\nReceipt: ${receiptPath}`);
}
if (held.length) console.log(`\n${held.length} row(s) were held and still need a decision.`);
}
