# Card drive: `view_contacts` and `publish_shelter_friends` (2026-10-27)

Two cards driven on dev, each as a login holding only that card, at 375 px. Nothing was fixed and no card proposed (the log is reviewed as a
set, then fixed). The rows are under `## Added 2026-10-27 by claude/card-drive-contacts` in `docs/card-access-faults.md`.

## Step zero: was each pass needed?

| card | last driven | what changed it since | verdict |
|---|---|---|---|
| `view_contacts` | never (no mention in the log) | new in `0268` | **needed** |
| `publish_shelter_friends` | never (no mention in the log) | new in `0268` | **needed** |

`grep` for the two keys over `supabase/migrations/02*.sql` matched only `0268_card_review_2_cards.sql`; the fault log has no mention of either.

## The two questions, per card

**`view_contacts` (7 steps).** Enough to finish the job: **yes.** The home tile, the list, a contact's page, a Shelter Friend's page and the
clinics list all open read only, with no add, edit or save control anywhere; the medication list is refused. Two small things: the
walkthrough's "list of clinics" is not on `/contacts` (it is `/clinics`, reached only by address), and one contact shows a "Map · null"
button.

**`publish_shelter_friends` (4 steps).** Enough to finish the job: **partly.** Publish and Unpublish work. **Adding a friend does not:** the
form's "Add a new business" route writes a contact, the database refuses it for this card, and the page shows the raw refusal text; the
"pick a supplier you already have" route had no one to pick on dev, so no friend could be added from this login.

## The TODO lines

- `view_contacts` browse (step 2) and see a Shelter Friend's card (step 5): answered. The card writes nothing, so there is no read-back; what
  was seen is that the data is read only. The disposable `walk-view_contacts` record was not made.
- `publish_shelter_friends` add, publish, unpublish (step 2): publish and unpublish answered (the Draft or On the website label and button in
  the same list; the page says `/friends`); add not completable, see above.

## What I created on dev, removed, and left

- Created: two one-card logins (`view_contacts`, `publish_shelter_friends`), not removed (disposable; I did not re-try `--remove --cards`).
- Added a friend: **nothing**, the save was refused.
- Changed: "Test friend" was published then unpublished, so it is Draft again as found.
- Left behind: nothing else. The contacts, clinics and friends I saw were not created by me and were not touched.

## Not done, said plainly

- `/friends` (the public page) was not fetched.
- Up and Down on the friends list were not pressed; Operations in the header menu was not opened; where the "Map · null" button leads was
  not followed; the contacts filters and search were seen, not exercised.
- Production was not read; who holds either card there is not established.

## The parent item

It covers nineteen cards and this stream drove two: **`view_contacts`, `publish_shelter_friends`. Fourteen remain after this stream** (the
brief's count). The box is left open for the planner.

## Release note

`n/a`: a recording pass; nothing a user sees changed. `src/lib/releases.ts` is untouched.
