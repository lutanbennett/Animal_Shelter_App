# Card walkthrough: the three blocked cards, re-run, 2026-10-23

Stream `cards-rerun-blocked`. Dev only, port 3011, 375 px wide, one throwaway login per card
(`scripts/dev-signin.mjs --cards <key>`, aal1). Cards: `medical_records`, `book_clinic_visits`, `residents`.
Disposable record: **Capwarn Test 0924** (R-0079), an existing dev test resident. These cards cannot register a
resident, so no `walk-` record could be made for the first two; every row written carries a `walk-<card>` note.

**Summary:** 3 cards walked, **0 pass**. 31 steps run: 22 pass, 7 fail, 2 not a card fault (a wrong
expectation, a missing control); 1 step not walked. 10 of the 15 `TODO:` steps answered by doing the job (the other 5:
vet visits, hospital, foster/adopt, death, publish a photo). 6 findings, filed as 4 backlog items.

| card | result | steps | the old blocker |
|---|---|---|---|
| `medical_records` | **FAIL** (1 step: vet visits) | 13 run, 11 pass | **gone**: opens the full page, every medical section saves |
| `book_clinic_visits` | **FAIL** (its one job) | 5 steps, 2 pass, 2 fail, 1 not walked | **gone**: lists and the resident's visits page load |
| `residents` | **FAIL** (4 steps: move, hospital, foster/adopt, death) | 14 run, 9 pass | **gone**: the hub opens with every control it should have |

**Headline: the earlier blockage is gone, on all three cards.** `/residents/<id>` no longer redirects a card login
to the name card, and what the two earlier records could not reach now runs. What the run found instead are **two
different shared faults, both of one shape: a read the card does not hold** (finding A: the clinic list; finding E:
the enclosures behind every lifecycle write). They affect the cards' own jobs, not the redirect.

Pages stream slowly on first hit (10 to 25 s); a header-only page is still loading, not broken.

## Findings

**A. `book_clinic_visits` and `medical_records` cannot save a clinic visit: the clinic list is empty (card gap).**
The clinic picker on `/clinic-visits/new` and `/clinic-visits/<id>/edit` reads `clinics`, whose select policy needs
`clinics.list` (read) (`0182_perm_policy_cleanup.sql:42-45`; it used to accept `visit.book`, which is why it worked).
Neither card holds `clinics.list`. The field is required, so the browser refuses the save with "Please select an
item in the list". Same cause on the Immunizations form: its "Add all in zone / enclosure" pickers are empty.
This is the same shape as the `residents` card's missing enclosure read filed on 2026-10-22.

**B. A card login is offered controls its card does not grant (menu/affordance gap, expected from earlier runs).**
`medical_records` on the resident page: "Edit resident details", "Housing", "Send to hospital", "Foster / adopt",
"Move enclosure". All five **refuse correctly** when opened (read-only half holds), but they are offered.
`book_clinic_visits` on `/upcoming-visits` and the resident's visits page: "Open" and "Edit" on every visit, plus
five add buttons (blood test, prescription, weight, procedure, hospital). Every one that was opened is refused
(`/no-access`). The top menu on both logins shows Residents and Operations.

**C. Walkthrough step "refused: `/operations/medication-list`" is wrong for `medical_records` (generator, not card).**
The page opens, read-only ("nothing here is ticked off or recorded"). It is gated on `medical.prescriptions:read`
(`src/app/operations/medication-list/page.tsx:45`), which this card holds by design. Not a leak; the expectation is
what is wrong.

**D. `/appointments` refuses the login holding `book_clinic_visits`.** The card's `opens` is `/appointments`
(`cards.ts:115`) but a shelter-staff login is meant to use `/upcoming-visits` (`opensAny`). The walkthrough says so;
the home tile for this card would need to point at the right one. `/upcoming-visits` itself loads.

**E. A `residents` login cannot move, hospitalise, foster/adopt or record the death of a resident (card gap, the
same shape as A).** `0248` fixed intake and the place pickers, not the writes. Move: the picker lists Blue
Enclosure 3, then Save says *That enclosure no longer exists* (`src/lib/placements/move.ts:53` reads the
`enclosures` table, unreadable without `facility.enclosures:read`). Hospital, Foster and Death say *The
Hospital / Fostered / Deceased status enclosure is missing from this database* (the Lifecycle enclosures, same
policy). Nothing was written. One backlog item.

**F. Photo notes in the walkthrough are wrong for `residents` (generator).** Step 10 says this card cannot look
at the photo again; it can (tile with a Profile tag, folder and date). Step 12 (public website) has no control
on the photos page: the viewer offers Mark as posted (social), Remove, Current profile photo and Move to
folder. Filed with C and D as one generator item.

## `medical_records`: the headline card (blocker gone; step 2 fails on finding A)

Acceptance test (Lutan, 2026-10-22): full resident page, medical sections editable, everything else visible but not editable.

| step | result | note |
|---|---|---|
| 0 sign in | pass | header reads `Dev sign-in: medical_records` |
| 1 `/residents` loads | pass | 91 residents; list offers "Log immunizations" and the spreadsheet download |
| **opens `/residents/<id>`** | **pass: blocker gone** | stays on `/residents/<id>`, full hub with Overview and Medical tabs |
| read-only half | pass (server), with finding B | `/edit`: "Only staff and admins can edit resident details", no form. `/move`, `/hospital`, `/rehome`: refusal text, no form. `/housing`: history only. |
| 2 vet visits and how they went | **FAIL** | `/clinic-visits/new` is `/no-access` (booking is the other card, expected). On an existing visit the Edit form opens but cannot save: clinic list empty (A). |
| 3 procedures | pass | Nail clipping saved; shows on the resident's Procedures page with its note. Attach-files control present, no file uploaded. |
| 4 blood tests | pass | CBC saved; shows on the resident's Blood Tests page with its note. |
| 5 prescriptions | pass | AMC 500, 1 tablet twice daily; shows under "Current (1)". (Also appears on the Medication list.) |
| 6 immunizations | pass, with A | Deworming recorded; the form's own result table reads "23 Oct 2026, next due 23 Nov 2026". Zone/enclosure pickers empty. |
| 7 weight | pass | 4.3 kg saved; weight history shows "Latest 4.3 kg" and the trend line. |
| 8 diet | pass | Renal diet, 3 meals a day; shows under "Current (2)" on the resident's Diet page. |
| 9 remove and restore | pass | Weight entry removed with a reason: gone from history, "1 removed hidden"; restored from "Show removed": back as Latest. |
| 10 refused `/operations/medication-list` | **not refused** | see C. |

**Earlier blockage: GONE.** Steps 2 to 9, which were all unreachable on 2026-10-22, now run. Seven of eight
`TODO:` steps are answered by doing the job; the eighth (visits) is blocked by A, not by the redirect.

**Known and expected, not filed:** the photos section is read through `sees_all_residents()`, and a card login
sees it empty (`0152`/`0189`/`0223`); adoption updates likewise (`0144`). The page opened without them.

## `book_clinic_visits`: FAIL (finding A)

| step | result | note |
|---|---|---|
| 0 sign in | pass | `Dev sign-in: book_clinic_visits` |
| 1 open `/appointments` / `/upcoming-visits` | pass with D | `/appointments` is `/no-access`; `/upcoming-visits` loads ("Vet visits", every visit at every clinic, "Book a vet appointment") |
| 2 book a vet visit | **FAIL** | the form opens, resident preselected, but "Clinic" has no options and is required (A). Tried both the plain link and `?from=/upcoming-visits`. No visit was created. |
| 3 vet visits read only | **FAIL** | visits show on the resident's visits page, but "Open" and "Edit" on each visit and five add buttons are offered; opening Open, Edit, or the visit page is `/no-access` (B). Nothing could be written. |
| 4 refused `/operations/medication-list` | not walked | this login was not sent there; `medical_records` shows it can open for a login holding prescriptions (C). Left for the next run of this card. |

**Earlier blockage: GONE** for this card as well: the visits list and the resident's visits page load. The card
fails on its own job, for a different reason.

## `residents`: FAIL (finding E; the old blocker is gone)

Disposable record: **walk-residents** (R-5431), registered in step 3. It is left in dev, as the walkthrough
asks. It stayed alive (no death could be recorded) and now carries one photo in the Foster folder.

| step | result | note |
|---|---|---|
| 0 sign in | pass | `Dev sign-in: residents` |
| 1 `/residents` loads | pass | the list offers "New resident (intake)" and no medical buttons (#872 holds for this login) |
| 2 details, housing, history | **answered, pass** | `/edit` saved a Thai name and a bio; the hub shows "walk-residents (วอล์ค)" and the bio at once. Housing history is on `/housing`. |
| 3 register a resident | **pass** | six steps, Review, "Register resident" opened the new hub (R-5431, Unassigned, chip shown). **The 2026-10-22 failure is fixed by `0248`.** Zone picker lists zones. |
| 4 microchip | **answered, pass** | entered at intake (step 3 of the wizard); "Correct" on the hub changed it to …002, shown at once |
| 5 adopter news | **answered, pass** | needs an adopted resident (mine could not become one, see 8). On Storytest Adopted, "Add update" saved a LINE note, listed first on `/adoption-updates`. |
| 6 move enclosure | **FAIL** | E: picker works, Save says *That enclosure no longer exists* |
| 7 hospital | **FAIL, not answered** | E: *The Hospital status enclosure is missing from this database* |
| 8 foster / adopt | **FAIL, not answered** | E: *The Fostered status enclosure is missing from this database* (carer name filled; nothing written) |
| 9 record a death | **FAIL, not answered** | E: *The Deceased status enclosure is missing from this database* (after the confirm step) |
| 10 add a photo | pass | Medical folder, upload "Done", the page counts it ("Not posted yet (1)") and shows the tile with a Profile tag. **The note that this card cannot see it again is wrong** (F). |
| 11 refile / remove / profile | **answered, pass** | tap the photo: Move to folder (Medical to Foster read "Foster · 23 Oct 2026"), Remove photo and Current profile photo sit beside it. Remove was not pressed. |
| 12 publish on the website | **not answerable** | no such control for this card (F). The page says Foster-folder photos "can appear on the public website". |
| 13 refused `/operations/medication-list` | pass | `/no-access` |

**Earlier blockage: GONE.** The earlier record lost steps 2 and 4 to 12 to the redirect; every one of them now
runs. Steps 7, 8 and 9 now fail for a reason unconnected to the redirect, and they were never reachable before.

**Not established:** the hub reads "No current diet recorded" for walk-residents, although the wizard's Health
step has a diet picker. Whether the choice was saved, or this login cannot read diets, was not checked (the
Medical records login was not pointed at this record).

## `TODO:` steps answered

Answered by doing the job, into `scripts/gen-card-walkthrough.mjs` and regenerated (`docs/card-walkthrough.md`):
`resident.record`, `resident.microchip`, `resident.adoption_news`, `photos.resident_manage`, and the six medical
ones (`medical.procedures`, `blood_tests`, `prescriptions`, `immunizations`, `diet`, `archive`). **Left
unanswered, none guessed:** `medical.visits` (A), `placement.hospital`, `placement.rehome`, `placement.death` (E),
`photos.resident_publish` (F).

## Cookie sharing

One browser, one signed-in role at a time, as the brief warned. No page showed a card the current login did not
hold. The sign-in script was re-run per card; `--remove` was **not** run.

## Filed on the backlog (branch `backlog`)

Four items: lifecycle writes for the `residents` card (E); the clinic list for the two visit cards (A); dead-end
links on the resident page and visit list (B); four wrong steps in the walkthrough generator (C, D, F).

Release-notes line: n/a: a test run, nothing a shelter user would notice changed.
