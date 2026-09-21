// Snapshot the legacy AppSheet "Database" Google Sheet, one CSV per tab, so
// scripts/import-appsheet.mjs works from a fixed, inspectable copy rather
// than whatever the sheet says at the moment it runs.
//
//   node scripts/appsheet-export.mjs                # → appsheet-export/<timestamp>/
//   node scripts/appsheet-export.mjs --out some/dir
//
// The sheet lives in the Drive account the app already has an OAuth token
// for (it is the parent folder of GOOGLE_DRIVE_ROOT_FOLDER_ID's own tree —
// AppSheet keeps its files relative to the sheet), so this reads it with the
// GOOGLE_OAUTH_* values from .env.local and no extra scope: Sheets' own
// "gviz" CSV endpoint accepts a Drive-scoped token, one tab at a time by
// name (headers=1 stops it guessing that several rows are headers). Cells
// come out as the sheet *displays* them (dates as d/m/yyyy, booleans as
// TRUE/FALSE), which is what the import script expects.
//
// The endpoint quietly returns the first tab when a name doesn't exist, so
// every tab's header row is checked against what the import script relies
// on; a renamed or restructured tab fails here, not half-way through a load.
//
// The output holds the shelter's real records and is gitignored.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";
import { loadEnv } from "./lib/env.mjs";
import { parseCsv } from "./lib/csv.mjs";

export const APPSHEET_SHEET_ID =
  process.env.APPSHEET_SHEET_ID ?? "1rNLUsZtQQmod_fGWjU9qMefxzQHa452gNRs4pOodiK8";

/**
 * Tab name → the first columns the import script reads, in sheet order.
 * (Not every column: the blood-test tab alone has 38.) Tabs that were only
 * ever AppSheet mechanics — Bulk Upload, Bulk Appointments, Maintenance,
 * Maintenance_Filter, Buttons, the per-user settings — are not exported.
 */
export const TABS = {
  Residents: ["ID", "Name", "Thai Name", "Other Names", "Breed", "Sex", "Date of birth", "Profile Image", "Spayed", "Ready for Adoption", "BIO", "Origin ID", "Details", "Blood Test Priority"],
  Attachments: ["ID", "Category", "RID", "Procedure_ID", "File", "Sub_Folder", "Tag", "Date_Taken"],
  "Blood Tests": ["ID", "RID", "Date of test", "Vet Appointment ID", "Vet", "Test Type", "Normal Result", "Results", "Next Blood Test", "Treatment Plan", "File"],
  "Immunization Types": ["ID", "Name", "FrequencyValue (Months)", "IsMandatory"],
  // "Immunization Records" is the bulk fan-out parent; "History" holds the
  // one-row-per-dose children the app's immunization_records maps to.
  "Immunization History": ["ID", "RID", "DateAdministered", "SingleImmunizationID"],
  Project_Folders: ["Folder_ID", "Folder_Name", "Parent_Folder_ID"],
  Group_origins: ["ID", "Title", "Origin information"],
  Project_Photos: ["Photo_ID", "Folder_ID", "Photo_File", "Date_Taken"],
  Weight: ["ID", "RID", "Appointment ID", "Date", "Weight"],
  Contacts: ["ID", "Name/s", "Address", "Phone", "Watsapp ID", "Messenger ID", "Line ID", "Type"],
  Enclosures: ["ID", "Enclosure Name", "Zone", "Map ID", "Coordinates", "Maximum Residents", "Description"],
  Zones: ["ID", "Zone", "Int-Ex", "Description", "Show in UI"],
  Placement_History: ["HistoryID", "RID", "PlacementType", "StartDate", "EndDate", "Zone", "EnclosureID", "PreviousEnclosureID", "CarerID", "Notes"],
  Vets: ["VetID", "Vet Name", "Address", "Phone", "Line ID", "Notes"],
  "Vet Appointments": ["Appointment ID", "RID", "Vet", "Notes", "Date"],
  Procedures: ["ProcedureID", "AppointmentID", "RID", "Vet", "Procedure", "Outcome", "Date"],
  Prescriptions: ["ID", "RID", "Vet Appointment ID", "Vet", "Medication", "Frequency", "# Tablets", "Times per frequency", "Start Date", "End Date", "Notes"],
  Medication: ["ID", "Medication", "Archive"],
};

/** Tab name → CSV file name. */
export function tabFileName(tab) {
  return `${tab.replace(/[^A-Za-z0-9_-]+/g, "_")}.csv`;
}

async function main() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
  const outDir = outIndex >= 0 ? args[outIndex + 1] : join("appsheet-export", stamp);

  const env = loadEnv("test");
  const oauth = new google.auth.OAuth2(env.GOOGLE_OAUTH_CLIENT_ID, env.GOOGLE_OAUTH_CLIENT_SECRET);
  oauth.setCredentials({ refresh_token: env.GOOGLE_OAUTH_REFRESH_TOKEN });
  const { token } = await oauth.getAccessToken();
  const drive = google.drive({ version: "v3", auth: oauth });

  const meta = await drive.files.get({ fileId: APPSHEET_SHEET_ID, fields: "name, modifiedTime, owners(emailAddress)" });
  console.log(`Sheet "${meta.data.name}" owned by ${meta.data.owners?.[0]?.emailAddress}, last modified ${meta.data.modifiedTime}`);

  mkdirSync(outDir, { recursive: true });
  let failed = false;
  for (const [tab, expected] of Object.entries(TABS)) {
    const url = `https://docs.google.com/spreadsheets/d/${APPSHEET_SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.error(`  ${tab}: HTTP ${res.status}`);
      failed = true;
      continue;
    }
    const text = await res.text();
    const header = (parseCsv(text)[0] ?? []).map((h) => h.trim());
    const mismatch = expected.findIndex((col, i) => header[i] !== col);
    if (mismatch >= 0) {
      console.error(`  ${tab}: column ${mismatch + 1} is "${header[mismatch] ?? ""}", expected "${expected[mismatch]}" — tab renamed or restructured?`);
      failed = true;
      continue;
    }
    const rows = parseCsv(text).length - 1;
    writeFileSync(join(outDir, tabFileName(tab)), text);
    console.log(`  ${tab}: ${rows} rows`);
  }
  writeFileSync(
    join(outDir, "export.json"),
    JSON.stringify({ sheetId: APPSHEET_SHEET_ID, sheetModified: meta.data.modifiedTime, exportedAt: new Date().toISOString() }, null, 2),
  );
  if (failed) {
    console.error(`\nSome tabs failed — fix TABS in ${import.meta.url.split("/").pop()} or the sheet, then re-run.`);
    process.exit(1);
  }
  console.log(`\nWritten to ${outDir}/`);
}

// import-appsheet.mjs imports TABS from here without wanting an export run.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
