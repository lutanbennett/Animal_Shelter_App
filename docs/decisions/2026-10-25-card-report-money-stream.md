# Card report stream 4: contacts, donations, bills, appeals, outreach (2026-10-25)

Stream 4 of 6 of the card report. Five cards, driven in a browser on the dev project as a login holding only the card, each after a read-back that
the login held exactly that card and its expected cells (`contacts` 7 cells, `run_appeals` 2, the other three 1 each). Output: five files in
`docs/card-reports/`, one block of rows in `docs/card-access-faults.md`. Nothing was fixed, no grant changed, no card proposed, no migration.
The format is #942's and was not changed; `build-card-report.mjs` was not touched.

## What was found that Lutan asked to be told about

- **Two cards publish to the public website with no second approval.** `run_appeals`: Publish on an appeal reached the public Appeals page within seconds, read with
  no sign-in; Take off removed it. `contacts`: Publish on a Shelter Friend reached the public Friends page and Unpublish removed it. Both were put back after the test.
- **`run_appeals` shows a false warning.** The page said the resident was not public and the appeal would not appear; the resident's flag was true and the appeal did
  appear. The card cannot read that flag, so the message is wrong for it. Recorded as a defect of the display, not fixed.
- **`contacts` has no read-only form.** All seven grants are at edit and delete is permanent. A Recommendation, not a fix.
- **`bills` cannot do the last step of its own job.** "What is it for?" was empty while the database held 11 open maintenance jobs (service-role count).
  `donations_receipts` and `run_appeals` meet the same wall at the resident list. This confirms the existing root row rather than adding a new one.

## One earlier row was contradicted

The Card review 1 row for `donations_receipts` said the donor list was empty for that card. Driving shows the Donors page and dropdown are readable: the `supporters` table
held 0 rows, and a donor added by the login then showed up (service-role count 1). Kept in the log as a contradicted row, not deleted.

## Choices made

- **No donor, contact or resident is named** in the reports or the fault rows (the repo is public). Test records are named `walk-<card>` and left on dev as disposable data.
- **Production was not read.** This worktree has no `.env.deploy.production`, so the four production check commands in the brief could not run; every "production" cell is
  *not established*. Not worked around.
- **Dev rows left behind, on purpose** (dev test data is disposable): a clinic, two doctors (one merged away), a donor, two receipts, an outreach visit with a place and a photo, a Shelter Friend draft, and a fixture appeal whose wording was edited and which was then taken off the website (it is a draft again). A contact and a bill were deleted again; nothing that existed before was removed.
  that an appeal draft's wording was edited on a fixture appeal and then taken off the website (it is now a draft with test wording).
- **Left alone on purpose:** Void a receipt, Delete this visit, the Shelter Friend "Remove status", and publishing a Shelter Friend other than the one put back. Offered, not pressed.
- **A dev-server trap is written into the fault log's method note**: a page can paint before React attaches, and a form then submits as a plain GET and saves nothing, which looks like a
  broken Save. Click once with a real click, wait, then fill and submit.

## Not done in this stream

`contacts` step "see a Shelter Friend's card" was driven on one friend; the carer-to-resident link (done from the resident's page) was not, because that page is another card's.
Which card ticks an outreach photo onto the public site was not looked at.
