// Load a snapshot of the legacy AppSheet data (scripts/appsheet-export.mjs)
// into one environment's database, and point the rows at the files that
// already sit in the app's Google Drive tree.
//
//   node scripts/import-appsheet.mjs --report                 # profile the snapshot, touch nothing
//   node scripts/import-appsheet.mjs --dry-run                # full load inside begin…rollback (dev/test)
//   node scripts/import-appsheet.mjs --replace                # load into dev/test, wiping its scratch rows first
//   node scripts/import-appsheet.mjs --env production         # load into production (must be empty)
//   … --from appsheet-export/20260922T0300                    # a snapshot other than appsheet-export/latest
//
// One script, one transaction: the snapshot is read, cleaned and checked,
// the whole load is generated as SQL and sent through the Management API
// in a single begin…commit (the same route apply-migrations.mjs uses), and
// only after that commit are the legacy Drive folders renamed. Any
// assertion failing anywhere leaves the database untouched. Re-runnable:
// UUIDs are derived from the AppSheet ids, so the same snapshot always
// loads as the same rows.
//
// What it does with the data — the decisions are in docs/data-migration.md:
//   - residents get R-nnnn codes in intake order; their legacy Drive folder
//     ("Name (8-hex id)") is found under Residents/ or Residents/Deceased/,
//     linked by id, and renamed to "Name (R-nnnn)" after the commit
//   - rows that reference a resident missing from the Residents tab are
//     test leftovers and dropped (listed in the report)
//   - the pseudo zones (Carers, Hospital, Deceased, Unassigned) collapse
//     onto the seeded Lifecycle enclosures; real zones and enclosures are
//     created by name
//   - attachment paths ("Residents/Panda (4df69c6f)/Photos/Foster/2606/x.jpg")
//     are resolved to Drive file ids by walking the tree; an unresolvable
//     path drops that attachment row and is listed
//   - the deceased lock is bypassed for the transaction (the setting the
//     app's own deceased tooling uses), so a dead resident's history can be
//     written; placements go in chronologically per resident so the
//     close-prior and deceased-cascade triggers behave as they would live
//
// Reference tables the migrations seed (frequency, medication,
// immunization_types, procedure_types, blood_test_types, the project
// category roots) are merged by name, never wiped.

import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { google } from "googleapis";
import { loadEnv, parseEnvArg, projectRef as refOf } from "./lib/env.mjs";
import { parseCsvObjects } from "./lib/csv.mjs";
import { TABS, tabFileName } from "./appsheet-export.mjs";

// ---------------------------------------------------------------------------
// Arguments and environment
// ---------------------------------------------------------------------------

const { name: envName, rest: args } = parseEnvArg(process.argv.slice(2));
const report = args.includes("--report");
const dryRun = args.includes("--dry-run");
const replace = args.includes("--replace");
const fromIndex = args.indexOf("--from");
const snapshotDir = fromIndex >= 0 ? args[fromIndex + 1] : join("appsheet-export", "latest");

if (!existsSync(join(snapshotDir, "export.json"))) {
  console.error(`No snapshot at ${snapshotDir}/ — run scripts/appsheet-export.mjs first.`);
  process.exit(2);
}

const env = loadEnv(envName);
const projectRef = refOf(env);

// ---------------------------------------------------------------------------
// Snapshot
// ---------------------------------------------------------------------------

const tab = (name) => parseCsvObjects(readFileSync(join(snapshotDir, tabFileName(name)), "utf8"));
const src = Object.fromEntries(Object.keys(TABS).map((name) => [name, tab(name)]));
const exportMeta = JSON.parse(readFileSync(join(snapshotDir, "export.json"), "utf8"));

const anomalies = [];
const note = (kind, detail) => anomalies.push({ kind, detail });

// ---------------------------------------------------------------------------
// Value parsing — cells arrive as the sheet displays them
// ---------------------------------------------------------------------------

/** "7/9/2026", "07/09/2026", "7/9/26", "16/07/2026 13:00:00" → "2026-09-07" (Thai day-first). */
function parseDate(value, where) {
  if (!value) return null;
  const m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (!m) {
    note("unparsed-date", `${where}: "${value}"`);
    return null;
  }
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${year}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/**
 * "Jan-2020" → an age estimate anchored to the export date, the way the app
 * stores ages (0011/0023): years with one decimal, plus the date it was
 * true on.
 */
function monthYearToAge(value, where, asOfIso) {
  if (!value) return null;
  const m = value.match(/^([A-Za-z]{3})-(\d{4})$/);
  if (!m || !MONTHS[m[1].toLowerCase()]) {
    note("unparsed-dob", `${where}: "${value}"`);
    return null;
  }
  const born = new Date(Date.UTC(Number(m[2]), MONTHS[m[1].toLowerCase()] - 1, 15));
  const asOf = new Date(asOfIso);
  const years = (asOf - born) / (365.25 * 24 * 3600 * 1000);
  return { years: Math.max(0, Math.round(years * 2) / 2), asOf: asOfIso.slice(0, 10) };
}

const bool = (value) => (value === "TRUE" ? true : value === "FALSE" ? false : null);
const blank = (value) => (value && value.trim() ? value.trim() : null);

/** Deterministic UUID (v5 shape) from an AppSheet id, so re-runs load the same rows. */
function uuid(table, id) {
  const hex = createHash("sha1").update(`lanna-appsheet:${table}:${id}`).digest("hex").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

// SQL literals. Everything user-typed goes through q(); identifiers are ours.
const q = (value) => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};

// ---------------------------------------------------------------------------
// Residents — the spine everything else hangs off
// ---------------------------------------------------------------------------

const exportedAt = exportMeta.exportedAt;
const residentRows = src.Residents.filter((r) => r.ID);
const residentIds = new Set(residentRows.map((r) => r.ID));
const residentName = (rid) => residentRows.find((r) => r.ID === rid)?.Name ?? rid;

/** Rows in other tabs that point at a resident who no longer exists. */
function keepIfResident(rows, rid, what) {
  const kept = rows.filter((r) => residentIds.has(r[rid]));
  const dropped = rows.filter((r) => !residentIds.has(r[rid]));
  if (dropped.length) {
    note("orphan-rows", `${what}: ${dropped.length} row(s) for missing resident(s) ${[...new Set(dropped.map((r) => r[rid]))].join(", ")}`);
  }
  return kept;
}

const placementsRaw = keepIfResident(src.Placement_History, "RID", "Placement_History");

// Intake date = the Intake placement's start; the sheet's own order breaks ties.
const intakeDate = {};
for (const p of placementsRaw) {
  if (p.PlacementType === "Intake") intakeDate[p.RID] ??= parseDate(p.StartDate, `Placement ${p.HistoryID}`);
}

const residents = residentRows.map((r, index) => {
  const isCat = r.Breed === "Cat" || /\(cat\)/i.test(r.Name);
  const age = monthYearToAge(r["Date of birth"], `Resident ${r.Name}`, exportedAt);
  const interval = { Yearly: 12, Quarterly: 3, Monthly: 1 }[r["Blood Test Priority"]];
  if (r["Blood Test Priority"] && !interval) note("unknown-value", `Resident ${r.Name}: Blood Test Priority "${r["Blood Test Priority"]}"`);
  if (!intakeDate[r.ID]) note("no-intake", `Resident ${r.Name} (${r.ID}) has no Intake placement`);
  return {
    appsheetId: r.ID,
    id: uuid("residents", r.ID),
    name: r.Name.trim(),
    thaiName: blank(r["Thai Name"]),
    otherNames: blank(r["Other Names"]),
    species: isCat ? "Cat" : "Dog",
    breed: r.Breed === "Cat" ? null : blank(r.Breed),
    sex: ["Male", "Female"].includes(r.Sex) ? r.Sex : null,
    age,
    intakeDate: intakeDate[r.ID] ?? null,
    bio: blank(r.BIO),
    isDesexed: bool(r.Spayed),
    readyForAdoption: bool(r["Ready for Adoption"]) ?? false,
    profileImageId: blank(r["Profile Image"]),
    originId: blank(r["Origin ID"]),
    bloodTestInterval: interval ?? 12,
    sheetOrder: index,
    code: null,
  };
});

// R-0001… in intake order — the same order the shelter would have intaken
// them into the new system.
[...residents]
  .sort((a, b) => (a.intakeDate ?? "9999").localeCompare(b.intakeDate ?? "9999") || a.sheetOrder - b.sheetOrder)
  .forEach((r, i) => (r.code = `R-${String(i + 1).padStart(4, "0")}`));
const residentByAppsheet = Object.fromEntries(residents.map((r) => [r.appsheetId, r]));

// ---------------------------------------------------------------------------
// Zones and enclosures
// ---------------------------------------------------------------------------

// Source pseudo-zones → the seeded Lifecycle enclosure that plays their part.
const PSEUDO = { Unassigned: "Unassigned", Hospital: "Hospital", Fostered: "Fostered", Adopted: "Adopted", Deceased: "Deceased" };
const lifecycleSql = (name) => `(select e.id from enclosures e join zones z on z.id = e.zone_id where z.name = 'Lifecycle' and e.name = ${q(name)})`;

const zoneRows = src.Zones.filter((z) => z.ID);
const zones = zoneRows
  .filter((z) => !["Carers", "Hospital", "Deceased", "Unassigned"].includes(z.Zone))
  .map((z) => ({
    appsheetId: z.ID,
    id: uuid("zones", z.ID),
    // "orange" is the only lower-case zone; the rest are Title Case.
    name: z.Zone.trim().replace(/^[a-z]/, (c) => c.toUpperCase()),
    internal: z["Int-Ex"] === "LCA",
  }));
const zoneByAppsheet = Object.fromEntries(zones.map((z) => [z.appsheetId, z]));

const enclosureRows = src.Enclosures.filter((e) => e.ID);
const enclosures = [];
/** AppSheet enclosure id → SQL expression for the target enclosure id. */
const enclosureSql = {};
/** AppSheet enclosure id → SQL expression for its zone id. */
const enclosureZoneSql = {};
for (const e of enclosureRows) {
  const name = e["Enclosure Name"].trim();
  if (PSEUDO[name]) {
    enclosureSql[e.ID] = lifecycleSql(PSEUDO[name]);
    enclosureZoneSql[e.ID] = `(select id from zones where name = 'Lifecycle')`;
    continue;
  }
  const zone = zoneByAppsheet[e.Zone];
  if (!zone) {
    note("orphan-rows", `Enclosure "${name}" points at unknown zone ${e.Zone}`);
    continue;
  }
  const id = uuid("enclosures", e.ID);
  enclosures.push({ id, name, zoneId: zone.id, capacity: e["Maximum Residents"] ? Number(e["Maximum Residents"]) : null, notes: blank(e.Description) });
  enclosureSql[e.ID] = q(id);
  enclosureZoneSql[e.ID] = q(zone.id);
}

// ---------------------------------------------------------------------------
// Reference rows: contacts, vets, origins, medication, frequency, immunization types
// ---------------------------------------------------------------------------

const CONTACT_TYPES = { Carer: "Carer", Volunteer: "Volunteer", Supplier: "Vendor", Vendor: "Vendor", Donor: "Donor" };
const contacts = src.Contacts.filter((c) => c.ID).map((c) => {
  const type = CONTACT_TYPES[c.Type];
  if (!type) note("unknown-value", `Contact ${c["Name/s"]}: type "${c.Type}" → Other`);
  return {
    id: uuid("contacts", c.ID),
    name: c["Name/s"].trim(),
    type: type ?? "Other",
    phone: blank(c.Phone),
    address: blank(c.Address),
    whatsapp: blank(c["Watsapp ID"]),
    messengerId: blank(c["Messenger ID"]),
    lineId: blank(c["Line ID"]),
  };
});
const contactId = (appsheetId) => (appsheetId ? uuid("contacts", appsheetId) : null);

const vets = src.Vets.filter((v) => v.VetID).map((v) => ({
  id: uuid("vets", v.VetID),
  name: v["Vet Name"].trim(),
  contactInfo: [v.Phone && `Phone: ${v.Phone}`, v["Line ID"] && `LINE: ${v["Line ID"]}`, v.Address && `Map: ${v.Address}`].filter(Boolean).join("\n") || null,
  notes: blank(v.Notes),
}));
const vetIds = new Set(src.Vets.map((v) => v.VetID));
const vetId = (appsheetId, where) => {
  if (!appsheetId) return null;
  if (!vetIds.has(appsheetId)) {
    note("orphan-rows", `${where}: unknown vet ${appsheetId}`);
    return null;
  }
  return uuid("vets", appsheetId);
};

const origins = src.Group_origins.filter((o) => o.ID).map((o) => ({
  id: uuid("group_origins", o.ID),
  name: o.Title.trim(),
  notes: blank(o["Origin information"]),
}));
const originIds = new Set(origins.map((o) => o.id));

// Medication and frequency are merged by name into the seeded rows, so the
// SQL looks them up rather than carrying ids.
const medications = src.Medication.filter((m) => m.ID).map((m) => ({ appsheetId: m.ID, name: m.Medication.trim() }));
const medicationByAppsheet = Object.fromEntries(medications.map((m) => [m.appsheetId, m.name]));

/** AppSheet (Frequency, Times per frequency) → the app's frequency label (0027/0044). */
function frequencyLabel(frequency, times, where) {
  const n = Number(times || 1);
  const label =
    frequency === "Daily" ? { 1: "Once daily", 2: "Twice daily", 3: "Three times daily" }[n]
    : frequency === "Weekly" && n === 1 ? "Weekly"
    : frequency === "Monthly" && n === 1 ? "Monthly"
    : frequency === "" ? "As needed"
    : null;
  if (!label) note("unknown-value", `${where}: frequency "${frequency}" × ${times} has no equivalent → As needed`);
  return label ?? "As needed";
}

const IMMUNIZATION_RENAMES = { Parvovirtus: "Parvovirus" };
const immunizationTypes = src["Immunization Types"].filter((t) => t.ID).map((t) => ({
  appsheetId: t.ID,
  name: IMMUNIZATION_RENAMES[t.Name.trim()] ?? t.Name.trim(),
  intervalMonths: t["FrequencyValue (Months)"] ? Number(t["FrequencyValue (Months)"]) : null,
  isMandatory: t.IsMandatory === "Yes",
}));
const immunizationTypeName = Object.fromEntries(immunizationTypes.map((t) => [t.appsheetId, t.name]));

// ---------------------------------------------------------------------------
// Placements — chronological per resident, one open record each
// ---------------------------------------------------------------------------

const PLACEMENT_TYPES = {
  Intake: "Intake", ChangeEnclosure: "ChangeEnclosure", SendToHospital: "SendToHospital", ReturnFromHospital: "ReturnFromHospital",
  Foster: "Foster", Fostered: "Foster", Adopt: "Adopt", Adopted: "Adopt", Deceased: "Deceased", ReturnToShelter: "ReturnToShelter",
};

const placements = [];
for (const rid of residentIds) {
  const rows = placementsRaw
    .map((p, order) => ({ p, order }))
    .filter(({ p }) => p.RID === rid)
    .map(({ p, order }) => ({
      appsheetId: p.HistoryID,
      resident: residentByAppsheet[rid],
      type: PLACEMENT_TYPES[p.PlacementType],
      start: parseDate(p.StartDate, `Placement ${p.HistoryID}`),
      end: parseDate(p.EndDate, `Placement ${p.HistoryID}`),
      enclosure: p.EnclosureID,
      previousEnclosure: blank(p.PreviousEnclosureID),
      carer: blank(p.CarerID),
      notes: blank(p.Notes),
      order,
    }))
    .sort((a, b) => (a.start ?? "").localeCompare(b.start ?? "") || a.order - b.order);

  rows.forEach((row, i) => {
    if (!row.type) note("unknown-value", `Placement ${row.appsheetId} (${row.resident.name}): type "${placementsRaw.find((p) => p.HistoryID === row.appsheetId).PlacementType}"`);
    if (!enclosureSql[row.enclosure]) note("orphan-rows", `Placement ${row.appsheetId} (${row.resident.name}): unknown enclosure ${row.enclosure}`);
    if (row.previousEnclosure && !enclosureSql[row.previousEnclosure]) {
      note("orphan-rows", `Placement ${row.appsheetId}: unknown previous enclosure ${row.previousEnclosure} → dropped`);
      row.previousEnclosure = null;
    }
    if (row.carer && !contacts.some((c) => c.id === contactId(row.carer))) {
      note("orphan-rows", `Placement ${row.appsheetId}: unknown carer ${row.carer} → dropped`);
      row.carer = null;
    }
    // Same-day moves get successive seconds so end_date > start_date holds
    // and the close-prior trigger sees them in the right order.
    const sameDayBefore = rows.slice(0, i).filter((r) => r.start === row.start).length;
    row.startTs = `${row.start} 00:00:${String(sameDayBefore).padStart(2, "0")}+07`;
    const isLast = i === rows.length - 1;
    if (!isLast && row.end !== rows[i + 1].start) {
      note("placement-gap", `${row.resident.name}: ${row.type} ends ${row.end ?? "never"} but the next placement starts ${rows[i + 1].start} → closed at the next start`);
    }
    if (isLast && row.end) note("placement-gap", `${row.resident.name}: last placement (${row.type}) is closed on ${row.end} — reopened, it is their current state`);
    if (i === 0 && row.type !== "Intake") note("placement-gap", `${row.resident.name}: history starts with ${row.type}, not Intake`);
  });
  placements.push(...rows);
}

const deceasedResidents = new Set(placements.filter((p) => p.type === "Deceased" && p === placements.filter((x) => x.resident === p.resident).at(-1)).map((p) => p.resident.appsheetId));

// ---------------------------------------------------------------------------
// Medical: appointments, weights, procedures, blood tests, prescriptions, immunizations
// ---------------------------------------------------------------------------

const appointmentRows = keepIfResident(src["Vet Appointments"], "RID", "Vet Appointments");
const appointments = appointmentRows.map((a) => ({
  id: uuid("vet_appointments", a["Appointment ID"]),
  residentId: uuid("residents", a.RID),
  vetId: vetId(a.Vet, `Appointment ${a["Appointment ID"]}`),
  date: parseDate(a.Date, `Appointment ${a["Appointment ID"]}`),
  notes: blank(a.Notes),
})).filter((a) => a.date || (note("dropped", `Appointment ${a.id}: no date`), false));
const appointmentIds = new Set(appointmentRows.map((a) => a["Appointment ID"]));
const appointmentId = (appsheetId, where) => {
  if (!appsheetId) return null;
  if (!appointmentIds.has(appsheetId)) {
    note("orphan-rows", `${where}: unknown appointment ${appsheetId} → unlinked`);
    return null;
  }
  return uuid("vet_appointments", appsheetId);
};

const weights = keepIfResident(src.Weight, "RID", "Weight")
  .map((w) => ({
    id: uuid("weight", w.ID),
    residentId: uuid("residents", w.RID),
    appointmentId: appointmentId(w["Appointment ID"], `Weight ${w.ID}`),
    date: parseDate(w.Date, `Weight ${w.ID}`),
    kg: Number(w.Weight),
  }))
  .filter((w) => (w.date && w.kg > 0) || (note("dropped", `Weight ${w.id}: date "${w.date}" / weight ${w.kg}`), false));

const PROCEDURE_RENAMES = { "X-Ray": "X-ray", "Teeth Clean": "Teeth cleaning" };
const procedures = keepIfResident(src.Procedures, "RID", "Procedures")
  .map((p) => ({
    id: uuid("procedures", p.ProcedureID),
    appsheetId: p.ProcedureID,
    residentId: uuid("residents", p.RID),
    appointmentId: appointmentId(p.AppointmentID, `Procedure ${p.ProcedureID}`),
    typeName: PROCEDURE_RENAMES[p.Procedure.trim()] ?? blank(p.Procedure),
    date: parseDate(p.Date, `Procedure ${p.ProcedureID}`),
    notes: blank(p.Outcome),
  }))
  .filter((p) => (p.date && p.typeName) || (note("dropped", `Procedure ${p.appsheetId} (${residentName(src.Procedures.find((x) => x.ProcedureID === p.appsheetId).RID)}): missing ${p.date ? "procedure name" : "date"}`), false));

// The CBC columns: folded into `results` as "Label: value" lines, since the
// app records results as text (0050 typed the test, not its values).
const CBC_COLUMNS = ["WBC", "Neutrophil%", "Band Neutrophil%", "Lymphocyte%", "Monocyte%", "Eosinophil%", "Basophil%", "RBC", "Hb", "Hct", "MCV", "MCH", "MCHC", "RDW", "Platelets (manual)", "Platelet smear", "[RBCs Morphology]", "Anisocytosis", "Macrocyte", "Microcyte", "Target Cell", "Polychromasia", "Blood Parasite", "BUN", "Creatine", "AST (SGOT)", "ALT (SGPT)"];
const BLOOD_TEST_RENAMES = { Urinalysis: "Urinary Analysis" };
const bloodTests = keepIfResident(src["Blood Tests"], "RID", "Blood Tests")
  .map((b) => {
    const values = CBC_COLUMNS.filter((c) => blank(b[c])).map((c) => `${c.replace(/^\[|\]$/g, "")}: ${b[c].trim()}`);
    const parts = [
      blank(b.Results),
      blank(b["Normal Result"]) && `Normal result: ${b["Normal Result"].trim()}`,
      blank(b["Treatment Plan"]) && `Treatment plan: ${b["Treatment Plan"].trim()}`,
      blank(b["Next Blood Test"]) && `Next blood test: ${b["Next Blood Test"].trim()}`,
      values.length && values.join("\n"),
    ].filter(Boolean);
    return {
      id: uuid("blood_tests", b.ID),
      appsheetId: b.ID,
      residentId: uuid("residents", b.RID),
      rid: b.RID,
      appointmentId: appointmentId(b["Vet Appointment ID"], `Blood test ${b.ID}`),
      typeName: BLOOD_TEST_RENAMES[b["Test Type"].trim()] ?? blank(b["Test Type"]) ?? "CBC (Complete Blood Count)",
      date: parseDate(b["Date of test"], `Blood test ${b.ID}`),
      results: parts.join("\n\n") || null,
      file: blank(b.File),
    };
  })
  .filter((b) => b.date || (note("dropped", `Blood test ${b.appsheetId}: no date`), false));

const prescriptions = keepIfResident(src.Prescriptions, "RID", "Prescriptions")
  .map((p) => ({
    id: uuid("prescriptions", p.ID),
    appsheetId: p.ID,
    residentId: uuid("residents", p.RID),
    appointmentId: appointmentId(p["Vet Appointment ID"], `Prescription ${p.ID}`),
    medicationName: medicationByAppsheet[p.Medication],
    frequencyLabel: frequencyLabel(p.Frequency, p["Times per frequency"], `Prescription ${p.ID}`),
    frequencyText: `${p.Frequency}${p["Times per frequency"] ? ` × ${p["Times per frequency"]}` : ""}`,
    doseQuantity: p["# Tablets"] ? Number(p["# Tablets"]) : null,
    dosesPerDay: p.Frequency === "Daily" && p["Times per frequency"] ? Number(p["Times per frequency"]) : null,
    start: parseDate(p["Start Date"], `Prescription ${p.ID}`),
    end: parseDate(p["End Date"], `Prescription ${p.ID}`),
    notes: blank(p.Notes),
  }))
  .map((p) => (p.frequencyLabel === "As needed" && p.frequencyText !== "" ? { ...p, notes: [`Frequency in AppSheet: ${p.frequencyText}`, p.notes].filter(Boolean).join("\n") } : p))
  .filter((p) => {
    if (!p.medicationName) note("dropped", `Prescription ${p.appsheetId}: unknown medication`);
    else if (!p.start) note("dropped", `Prescription ${p.appsheetId}: no start date`);
    else if (p.end && p.end < p.start) note("dropped", `Prescription ${p.appsheetId}: ends ${p.end} before it starts ${p.start}`);
    else return true;
    return false;
  });

const immunizations = keepIfResident(src["Immunization History"], "RID", "Immunization History")
  .map((i) => ({
    id: uuid("immunization_records", i.ID),
    appsheetId: i.ID,
    residentId: uuid("residents", i.RID),
    typeName: immunizationTypeName[i.SingleImmunizationID],
    date: parseDate(i.DateAdministered, `Immunization ${i.ID}`),
  }))
  .filter((i) => (i.date && i.typeName) || (note("dropped", `Immunization ${i.appsheetId}: ${i.typeName ? "no date" : "unknown type"}`), false));
{
  const seen = new Set();
  for (const i of immunizations) {
    const key = `${i.residentId}|${i.typeName}|${i.date}`;
    if (seen.has(key)) note("duplicate", `Immunization ${i.appsheetId} duplicates another dose (B69) → dropped`);
    seen.add(key);
  }
}
const immunizationsUnique = immunizations.filter((i, idx, all) => all.findIndex((x) => x.residentId === i.residentId && x.typeName === i.typeName && x.date === i.date) === idx);

// ---------------------------------------------------------------------------
// Files: attachments, blood-test files, project folders and photos
// ---------------------------------------------------------------------------

const attachmentRows = keepIfResident(src.Attachments, "RID", "Attachments");
const procedureIds = new Set(procedures.map((p) => p.appsheetId));
const attachments = attachmentRows.map((a) => {
  const isProcedure = a.Category === "Procedure Image";
  if (isProcedure && !procedureIds.has(a.Procedure_ID)) note("orphan-rows", `Attachment ${a.ID}: procedure ${a.Procedure_ID} not found → filed as a resident photo`);
  const asProcedure = isProcedure && procedureIds.has(a.Procedure_ID);
  return {
    id: uuid("attachments", a.ID),
    appsheetId: a.ID,
    rid: a.RID,
    ownerType: asProcedure ? "procedure" : "resident",
    ownerId: asProcedure ? uuid("procedures", a.Procedure_ID) : uuid("residents", a.RID),
    // Photos are filed by category (0013); procedure images sit with the
    // procedure and have no category of their own.
    subFolder: asProcedure ? null : (blank(a.Sub_Folder) ?? "Shelter"),
    path: a.File,
    caption: blank(a.Tag),
    dateTaken: parseDate(a.Date_Taken, `Attachment ${a.ID}`),
  };
});

const CATEGORY_RENAMES = { "Shelter projects": "Shelter Projects" };
const folderRows = src.Project_Folders.filter((f) => f.Folder_ID);
const folderById = Object.fromEntries(folderRows.map((f) => [f.Folder_ID, f]));
/** The chain of names from a category root down to this folder, or null if it is detached / legacy maintenance. */
function folderChain(f) {
  const chain = [];
  let cur = f;
  while (cur) {
    chain.unshift(cur);
    if (!cur.Parent_Folder_ID) break;
    cur = folderById[cur.Parent_Folder_ID];
  }
  if (chain[0].Parent_Folder_ID) return null; // parent missing
  chain[0] = { ...chain[0], Folder_Name: CATEGORY_RENAMES[chain[0].Folder_Name] ?? chain[0].Folder_Name };
  return chain;
}
const projectFolders = [];
for (const f of folderRows) {
  if (!f.Parent_Folder_ID) continue; // category roots are seeded by 0034
  const chain = folderChain(f);
  if (!chain) {
    note("orphan-rows", `Project folder "${f.Folder_Name}" (${f.Folder_ID}) has no path to a category → dropped`);
    continue;
  }
  // The legacy Enclosure Maintenance tree only ever held test folders (backlog, 2026-09-21).
  if (chain.some((c) => c.Folder_Name === "Enclosure Maintenance")) {
    note("skipped", `Project folder "${chain.map((c) => c.Folder_Name).join("/")}" is legacy maintenance → not migrated`);
    continue;
  }
  projectFolders.push({
    id: uuid("project_folders", f.Folder_ID),
    appsheetId: f.Folder_ID,
    name: f.Folder_Name.trim(),
    category: chain[0].Folder_Name,
    parentId: chain.length > 2 ? uuid("project_folders", chain[chain.length - 2].Folder_ID) : null,
    path: chain.map((c) => c.Folder_Name),
  });
}
const projectFolderIds = new Set(projectFolders.map((f) => f.appsheetId));
const projectPhotos = src.Project_Photos.filter((p) => p.Photo_ID)
  .map((p) => ({
    id: uuid("attachments", p.Photo_ID),
    appsheetId: p.Photo_ID,
    folderId: p.Folder_ID,
    path: p.Photo_File,
    dateTaken: parseDate(p.Date_Taken, `Project photo ${p.Photo_ID}`),
  }))
  .filter((p) => projectFolderIds.has(p.folderId) || (note("orphan-rows", `Project photo ${p.appsheetId}: folder ${p.folderId} not migrated → dropped`), false));

// ---------------------------------------------------------------------------
// Google Drive — where the files actually are
// ---------------------------------------------------------------------------

const oauth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
oauth.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
const drive = google.drive({ version: "v3", auth: oauth });
const FOLDER = "application/vnd.google-apps.folder";

const childrenCache = new Map();
async function children(folderId) {
  if (!childrenCache.has(folderId)) {
    const files = [];
    let pageToken;
    do {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType)",
        pageSize: 1000,
        pageToken,
      });
      files.push(...(res.data.files ?? []));
      pageToken = res.data.nextPageToken;
    } while (pageToken);
    childrenCache.set(folderId, files);
  }
  return childrenCache.get(folderId);
}
const child = async (folderId, name, mimeType) =>
  (await children(folderId)).find((f) => f.name === name && (!mimeType || f.mimeType === mimeType)) ?? null;

const rootId = env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
const residentsFolder = await child(rootId, "Residents", FOLDER);
const deceasedFolder = residentsFolder && (await child(residentsFolder.id, "Deceased", FOLDER));
const projectsFolder = await child(rootId, "Projects", FOLDER);
if (!residentsFolder || !projectsFolder) {
  console.error("Residents/ and Projects/ must exist under GOOGLE_DRIVE_ROOT_FOLDER_ID.");
  process.exit(1);
}

// A resident's legacy folder is "<Name> (<8-hex id>)" — or already
// "<Name> (R-nnnn)" from an earlier run — under Residents/ or, once they
// have died, Residents/Deceased/.
const folderSuffix = (name) => name.match(/\(([^()]+)\)\s*$/)?.[1] ?? null;
for (const r of residents) {
  const candidates = [];
  for (const parent of [residentsFolder, deceasedFolder].filter(Boolean)) {
    for (const f of await children(parent.id)) {
      if (f.mimeType !== FOLDER) continue;
      const suffix = folderSuffix(f.name);
      if (suffix === r.appsheetId || suffix === r.code) candidates.push({ ...f, parent: parent.name });
    }
  }
  if (candidates.length > 1) {
    // A resident renamed in AppSheet can have "Dang (id)" and "Dang 1 (id)";
    // a dev scratch folder can carry an R-code. The one their attachment
    // paths point into wins, then a legacy-id match, then the current name.
    const referenced = candidates.filter((c) => attachmentRows.some((a) => a.RID === r.appsheetId && a.File.startsWith(`Residents/${c.name}/`)));
    const byId = candidates.filter((c) => folderSuffix(c.name) === r.appsheetId);
    const named = candidates.filter((c) => c.name.startsWith(`${r.name} (`));
    r.driveFolder = referenced[0] ?? byId[0] ?? named[0] ?? candidates[0];
    note("drive", `${r.name}: ${candidates.length} folders carry their id (${candidates.map((c) => `${c.parent}/${c.name}`).join(", ")}) → using ${r.driveFolder.name}`);
  } else {
    r.driveFolder = candidates[0] ?? null;
  }
  if (r.driveFolder && deceasedResidents.has(r.appsheetId) !== (r.driveFolder.parent === "Deceased")) {
    note("drive", `${r.name}: folder is under ${r.driveFolder.parent} but the resident is ${deceasedResidents.has(r.appsheetId) ? "" : "not "}deceased`);
  }
}
// What else is in Residents/ — dev scratch folders and the like, for cleanup by hand.
{
  const claimed = new Set(residents.map((r) => r.driveFolder?.id).filter(Boolean));
  for (const parent of [residentsFolder, deceasedFolder].filter(Boolean)) {
    for (const f of await children(parent.id)) {
      if (f.mimeType === FOLDER && !claimed.has(f.id) && f.name !== "Deceased") note("drive-unclaimed", `${parent.name}/${f.name} belongs to no migrated resident`);
    }
  }
}

/**
 * "Residents/Panda (4df69c6f)/Photos/Foster/2606/x.jpg" → Drive file id.
 * The first two segments name the resident folder, which may have been
 * renamed already, so they resolve through the resident; the rest is a
 * literal walk.
 */
async function resolvePath(path, where) {
  const segments = path.split("/").filter(Boolean);
  let folderId;
  let rest;
  if (segments[0] === "Residents") {
    const rid = folderSuffix(segments[1] ?? "");
    const resident = residentByAppsheet[rid];
    let literal = null;
    for (const parent of [residentsFolder, deceasedFolder].filter(Boolean)) literal ??= await child(parent.id, segments[1], FOLDER);
    if (!literal && !resident?.driveFolder) {
      note("drive-missing", `${where}: no folder for ${segments[1]} → dropped`);
      return null;
    }
    folderId = (literal ?? resident.driveFolder).id;
    rest = segments.slice(2);
  } else if (segments[0] === "Projects") {
    folderId = projectsFolder.id;
    rest = segments.slice(1);
  } else {
    note("drive-missing", `${where}: path "${path}" is outside Residents/ and Projects/ → dropped`);
    return null;
  }
  for (let i = 0; i < rest.length; i++) {
    const isLast = i === rest.length - 1;
    const found = await child(folderId, rest[i], isLast ? null : FOLDER);
    if (!found) {
      note("drive-missing", `${where}: "${path}" stops at "${rest[i]}" → dropped`);
      return null;
    }
    folderId = found.id;
  }
  return folderId;
}

for (const a of attachments) a.driveFileId = await resolvePath(a.path, `Attachment ${a.appsheetId} (${residentName(a.rid)})`);
for (const b of bloodTests) b.driveFileId = b.file ? await resolvePath(b.file, `Blood test ${b.appsheetId} (${residentName(b.rid)})`) : null;
for (const p of projectPhotos) p.driveFileId = await resolvePath(p.path, `Project photo ${p.appsheetId}`);
for (const f of projectFolders) {
  let folderId = projectsFolder.id;
  for (const name of f.path) {
    const found = folderId && (await child(folderId, name, FOLDER));
    folderId = found?.id ?? null;
  }
  f.driveFolderId = folderId;
  if (!folderId) note("drive", `Project folder ${f.path.join("/")} has no Drive folder yet → created on first upload`);
}

const attachmentsResolved = attachments.filter((a) => a.driveFileId);
for (const r of residents) {
  const profile = r.profileImageId && attachmentsResolved.find((a) => a.appsheetId === r.profileImageId);
  if (r.profileImageId && !profile) note("drive-missing", `${r.name}: profile image ${r.profileImageId} not resolvable → no profile photo`);
  r.profilePhotoDriveFileId = profile?.driveFileId ?? null;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const counts = {
  residents: residents.length,
  "  of which deceased": deceasedResidents.size,
  "  with a Drive folder": residents.filter((r) => r.driveFolder).length,
  zones: zones.length,
  enclosures: enclosures.length,
  contacts: contacts.length,
  vets: vets.length,
  group_origins: origins.length,
  placement_history: placements.length,
  vet_appointments: appointments.length,
  weight: weights.length,
  procedures: procedures.length,
  blood_tests: bloodTests.length,
  "  with a file": bloodTests.filter((b) => b.driveFileId).length,
  prescriptions: prescriptions.length,
  immunization_records: immunizationsUnique.length,
  "attachments (resident/procedure)": attachmentsResolved.length,
  project_folders: projectFolders.length,
  "attachments (project)": projectPhotos.filter((p) => p.driveFileId).length,
};

console.log(`Snapshot ${snapshotDir} (sheet modified ${exportMeta.sheetModified})`);
console.log(`Target: ${envName} — project ${projectRef}${report ? " (report only)" : dryRun ? " (dry run)" : ""}\n`);
console.log("Rows to load:");
for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(34)} ${v}`);

const byKind = {};
for (const a of anomalies) (byKind[a.kind] ??= []).push(a.detail);
console.log(`\n${anomalies.length} note(s):`);
for (const [kind, details] of Object.entries(byKind)) {
  console.log(`\n  ${kind} (${details.length})`);
  for (const d of details) console.log(`    - ${d}`);
}

// process.exit() here trips a libuv assertion on Windows while googleapis
// still holds sockets, so the load and the renames are simply skipped.
if (!report) await load();

async function load() {

// ---------------------------------------------------------------------------
// SQL
// ---------------------------------------------------------------------------

const sql = [];
sql.push("set local app.deceased_lock_bypass = 'on';");
// Migrated rows are stamped with the first admin so created_by is never null on real records.
sql.push("create temp table import_ctx as select (select user_id from user_roles where role = 'admin' and archived_at is null order by created_at limit 1) as admin_id;");
sql.push("do $$ begin if (select admin_id from import_ctx) is null then raise exception 'no active admin in user_roles — bootstrap one first'; end if; end $$;");

const existingCheck = `do $$ declare n int; begin select count(*) into n from residents; if n > 0 then raise exception '% resident(s) already in this database — pass --replace to wipe them', n; end if; end $$;`;
if (replace) {
  sql.push(`
    update project_folders set cover_attachment_id = null;
    delete from attachments;
    delete from resident_diets;
    delete from prescriptions;
    delete from immunization_records;
    delete from blood_tests;
    delete from procedures;
    delete from weight;
    delete from vet_appointments;
    delete from bulk_appointments;
    delete from maintenance_assignees;
    delete from maintenance_photos;
    delete from maintenance;
    delete from placement_history;
    delete from residents;
    delete from contacts;
    delete from vets;
    delete from group_origins;
    delete from enclosures where zone_id <> (select id from zones where name = 'Lifecycle');
    delete from zones where name <> 'Lifecycle';
    delete from project_folders where parent_folder_id is not null;
  `);
} else {
  sql.push(existingCheck);
}

const admin = "(select admin_id from import_ctx)";

for (const z of zones) sql.push(`insert into zones (id, name, internal) values (${q(z.id)}, ${q(z.name)}, ${q(z.internal)});`);
for (const e of enclosures) sql.push(`insert into enclosures (id, name, zone_id, capacity, notes) values (${q(e.id)}, ${q(e.name)}, ${q(e.zoneId)}, ${q(e.capacity)}, ${q(e.notes)});`);
for (const c of contacts) sql.push(`insert into contacts (id, name, type, phone, address, whatsapp, messenger_id, line_id) values (${q(c.id)}, ${q(c.name)}, ${q(c.type)}, ${q(c.phone)}, ${q(c.address)}, ${q(c.whatsapp)}, ${q(c.messengerId)}, ${q(c.lineId)});`);
for (const v of vets) sql.push(`insert into vets (id, name, contact_info, notes) values (${q(v.id)}, ${q(v.name)}, ${q(v.contactInfo)}, ${q(v.notes)});`);
for (const o of origins) sql.push(`insert into group_origins (id, name, notes) values (${q(o.id)}, ${q(o.name)}, ${q(o.notes)});`);
for (const m of medications) sql.push(`insert into medication (name) values (${q(m.name)}) on conflict (name) do nothing;`);
for (const t of immunizationTypes) sql.push(`insert into immunization_types (name, is_mandatory, interval_months) values (${q(t.name)}, ${q(t.isMandatory)}, ${q(t.intervalMonths)}) on conflict (name) do update set is_mandatory = excluded.is_mandatory, interval_months = excluded.interval_months;`);
for (const name of new Set(procedures.map((p) => p.typeName))) sql.push(`insert into procedure_types (name) values (${q(name)}) on conflict (name) do nothing;`);
for (const name of new Set(bloodTests.map((b) => b.typeName))) sql.push(`insert into blood_test_types (name) values (${q(name)}) on conflict (name) do nothing;`);

// deceased_archived_at stays null: the hub's "retry archive" then writes the
// summary PDF and index into the (already archived) folder on first click.
for (const r of residents) {
  sql.push(`insert into residents (id, resident_code, name, thai_name, other_names, species, breed, sex, estimated_age_years, age_estimated_on, intake_date, bio, is_desexed, ready_for_adoption, is_public_visible, group_origin_id, blood_test_interval_months, drive_folder_id, profile_photo_drive_file_id, created_by)
    values (${q(r.id)}, ${q(r.code)}, ${q(r.name)}, ${q(r.thaiName)}, ${q(r.otherNames)}, ${q(r.species)}, ${q(r.breed)}, ${q(r.sex)}, ${q(r.age?.years ?? null)}, ${q(r.age?.asOf ?? null)}, ${q(r.intakeDate)}, ${q(r.bio)}, ${q(r.isDesexed)}, ${q(r.readyForAdoption && !deceasedResidents.has(r.appsheetId))}, ${q(r.readyForAdoption && !deceasedResidents.has(r.appsheetId))}, ${r.originId && originIds.has(uuid("group_origins", r.originId)) ? q(uuid("group_origins", r.originId)) : "null"}, ${q(r.bloodTestInterval)}, ${q(r.driveFolder?.id ?? null)}, ${q(r.profilePhotoDriveFileId)}, ${admin});`);
}
// The code sequence continues after the migrated ones.
sql.push(`select setval('residents_resident_number_seq', ${residents.length});`);

for (const a of appointments) sql.push(`insert into vet_appointments (id, resident_id, vet_id, appointment_date, notes, status, created_by) values (${q(a.id)}, ${q(a.residentId)}, ${q(a.vetId)}, ${q(`${a.date} 09:00+07`)}, ${q(a.notes)}, 'completed', ${admin});`);
for (const w of weights) sql.push(`insert into weight (id, resident_id, vet_appointment_id, date, weight_kg, created_by) values (${q(w.id)}, ${q(w.residentId)}, ${q(w.appointmentId)}, ${q(w.date)}, ${q(w.kg)}, ${admin});`);
for (const p of procedures) sql.push(`insert into procedures (id, resident_id, vet_appointment_id, procedure_type_id, date, notes, created_by) values (${q(p.id)}, ${q(p.residentId)}, ${q(p.appointmentId)}, (select id from procedure_types where name = ${q(p.typeName)}), ${q(p.date)}, ${q(p.notes)}, ${admin});`);
for (const b of bloodTests) sql.push(`insert into blood_tests (id, resident_id, vet_appointment_id, blood_test_type_id, date, results, created_by) values (${q(b.id)}, ${q(b.residentId)}, ${q(b.appointmentId)}, (select id from blood_test_types where name = ${q(b.typeName)}), ${q(b.date)}, ${q(b.results)}, ${admin});`);
for (const p of prescriptions) sql.push(`insert into prescriptions (id, resident_id, vet_appointment_id, medication_id, frequency_id, dose_quantity, start_date, end_date, notes, created_by) values (${q(p.id)}, ${q(p.residentId)}, ${q(p.appointmentId)}, (select id from medication where name = ${q(p.medicationName)}), (select id from frequency where label = ${q(p.frequencyLabel)}), ${q(p.doseQuantity)}, ${q(p.start)}, ${q(p.end)}, ${q(p.notes)}, ${admin});`);
for (const i of immunizationsUnique) sql.push(`insert into immunization_records (id, resident_id, immunization_type_id, date_administered, created_by) values (${q(i.id)}, ${q(i.residentId)}, (select id from immunization_types where name = ${q(i.typeName)}), ${q(i.date)}, ${admin});`);

for (const a of attachmentsResolved) sql.push(`insert into attachments (id, owner_type, owner_id, sub_folder, drive_file_id, file_name, date_taken, caption, uploaded_by) values (${q(a.id)}, ${q(a.ownerType)}, ${q(a.ownerId)}, ${q(a.subFolder)}, ${q(a.driveFileId)}, ${q(a.path.split("/").pop())}, ${q(a.dateTaken)}, ${q(a.caption)}, ${admin});`);
for (const b of bloodTests.filter((x) => x.driveFileId)) sql.push(`insert into attachments (id, owner_type, owner_id, drive_file_id, file_name, uploaded_by) values (${q(uuid("attachments", `bt:${b.appsheetId}`))}, 'blood_test', ${q(b.id)}, ${q(b.driveFileId)}, ${q(b.file.split("/").pop())}, ${admin});`);

// Folders parent-first; the category root is the seeded row of that name.
for (const f of [...projectFolders].sort((a, b) => a.path.length - b.path.length)) {
  const parent = f.parentId ? q(f.parentId) : `(select id from project_folders where parent_folder_id is null and name = ${q(f.category)})`;
  sql.push(`insert into project_folders (id, top_level_category, name, parent_folder_id, drive_folder_id, created_by) values (${q(f.id)}, ${q(f.category)}, ${q(f.name)}, ${parent}, ${q(f.driveFolderId)}, ${admin});`);
}
for (const p of projectPhotos.filter((x) => x.driveFileId)) sql.push(`insert into attachments (id, owner_type, owner_id, drive_file_id, file_name, date_taken, uploaded_by) values (${q(p.id)}, 'project', ${q(uuid("project_folders", p.folderId))}, ${q(p.driveFileId)}, ${q(p.path.split("/").pop())}, ${q(p.dateTaken)}, ${admin});`);

// Placements last and in order: the close-prior trigger closes each one at
// the next start, and the Deceased row's cascade runs against a complete
// medical history. The source end dates are kept where they agree with the
// next start; the last row is left open whatever the sheet said.
for (const p of placements) {
  sql.push(`insert into placement_history (id, resident_id, placement_type, start_date, zone_id, enclosure_id, previous_enclosure_id, carer_id, notes, created_by)
    values (${q(uuid("placement_history", p.appsheetId))}, ${q(p.resident.id)}, ${q(p.type)}, ${q(p.startTs)}, ${enclosureZoneSql[p.enclosure]}, ${enclosureSql[p.enclosure]}, ${p.previousEnclosure ? enclosureSql[p.previousEnclosure] : "null"}, ${q(contactId(p.carer))}, ${q(p.notes)}, ${admin});`);
}

// Assertions — a failure here aborts the transaction.
sql.push(`do $$
declare bad int;
begin
  select count(*) into bad from residents r where (select count(*) from placement_history p where p.resident_id = r.id and p.end_date is null) <> 1;
  if bad > 0 then raise exception '% resident(s) without exactly one open placement', bad; end if;
  select count(*) into bad from residents where resident_code is null or drive_folder_id = '';
  if bad > 0 then raise exception '% resident(s) without a code', bad; end if;
  select count(*) into bad from resident_current_state where is_deceased;
  if bad <> ${deceasedResidents.size} then raise exception 'expected ${deceasedResidents.size} deceased, found %', bad; end if;
  select count(*) into bad from placement_history where end_date is not null and end_date <= start_date;
  if bad > 0 then raise exception '% placement(s) end before they start', bad; end if;
end $$;`);

const body = sql.join("\n");
const transaction = `begin;\n${body}\n${dryRun ? "rollback" : "commit"};`;

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

if (!env.SUPABASE_ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN is required to load.");
  process.exit(2);
}

process.stdout.write(`\n${dryRun ? "Dry run" : "Loading"} — ${sql.length} statements, ${(body.length / 1024).toFixed(0)} KB … `);
try {
  await query(transaction);
  console.log("ok");
} catch (error) {
  console.log("FAILED");
  console.error(error.message);
  console.error("Nothing was kept.");
  process.exit(1);
}

if (dryRun) {
  console.log("Rolled back — nothing was kept. Drive folders were not renamed.");
  return;
}

// ---------------------------------------------------------------------------
// Drive folder renames — only once the rows that point at them are committed
// ---------------------------------------------------------------------------

// Mirrors residentFolderName() in src/lib/google/drive.ts.
const folderNameFor = (r) => `${r.name.replace(/\//g, "-")} (${r.code})`;
let renamed = 0;
for (const r of residents) {
  if (!r.driveFolder) continue;
  const wanted = folderNameFor(r);
  if (r.driveFolder.name === wanted) continue;
  await drive.files.update({ fileId: r.driveFolder.id, requestBody: { name: wanted }, fields: "id" });
  console.log(`  renamed "${r.driveFolder.name}" → "${wanted}"`);
  renamed++;
}
console.log(`\nDone. ${renamed} Drive folder(s) renamed.`);
}
