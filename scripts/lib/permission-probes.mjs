// The probes for scripts/check-permission-parity.mjs: one concrete statement per
// activity and level, run under each role's own login.
//
// docs/roles-and-permissions.md §11 puts the probes in the catalogue file
// (src/lib/permissions/catalogue.ts), which `permissions-catalogue` owns. That
// file was not ready when this was written, so the probes live here and the
// catalogue adopts them later (decisions/2026-10-03-permission-parity-check.md).
// There must never be a second list: when the catalogue takes the field over,
// this file is deleted, not kept alongside.
//
// A probe is
//   activity   a key of the catalogue
//   level      "read" (the statement reads rows: allowed means it returned one)
//              "edit" (the statement writes: allowed means it took effect)
//   sql        the statement. `$R` is the resident it runs against; `$P` is the
//              harness person it runs as, for the few statements that name one
//   scoped     run once inside a vet's scope and once outside it (§5). Outside
//              it a vet is refused whatever the cell says; every other role is
//              unaffected
//   expect     override: the exact set of roles the DEFAULT says may do this.
//              For a statement whose default is narrower than the activity's
//              cell, which is what a known tightening is
//   known      the tightenings this probe is expected to find: { id, roles }.
//              `id` is the row of §3 C; `roles` are the roles the database lets
//              through beyond what the default allows. The check fails if the
//              database differs and the difference is not listed, and fails if
//              a listed difference is gone (§11, and decisions/2026-10-02-
//              check-scripts-assert-live-not-replay.md)
//   fn         the statement is a function call; its refusal is an exception
//              rather than zero rows
//
// Every probe also runs as Admin, who is allowed everything (§6). If Admin is
// refused the probe itself is broken (a missing fixture, a wrong column) and
// the run stops saying so, rather than reading it as a finding.

export const SCOPED = "$R";

const MED = "(select id from medication order by id limit 1)";
const ENC = "(select id from enclosures order by id limit 1)";

// Every probe, in the catalogue's order. Activities with no database-level
// meaning are listed in NO_DB_PROBE below with the reason, so that "not probed"
// is a stated fact and not an absence.
export const PROBES = [
  // --- Residents
  { activity: "resident.record", level: "edit", scoped: true, sql: `update residents set bio = 'probe' where id = $R` },
  { activity: "resident.record", level: "read", scoped: true, sql: `select 1 from residents where id = $R` },
  { activity: "resident.record", level: "read", scoped: true, sql: `select 1 from placement_history where resident_id = $R` },
  {
    // C2: nobody deletes a resident from a screen. Default: Admin only.
    activity: "resident.record", level: "edit", sql: `delete from residents where id = $BARE`,
    expect: ["admin"], known: [{ id: "C2", roles: ["management", "staff"] }],
  },
  { activity: "resident.register", level: "edit", fn: true, sql: `select record_intake('Probe pup', current_date, p_diet_type_id => $DIET)` },
  { activity: "resident.microchip", level: "edit", scoped: true, fn: true, sql: `select set_resident_microchip($R, '981000000000001', null)` },
  { activity: "resident.adoption_news", level: "edit", scoped: true, sql: `insert into adoption_updates (resident_id, received_on, channel) values ($R, current_date, 'visit')` },
  { activity: "resident.adoption_news", level: "edit", scoped: true, sql: `delete from adoption_updates where resident_id = $R` },
  { activity: "resident.adoption_news", level: "read", scoped: true, sql: `select 1 from adoption_updates where resident_id = $R` },

  // --- Housing
  { activity: "placement.move", level: "edit", sql: `insert into placement_history (resident_id, placement_type, start_date, enclosure_id) values ($R, 'ChangeEnclosure', now() + interval '1 minute', ${ENC})` },
  { activity: "placement.hospital", level: "edit", sql: `insert into placement_history (resident_id, placement_type, start_date) values ($R, 'SendToHospital', now() + interval '1 minute')` },
  { activity: "placement.rehome", level: "edit", sql: `insert into placement_history (resident_id, placement_type, start_date, carer_id) values ($R, 'Foster', now() + interval '1 minute', (select id from contacts where type = 'Carer' limit 1))` },
  { activity: "placement.death", level: "edit", sql: `insert into placement_history (resident_id, placement_type, start_date) values ($R, 'Deceased', now() + interval '1 minute')` },
  { activity: "placement.death_withdraw", level: "edit", fn: true, sql: `select undo_deceased_placement($DEAD, 'probe')` },

  // --- Medical (scoped to the vet's clinic)
  { activity: "visit.book", level: "edit", scoped: true, sql: `insert into vet_appointments (resident_id, vet_id, appointment_date, status) values ($R, $CLINIC, now() + interval '9 days', 'scheduled')` },
  ...table("medical.visits", "vet_appointments", `update vet_appointments set reason = 'probe' where resident_id = $R`, `insert into vet_appointments (resident_id, vet_id, appointment_date, status) values ($R, $CLINIC, now() + interval '9 days', 'scheduled')`, `delete from vet_appointments where resident_id = $R`, { c4: true }),
  ...table("medical.procedures", "procedures", `update procedures set notes = 'probe' where resident_id = $R`, `insert into procedures (resident_id, date, procedure_type_id) values ($R, current_date, (select id from procedure_types limit 1))`, `delete from procedures where resident_id = $R`, { c4: true }),
  ...table("medical.blood_tests", "blood_tests", `update blood_tests set results = 'probe' where resident_id = $R`, `insert into blood_tests (resident_id, date, blood_test_type_id) values ($R, current_date, (select id from blood_test_types limit 1))`, `delete from blood_tests where resident_id = $R`, { c4: true }),
  ...table("medical.prescriptions", "prescriptions", `update prescriptions set notes = 'probe' where resident_id = $R`, `insert into prescriptions (resident_id, medication_id, start_date) values ($R, ${MED}, current_date)`, `delete from prescriptions where resident_id = $R`, { c4: true }),
  ...table("medical.immunizations", "immunization_records", `update immunization_records set notes = 'probe' where resident_id = $R`, `insert into immunization_records (resident_id, immunization_type_id, date_administered) values ($R, (select id from immunization_types limit 1), current_date - 400)`, `delete from immunization_records where resident_id = $R`, { c4: true }),
  ...table("medical.weight", "weight", `update weight set notes = 'probe' where resident_id = $R`, `insert into weight (resident_id, date, weight_kg) values ($R, current_date - 400, 5)`, `delete from weight where resident_id = $R`, { c5: true }),
  ...table("medical.diet", "resident_diets", `update resident_diets set notes = 'probe' where resident_id = $R`, `insert into resident_diets (resident_id, diet_type_id, start_date) values ($R, (select id from diet_types limit 1), current_date - 400)`, `delete from resident_diets where resident_id = $R`, {}),
  { activity: "medical.archive", level: "edit", sql: `update weight set archived_at = now(), archive_reason = 'probe' where resident_id = $R`, known: [{ id: "N4", roles: ["vet"] }] },
  { activity: "medical.archive", level: "edit", sql: `update prescriptions set archived_at = now(), archive_reason = 'probe' where resident_id = $R`, known: [{ id: "N4", roles: ["vet"] }] },
  { activity: "medical.archive", level: "edit", sql: `update immunization_records set archived_at = now(), archive_reason = 'probe' where resident_id = $R`, known: [{ id: "N4", roles: ["vet"] }] },
  { activity: "medical.archive", level: "edit", sql: `update vet_appointments set archived_at = now(), archive_reason = 'probe' where resident_id = $R`, known: [{ id: "N4", roles: ["vet"] }] },

  // --- Photos
  { activity: "photos.resident_add", level: "edit", scoped: true, fn: true, sql: `select record_attachment('resident', $R, 'harness-probe-file', 'probe.jpg', 'Medical', null, null)` },
  { activity: "photos.resident_manage", level: "edit", fn: true, sql: `select delete_resident_photo((select id from attachments where owner_type = 'resident' and owner_id = $R limit 1))` },

  // --- Enclosures
  { activity: "facility.enclosures", level: "edit", sql: `update enclosures set notes = 'probe' where id = $ENC`, known: [{ id: "C1", roles: ["management", "staff"] }] },
  { activity: "facility.enclosures", level: "edit", sql: `update zones set internal = internal where id = $ZONE`, known: [{ id: "C1", roles: ["management", "staff"] }] },
  { activity: "facility.enclosures", level: "read", sql: `select 1 from enclosures where id = $ENC`, known: [{ id: "C10", roles: ["vet"] }] },
  { activity: "facility.enclosures", level: "read", sql: `select 1 from zones where id = $ZONE`, known: [{ id: "C10", roles: ["vet"] }] },

  // --- Maintenance
  { activity: "maintenance.jobs", level: "edit", sql: `insert into maintenance (title, zone_id) values ('probe', $ZONE)` },
  { activity: "maintenance.jobs", level: "edit", sql: `update maintenance set description = 'probe' where id = $JOB` },
  { activity: "maintenance.jobs", level: "edit", sql: `delete from maintenance where id = $JOB` },
  { activity: "maintenance.jobs", level: "read", sql: `select 1 from maintenance where id = $JOB` },
  { activity: "maintenance.progress", level: "edit", sql: `update maintenance set status = 'In Progress' where id = $JOB` },
  { activity: "maintenance.photos", level: "edit", sql: `insert into maintenance_photos (maintenance_id, drive_file_id) values ($JOB, 'harness-probe-file')` },

  // --- Projects
  { activity: "projects.folders", level: "edit", sql: `insert into project_folders (top_level_category, name, parent_folder_id) values ('Events', 'Probe project', $CATEGORY)`, refusedBy: ["P0001"] /* project_folders_before_write reads the parent as the caller, so a role that cannot see it is refused there first */ },
  { activity: "projects.folders", level: "edit", sql: `update project_folders set summary = 'probe' where id = $PROJECT` },
  { activity: "projects.folders", level: "edit", sql: `delete from project_folders where id = $PROJECT` },
  { activity: "projects.folders", level: "read", sql: `select 1 from project_folders where id = $PROJECT` },
  { activity: "projects.photos", level: "edit", sql: `insert into project_photos (project_folder_id, drive_file_id) values ($PROJECT, 'harness-probe-file')` },
  { activity: "projects.publish", level: "edit", sql: `update project_folders set is_public = true where id = $PROJECT` },

  // --- Clinics, contacts, supporters
  { activity: "clinics.list", level: "edit", sql: `update vets set notes = 'probe' where id = $CLINIC` },
  { activity: "clinics.list", level: "read", sql: `select 1 from vets where id = $CLINIC`, known: [{ id: "C10", roles: ["vet"] }] },
  { activity: "clinics.doctors", level: "edit", sql: `insert into vet_doctors (name, vet_id) values ('Probe doctor', $CLINIC)`, known: [{ id: "C7", roles: ["staff", "vet"] }] },
  { activity: "clinics.doctors", level: "edit", sql: `update vet_doctors set active = active where id = $DOCTOR`, known: [{ id: "C7", roles: ["staff", "vet"] }] },
  { activity: "clinics.doctors", level: "edit", fn: true, sql: `select merge_vet_doctors($DOCTOR, $DOCTOR2)`, known: [{ id: "C7", roles: ["staff", "vet"] }] },
  { activity: "contacts.directory", level: "edit", sql: `update contacts set notes = 'probe' where id = $CONTACT`, known: [{ id: "C6", roles: ["staff"] }] },
  { activity: "contacts.directory", level: "edit", sql: `delete from contacts where id = $CONTACT`, known: [{ id: "C6", roles: ["staff"] }] },
  { activity: "contacts.directory", level: "read", sql: `select 1 from contacts where id = $CONTACT`, byRole: { volunteer: `select 1 from volunteer_contacts where id = $CONTACT` } },
  { activity: "contacts.add", level: "edit", sql: `insert into contacts (name, type) values ('Probe contact', 'Vendor')` },
  { activity: "friends.manage", level: "edit", sql: `update shelter_friends set published = published where id = $FRIEND` },
  { activity: "friends.manage", level: "read", sql: `select 1 from shelter_friends where id = $FRIEND`, known: [{ id: "C10", roles: ["vet"] }, { id: "N3", roles: ["staff", "volunteer"] }] },

  // --- Stock and ordering
  { activity: "stock.count", level: "edit", fn: true, sql: `select record_stocktake('[]'::jsonb, '[]'::jsonb)` },
  { activity: "stock.delivery", level: "edit", sql: `insert into stock_receipts (item_kind, medication_id, quantity) values ('medication', ${MED}, 1)` },
  { activity: "stock.delivery", level: "read", sql: `select 1 from stock_receipts where id = $RECEIPT`, known: [{ id: "C9", roles: ["volunteer"] }] },
  { activity: "stock.medications", level: "edit", sql: `update medication set cost_per_unit = cost_per_unit where id = ${MED}` },
  { activity: "stock.medications", level: "read", sql: `select cost_per_unit from medication where id = ${MED}`, known: [{ id: "C9", roles: ["volunteer"] }, { id: "N1", roles: ["staff", "vet"] }] },
  { activity: "stock.diets", level: "edit", sql: `update diet_types set notes = 'probe' where id = $DIET` },
  { activity: "stock.diets", level: "read", sql: `select cost_per_unit from diet_types where id = $DIET`, known: [{ id: "C9", roles: ["volunteer"] }, { id: "C10", roles: ["vet"] }, { id: "N2", roles: ["staff"] }] },
  { activity: "stock.correct", level: "edit", fn: true, sql: `select record_stock_correction('medication', ${MED}, 1)` },

  // --- Management
  { activity: "reports.cashflow", level: "edit", sql: `update fixed_outgoings set note = 'probe' where id = $OUTGOING` },
  { activity: "reports.cashflow", level: "read", sql: `select 1 from fixed_outgoings where id = $OUTGOING` },
  { activity: "recurring.manage", level: "edit", sql: `update recurring_jobs set description = 'probe' where id = $JOB_NONE` },
  { activity: "recurring.manage", level: "edit", sql: `insert into recurring_jobs (title, time_of_day, link_path, repeat, weekdays, starts_on) values ('Probe', 'morning', '/', 'weekly', '{1}', current_date)` },
  { activity: "recurring.do_any", level: "edit", fn: true, sql: `select record_recurring_job($JOB_NONE, current_date, 'done', null)` },
  { activity: "recurring.do_own", level: "edit", fn: true, sql: `select record_recurring_job($JOB_ALL, current_date, 'done', null)`, known: [{ id: "C11", roles: ["vet"] }] },

  // --- Settings
  { activity: "website.content", level: "edit", sql: `update site_content set tagline = tagline` },
  { activity: "reference.types", level: "edit", sql: `update immunization_types set cost = cost where id = (select id from immunization_types limit 1)`, known: [{ id: "C3", roles: ["vet"] }] },
  { activity: "reference.types", level: "edit", sql: `insert into immunization_types (name, interval_months) values ('Probe type', 12)`, known: [{ id: "C3", roles: ["vet"] }] },
  { activity: "reference.types", level: "edit", sql: `update blood_test_types set name = name where id = (select id from blood_test_types limit 1)` },
  { activity: "reference.add_while_recording", level: "edit", sql: `insert into medication (name) values ('Probe medication')` },
  { activity: "reference.add_while_recording", level: "edit", sql: `insert into frequency (label) values ('Probe frequency')` },
  { activity: "reference.add_while_recording", level: "edit", sql: `insert into procedure_types (name) values ('Probe procedure')` },
  { activity: "audit.view", level: "edit", sql: `select 1 from audit_log limit 1` },
];

// A statement a read on a Yes/No activity: "read" there means "needs Yes".
// (audit.view and system.status are Yes/No activities probed by reading.)
// Marked so the runner knows the SQL is a select though the level is edit.
// (Handled by the runner: a select statement counts rows; a write counts rows too.)

// What a table's four statements look like, to keep PROBES readable.
function table(activity, name, update, insert, del, flags) {
  const out = [
    { activity, level: "edit", scoped: true, sql: update },
    { activity, level: "edit", scoped: true, sql: insert },
    { activity, level: "read", scoped: true, sql: `select 1 from ${name} where resident_id = $R` },
  ];
  // A hard delete is not an act the matrix has: the screens remove by archiving
  // (medical.archive), so the default is Admin only. Tables whose policies hand
  // it to a role are the known tightenings (C4, C5).
  const delProbe = { activity, level: "edit", scoped: true, sql: del, expect: ["admin"] };
  if (flags.c4) delProbe.known = [{ id: "C4", roles: ["vet"] }];
  if (flags.c5) delProbe.known = [{ id: "C5", roles: ["management", "staff", "vet"] }];
  out.push(delProbe);
  return out;
}

// Activities with no database statement that distinguishes them, and why. The
// runner prints this list so the gap is read, not inferred.
export const NO_DB_PROBE = {
  "placement.death_withdraw": undefined, // probed above; kept out of this list on purpose
  "photos.resident_publish": "Finding A5: publishing is a side effect of filing a photo anywhere but Medical, so there is no statement to separate it from photos.resident_add until the split is built",
  "facility.map": "a page over data the facility.enclosures probes already cover; no table of its own",
  "projects.publish": undefined,
  "stock.purchasing": "a page over medication_forecast / diet_forecast, which read what stock.medications and stock.diets probes already cover",
  "stock.usage": "a page over stock_counts and stock_receipts, covered by the stock.delivery and stock.count probes",
  "system.status": "status_alert_runs is not granted to authenticated at all, Admin included: the page reads it with the service role, so the database has no per-role statement to test",
  "reports.dashboard": "a page that reads tables other activities own; it has no table",
  "translations.manage": "the translations table has no fixture row that is stable across runs; the policy is read by hand in Appendix C",
  "assistant.ask": "app code and the Anthropic call; no database statement",
  "assistant.record": "app code; each thing it records is checked against that thing's own activity",
  "audit.undo": "app code replaying the audit log through the ordinary table policies",
};
for (const k of Object.keys(NO_DB_PROBE)) if (NO_DB_PROBE[k] === undefined) delete NO_DB_PROBE[k];
