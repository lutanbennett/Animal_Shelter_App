# Card report, stream 2: the four medical cards (2026-10-25)

Cards written up: `medical_records`, `book_clinic_visits`, `administer_medication`, `add_medical_photos`. Reports are in
`docs/card-reports/`; the faults are in `docs/card-access-faults.md` under "Added 2026-10-25 by `claude/card-report-medical`".
Nothing was fixed, no grant was changed and no card was proposed (Lutan's ruling 2026-10-24: the log is reviewed as a set).
The format and the generator were not touched; all four cards fitted it.

## Choices worth knowing

- **Every report is from a driven pass, one login per card.** Each login was made with `dev-signin.mjs --cards <card>`, and before any
  page was opened a read of `role_cards` and `role_permissions` confirmed it held exactly that card and the expected cells (counts are in
  the fault log). The read-back was a throw-away script in the scratchpad that only reads; it is not committed.
- **The `card_includes` edge was proved, not assumed.** A login holding only `medical_records`, and another holding only
  `book_clinic_visits`, each opened the Residents list, a resident's page, Housing & Status, the Photos gallery and the spreadsheet.
  The other two cards do not include `view_residents`, but they hold the same `resident.record` read, and the same five things worked.
- **The walkthrough's one TODO was answered by driving.** Step 2 of `medical_records` ("Vet visits and how they went") asks where the
  write should show afterwards. The pass drove what the card can actually do with a visit: add a doctor's report page (it shows as
  "Doctor's report: 1 page" on the resident's Clinic Visits tab) and try to mark a visit completed (it cannot, because the clinic box is
  empty). The question of what the step *should* be is still Lutan's; the catalogue was not edited.
- **`book_clinic_visits` can book, but not through its own form.** This was not in any earlier row. The "Calendar entries to confirm"
  panel on Vet visits lists the clinics and its Create visit button made a real visit. It is recorded as its own row ("two doors
  disagree") rather than folded into the clinic-list row, because it is a different door with a different answer.
- **One root cause, one row.** The empty clinic list (book form, edit form, clinic column, "linked visit" choices) is one row naming both
  cards. The resident-page "none" counts, the offered-but-refused buttons and the whole-record spreadsheet are each one row naming the
  cards they affect, and each says which existing row it extends.
- **The production checks were run from the main checkout.** This worktree has no `.env.deploy.production` (the worktree script copies only
  `.env.local`), so `check-production.mjs` stops here. `fault-clinic-visit-save` and `role-cards` are the allow-listed read-only checks and
  were run from `C:\Development\Animal_Shelter_App` without changing anything there. Result: Staff is blocked from saving a visit on the live
  system today; Management is not.
- **Resident counts differ between cards (90, then 93).** The dev database is shared by every stream, so other work added residents during
  the pass. Each report says what was seen when it was opened.
- **Test rows were left on dev** (a weight, a prescription, a procedure, a blood test, an immunization, a diet and a doctor's report page on
  one resident; two medical photos and a booked visit on another), all named `walk-<card>` where a name was possible. Dev data is disposable.

## Not established

- Whether a resident's profile picture can reach the public website (a medical photo became the profile picture of a resident with none).
- How the calendar panel reads the clinic names when the form cannot. Only the behaviour was driven, not the reason.
- Whether the doctor role is affected: it is out of scope by Lutan's instruction and was not touched.
