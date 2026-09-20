import "server-only";
import type {
  ArchiveFile,
  ResidentArchiveRecord,
} from "./resident-record";

/**
 * The offline index page written into a deceased resident's Drive folder.
 *
 * This is the archival strategy's endgame: once a resident's folder is
 * pulled off Google Drive onto the shelter's local disk (to keep Drive
 * storage free for current residents), the folder still has to be usable on
 * its own. Opening this file gives the whole animal back — their details,
 * their medical history, and every photo and scan in the folder, rendered
 * as a page rather than a directory listing.
 *
 * Everything it needs is therefore either inline (CSS, the data itself) or
 * a path *relative to the folder this file sits in* (photos, blood-test
 * scans, the summary PDF). No network, no fonts to download, no app. A
 * Drive link is offered alongside each file as a convenience for as long as
 * the folder is still on Drive, but nothing depends on it.
 *
 * Built as a string rather than with React: this page must never share a
 * runtime, a component or a stylesheet with the app, because the app will
 * have moved on (or be gone) long before these folders are read again.
 */

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Every value interpolated into the page goes through this. */
function esc(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

/** Same, but renders a dash for empty values so tables don't have holes. */
function escOrDash(value: string | number | null | undefined): string {
  const text = esc(value);
  return text.trim() ? text : "—";
}

/**
 * Percent-encodes a relative path segment by segment — a file called
 * "front & back.jpg" in a folder called "Blood Tests" has to survive being
 * put in an href, and encodeURIComponent on the whole path would eat the
 * slashes.
 */
function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function driveUrl(driveFileId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(driveFileId)}/view`;
}

/** "2026-09-15" / ISO timestamp -> "15 Sep 2026". */
function day(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function join(parts: (string | null | undefined)[], separator = " · "): string {
  return parts.filter((part) => part && String(part).trim()).join(separator);
}

function fieldRow(label: string, value: string | null | undefined): string {
  return `<div class="field"><dt>${esc(label)}</dt><dd>${escOrDash(value)}</dd></div>`;
}

function section(id: string, title: string, body: string): string {
  return `<section id="${esc(id)}"><h2>${esc(title)}</h2>${body}</section>`;
}

function table(columns: string[], rows: string[][], empty: string): string {
  if (rows.length === 0) return `<p class="empty">${esc(empty)}</p>`;
  const head = columns.map((column) => `<th>${esc(column)}</th>`).join("");
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/**
 * One photo tile. The <img> points at the file's path inside this folder;
 * when that file isn't there (someone archived the folder without the
 * photos, or the name was changed), the tile falls back to a caption-only
 * card with the Drive link rather than a broken-image icon.
 */
function photoTile(file: ArchiveFile): string {
  const caption = join([
    file.category,
    file.dateTaken ? day(file.dateTaken) : null,
    file.isProfilePhoto ? "profile photo" : null,
  ]);
  const label = file.fileName ?? file.driveFileId;
  const image = file.relativePath
    ? `<img src="${esc(encodePath(file.relativePath))}" alt="${esc(label)}" loading="lazy" onerror="this.closest('.tile').classList.add('missing')">`
    : "";
  return `<figure class="tile${file.relativePath ? "" : " missing"}">
      ${image}
      <div class="tile-fallback">${esc(label)}</div>
      <figcaption>
        <span>${escOrDash(caption)}</span>
        <a href="${esc(driveUrl(file.driveFileId))}" rel="noreferrer noopener">Drive</a>
      </figcaption>
    </figure>`;
}

/** Path-or-Drive link used in the file tables. */
function fileLink(file: ArchiveFile): string {
  const label = esc(file.fileName ?? file.driveFileId);
  const local = file.relativePath
    ? `<a href="${esc(encodePath(file.relativePath))}">${label}</a>`
    : label;
  return `${local} <a class="drive" href="${esc(driveUrl(file.driveFileId))}" rel="noreferrer noopener">Drive</a>`;
}

const STYLES = `
  :root {
    color-scheme: dark;
    --bg: #121212;
    --surface: #1c1c1e;
    --surface-2: #262629;
    --border: #333338;
    --fg: #f5f5f5;
    --muted: #a1a1aa;
    --accent: #ff9f0a;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 0 16px 64px;
    background: var(--bg);
    color: var(--fg);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans Thai",
      "Noto Sans", Arial, sans-serif;
  }
  .wrap { max-width: 1040px; margin: 0 auto; }
  a { color: var(--accent); }
  header.hero {
    display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-start;
    padding: 28px 0 20px;
  }
  header.hero img {
    width: 132px; height: 132px; object-fit: cover;
    border-radius: 10px; border: 1px solid var(--border); background: var(--surface-2);
  }
  .kicker {
    font-size: 12px; letter-spacing: 1.4px; text-transform: uppercase;
    color: var(--accent); font-weight: 700;
  }
  h1 { font-size: 30px; margin: 4px 0 6px; }
  h2 {
    font-size: 15px; text-transform: uppercase; letter-spacing: 0.8px;
    color: var(--muted); border-bottom: 1px solid var(--border);
    padding-bottom: 6px; margin: 0 0 12px;
  }
  .sub { color: var(--muted); margin: 0; }
  .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .badge {
    background: var(--surface-2); border-radius: 999px; padding: 4px 12px;
    font-size: 12px; color: var(--muted);
  }
  nav.toc { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 24px; }
  nav.toc a {
    font-size: 13px; text-decoration: none; padding: 5px 12px;
    border: 1px solid var(--border); border-radius: 999px; color: var(--fg);
  }
  nav.toc a:hover { border-color: var(--accent); color: var(--accent); }
  section { margin-bottom: 30px; }
  .death {
    border: 1px solid var(--accent); border-radius: 10px;
    padding: 16px 18px; margin-bottom: 28px; background: rgba(255, 159, 10, 0.07);
  }
  .death h2 { border-bottom-color: rgba(255, 159, 10, 0.4); color: var(--accent); }
  dl.fields { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 0; }
  dl.fields.stacked { grid-template-columns: 1fr; }
  .field dt { font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; color: var(--muted); }
  .field dd { margin: 2px 0 0; white-space: pre-wrap; }
  .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 10px; }
  table { border-collapse: collapse; width: 100%; font-size: 14px; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  th { font-size: 11px; letter-spacing: 0.6px; text-transform: uppercase; color: var(--muted); font-weight: 600; }
  tr:last-child td { border-bottom: 0; }
  td .drive { font-size: 11px; color: var(--muted); text-decoration: none; }
  .empty { color: var(--muted); font-style: italic; }
  .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }
  .tile { margin: 0; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--surface); }
  .tile img { display: block; width: 100%; height: 170px; object-fit: cover; background: var(--surface-2); }
  .tile-fallback {
    display: none; padding: 26px 12px; text-align: center; color: var(--muted);
    font-size: 13px; word-break: break-word; background: var(--surface-2);
  }
  .tile.missing img { display: none; }
  .tile.missing .tile-fallback { display: block; }
  .tile figcaption {
    display: flex; justify-content: space-between; gap: 8px;
    padding: 8px 10px; font-size: 12px; color: var(--muted);
  }
  .tile figcaption a { text-decoration: none; }
  .docs { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 26px; }
  .docs a {
    display: inline-block; padding: 10px 16px; border-radius: 10px;
    border: 1px solid var(--accent); text-decoration: none; font-weight: 600;
  }
  footer { color: var(--muted); font-size: 13px; border-top: 1px solid var(--border); padding-top: 14px; }
  @media print {
    :root { color-scheme: light; --bg: #fff; --surface: #fff; --surface-2: #f4f4f5;
            --border: #d4d4d8; --fg: #18181b; --muted: #52525b; --accent: #a35f00; }
    nav.toc, .tile figcaption a, .drive { display: none; }
    body { padding: 0; }
  }
`;

/**
 * Renders the whole page. `summaryPdfFileName` is the name the summary PDF
 * was saved under in this same folder, so the page can link to it.
 */
export function renderResidentIndexHtml(
  record: ResidentArchiveRecord,
  options: { summaryPdfFileName?: string | null } = {},
): string {
  const { resident, death } = record;
  const displayName = resident.thaiName
    ? `${resident.name} (${resident.thaiName})`
    : resident.name;
  const title = `${resident.name} (${resident.animalCode})`;

  const profilePhoto = record.photos.find((photo) => photo.isProfilePhoto);
  const heroImage =
    profilePhoto?.relativePath
      ? `<img src="${esc(encodePath(profilePhoto.relativePath))}" alt="${esc(displayName)}" onerror="this.remove()">`
      : "";

  const bloodTestFiles = record.bloodTests.flatMap((test) =>
    test.files.map((file) => ({ test, file })),
  );
  const procedureFiles = record.procedures.flatMap((procedure) =>
    procedure.files.map((file) => ({ procedure, file })),
  );

  const toc = [
    ["details", "Details"],
    ["bio", "Bio & background"],
    ["housing", "Housing history"],
    ["immunizations", "Immunizations"],
    ["appointments", "Vet appointments"],
    ["prescriptions", "Prescriptions"],
    ["procedures", "Procedures"],
    ["blood-tests", "Blood tests"],
    ["weight", "Weight"],
    ["photos", "Photos"],
    ["files", "All files"],
  ]
    .map(([id, label]) => `<a href="#${esc(id)}">${esc(label)}</a>`)
    .join("");

  const body = `
    <header class="hero">
      ${heroImage}
      <div>
        <p class="kicker">Resident archive</p>
        <h1>${esc(displayName)}</h1>
        <p class="sub">${esc(
          join([
            resident.animalCode,
            resident.species,
            resident.breed,
            resident.sex,
          ]),
        )}</p>
        <div class="badges">
          <span class="badge">Intake ${esc(day(resident.intakeDate))}</span>
          ${death ? `<span class="badge">Died ${esc(day(death.date))}</span>` : ""}
          <span class="badge">${record.photos.length} photo${record.photos.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </header>

    ${
      death
        ? `<div class="death"><h2>Death</h2><dl class="fields">
            ${fieldRow("Date of death", day(death.date))}
            ${fieldRow("Cause of death", death.causeOfDeath)}
            ${fieldRow("Notes", death.notes)}
          </dl></div>`
        : ""
    }

    ${
      options.summaryPdfFileName
        ? `<div class="docs"><a href="${esc(encodePath(options.summaryPdfFileName))}">Open the full summary PDF</a></div>`
        : ""
    }

    <nav class="toc">${toc}</nav>

    ${section(
      "details",
      "Details",
      `<dl class="fields">
        ${fieldRow("Name", resident.name)}
        ${fieldRow("Animal ID", resident.animalCode)}
        ${fieldRow("Thai name", resident.thaiName)}
        ${fieldRow("Other names", resident.otherNames)}
        ${fieldRow("Species", resident.species)}
        ${fieldRow("Breed", resident.breed)}
        ${fieldRow("Sex", resident.sex)}
        ${fieldRow(
          "Age",
          resident.estimatedAgeYears != null
            ? `~${resident.estimatedAgeYears} years (estimated ${day(resident.ageEstimatedOn)})`
            : null,
        )}
        ${fieldRow("Intake date", day(resident.intakeDate))}
        ${fieldRow(
          "Origin",
          join([resident.originName, resident.originDate ? day(resident.originDate) : null], " — "),
        )}
      </dl>`,
    )}

    ${section(
      "bio",
      "Bio & background",
      `<dl class="fields stacked">
        ${fieldRow("Bio", resident.bio)}
        ${fieldRow("Temperament", resident.temperamentNotes)}
        ${fieldRow("Past story", resident.pastStoryNotes)}
        ${fieldRow("Behaviour", resident.behaviourNotes)}
      </dl>`,
    )}

    ${section(
      "housing",
      "Housing history",
      table(
        ["From", "To", "Event", "Enclosure", "Notes"],
        record.placements.map((placement) => [
          esc(day(placement.startDate)),
          placement.endDate ? esc(day(placement.endDate)) : "present",
          esc(placement.placementType),
          placement.previousEnclosureName
            ? `${esc(placement.previousEnclosureName)} → ${escOrDash(placement.enclosureName)}`
            : escOrDash(placement.enclosureName),
          escOrDash(join([placement.carerName, placement.notes])),
        ]),
        "No placements recorded.",
      ),
    )}

    ${section(
      "immunizations",
      "Immunizations",
      table(
        ["Date", "Vaccine", "Given by", "Batch", "Notes"],
        record.immunizations.map((immunization) => [
          esc(day(immunization.dateAdministered)),
          escOrDash(immunization.typeName),
          escOrDash(immunization.administeredBy),
          escOrDash(immunization.batchNumber),
          escOrDash(immunization.notes),
        ]),
        "No immunizations recorded.",
      ),
    )}

    ${section(
      "appointments",
      "Vet appointments",
      table(
        ["Date", "Vet", "Status", "Reason / notes"],
        record.appointments.map((appointment) => [
          esc(day(appointment.appointmentDate)),
          escOrDash(appointment.vetName),
          esc(appointment.status),
          escOrDash(join([appointment.reason, appointment.notes])),
        ]),
        "No vet appointments recorded.",
      ),
    )}

    ${section(
      "prescriptions",
      "Prescriptions",
      table(
        ["From", "To", "Medication", "Dose", "Frequency", "Notes"],
        record.prescriptions.map((prescription) => [
          esc(day(prescription.startDate)),
          prescription.endDate ? esc(day(prescription.endDate)) : "ongoing",
          escOrDash(prescription.medicationName),
          escOrDash(prescription.dose),
          escOrDash(prescription.frequencyLabel),
          escOrDash(prescription.notes),
        ]),
        "No prescriptions recorded.",
      ),
    )}

    ${section(
      "procedures",
      "Procedures",
      table(
        ["Date", "Procedure", "Notes", "Files"],
        record.procedures.map((procedure) => [
          esc(day(procedure.date)),
          escOrDash(procedure.procedureType),
          escOrDash(procedure.notes),
          procedure.files.length > 0
            ? procedure.files.map((file) => fileLink(file)).join("<br>")
            : "—",
        ]),
        "No procedures recorded.",
      ),
    )}

    ${section(
      "blood-tests",
      "Blood tests",
      table(
        ["Date", "Results", "Files"],
        record.bloodTests.map((test) => [
          esc(day(test.date)),
          escOrDash(test.results),
          test.files.length > 0
            ? test.files.map((file) => fileLink(file)).join("<br>")
            : "—",
        ]),
        "No blood tests recorded.",
      ),
    )}

    ${section(
      "weight",
      "Weight",
      table(
        ["Date", "Weight", "Notes"],
        record.weights.map((weight) => [
          esc(day(weight.date)),
          `${esc(weight.weightKg)} kg`,
          escOrDash(weight.notes),
        ]),
        "No weights recorded.",
      ),
    )}

    ${section(
      "photos",
      "Photos",
      record.photos.length > 0
        ? `<div class="gallery">${record.photos.map(photoTile).join("")}</div>`
        : `<p class="empty">No photos on file.</p>`,
    )}

    ${section(
      "files",
      "All files",
      table(
        ["File", "Folder", "Date"],
        [
          ...(options.summaryPdfFileName
            ? [
                [
                  `<a href="${esc(encodePath(options.summaryPdfFileName))}">${esc(options.summaryPdfFileName)}</a>`,
                  "(this folder)",
                  esc(day(record.generatedAt)),
                ],
              ]
            : []),
          ...record.photos.map((photo) => [
            fileLink(photo),
            escOrDash(photo.category ? `Photos/${photo.category}` : null),
            esc(day(photo.dateTaken)),
          ]),
          ...bloodTestFiles.map(({ test, file }) => [
            fileLink(file),
            "Blood Tests",
            esc(day(test.date)),
          ]),
          ...procedureFiles.map(({ procedure, file }) => [
            fileLink(file),
            "Procedures",
            esc(day(procedure.date)),
          ]),
        ],
        "No files on file.",
      ),
    )}

    <footer>
      <p>
        Archived record for ${esc(title)}, generated ${esc(day(record.generatedAt))}
        by Lanna Care for Animals.
      </p>
      <p>
        This page reads the photos and scans stored beside it in this folder,
        so it works with no internet connection — keep it together with the
        folder's subfolders when moving the archive to local storage. The
        "Drive" links only work while the folder is still on Google Drive.
      </p>
    </footer>
  `;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} — resident archive</title>
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">${body}</div>
</body>
</html>
`;
}

/** The archive index is named so a person opening the folder finds it first. */
export const RESIDENT_INDEX_FILE_NAME = "index.html";
