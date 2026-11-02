# 2026-11-02 — Which English in the `.ts` files does a shelter user read? The classification pass

**Context.** `scripts/check-thai-dictionary.mjs` rule 2 sees English in `.tsx` files only. The backlog
item "English the Thai-dictionary check CANNOT see" put ~258 prose strings in the other `.ts` files and
said, before the check is extended, *decide which of them are user-facing at all*, because a rule that
reports an LLM prompt or an admin email is a rule people filter. This is that decision. **It changes
no string, wires nothing into the dictionaries, and does not extend the check.**

## The item was right about its instrument

Read, not trusted: `tsxFiles()` keeps names ending `.tsx`; the matcher is `JSX_TEXT` plus seven
attributes (`placeholder title aria-label aria-description alt label summary`); `RULE_2_BLOCKS = true`;
the allow-list is `RULE_2_ALLOWED`, keyed by file path, two kinds (`declares`+`whole`, or named
`strings`), with stale entries failing. Nothing in it is wrong. The one thing worth saying: the item's
~258 cannot be reproduced exactly, because its matcher was not written down.

## The count, re-taken 2026-11-02, with its method

`node scripts/measure-english-in-ts.mjs` (new, report only, always exits 0). Method: every string and
template literal in `src/**/*.ts` (not `.d.ts`, not `src/lib/i18n/dictionaries/`), comments skipped,
`${…}` blanked; kept when the whole literal is words and ordinary punctuation, contains whitespace,
has three or more words and one of four letters or more.

| | 2026-11-01 (item) | 2026-11-02 (this pass) |
| --- | --- | --- |
| prose strings in `.ts` | 900 in 107 files | **1,154** |
| `src/lib/manual/en.ts` | 438 | 590 |
| `src/lib/releases.ts` | 204 | 303 |
| **elsewhere** | **~258** | **261** |

The two big files differ by half again, so **my matcher is looser than the item's, and the item's
total is not reproduced.** The "elsewhere" figure agrees to within 3, which is the number this pass
needs, but I cannot say the 261 and the 258 are the same strings. Do not compare the other two rows.
Streams have shipped since the item was written, so a difference was expected.

## Classification, by reason (`scripts/lib/english-in-ts-classes.mjs`)

Matched by directory or shape, first match wins, so a new file under `src/lib/assistant/` is covered
without an entry. **Every one of the 261 is classified; the script prints `UNCLASSIFIED` 0.**

| Reader | Class | Strings | Why |
| --- | --- | ---: | --- |
| nobody | `llm-prompt-and-tool-schema` (`src/lib/assistant/*`, `src/app/assistant/interpret.ts`) | 88 | Sent to a model, or an error from a model server |
| nobody | `not-prose` | 36 | CSS class lists, column lists, cache headers, paths |
| nobody | `developer-diagnostics` | 17 | Google/Drive/calendar-sync errors that are caught and logged; log lines |
| covered | `assistant-already-localised` | 9 | English half of a `locale === "th"` switch; the Thai is beside it |
| admin | `admin-email-and-status` | 17 | The alert email, release mail, and the status screen's health lines |
| fixed | `english-record-by-design` | 5 | The archive record (decided 2026-11-01); the issuer's name and address; the authenticator label |
| maybe | `thrown-or-returned-maybe-shown` | 11 | Drive-sync and archive helpers; a caller may hand the message to a screen |
| **user** | `upload-and-api-errors` | 56 | `AttachmentUploader.tsx` draws `body.error` in red, verbatim |
| **user** | `route-and-action-messages` | 9 | "Sign in to …", "Attachment not found." from downloads and actions |
| **user** | `calendar-text-and-notes` | 5 | Notes stamped on visits from Google Calendar; the event title |
| **user** | `labels-and-export-headings` | 8 | CSV headings, "Once a day", "Visitors and Volunteers" |

**Allow-list shape: rules by reason, not a list of strings.** `RULE_2_ALLOWED` is per file/per string
because `.tsx` has few, deliberate cases. Here 141 of 261 are machine-facing in whole directories, so a
string list would need an edit for every new prompt line and would rot. The rules are data in
`scripts/lib/english-in-ts-classes.mjs`, deliberately **not read by `check-thai-dictionary.mjs`** (that
is the extension, its own item). Whoever extends the check can import `classify()` and report only
`reads: "user"` and `"maybe"`.

## The user-facing number, 2026-11-02

**78 strings in 30 files are definitely read by a shelter user and have no Thai** (56+9+5+8), out of
261. **A further 11 are "maybe"**; and **17 are an administrator's** (decision below). So extending the
check to `.ts` is a **small-to-medium job: roughly 80–110 messages, concentrated** — 56 of the 78 are the
same dozen upload/download phrases repeated across 14 routes ("No file provided.", "File is larger than
15MB.", "Resident not found.", "This resident has died — their record is closed."), so about 20 distinct
wordings for the biggest group. The 161 strings in `.tsx` the JSX matcher misses were **not** counted in
this pass and are a separate, unmeasured-by-class job.

Worst offenders, for the planner (all verified in source): the `src/app/api/**` routes' error text (56,
shown red under every upload); `src/lib/residents/export.ts` CSV headings; "Once a day" in
`src/lib/prescriptions/frequency.ts`; "Visitors and Volunteers" in `src/lib/projects/queries.ts`;
the calendar notes in `src/lib/clinics/calendar-import.ts` / `calendar-poll.ts`, which are stored in the
visit and therefore also compared by string in `src/lib/audit/recent-changes.ts` (translating them
needs care: that comparison matches the English text).

## What I could not settle

1. **The 11 "maybe".** Whether a screen shows a Drive-sync or archive helper's message needs each
   caller traced; I did not trace them. Counted separately, not in the 78.
2. **The 17 administrator-facing strings** (`src/lib/status/*`, `release-mail.ts`). Not user-facing in
   the item's sense, but the status screen is read by an admin in a Thai-speaking shelter. Whether admin
   screens stay English is a decision I have left for the planner. They are not in the 78.
3. **CSV headings.** Whether the residents export is English by design (a file for other software) is
   not decided; counted as user-facing because a person opens it.
4. **`releases.ts` staying English** is current practice, not a decision. Not changed or classified.
5. **My classification of `developer-diagnostics`** is by file, from reading the strings, not by
   tracing every `catch`. A message I called a log line could reach a screen.
6. **Strings my matcher misses** (two-word messages, sentences under three words, `.tsx` strings the JSX
   matcher skips) are outside both 261 and 78.

## Before / after `check-thai-dictionary.mjs`

Unchanged by design: the script was not edited. Both before and after this change it ends
`every Thai entry is either translated, wordless or allowed by name, and every piece of English in a
.tsx is either translated or allowed by name` (rule 2: 13 allowed by name, 0 to translate, 471 .tsx files).

## Backlog

The item is **struck and left open**, not ticked: 11 "maybe" and the admin question are unsettled, and
the 161 `.tsx` strings were not classified. For the planner to file: the `.ts` extension item should
import `classify()` and gate on `user`.
