# 2026-09-27 — Who can do a recurring job is derived from its link, not stored

Backlog, "Recurring jobs: only offer people who can actually do the job"
(Pass 1 of the role walkthrough: a stocktake given to a vet bounced them).
The item left open how a job says which capability it needs — a field on
the job, or derived from its target path. **Derived from the path**, in
`src/lib/recurring-jobs/eligibility.ts`:

- **The link is what fails.** A vet was not refused by an abstract
  "stocktake capability"; they were refused by `/stocktake`. A separate
  capability field could disagree with the link (capability "stocktake",
  link `/maintenance`) and then protect nothing. Deriving it means the
  one thing that can go wrong is the one thing checked.
- **The rules borrow each page's own predicate** — `canStocktake`,
  `canRecordDelivery`, `canWriteMaintenance` — so a page guard and the
  picker can only drift if someone edits one and not the other. `canManage`
  is restated (admin, management) because `require-management.ts` imports
  server-only code and the form is a client component. Longest prefix wins;
  query and fragment are ignored (`/stocktake?tab=diets` is `/stocktake`).
  A path no rule names — no link, `/residents`, `/my` — is open to every
  assignable role.
- **Maintenance means writing it**, as the item says: volunteers can open
  the board and add photos but cannot move a job on. Other pages mean
  "can open it".
- **Vets are never assignable, whatever the link** (Lutan, 2026-09-27, in
  this stream's session): a vet's work comes from their vet appointments —
  adding a vaccination for the resident they saw, say — not from the
  shelter's routine. So even a job with no link, or one on `/residents`,
  does not go to a vet. This is broader than the page rules and sits above
  them (`ASSIGNABLE_ROLES` is the app-access roles minus `vet`), so it
  does not wait on `claude/vet-scope-navigation`'s route guards. Taking
  recurring jobs out of a vet's menu altogether, and shaping the vet's world
  around appointments, is its own backlog item. **When vet-scope lands, its
  route rules and this table should still become one shared helper** —
  noted in the PR rather than both streams inventing one at once.
- **0095 is left as it is.** It still lets a vet read the rules and be an
  assignee at the table level; narrowing that is schema work for its own
  PR, and nothing here needs it.
- **No migration**: 0095 checks only that an assignee is live staff, and
  this is a check on top of that, in the actions. That also
  means a write straight to the table skips it; the display half below is
  what catches that.

Jobs already assigned are handled three ways, because a filter on the form
does not fix a row saved before it:

- **On save**: `saveRecurringJob` refuses a team containing anyone who
  can sign in but can't do the job — checked *before* the row is written,
  so changing the link to a page someone on the team can't open is refused
  whole, not saved half-way. The form keeps such a person listed, struck
  through, so they can be unticked. Hand over (both modes) refuses per date
  or per job, with the reason, and carries on with the rest.
- **On the Management page**: a red banner and a line on the card, next to
  the existing "stranded" warning; a cover team with such a person is
  flagged under Handed to someone else. Archived people stay the stranded
  warning's business, not this one's.
- **On the person's My tasks**: the job stays (it is still theirs to skip or
  pass back) but its title no longer links to a page that would only refuse
  them, and it says to ask management to reassign it.

Dev had two such rows on 2026-09-27, both with the same vet: "Stocktake of
medication" (`/stocktake`, the Pass 0 case) and "Order medicine for the
week" (no link), flagged once vets stopped being assignable at all. Both
are left in place as fixtures for the display half.
