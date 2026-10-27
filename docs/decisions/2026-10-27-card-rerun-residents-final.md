# Card re-run: `residents`, driven a second time (2026-10-27)

The last card of the first fourteen. It was driven on 2026-10-26 (`2026-10-26-card-rerun-residents.md`); this is the pass after the
migration that changed it. Nothing was fixed and no card proposed (Lutan: the log is reviewed as a set; cards are Card review 2).

## Which axis invalidated the 2026-10-26 pass

**A migration, and it was `0269`, not `0268` as the brief expected.** `grep -n "'residents'"` over `0268`, `0269`, `0270` and `0271`:

- `0268`: no match. It never names this card.
- `0269_card_review_2_app_half.sql:134`: `delete from card_grants where card = 'residents' and activity = 'placement.hospital';`
- `0270`, `0271`: no match.

`0269` also rewrote `record_attachment()` (section 1) and `attachments_update_folder_guard` (section 2), which is the exact area of the
2026-10-26 "Medical to Shelter fails" row. **The 2026-10-26 pass pre-dates `0269`**, so a second pass was needed. The app half did not
change this card's pages after 2026-10-26 in any way I could see; the one new control seen (Mark as posted) is `0223`'s, older than both
passes and simply not recorded before.

## The two questions, per step

| # | step | enough to finish the job? | nothing more than the label? |
|---|---|---|---|
| 0 | sign in, Residents tile / menu | yes: Home and Residents only | yes |
| 1 | open `/residents` | yes: 94 residents, enclosure and zone names, filters, chip scan | see "too much" below |
| 2 | details, housing, history | **yes**: breed and bio saved; hub and `/housing` read them back | public-facing fields on the form: judgement row |
| 3 | register (intake) | **yes**: six steps, zone and enclosure pickers fill; R-6600 appeared | an intake tick publishes to the adoptable page (not pressed) |
| 4 | microchip | **yes**: set at intake, corrected from the hub, new number shown at once | yes |
| 5 | news from an adopter | **yes**: control only on an adopted resident; listed first with date and channel | publish tick offered (not pressed) |
| 6 | move | **yes**: hub shows the new enclosure | yes |
| 7 | foster, adopt, return | **partly**: all three save **with an existing carer**; **Add a new carer is offered and fails** with a raw RLS message about `contacts` | see the row |
| 8 | add a photo | **yes**: Medical folder, tile "Medical · 27 Oct 2026" | Mark as posted offered (judgement) |
| 9 | refile, remove, profile photo | **partly**: Remove (confirm) and Shelter to Medical work; **Medical to Shelter still fails**; profile photo refused on a Medical or waiting photo, with a reason | yes |
| 10 | photo to Shelter only | **yes** (the first try answered 500: a connection timeout to Google, Retry saved): filed to Shelter, "Waiting for approval" | yes |
| 11 | Contacts, read only | the grant does one thing: carer names; no contacts page (`/no-access`) | yes |
| 12 | refused: medication list | refused to `/no-access` | yes |

**Beyond the 13:** the hub offers no hospital control (correct after `0269`); `/hospital` and `/deceased` still open by URL and refuse with
"Only staff and admins ...". Download spreadsheet still returns the whole list.

## My verdict on the `/residents`-opens-by-URL finding (#981, #985)

**For this card there is nothing to find: `/residents` is its own page (`opens: "/residents"`), listed in its menu, and the 94 rows are
the job.** So what I see agrees with #985 on both halves: the finding is about the four ops/facility cards and `feed_special_diets`, whose
grants give a page that opens and says "0 residents" without refusing. **Not an over-grant of data; a leaf with a misleading display**
(#985's wording, and I have no reason to differ). The `residents` card does read more than they do (`resident.record`, all columns), which
is correct for the manage card. The misleading page is for those other cards to answer, and #985's row already does.

## What happened to the 2026-10-26 rows and #926's

Kept, none deleted. The 2026-10-25 "bundle is 12 activities" row is marked **PARTLY OVERTAKEN** in place (hospital, death and the public
photo grant have left the card). **The driven pass contradicted none of the five 2026-10-26 rows**: Medical to Shelter, the badge, the
death-page wording, the step-12 wording and the export all still stand, and the publish tick has company (three places, not one).

## New this pass (eight rows under `## Added 2026-10-27 by claude/card-rerun-residents-final`)

1. Medical to Shelter still fails (cause confirmed: the guard admits publish or approve, this card holds neither). The only step it stops.
2. **Add a new carer is offered and refused**, with the raw database message.
3. Hospital correctly gone from the card; the by-URL page names "staff and admins".
4. Badge persists (unchanged).
5. Public-facing fields on three forms (judgement).
6. Spreadsheet export (judgement, unchanged).
7. Mark as posted (judgement, new to the log).
8. Walkthrough wording and the two `TODO:` steps (unchanged).

## The sibling streams

- **`claude/buttons-follow-cards`:** I saw no control hidden that the 2026-10-26 pass had seen. The photo dialog still offered Remove photo, Move to folder and Mark as posted, all of which this card may use, and Add a new carer, which it may not. **I cannot tell whether that stream's change had reached this worktree**, so the carer control is recorded as offered-and-refused, not as a regression.
- **`claude/role-delete-schema`:** nothing odd in role-level filtering was seen; dev read 272 applied, 0 pending throughout.

## Not done, said plainly

- The public site was not fetched; the publish ticks were not pressed.
- The cause of the Medical to Shelter failure is read from `0269`'s policy and the driven result, not reproduced under the login's claims.
- No profile photo could be set: a new photo waits for approval, which this card cannot give.
- Production was not read from this worktree.

## The fourteen-card item

**This card completes the set of fourteen, so the backlog item is now closeable.** Per the brief it is **not ticked here**; that is the planner's.
