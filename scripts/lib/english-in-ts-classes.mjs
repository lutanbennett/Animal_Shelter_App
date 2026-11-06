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
 *   "maybe"    a message whose caller has not been traced. NONE remain (2026-11-06,
 *              docs/decisions/2026-11-06-english-strings-classification.md): the
 *              eleven were traced and moved into a real class. Use it only while tracing.
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
  /^[a-z]+\.[A-Za-z]+( [a-z]+)+$/, // a log label: "residents.recordIntake chip", "residents.recordIntake note tags"
  /^[A-Za-z' ]+(, [A-Za-z' -]+)*, (sans-)?serif$|^var\(--/, // a CSS font stack
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
      (rel === "src/lib/clinics/calendar-poll.ts" && /sync token/.test(t)) ||
      (rel === "src/app/api/reels/finish/route.ts" && /^Reel upload: could not trash/.test(t)) ||
      // thrown inside a helper no caller catches, or returned to a caller that logs it and shows its own dictionary text
      (rel === "src/lib/projects/drive-sync.ts" && /^Project folder not found/.test(t)) ||
      (rel === "src/lib/clinics/calendar-import.ts" && /^The event has no time or no resident/.test(t)) ||
      /use[A-Z][A-Za-z]+ must be used within/.test(t), // a React hook's developer-only guard
  },
  {
    id: "machine-feed-error",
    reads: "nobody",
    why: "The health feed Home Assistant polls with a bearer token (src/app/api/status/health/route.ts). A program reads its JSON; no screen draws it.",
    match: (rel) => rel === "src/app/api/status/health/route.ts",
  },
  {
    id: "archive-action-errors",
    reads: "user",
    why: "Returned as { error } from archiveDeceasedResident / restoreDeceasedResident, which app/residents/[id]/deceased/actions.ts passes straight into the action result the hub draws (traced 2026-11-06).",
    match: (rel) => rel.startsWith("src/lib/archive/"),
  },
  {
    id: "drive-warning-fallback",
    reads: "user",
    why: "The fallback sentence of driveErrorMessage(): returned to the maintenance and project actions as driveWarning, which MaintenanceBoard.tsx and MaintenanceForm.tsx draw (traced 2026-11-06). It sits in a function argument, so rule 3's positions do not reach it; translating needs the caller's dictionary threaded in.",
    match: (rel) => /drive-sync\.ts$/.test(rel),
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
    id: "stored-marker-by-design",
    reads: "fixed",
    why: "A marker the sync stamps into a visit's notes ('Created from Google Calendar', 'Cancelled from Google Calendar'). It is data, written by a process with no locale, stored once, and other code finds it by comparing the text (audit/recent-changes.ts). Translating it at write time would break that match and still pick one language for every reader. Showing it in Thai is a display-time lookup, its own item.",
    match: (rel, t) => /^(Created|Cancelled) from Google Calendar$/.test(t) && /calendar-(import|poll)\.ts$|recent-changes\.ts$/.test(rel),
  },
  {
    id: "shared-calendar-title",
    reads: "fixed",
    why: "The event title written to the shelter's shared Google Calendar. The server builds it with no reader's locale and Google shows the same text to everyone.",
    match: (rel) => rel === "src/lib/clinics/calendar-event.ts",
  },
  {
    id: "calendar-admin-mail",
    reads: "admin",
    why: "The line in the mail to administrators when the calendar cancels a visit.",
    match: (rel) => rel === "src/lib/clinics/calendar-poll.ts",
  },
  {
    id: "csv-export-english-by-design",
    reads: "fixed",
    why: "Every heading and value in the residents export is built from the English dictionary (statusLabel(en, ...), formatAge(en, ...)), so the file is English throughout: spreadsheets and other software read it, it is not drawn in the app. Translating only the headings would mix two languages in one file.",
    match: (rel) => rel === "src/lib/residents/export.ts",
  },
  {
    id: "stored-schedule-label",
    reads: "fixed",
    why: "The English label stored when the form creates a frequency row for a pattern nobody has used. Stored data, written once.",
    match: (rel) => rel === "src/lib/prescriptions/frequency.ts",
  },
  {
    id: "category-key-with-thai",
    reads: "covered",
    why: "Project category names are stored keys that screens translate through the dictionary; the English here is the key.",
    match: (rel) => rel === "src/lib/projects/queries.ts",
  },
  {
    id: "app-shell-metadata",
    reads: "fixed",
    why: "The static <title> and meta description in the root layout: a proper noun and a search-engine description. The app sits behind sign-in, so no worker reads the description.",
    match: (rel) => rel === "src/app/layout.tsx",
  },
];

export function classify(rel, text) {
  for (const c of CLASSES) if (c.match(rel, text)) return c;
  return null;
}
