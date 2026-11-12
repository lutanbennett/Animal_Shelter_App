# Adding bills in bulk: CSV or an in-app grid? (`#m3vx9`, investigation only)

## Recommendation

**Build the CSV import, but only if the typing really happens away from the app. If the typing happens
in the app, build the grid instead.** The one-line reason: the CSV can carry a **photo filename column**
that ties each typed row to a receipt photo already uploaded (measured below, it works), and a grid
cannot do that job away from the app.

**What I could NOT confirm, and it is Lutan's to answer:** *Does the typing really happen away from the
app (a spreadsheet at home, or by someone without a login)?* If the answer is "no, it is typed at the
Bills page anyway", the grid wins: no file, no preview screen, no error report, and every row stays inside
the person's own card checks. Nothing in the code can tell me this.

## 1. Does the photo filename survive? Measured: yes

On dev I uploaded a file through the same route the Bills page's "Add bills" button uses
(`/api/bills/new`, signed in as the dev Admin login) named
`IMG_0001 bill-import-investigation test.png`. I then read the row back from `attachments`:
`owner_type = bill_inbox`, `file_name = IMG_0001 bill-import-investigation test.png`.
**Same name, character for character, spaces included.** The upload code passes `file.name` straight to
the database (`src/lib/bills/upload.ts`, `fileBillPhoto`) and nothing in the browser renames or
re-compresses it. So the filename match is alive. (The test card is left on dev; dev test data is
disposable.)

## 2. The item's other caveats

- **Same name twice (i).** `file_name` can be empty and is not unique; a phone calls photos `IMG_0001.jpg`.
  The import must report, row by row, "no photo has that name" and "two photos have that name, rename one",
  and never pick one. Typing the upload date beside the name would narrow it, but reporting is the rule.
- **Only inbox photos (ii).** The lookup is limited to `owner_type = 'bill_inbox'`. The database already
  backs this up: the attachments policies in `0189_bills.sql` ask `bill_owner_can(owner_type, …)`, and for
  `bill_inbox` that is `can_use_bills_inbox()`. The comment in that file says the update check "asks the NEW
  owner's activity too, so a photo cannot be [moved to somewhere the person may not file]". So moving an
  inbox photo onto a utility bill, a general bill, a job, a visit or a delivery is checked by the person's
  own cards, and a resident's photo is never reachable because it is not an inbox photo. No new guard is
  needed.
- **A row with no filename (iv).** Still valid. It becomes a bill without a photo, which the existing
  inbox *Likely matches* (amount and date) can join later.

## 3. Encoding and dates: say what we accept, reject the rest

- **Encoding:** UTF-8 only. A leading byte-order mark (the invisible marker Excel adds) is **accepted and
  stripped**, because it is harmless and very common. **CP874 (old Thai Windows) is rejected** with a plain
  message ("save as CSV UTF-8"); we do not guess, because a wrong guess turns Thai names to rubbish and files
  them under the wrong place.
- **Dates:** one format, `2026-11-11`. Anything else (`11/11/2026`, `11-11-26`) is rejected on that row
  with "the date must look like 2026-11-11".
- **Utility month:** a separate column written `2026-11`, because the database insists the covered month is
  the first of a month.
- **Names for place, account, kind:** matched against the shelter's stored name exactly (Thai included, never
  a slug). Unknown name: that row is rejected ("there is no place called that"); the import never adds to the
  lists.
- **Whole file or good rows?** Import the good rows and hand back a CSV of the rejected rows with a reason
  per line, after a preview where the person presses *Import N bills*.

## 4. Worked example of the template

| destination | kind | place | account | amount | date | covers_month | photo_filename |
|---|---|---|---|---|---|---|---|
| utility | Electricity | Main shelter | MEA 1234 | 4820.50 | 2026-11-03 | 2026-10 | IMG_0412.jpg |
| general | Dog food | Main shelter |  | 12900.00 | 2026-11-05 |  | IMG_0413.jpg |
| general | Cleaning | Annex |  | 640.00 | 2026-11-06 |  |  |

The template is downloaded from the app, filled with the shelter's own names, so the typist picks rather
than spells. Maintenance, delivery and clinic bills belong to a job, delivery or visit; **I recommend the
first build covers `utility` and `general` only** (they need no parent record). Later destinations add a
column for the job or visit.

## 5. Row rights

Each row is written as the person importing, under their own session, so a row for a destination they hold
no card for fails with a readable reason. **Any design needing a service-role write is the wrong design.**
(Evidence that per-row card checks already behave: #1508 fixed the inbox so it only offers the routes the
login's cards allow.)

## 6. Size and card

- **Band:** about 450–600k tokens at `medium`; one stream.
- **Shape:** a template-download route, an import page (upload, preview, import, rejects download), a small
  CSV reader (the app has none), the manual section, and tests. Roughly 8–12 files under `src/app/bills/`
  and `src/lib/bills/`.
- **Migration:** none for the filename match and rows themselves.
- **New card:** **probably none.** Use the existing `bills.utilities` / `bills.general` checks per row; the
  import page itself is shown to anyone who holds either. If Lutan wants "may import" separate from "may
  file", that needs a new card, and a card cannot be split from its grants (`check-cards-count` asserts an
  exact count from `cards.ts`), so it would be one stream carrying its own migration.
- **It is the app's first import**, so the CSV reader, preview and rejects file become the pattern residents
  and donations copy.

## 7. What the backlog item should now read (for the planner to file)

"Build the bulk-bills CSV import, utility and general first; blocked on Lutan confirming the typing happens
away from the app (otherwise build the in-app grid). Filename match measured working 2026-11-12."
