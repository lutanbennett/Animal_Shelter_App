# A new release note is tagged by card, not by role

2026-10-26, `claude/release-notes-by-card`. Decided by the stream, as a design choice (the backlog item called
it a small decision and the planner said it was not Lutan's call).

## The problem

`ReleaseNote` could only narrow a note by Lanna's own role keys (`roles: ["admin", "management"]`). A shelter that
renames its roles makes those tags mean nothing, the flaw the manual just lost. Lutan, 2026-10-26: *"having any
fallback to a named role will break longer term."*

## What a new note looks like

`ReleaseNote` has a third shape, alongside the plain string and the old `{ text, roles }`:

    { text: "…", cards: ["who_does_what"] }

- **Mine** = the reader holds one of the cards (`holdsCard`, the same test the manual uses).
- **Admin sees every card-tagged note.** Admin is outside the card system, so the answer comes before any card is
  read; it is not "Admin holds every card" and Admin is given no cards.
- **A tag nobody recognises widens.** If none of the note's cards is a `CardKey` the code still knows (a card renamed
  or removed, or an empty list), the note is shown to everyone, never hidden.
- **Untagged** still reads as everyone's. A reader with no permissions at all sees everything.
- Which card to name is for the author to pick from `CARD_KEYS` in `src/lib/permissions/cards.ts`; no card list is
  typed anywhere else.

## What happens to `roles`

**`roles:` is closed to new notes.** Every existing tag stays exactly as written, `staff` included: past notes are a
record of what was said at the time, so nothing is retagged. `ReleaseRole` and the retired `staff` value stay for them,
and the page reads them as it did before (the reader's role keys against the tag, widening for a role the tags never
heard of; Admin is not special-cased on that path, so history renders unchanged).

## The pieces

- `src/lib/release-audience.ts` (`isNoteForReader`) is the one place that decides; the Releases page calls it.
- `scripts/check-test-plan.mjs` now strips `cards: [...]` as well as `roles: [...]`, treats either tag as tagged for
  the admin-only-place warning, and adds a second **warning, never a failure**, for a new note tagged `roles`. It was
  taught the new shape, not loosened: a correct-but-unsigned plan still exits 0.
- §7 of `docs/test-plan-template.md` documents `cards` and says `roles` is closed.
- `release-mail.ts` reads only the note text and needs no change; `health.ts` reads the version list only.
