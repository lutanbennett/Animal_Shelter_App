# 2026-11-06 — English strings: the 161 `.tsx`, the 11 "maybe", the 14 stray positions, and admin screens

**Context.** Backlog item `#c7zjk` listed five open points after the `.ts` classification
(`2026-11-02-english-classification-pass.md`) and rule 3 (`2026-11-03-thai-check-ts-extend.md`).
This settles them. **No dictionary key was added and no Thai was written, so there is nothing new
for a Thai speaker to read from this change.** It edits the classifier, a measuring script and docs.

## Step zero: what was true today

- `check-thai-dictionary.mjs`: rule 1 92 identical-to-English (all allowed or wordless); rule 2 13 pieces
  of English in 504 `.tsx` files, 13 allowed, 0 to translate; rule 3 **2 reported**, both in
  `src/app/api/status/health/route.ts`.
- The classifier existed and did what the item said. Nothing had landed that closes the item.
- `.ts` re-measured with `scripts/measure-english-in-ts.mjs`: 1,144 prose strings, 204 outside the manual
  and release notes (261 on 2026-11-02; the translated route strings are gone). The 78 "definitely user"
  were **17 today**.

## (3) The 161 `.tsx` strings: not reproducible, and the honest number is 20

The 161 came from a matcher nobody wrote down. Re-measured with a TypeScript-AST walk of every string and
template literal in `.tsx` (new `scripts/measure-english-in-tsx.mjs`, report only): **20 prose literals in
7 files**, after skipping class lists, imports, type positions and non-text attributes. A line scanner
reads JSX apostrophes as string quotes, which is the likely source of the old figure. The 20, by reader:

| Reader | Strings | What |
| --- | ---: | --- |
| fixed (English by decision) | 12 | the deceased-resident summary PDF (2026-11-01 decision) |
| fixed | 2 | root layout `<title>`/description: a proper noun and a search-engine description; the app is behind sign-in |
| nobody | 3 | `useX must be used within …` developer guards |
| nobody | 3 | CSS font stacks |

**None is a worker-readable string without Thai, so there was nothing to convert** (deliverable 3 is
therefore empty on purpose). The classifier now has rules for these; `measure-english-in-tsx.mjs` is the
way to re-take the count. Limit: three-word minimum, so a two-word English literal in a `.tsx` is invisible
to it (as it is to `.ts`).

## (2) The 11 "maybe", traced to their callers

| String(s) | Traced to | Class |
| --- | --- | --- |
| archive `Resident not found.` ×2, `Failed to archive the resident.`, `This resident is still recorded as deceased.`, `Failed to restore the resident's Drive folder.` | returned as `{ error }`; `app/residents/[id]/deceased/actions.ts` passes `result.error` into the action result the hub draws | **user** — real, untranslated |
| `driveErrorMessage` fallbacks ×4 (`Could not move/rename/delete the Drive folder.`) | returned as `driveWarning`; `MaintenanceBoard.tsx`/`MaintenanceForm.tsx` draw it | **user** — real, but in a function argument rule 3 does not reach |
| `Project folder not found.` | thrown in a helper the photo route does not catch | nobody |
| `The event has no time or no resident.` | `confirm-actions.ts` logs it and returns `t.common.somethingWentWrong` | nobody |

No class `maybe` has members any more.

## (1) and the design question: the fourteen, tested

The item said one of the fourteen is a design question. **Tested, it is more than one, and the reason is
different:** none of the fourteen is text a dictionary key can fix.

- **Stored calendar notes** (`Created from Google Calendar`, `Cancelled from Google Calendar`, three
  sites). The item said "stored in whatever locale its writer typed". They are not typed by a person: a
  sync process with no locale stamps them, once, and `audit/recent-changes.ts` **finds them by comparing
  the text**. Translating at write time would break that match and still choose one language for every
  reader. **Settled: the marker is data and stays a fixed English string. Showing it in Thai is a
  display-time lookup, a separate item.** Rule 3 is not widened to reach it.
- **`Vet visit: … at …`**: the title on the shelter's shared Google Calendar. No reader's locale exists
  when the server builds it, and Google shows everyone the same text. Fixed.
- **The cancellation mail line** in `calendar-poll.ts`: an administrator's. Admin.
- **Eight export headings/labels.** `residents/export.ts` builds every heading *and every value* from the
  English dictionary (`statusLabel(en, …)`, `formatAge(en, …)`), so the file is English throughout and is
  read by spreadsheets. Translating only the headings would mix two languages in one file. **Settled:
  the residents export is English by design.** `Once a day` (`frequency.ts`) is a label **stored** when a
  frequency row is first created. `Visitors and Volunteers` is a stored category key the screens already
  translate through the dictionary.
- **The log label** `residents.recordIntake note tags`, and `Reel upload: could not trash …`: `console.error`
  text. The old `upload-and-api-errors` rule swallowed anything under `src/app/api/`, which is how a log
  line reached the `user` class.

**Positions widened: none.** Of the fourteen, zero would have been a translatable string; widening the
matcher to reach them would have reported strings nobody can fix, the failure this family was kept
report-only to avoid. The "recall 66 of 80" figure was measuring the classifier's mistakes, not missed
user text.

## (4) Do admin screens stay English? Yes, recorded as a judgement

The system-status screen, the nightly alert email, the release mail and the calendar cancellation mail
are read by an administrator, for whom English is the working language of operating the system. They stay
English and are not reported by rule 3, which gates on the `user` class. Revisit only if a Thai-only
administrator is appointed. Not put to Lutan.

## The false-positive rate, measured

- **Before** (this morning): rule 3 reported **2 strings; both false positives** (`Too many requests.` and
  `Health could not be read.`, the JSON of a bearer-token feed Home Assistant polls). 0 of 2 correct.
  Of the 17 strings the classifier called `user` (2 health-feed, 2 log lines, 5 calendar, 8 export/label),
  **none** was a worker-readable string needing a Thai key.
- **After** (the classifier corrected here): rule 3 reports **5 strings; all 5 traced to a screen**
  (the archive helpers above). **0 of 5 false positives.** Small sample, one run, one tree.

## (5) What must be true before rule 3 may BLOCK

1. The five archive-helper strings are translated (thread `t` into `archiveDeceasedResident` and
   `restoreDeceasedResident` from `deceased/actions.ts`, `assistant/actions.ts`, `refresh-deceased-archive.ts`
   and its four callers), or each is allowed by name in `RULE_3_ALLOWED` with a reason.
2. The four Drive-warning fallbacks are decided: translate (needs `t` threaded into two `drive-sync`
   files) and teach rule 3 the `driveErrorMessage(…, "…")` position, or leave as English with a recorded
   reason.
3. A day of PRs with rule 3 reporting nothing it should not (no false positive). One measurement above is
   not a day.
4. **A Thai speaker reads the 34 route strings from #1236** and any strings added for 1–2. Nobody has.
5. Then flip `RULE_3_BLOCKS` in `scripts/check-thai-dictionary.mjs`. **Not done here.**

## Not touched

`src/lib/archive/*`, the dictionaries and every `.tsx` string: no change. The two files that changed in
`scripts/` are the classifier and the new `.tsx` measuring script.
