# The manual follows the cards, and nothing falls back to a role by name (2026-10-26)

Branch `claude/manual-by-card`. No migration. Backlog item: *The user manual follows the cards*, in **Documentation**.

Lutan, 2026-10-25: *"Adjust the user manual to transfer from RBAC structure to ABAC structure (Using the who does what cards as the
seed)"*. Scoped on 2026-10-26: *"possibly just do the schema work to start with as it may end up in rework of the actual linkages to
cards after the review"*. And, as a standing principle: *"having any fallback to a named role will break longer term"*.

So this builds the **structure** and the **automatic derivation**, and leaves every topic-to-card link that needs a person's judgement
alone, in plain view.

## What a topic's card is

`cardsOfTopic()` in `src/lib/manual/for-topic.ts` gives one of three answers:

| Answer | When | Shown to |
|---|---|---|
| `cards` | the topic names an `activity` (derived), or a person put a `cards: [...]` list on it (wins) | whoever holds one of those cards, and Admin |
| `everyone` | `everyone: true` on the topic | everyone who signs in |
| `unassigned` | none of the above | **everyone, marked "Not yet assigned to a card"** |

**"No card" has two meanings and the code tells them apart.** A topic for everyone who signs in legitimately has no card, and says so
with `everyone: true`. A topic nobody has decided about is `unassigned`. The trap was treating both as "not mine": the 14 topics below
would have silently vanished for everybody, with no message and no record, which is the `cardTile()` failure `CLAUDE.md` warns of.
Unassigned topics are shown, so the gap is visible.

A third case is not a gap: **an activity no card grants** (`audit.view`, `facility.enclosures`, `reference.types`, `system.status`
…) is Admin's alone, outside the card system. Its topic derives `cards: []`, which only Admin satisfies, so non-Admin
readers do not see it. This matches what the page did before (it asked `can()`), and it is not "unassigned".

## Derived, not written in

The 66 topics with an `activity` carry **no card list in `en.ts`**. `cardsOfTopic()` looks the activity up in `cards.ts` (the cards whose
`bundleOfCards()` grants it, at the level the topic needs), at render and check time. If the card review changes what a card grants,
the answer changes and nothing in the manual is edited. Nothing is materialised, so there is nothing to regenerate.

**"Do I hold this card?"** (`holdsCard()`): the reader's cells cover every activity the card grants. Permissions carry cells, not card
rows, and this is the same test `cardTile()` applies. A card granting nothing (a landing page) is held by no one. Admin is never asked:
`topicView()` answers "mine" for Admin before reading a card, as `can()` does. **Admin was not given any card** and does not hold
"every card" (CLAUDE.md, settled 2026-10-25).

## What was removed

- `src/lib/manual/audience.ts`: `asManualRole`, `audiencesOf`. They mapped every role that is not admin, management, doctor or
  volunteer onto **volunteer, by role key**. A 2IC was shown the volunteer's manual. Now it is shown its own cards' topics.
- `ManualRole`, `Manual.roleNames`, `Manual.roleSummary`, `ROLE_ORDER` (page and PDF), the `roles` tag on every topic, the "Who:" badge.
- `Releases` page: it called `audiencesOf` too, so a 2IC reading What's new was also read as a volunteer. It now uses the reader's own
  role name (`perms.role.name`) and the role keys they actually hold.
- `CreateUserForm`'s `defaultValue="volunteer"`: it assumed a role with that key exists. It now starts on "Choose a role…" and the
  field is required. (**Not** "the first givable role": the list's first entry would be Admin, which is the wrong thing to default to.
  The server already refuses an empty role.)
- The two `docs/hard-coded-security-registry.json` records (`manual/page.tsx`, `manual-pdf.tsx`) that described the role marking. They
  described content marking, not access; with the tags gone they describe nothing, so they are deleted in the same change.
  `node scripts/check-hard-coded-security.mjs` still reports its five known `0264_inert_security_leftovers.sql` failures (a line-ending
  defect in the check, its own backlog item, not this change).

**Left alone on purpose** (each looks like the fault and is not): `role-options.ts`'s `ORDER` (ordering only), `roleOptionLabel()` (an
unknown role shows its own name), everything about the public Volunteer web page.

## Release notes: the fallback is to widen

Release notes are still tagged by role key (`ReleaseRole`); that authoring question is its own backlog item (should a note be tagged by
card?). Past notes are a record of what was said and are not retagged. In the meantime `isForAnyRole()` (`filter.ts`) shows a note when
it is untagged, when a tag names a role the reader holds, **or when none of the reader's roles is one the tags were ever written in**. A
renamed role is therefore shown every note instead of being narrowed, which is the opposite of the manual's old bug. A reader whose role
*is* one of the tagged names still gets the tag's filtering, so a Doctor still does not see admin-only notes. The list of tagged names
(`TAGGED_ROLES` in `releases/page.tsx`) is a vocabulary for "can the tags speak to this role", not a rule about what anyone may do.

## The worklist: 14 topics left for after the card review

These have a role tag in the old manual and **no `activity`**, so there is nothing to derive from, and choosing a card for each is
the judgement Lutan asked to defer. Each now carries `awaitingCard: [...]` in `src/lib/manual/en.ts` holding its **old role tag, kept only
as a hint** (nothing reads it to decide who sees the topic; the matrix script uses it for its column only):

`appointments-vet` (doctor), `my-access-requests` (admin), `name-card` (all four), `microchip` (admin, management, doctor),
`placement-history` (admin, management, doctor), `record-weight` (admin, management), `resident-photos` (admin, management, doctor),
`resident-videos` (admin, management, doctor), `medication-list` (admin, management), `feeding-list` (admin, management),
`stocktaking-switches` (admin), `security` (admin), `who-does-what` (admin, management), `two-step` (admin).

The follow-up stream links each by adding `cards: [...]` (or `everyone: true`) and deleting its `awaitingCard`. `node scripts/acceptance-matrix.mjs --check`
prints the current unassigned list on every run, so the worklist cannot go stale. The test `src/lib/manual/for-topic.test.mjs` fails
if a topic is unassigned without being on that list, or if a `roles` tag reappears.

Two things the follow-up will want to know: **`record-weight`, `medication-list` and `feeding-list` almost certainly belong to the
Record Weight, Administer Medication and Feed Special Diets cards** (`jobs.ts`), but whether Management should be shown them through a
card is exactly the review's question; and **`security` and `two-step` are Admin-only**, so they likely want no card at all
(derived as Admin's alone, like the other Settings pages) rather than a card.

**16 topics with no role tag and no activity** were "for everyone who signs in" under the old rule (untagged meant everyone), so they
carry `everyone: true`. That preserves what they meant; it is not a new decision.

## Two corrections to the backlog item

1. **There are 29 cards, not 21.** The item counted `NewCardKey` only; `CardKey` is `JobKey | NewCardKey` and `jobs.ts` adds 8 (all of
   which are the medical and daily-work jobs). The code uses `CARD_KEYS`, never a typed list, and *Cards at a glance* lists all 29.
2. **The registry clause was stale.** There is no count any more (`2026-10-25-no-coded-security-inventory.md`); the two records were
   deleted instead.

## Cross-check against the card reports

*Cards at a glance* takes each line from the card's own Who does what description (`t.admin.whoDoesWhat.cardsView.description[key]`),
so the manual and that screen cannot drift. **I did not read all 29 `docs/card-reports/` against those descriptions** and make no claim
that they match; that review is part of Lutan's card review and its fixes will flow here without an edit.

## Not done, on purpose

Screenshots (one full rerun is planned); any change to what a card grants (none, not one row); the Thai edition (`manualPage` strings
were added in Thai); the release-note tagging redesign (filed as a backlog item).
