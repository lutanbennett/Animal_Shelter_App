# The release note for `0276`'s read half, and why it names four cards

**2026-10-28.** `0276_medical_photos_card.sql` gave reading a resident's Medical-folder photos its
own activity, `photos.resident_medical`. It went on production at **2026-10-28T04:56:38Z**, a minute
after `0.40.9` merged. `0.40.9` told users that *filing* into Medical needs its own permission
(`0277`/`0278`) and said nothing about *viewing* it, so the read half shipped to the shelter with no
note. This PR is that one line.

## Why it was missed, and the mechanism is already written down

`0276`'s own PR correctly wrote its release-note line `n/a`: production did not have the migration,
so a note would have promised something that did not work yet — the release-note truth rule
(`docs/decisions/2026-10-11-release-note-truth-rule.md`), which exists because #518's false note
reached every admin in `0.25.0`. That rule says *the PR that closes the outstanding step carries the
note*, and it assumes the step is closed **by a PR**. Here the step was a **command** — a planner
applying the migration — so the note was handed to a PR that was never going to exist.

That is the identical shape as `0275`'s note, which the backlog records and #1024 then wrote. **The
difference worth recording: `0275`'s was caught, `0276`'s was not**, and both were created the same
way on the same day. The general lesson is already an item in the backlog; this file only notes that
it recurred once more before the lesson landed.

## Why the note names four cards

The read is granted to `view_medical` and `medical_records` by `card_grants`. But `card_closure()`
expands `card_includes` transitively, and three cards include `view_medical`: `medical_records`,
`book_clinic_visits` and `run_appeals`. So four cards reach the read, and `0276`'s note 2 says that
is intended — *"that is what 'includes' means and is recorded, not widened."*

Naming only the two granted cards would therefore be **wrong in a way a user would notice**:
Management sees the Medical photos through Book clinic visits, and a note saying it needs View
medical or Manage medical would have them hunting for a card they do not need. The note names all
four. Whether four card names in one sentence is too much for a shelter user is the one thing left
in this plan's manual list.

## What the note deliberately does not say

- **Who holds which card.** That is a Settings answer, not a release note, and it changes without a
  deploy. It is also live and slightly surprising: **Head of Medical files photos into Medical and
  can no longer open them, while Management can see them through a clinic-booking card.** Both
  halves are deliberate — note 4 withholds the read from Add medical photos on Lutan's *"decrease to
  just what is required"* ruling — so there is nothing here to file in
  `docs/card-access-faults.md`. Whether he **wants** that shape was raised with him on 2026-10-28.
- **"No longer sees the Medical folder."** A first draft said that, and it overclaims. `0276`
  changes `attachments_select_perm`, so the **photos** stop being readable; the folder chooser and
  Move list are `0277`/`0278`, already noted in `0.40.9`. The note says the folder's photos.

## Not established

**Who currently holds the read is derived, not proven.** It comes from `card_includes` and
`card_grants` in the applied migrations plus the live `role-cards` reading, not from a query run as
each login — ad-hoc production reads are refused in a worktree, and `check-production.mjs` has no
check that prints a role's activities. If that matters later, it needs its own named check rather
than another derivation.
