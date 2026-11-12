# A document store for the foundation's own papers (#98se8, migration 0362)

2026-11-12, stream `foundation-document-store`. Branch `claude/foundation-document-store`.

## What was built

The shape the item names, and nothing else: **a table, a `can_see_drive_file()` case and a card.** Not a second way to serve files.

- `foundation_documents` (0362): category, title, optional month (`period`, first of the month), note, the Drive file id, file name, who filed it.
  Categories are the accountant's named list and no others: establishment documents and bylaws; registration certificate and licences;
  current board list; board member ID and household registration copy; board meeting minutes and resolutions; financial statements and annual
  reports; tax identification number (Form L.P.10); bank statement; monthly bank reconciliation.
- `can_see_drive_file()` gained one branch (body is 0324's). It stays `security invoker`, so the table's own policies answer it as the caller.
  `/api/documents/<id>` is **unchanged**: `private, no-store`, images and PDFs inline, everything else forced to download.
- Upload goes to a `Foundation papers` folder under the shelter's Drive root, through the existing `uploadImageToFolder` (which does **not** grant
  `anyone with the link`), read back with `confirmUploaded`. Only PDF and photo are accepted, by the file's own bytes (`checkFileSignature`).
- Pages: `/management/foundation-papers` and `/management/foundation-papers/board-ids`.

## Decision: ONE card or TWO? Two.

The item flagged that the ID copies are a much narrower audience than the bylaws. **Two activities, two cards:**

| Card | Activity (level) | Reaches |
|---|---|---|
| `foundation_papers` | `foundation.papers` at Edit | every category except the ID copies |
| `foundation_id_copies` | `foundation.id_copies` at Edit | the board members' ID and household registration copies only |

Why two and not one: with one card, whoever is trusted to file the minutes or read a bank statement would also read national ID cards, and
the only way to narrow that later is to split a card that people already hold. Splitting is the cheaper decision made once, now, while nobody
holds either card. It cost one extra activity, one extra card and one extra page, all in this PR, because a card cannot be split from its grants.

How the split is enforced, all in the database: the table's `select`, `insert` and `delete` policies resolve to `has_permission()` with the activity
chosen by the row's category. A login holding only Foundation papers cannot list, read, open (`can_see_drive_file()` is false) or file an ID copy,
and a login holding only Board ID copies cannot reach the rest. The app's action checks ask the same activity through `activityFor()`.

**No state in which a card does nothing.** Each card grants its own activity at Edit and opens its own page, which that activity alone opens.
Neither card's page needs the other card. The `card-grants-applied` check reads production and could not be run from this worktree; see below.

Granted at Edit (read, file, remove). A read-only variant for an outside accountant is a third card on the same activity at level 1
(the shape `view_expenses` has); **not built**, because nobody has asked for it and it is a one-row addition.

## Action controls, and the activity each asks

| Control | Drawn when | Server check |
|---|---|---|
| The whole "File a paper" form | `can(perms, "foundation.papers", "edit")` on the papers page; `can(perms, "foundation.id_copies", "edit")` on the ID page | `fileFoundationPaper`: `can(…, activityFor(category), "edit")`; policy `foundation_documents_insert` |
| Remove (each row) | same as the form | `removeFoundationPaper`: `can(…, activityFor(row.category), "edit")`; policy `foundation_documents_delete` |
| Open (each row) | always drawn on a row the login can already read | `/api/documents/<id>` → `can_see_drive_file()` → the select policy |

`PapersPanel` takes `canEdit`, which **defaults to false**.

## The store sits empty, and nothing real goes in until Lutan says so

Lutan, 2026-11-09: *"build the system to be able to accept the documents but we won't have the documents in until we are ready from an
information protection perspective."* The Drive lockdown he did on 2026-11-12 removed the hard blocker, but **loading real papers is still his
gate**, not this stream's: **a later session must not read an empty store as unfinished and fill it.** In particular the board members' ID and
household registration copies belong to named people who are not the shelter, and this repository is public.

Driven on dev with **made-up fixtures only**, all named `FIXTURE …`: a one-line PDF, two fake Drive ids, a fake bank statement for January 2027.

## Not built

- A read-only card (see above).
- Replacing a file in place: a wrong entry is removed and filed again. There is deliberately no update policy, so a row never changes under the
  file it names.
- Spreadsheet or CSV statements: the upload accepts PDF and photo only, because the byte-check covers only those. A bank that offers CSV only
  would need `checkFileSignature` extended.
- Payroll, P.N.D.1, S.P.S.1-10: out, by Lutan's ruling of 2026-11-09. Not designed for.
- Any change to `/api/documents/<id>`, `drive.ts`, bills or placements.

## How the accountant gets the supplier withholding documents as well (deliverable 9)

Her year-set now comes from **two places**. The store holds the foundation's own papers and the banking half. **Form 50 Bis and P.N.D.3 / P.N.D.53
are filed against the supplier bill** (settled 2026-11-10) and stay there. So she gets them the way she already gets the receipts: through
`/management/expenses`, which links each bill's receipt (the `view_expenses` card, 0317). What is **still owed**, and is a build question for the
bills stream rather than this store: that a withholding document attached to a supplier bill must be reachable through the same read-only expenses
view, which today reads a bill's photo through `bill_owner_can()`. Whether a withholding form is stored as an attachment of that bill, and so is
already covered, is exactly what `bill-import-investigation` is writing a paper about. **For the planner to file** against that item: *confirm a
withholding document attached to a supplier bill opens for a holder of `view_expenses`, and say how she finds all of a year's at once.*
Nothing in this PR can settle it; the store does not hold those documents.

## Dates

The store can take a bank statement now (category plus the month it covers, required by a check constraint), so **the half with the end-of-January
2027 date on it is built**, not only the one-off registration papers. The habit still has to start with January's statement, and it cannot start
until Lutan says the protection is right.

## What was not verified

- `card-grants-applied` and `check-production.mjs` read production, which a worktree cannot. Dev's `check-card-grants.mjs` passes (144 rows).
- The Thai wording was written by Claude and has not been read by a Thai reader.
- Not driven at aal2; not needed, no page here asks it.
- Mobile layout was not looked at.
