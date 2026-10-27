# The last 14 manual topics are linked to cards, and nothing in the manual falls back to a role by name (2026-10-27)

Branch `claude/manual-follows-cards-fix`. No migration. Backlog item: *The user manual follows the cards*, in **Documentation**.

## The rule this closes

Lutan, 2026-10-26: *"having any fallback to a named role will break longer term."* The old `audience.ts` mapped every role that was not
one of four built-ins onto **volunteer, by role key**, so a 2IC was shown the volunteer's manual. That was removed by `073bda7b`
(`claude/manual-by-card`, 2026-10-26); this stream was first briefed to remove it and found it already gone. What was left was the
worklist: 14 topics with `awaitingCard`, shown to everyone and marked "Not yet assigned to a card". They are now resolved, and
`awaitingCard` is down to zero.

## How each was decided

No cards were invented or proposed. Each topic names the **activity its own page or action asks** (read from the page, as
`CLAUDE.md` says for buttons), and `cardsOfTopic()` derives the cards from `cards.ts`, so Card review 2 changes the answer without a
manual edit. The old role tag was a hint only and decided nothing.

| Topic | Answer | Because the page / action asks |
|---|---|---|
| appointments-vet | `medical.visits` read | `requirePermission("medical.visits","read")` |
| placement-history | `resident.record` read | `SECTION_READS.housing` |
| record-weight | `medical.weight` | the weight action |
| resident-photos, resident-videos | `photos.resident_add` | the photo upload action |
| microchip | `resident.microchip` | the chip form's `canEdit` |
| medication-list | `medical.prescriptions` read | `requirePermission` on the page |
| feeding-list | `medical.diet` read | `requirePermission` on the page |
| who-does-what | `roles.view` read | `requirePermission` on the page |
| name-card | `everyone: true` | the card opens for anyone, even signed out; what differs is how much it shows |
| my-access-requests, stocktaking-switches, security, two-step | `adminOnly: true` | the pages call `requireAdminUser()` / `perms.isAdmin` |

`adminOnly` is new and is not a card. It records "Admin does this, outside the card system" for topics where no activity exists to
derive from. It yields exactly what an activity no card grants already yields (`cards: []`, which only Admin satisfies), so it is a
decided answer and not a gap. Admin is **not** given cards and does not "hold every card".

## Why the hard-coded-security check does not and should not cover this

This is content marking, not access. Being shown the wrong page of a manual grants nobody anything, so
`check-hard-coded-security.mjs` correctly passes it. The rule has to be read, not enforced; do not "fix" the check to catch it.

## Why widen rather than narrow

A topic nobody decided about is shown, not hidden. A role with an unfamiliar name holds some cards, sees those topics plus the
"everyone" ones, and Admin sees all. Two sibling streams (role delete, security page) make unfamiliar role names more likely, which is
the argument for this shape.

## Left

Nothing of the 14. Not done: screenshots, the Thai edition (should now be translated once, as the item asked), and any change to what
a card grants. `record-weight`, `medication-list` and `feeding-list` now show to every card that grants those activities, which may
include Management through its medical cards; whether that is right is Card review 2's question.
