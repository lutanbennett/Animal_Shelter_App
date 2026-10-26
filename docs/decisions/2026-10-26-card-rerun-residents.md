# Card re-run: `residents`, driven (2026-10-26)

The one card of the first fourteen that is not in flux, driven again because its grants were settled by `0265` (applied on
production 2026-10-26) and its app half by #965. It had been driven once, on 2026-10-25, **before** either landed
(`card-report-residents`, rows in `docs/card-access-faults.md`). This is the first driven pass after them. Nothing was fixed and no card
proposed (Lutan: the log is reviewed as a set; cards are Card review 2).

**How:** `node scripts/dev-signin.mjs --cards residents --port 3006`; the login held that one card and nothing else. Disposable record
`walk-residents` (R-5725). Every step of `docs/card-walkthrough.md`'s `## Residents` section, 14 numbered steps, which is what the brief
counted. Dev schema 268 applied (0267 is applied on dev but not yet a file on `origin/main`, and `card-review-schema-all` is applying
0268 in the same batch, so a surprise in dev's behaviour is theirs before it is this card's); code at `8894515f`. Session aal1.

## The two questions, per step

| # | step | enough to finish the job? | nothing more than the label? |
|---|---|---|---|
| 0 | sign in, Residents tile / menu | yes: Home and Residents only in the menu | yes |
| 1 | open `/residents` | yes: 90 residents, enclosure and zone names showing | see "too much" below |
| 2 | details, housing and history | **yes**: edit saved, hub read the new breed and bio at once; `/housing` lists the Intake row with the enclosure's name | yes |
| 3 | register (intake) | **yes**: all six steps; zone and enclosure pickers filled; over-capacity warning then "Register anyway"; R-5725 appeared with its enclosure | yes |
| 4 | microchip | **yes**: set at intake, then Correct changed it and the hub showed the new number at once | yes |
| 5 | news from an adopter | **yes**: only an adopted resident has the control; the update listed first with date and channel (Email) | a "publish on the website" tick is offered (not pressed): see row 5 of the new fault block |
| 6 | move | **yes**: the hub shows the new enclosure. **Closes the 2026-10-25 "That enclosure no longer exists" fault** | yes |
| 7 | hospital and back | **yes**: In hospital, "Returns to <enclosure>", then Resident again. **Closes the "status enclosure is missing" fault** | yes |
| 8 | foster, adopt, return | **yes**: Fostered, Return to shelter, then Adopted, each read back on the hub; the carer list worked (names only) | yes |
| 9 | add a photo | **yes**: Medical folder, tile "Medical · 26 Oct 2026" | yes: Medical never reaches the website |
| 10 | refile, remove, profile photo | **partly**: Remove works (with a confirm); Shelter to Medical works; **Medical to Shelter fails** ("moved in Google Drive, but saving its new folder failed"), a real fault, read to be the `0152` folder guard wanting `photos.resident_publish`; the profile photo cannot be set on a Medical or waiting photo, and says why | yes |
| 11 | photo to Shelter only | **yes**: filed to Shelter, "Waiting for approval", not on the website, cannot be the profile photo yet | yes: the Foster and Adoption folders are gone |
| 12 | Contacts, read only | the grant does only one thing here: the carer names in step 8. No contacts page opens (`/management/contacts` to `/no-access`) | yes. The walkthrough wording is out of date |
| 13 | refused: Medication list | refused, to `/no-access` | yes |

**Beyond the 14:** `/residents/<id>/deceased` opens but says "Only staff and admins can record a death." and the hub offers no such
button, so the 0265 split took Record a death off this card as intended; the sentence names old role words. Download spreadsheet still
returns 200 and 95 lines to this card (unchanged, Card review 2's).

## What 0265 and #965 changed, confirmed by driving

- **Record a death is off this card.** Confirmed: no button, and the page refuses.
- **New photos wait for approval.** Confirmed: Shelter filing reads "Waiting for approval"; the public site was not fetched.
- **Foster / adopt and Move have an enclosure read.** Confirmed: Move, hospital and foster all save now.
- **Foster carer list reads names only.** Confirmed: five names, no contact details, no contacts page.
- **Medical tiles hidden, not "0 · none".** Confirmed: the hub shows only Housing, Photos, Adoption updates and Bio.

## What happened to #926's and the 2026-10-25 driven rows for this card

Kept, none deleted; four marked CLOSED in place in `docs/card-access-faults.md` (the enclosure lookup, blank enclosure names, the medical
"none" tiles, the Foster / Adoption publish bypass). **Nothing the driven pass disproved** that reading had suggested; the 2026-10-25 rows for this card were already
driven. The "bundle is 12 activities" judgement row is shorter now (no death, no public-photo grant) but the card is still the whole
residents job, and it stays Card review 2's.

## New this pass (five rows, `## Added 2026-10-26 by claude/card-rerun-residents`)

1. **Move to folder, Medical to Shelter, fails and leaves Drive and the record disagreeing.** The only fault that stops a step.
2. The "Waiting for approval" badge survives a move into Medical.
3. The refused death page names "staff and admins".
4. Walkthrough step 12 cannot be done as written.
5. Spreadsheet and the publish-adopter-words tick: judgement, unchanged.

## Not done, said plainly

- The public side of the Shelter photo was not fetched, so "not on the website" rests on the page's own words.
- The Shelter-folder move failure's cause was read from `0152`, not reproduced under the login's claims.
- Weight entered at intake (8.5) was not read back: this card shows no medical tiles, which is the intended behaviour.
- Production was not read (no `.env.deploy.production` here); `role-cards-coverage` is the brief's figure, not mine.
- The disposable record R-5725 and its remaining Medical-folder photo are left on dev (dev test data is disposable).
