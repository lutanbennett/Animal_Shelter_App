/**
 * Which English prose in a .ts file does a shelter user actually read?
 *
 * This is the CLASSIFICATION that docs/decisions/2026-11-02-english-classification-pass.md
 * records, kept as data so the check that is later extended to .ts files can
 * use it. It is grouped by REASON and matched by directory or shape, never
 * string by string, so a new file under src/lib/assistant/ is covered by the
 * rule instead of needing an entry. NOTHING reads this at build time yet:
 * check-thai-dictionary.mjs is deliberately not extended (its own backlog item).
 *
 * `reads` says who reads the English:
 *   "nobody"   a program, a developer or a log. Never needs Thai.
 *   "admin"    an operator-facing screen or email. Needs a decision, see the file.
 *   "fixed"    English on purpose, by the file's own statement or a decision.
 *   "covered"  already has its Thai beside it in the same file.
 *   "user"     a shelter worker can read it and no Thai exists. Real work later.
 *   "maybe"    a thrown or returned message a screen MAY show. Needs tracing.
 *
 * Rules are tried in order; the first match wins.
 */

const NOT_PROSE = [
  /^[a-z][A-Za-z_]*(, [a-z][A-Za-z_]*)+$/, // a column list: "id, name, parents"
  /^[a-z0-9/:%.-]+( [a-z0-9/:%.-]+)*$/, // a CSS class list or a path
  /^private, no-store$/,
  /paypal\.com|\.json\b|routes\.ts/,
  /^card, activity, level$/,
  /^Home screen icons$/, // a Drive folder's name
  /^residents\.recordIntake chip$/, // a log label
];

export const CLASSES = [
  {
    id: "not-prose",
    reads: "nobody",
    why: "CSS class lists, SQL column lists, cache headers, keys and paths. Prose-shaped to a regex, not words.",
    match: (rel, t) => NOT_PROSE.some((re) => re.test(t)),
  },
  {
    id: "llm-prompt-and-tool-schema",
    reads: "nobody",
    why: "Instructions and tool descriptions sent to a language model, its stop-word list, and the errors a model server returns to the code. A person never sees them.",
    match: (rel) =>
      (rel.startsWith("src/lib/assistant/") && !/carer-return-strings|immunization-strings/.test(rel)) ||
      rel === "src/app/assistant/interpret.ts",
  },
  {
    id: "assistant-already-localised",
    reads: "covered",
    why: "The English half of a locale switch whose Thai half is in the same function; the pair is kept beside the assistant until folded into t.assistant.",
    match: (rel) => /src\/lib\/assistant\/(carer-return|immunization)-strings\.ts$/.test(rel),
  },
  {
    id: "admin-email-and-status",
    reads: "admin",
    why: "The nightly alert email, the release mail, and the health lines on the admin status screen. Read by an administrator, in English today; whether that stays is a decision.",
    match: (rel) =>
      rel.startsWith("src/lib/status/") || rel === "src/app/api/status/alerts/route.ts" || rel === "src/lib/release-mail.ts",
  },
  {
    id: "english-record-by-design",
    reads: "fixed",
    why: "The permanent archive record is English on purpose (docs/decisions/2026-11-01-rule-2-allow-list-and-gate.md); the issuer name and address and the authenticator label are proper nouns.",
    match: (rel) =>
      rel.startsWith("src/lib/archive/resident-") || rel === "src/lib/donations/issuer.ts" || rel === "src/lib/auth/two-step.ts",
  },
  {
    id: "developer-diagnostics",
    reads: "nobody",
    why: "Log lines, assertion throws, and errors from talking to Google or the calendar that are caught and logged. Not drawn on a screen.",
    match: (rel, t) =>
      rel.startsWith("src/lib/google/") ||
      rel === "src/lib/clinics/calendar-sync.ts" ||
      rel === "src/lib/roles-draft/resolve.ts" ||
      rel === "src/app/memes/actions.ts" ||
      rel === "src/app/photos/approve/pending-actions.ts" ||
      rel === "src/lib/action-result.ts" ||
      rel === "src/lib/auth/same-origin.ts" ||
      (rel === "src/lib/clinics/calendar-poll.ts" && /sync token/.test(t)),
  },
  {
    id: "thrown-or-returned-maybe-shown",
    reads: "maybe",
    why: "A message returned by a Drive or archive helper, or an import result, whose caller may hand it to a screen. Reading the string cannot say; each caller has to be traced.",
    match: (rel, t) =>
      /drive-sync\.ts$/.test(rel) ||
      rel.startsWith("src/lib/archive/") ||
      (rel === "src/lib/clinics/calendar-import.ts" && !/^Created from/.test(t)),
  },
  {
    id: "upload-and-api-errors",
    reads: "user",
    why: "JSON error text from an upload or download route. AttachmentUploader.tsx draws body.error in red under the file, so a worker reads it verbatim.",
    match: (rel) => rel.startsWith("src/app/api/") || rel === "src/lib/bills/upload.ts",
  },
  {
    id: "route-and-action-messages",
    reads: "user",
    why: "Sign-in prompts and refusals returned as the body of an export, receipt or manual download, and 'not found' text from server actions.",
    match: (rel) => /\/(route|actions)\.ts$/.test(rel),
  },
  {
    id: "calendar-text-and-notes",
    reads: "user",
    why: "Notes stamped on a visit created or cancelled from Google Calendar (shown on the visit and in recent changes) and the event title staff see in Google Calendar.",
    match: (rel) => /src\/lib\/clinics\/calendar-(event|poll|import)\.ts$/.test(rel) || rel === "src/lib/audit/recent-changes.ts",
  },
  {
    id: "labels-and-export-headings",
    reads: "user",
    why: "CSV column headings and short on-screen labels (a prescription frequency, a project audience). Whether the export is English by design is not decided; the on-screen labels plainly need Thai.",
    match: (rel) =>
      rel === "src/lib/residents/export.ts" || rel === "src/lib/prescriptions/frequency.ts" || rel === "src/lib/projects/queries.ts",
  },
];

export function classify(rel, text) {
  for (const c of CLASSES) if (c.match(rel, text)) return c;
  return null;
}
