import "server-only";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text as PdfText,
  View,
  Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import { NOTO_SANS_THAI_REGULAR } from "./fonts/noto-sans-thai-regular";
import { NOTO_SANS_THAI_BOLD } from "./fonts/noto-sans-thai-bold";
import type { ResidentArchiveRecord } from "./resident-record";
import { getAppEnv, type AppEnv } from "@/lib/app-env";

/**
 * The Deceased Resident Summary PDF (requirements doc, Section 7.6) —
 * everything the shelter holds on one resident, in one printable document
 * that outlives the database. Written into the resident's own Drive folder
 * once that folder has been moved to Residents/Deceased/.
 *
 * Deliberately English-only in its labels, with the resident's own data
 * (which is often Thai) reproduced verbatim: the archive is a fixed
 * artefact, and it would be odd for the permanent record of a resident to
 * read differently depending on which language the person recording the
 * death happened to have the app set to. The embedded font covers both
 * scripts, so Thai notes and names render properly either way.
 */

Font.register({
  family: "NotoSansThai",
  fonts: [
    { src: NOTO_SANS_THAI_REGULAR, fontWeight: 400 },
    { src: NOTO_SANS_THAI_BOLD, fontWeight: 700 },
  ],
});

// @react-pdf hyphenates aggressively by default, breaking words (and Thai,
// which has no spaces) mid-glyph-cluster. Keep words whole.
Font.registerHyphenationCallback((word) => [word]);

// That callback only ever sees one run at a time, and textkit starts a new
// run wherever the script changes: `Valley (เจ้าหญิง…)` reaches it as `(`
// and `เจ้าหญิง…)`. With no space between them the line breaker takes the
// join for a hyphenation point of its own, and breaking there printed
// `Valley (-`. A penalty of textkit's infinity (linebreak.infinity) makes
// such a point unbreakable, so lines break only at spaces. Every Text in
// this file is this one.
const NO_HYPHENATION = 10000;

function Text(props: ComponentProps<typeof PdfText>) {
  return <PdfText hyphenationPenalty={NO_HYPHENATION} {...props} />;
}

/**
 * The watermark a non-production build puts on every page. A screen badge
 * stops at the browser; this PDF lands in Drive — which dev, test and UAT
 * share (docs/decisions.md) — where nothing else says which environment
 * made it. Dev is marked as well as UAT for that reason.
 */
const ENV_WATERMARK: Record<AppEnv, string | null> = {
  dev: "DEV",
  uat: "UAT",
  production: null,
};

const COLORS = {
  text: "#1f2933",
  muted: "#6b7280",
  rule: "#d8dee5",
  accent: "#a35f00",
};

// Line height is set per text style, never on the page or a View. A
// unitless lineHeight is resolved against the font size of the node that
// declares it and inherited as that absolute number, so the page's old
// `lineHeight: 1.4` (9pt × 1.4 = 12.6pt) gave the 20pt name a 12.6pt line
// box and it printed over the subtitle. Worse, the footer's page-number text
// is re-laid-out after each render pass, and every pass read the inherited
// 12.6 as a multiplier again (12.6 × 7.5³ ≈ 5,300pt): the bottom-anchored
// footer was placed thousands of points above the page and never appeared.
// Declared on the Text itself it is re-resolved from 1.4, not compounded.
const BODY_LINE_HEIGHT = 1.4;

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansThai",
    fontSize: 9,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 40,
  },
  header: { flexDirection: "row", gap: 12, marginBottom: 6 },
  headerText: { flexGrow: 1 },
  kicker: {
    fontSize: 8,
    lineHeight: BODY_LINE_HEIGHT,
    letterSpacing: 1.1,
    color: COLORS.accent,
    fontWeight: 700,
  },
  name: { fontSize: 20, lineHeight: 1.25, fontWeight: 700, marginTop: 2 },
  subtitle: { fontSize: 9, lineHeight: BODY_LINE_HEIGHT, color: COLORS.muted },
  photo: { width: 84, height: 84, objectFit: "cover", borderRadius: 4 },
  section: { marginTop: 14 },
  sectionTitle: {
    fontSize: 10,
    lineHeight: BODY_LINE_HEIGHT,
    fontWeight: 700,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.rule,
    paddingBottom: 3,
    marginBottom: 6,
  },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap" },
  field: { width: "50%", paddingRight: 10, marginBottom: 5 },
  fieldWide: { width: "100%", paddingRight: 10, marginBottom: 5 },
  fieldLabel: {
    fontSize: 7.5,
    lineHeight: BODY_LINE_HEIGHT,
    color: COLORS.muted,
    letterSpacing: 0.4,
  },
  fieldValue: { fontSize: 9.5, lineHeight: BODY_LINE_HEIGHT },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.rule,
    paddingVertical: 3,
  },
  headRow: { flexDirection: "row", paddingVertical: 3 },
  headCell: {
    fontSize: 7.5,
    lineHeight: BODY_LINE_HEIGHT,
    color: COLORS.muted,
    letterSpacing: 0.4,
  },
  cell: { fontSize: 9, lineHeight: BODY_LINE_HEIGHT, paddingRight: 6 },
  empty: {
    fontSize: 9,
    lineHeight: BODY_LINE_HEIGHT,
    color: COLORS.muted,
    fontStyle: "normal",
  },
  deathBox: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 4,
  },
  // Page-sized and centred, so the rotated word sits in the middle of every
  // page whatever the content; faint enough to read the record through.
  watermark: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  watermarkText: {
    fontSize: 140,
    fontWeight: 700,
    color: COLORS.accent,
    opacity: 0.12,
    letterSpacing: 8,
    transform: "rotate(-45deg)",
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: COLORS.muted,
  },
});

/** "2026-09-15" / ISO timestamp -> "15 Sep 2026". Fixed format, no locale. */
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
  const kept = parts.filter((part): part is string => Boolean(part && part.trim()));
  return kept.length > 0 ? kept.join(separator) : "—";
}

function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | null;
  wide?: boolean;
}) {
  return (
    <View style={wide ? styles.fieldWide : styles.field}>
      <Text style={styles.fieldLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.fieldValue}>{value && value.trim() ? value : "—"}</Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Deliberately wrappable: a resident with years of weights or vaccinations
  // has a section taller than a page, and an unwrappable one would clip
  // whatever didn't fit. minPresenceAhead keeps the heading from being
  // orphaned at the foot of a page instead.
  return (
    <View style={styles.section} minPresenceAhead={40}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/**
 * A simple table. `widths` are percentages that must add up to 100; rows
 * are already-formatted strings so this stays a dumb renderer.
 */
function Table({
  columns,
  widths,
  rows,
  empty,
}: {
  columns: string[];
  widths: string[];
  rows: string[][];
  empty: string;
}) {
  if (rows.length === 0) return <Text style={styles.empty}>{empty}</Text>;
  return (
    <View>
      <View style={styles.headRow}>
        {columns.map((column, index) => (
          <Text key={column} style={[styles.headCell, { width: widths[index] }]}>
            {column.toUpperCase()}
          </Text>
        ))}
      </View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row} wrap={false}>
          {row.map((cell, index) => (
            <Text key={index} style={[styles.cell, { width: widths[index] }]}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

export type SummaryPdfOptions = {
  /**
   * The profile photo as a data URI, when one could be fetched and is in a
   * format @react-pdf can embed (JPEG/PNG). Omitted otherwise — a missing
   * photo must never be the reason an archive fails.
   */
  profilePhotoDataUri?: string | null;
  /** Which environment's watermark to use; this build's own by default. */
  appEnv?: AppEnv;
};

function ResidentSummaryDocument({
  record,
  options,
}: {
  record: ResidentArchiveRecord;
  options: SummaryPdfOptions;
}) {
  const { resident, death } = record;
  const watermark = ENV_WATERMARK[options.appEnv ?? getAppEnv()];
  const displayName = resident.thaiName
    ? `${resident.name} (${resident.thaiName})`
    : resident.name;

  return (
    <Document
      title={`${resident.name} (${resident.residentCode}) — resident summary`}
      author="Lanna Care for Animals"
      subject="Deceased resident summary"
    >
      <Page size="A4" style={styles.page}>
        {watermark && (
          <View style={styles.watermark} fixed>
            <Text style={styles.watermarkText}>{watermark}</Text>
          </View>
        )}
        <View style={styles.header}>
          {options.profilePhotoDataUri && (
            // @react-pdf's Image is a PDF primitive, not an <img> — there is
            // no alt text in a PDF for the a11y rule to want.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={options.profilePhotoDataUri} style={styles.photo} />
          )}
          <View style={styles.headerText}>
            <Text style={styles.kicker}>DECEASED RESIDENT SUMMARY</Text>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.subtitle}>
              {join([
                resident.residentCode,
                resident.species,
                resident.breed,
                resident.sex,
              ])}
            </Text>
            {death && (
              <Text style={styles.subtitle}>
                {`In our care ${day(resident.intakeDate)} – ${day(death.date)}`}
              </Text>
            )}
          </View>
        </View>

        {/* Conditional section, per the original template: the one block
            that only a deceased resident's summary carries. */}
        {death && (
          <View style={styles.deathBox}>
            <Text style={styles.sectionTitle}>Death</Text>
            <View style={styles.fieldGrid}>
              <Field label="Date of death" value={day(death.date)} />
              <Field label="Cause of death" value={death.causeOfDeath} />
              <Field label="Notes" value={death.notes} wide />
            </View>
          </View>
        )}

        <Section title="Identity">
          <View style={styles.fieldGrid}>
            <Field label="Name" value={resident.name} />
            <Field label="Resident ID" value={resident.residentCode} />
            <Field label="Thai name" value={resident.thaiName} />
            <Field label="Other names" value={resident.otherNames} />
            <Field label="Species" value={resident.species} />
            <Field label="Breed" value={resident.breed} />
            <Field label="Sex" value={resident.sex} />
            <Field
              label="Age"
              value={
                resident.estimatedAgeYears != null
                  ? `~${resident.estimatedAgeYears} years (estimated ${day(resident.ageEstimatedOn)})`
                  : null
              }
            />
            <Field label="Intake date" value={day(resident.intakeDate)} />
            <Field
              label="Origin"
              value={join([resident.originName, day(resident.originDate)], " — ")}
            />
          </View>
        </Section>

        <Section title="Bio & background">
          <View style={styles.fieldGrid}>
            <Field label="Bio" value={resident.bio} wide />
            <Field label="Temperament" value={resident.temperamentNotes} wide />
            <Field label="Past story" value={resident.pastStoryNotes} wide />
            <Field label="Behaviour" value={resident.behaviourNotes} wide />
          </View>
        </Section>

        <Section title="Housing history">
          <Table
            columns={["From", "To", "Event", "Enclosure", "Notes"]}
            widths={["13%", "13%", "17%", "27%", "30%"]}
            rows={record.placements.map((placement) => [
              day(placement.startDate),
              placement.endDate ? day(placement.endDate) : "present",
              placement.placementType,
              placement.previousEnclosureName
                ? `${placement.previousEnclosureName} -> ${placement.enclosureName ?? "—"}`
                : (placement.enclosureName ?? "—"),
              join([placement.carerName, placement.notes], " · "),
            ])}
            empty="No placements recorded."
          />
        </Section>

        <Section title="Immunizations">
          <Table
            columns={["Date", "Vaccine", "Given by", "Batch", "Notes"]}
            widths={["13%", "27%", "18%", "15%", "27%"]}
            rows={record.immunizations.map((immunization) => [
              day(immunization.dateAdministered),
              immunization.typeName ?? "—",
              immunization.administeredBy ?? "—",
              immunization.batchNumber ?? "—",
              immunization.notes ?? "—",
            ])}
            empty="No immunizations recorded."
          />
        </Section>

        <Section title="Vet appointments">
          <Table
            columns={["Date", "Vet", "Status", "Reason / notes"]}
            widths={["13%", "22%", "13%", "52%"]}
            rows={record.appointments.map((appointment) => [
              day(appointment.appointmentDate),
              join([appointment.vetName, appointment.doctorName], " · "),
              appointment.status,
              join([appointment.reason, appointment.notes], " · "),
            ])}
            empty="No vet appointments recorded."
          />
        </Section>

        <Section title="Prescriptions">
          <Table
            columns={["From", "To", "Medication", "Dose", "Frequency", "Notes"]}
            widths={["12%", "12%", "24%", "12%", "16%", "24%"]}
            rows={record.prescriptions.map((prescription) => [
              day(prescription.startDate),
              prescription.endDate ? day(prescription.endDate) : "ongoing",
              prescription.medicationName ?? "—",
              prescription.dose ?? "—",
              prescription.frequencyLabel ?? "—",
              prescription.notes ?? "—",
            ])}
            empty="No prescriptions recorded."
          />
        </Section>

        <Section title="Diet">
          <Table
            columns={["From", "To", "Diet", "Meals", "Daily quantity", "Notes"]}
            widths={["12%", "12%", "24%", "10%", "18%", "24%"]}
            rows={record.diets.map((diet) => [
              day(diet.startDate),
              diet.endDate ? day(diet.endDate) : "ongoing",
              diet.dietTypeName ?? "—",
              String(diet.mealsPerDay),
              diet.dailyQuantity ?? "—",
              diet.notes ?? "—",
            ])}
            empty="No dietary requirements recorded."
          />
        </Section>

        <Section title="Procedures">
          <Table
            columns={["Date", "Procedure", "Notes", "Files"]}
            widths={["15%", "25%", "40%", "20%"]}
            rows={record.procedures.map((procedure) => [
              day(procedure.date),
              procedure.procedureType ?? "—",
              procedure.notes ?? "—",
              procedure.files.length > 0
                ? procedure.files.map((file) => file.fileName ?? file.driveFileId).join(", ")
                : "—",
            ])}
            empty="No procedures recorded."
          />
        </Section>

        <Section title="Blood tests">
          <Table
            columns={["Date", "Type", "Results", "Files"]}
            widths={["15%", "20%", "45%", "20%"]}
            rows={record.bloodTests.map((test) => [
              day(test.date),
              test.type ?? "—",
              test.results ?? "—",
              test.files.length > 0
                ? test.files.map((file) => file.fileName ?? file.driveFileId).join(", ")
                : "—",
            ])}
            empty="No blood tests recorded."
          />
        </Section>

        <Section title="Weight">
          <Table
            columns={["Date", "Weight", "Notes"]}
            widths={["18%", "17%", "65%"]}
            rows={record.weights.map((weight) => [
              day(weight.date),
              `${weight.weightKg} kg`,
              weight.notes ?? "—",
            ])}
            empty="No weights recorded."
          />
        </Section>

        <Section title="Photos & files">
          <Table
            columns={["Date", "Folder", "File"]}
            widths={["18%", "22%", "60%"]}
            rows={[
              ...record.photos.map((photo) => [
                day(photo.dateTaken),
                photo.category ?? "—",
                photo.relativePath ?? photo.fileName ?? photo.driveFileId,
              ]),
              ...record.bloodTests.flatMap((test) =>
                test.files.map((file) => [
                  day(test.date),
                  "Blood Tests",
                  file.relativePath ?? file.fileName ?? file.driveFileId,
                ]),
              ),
              ...record.procedures.flatMap((procedure) =>
                procedure.files.map((file) => [
                  day(procedure.date),
                  "Procedures",
                  file.relativePath ?? file.fileName ?? file.driveFileId,
                ]),
              ),
            ]}
            empty="No photos or files on file."
          />
        </Section>

        <View style={styles.footer} fixed>
          <Text>
            {`Lanna Care for Animals · ${resident.name} (${resident.residentCode}) · generated ${day(record.generatedAt)}${watermark ? ` · ${watermark}` : ""}`}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/** Renders the summary to PDF bytes. */
export async function renderResidentSummaryPdf(
  record: ResidentArchiveRecord,
  options: SummaryPdfOptions = {},
): Promise<Uint8Array> {
  const buffer = await renderToBuffer(
    <ResidentSummaryDocument record={record} options={options} />,
  );
  return new Uint8Array(buffer);
}

/** `Chai (R-0042) — resident summary.pdf`, the file name staff will see. */
export function summaryPdfFileName(record: ResidentArchiveRecord): string {
  const { name, residentCode } = record.resident;
  return `${name.trim().replace(/\//g, "-")} (${residentCode}) — resident summary.pdf`;
}
