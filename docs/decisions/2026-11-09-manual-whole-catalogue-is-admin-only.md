# The whole manual and the whole card catalogue are Admin's alone

Closes #ia85b. Lutan, 2026-11-09: *"they should not have ability to show entire manual which should be limited to admin."*

## What changed

- **Cards at a glance** (`/manual` and the PDF) lists only the cards the reader holds (`cardsForTable` in
  `src/lib/manual/for-topic.ts`). Admin, outside the card system, still sees every card. A reader holding none gets no
  section and no heading rather than an empty table.
- **`?view=all`** is honoured only for `perms.isAdmin` (`mayViewAll`), on `/manual` and `/manual/pdf`. The address is
  refused, not just the link hidden: anyone else asking for it gets their own cards' edition. The *Show everything* link and
  the two `?view=all` PDF links are drawn only for Admin.
- The `!entersApp(perms)` clause in the PDF route is gone: a login whose cards open nothing is no longer handed the whole manual.
- The pre-built full PDF is therefore only ever served to Admin.
- The PDF still resolves card names for every card on a topic's "Cards:" line (`cardLabels`), so a topic that several cards give
  does not show a raw card key for the ones the reader lacks.

## Judgement recorded

The table was probably built whole so a volunteer could ask *who does that?*. Lutan's direction outranks that, so it is gone for
non-Admin. No new card, no role key read anywhere (`CLAUDE.md`: Admin is the one thing outside the card system).

## Deliberately NOT changed

- **Hidden-until-found rendering** of topics that are not the reader's stays exactly as it is. It keeps deep links and
  Find-on-page working. Do not reopen it unless Lutan asks.
- **`/releases?view=all`** is left as it is: release notes are an announcement of what changed, not instructions for work the
  reader cannot do, and that page is keyed on the role's name rather than on cards. Moving it onto cards is a separate item.

## Found, not fixed

The sibling stream `manual-topics-by-card` owns `src/lib/manual/en.ts`; untouched here.
