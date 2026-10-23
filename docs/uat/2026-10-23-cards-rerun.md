# Card walkthrough: the three blocked cards, re-run, 2026-10-23

Stream `cards-rerun-blocked`. Dev only, port 3011, 375 px wide, one throwaway login per card
(`scripts/dev-signin.mjs --cards <key>`, aal1). Cards: `medical_records`, `book_clinic_visits`, `residents`.
Disposable record: **Capwarn Test 0924** (R-0079), an existing dev test resident. These cards cannot register a
resident, so no `walk-` record could be made for the first two; every row written carries a `walk-<card>` note.

**Summary:** SUMMARY-PLACEHOLDER

**Headline: the earlier blockage is gone.** `/residents/<id>` no longer redirects a card login to the name card.
The `medical_records` login opens the full resident page, and its medical sections open and save. What the run
found instead is **a different, shared fault**: the booking and visit forms offer no clinics to a card login, so
the two cards whose job involves a clinic visit cannot do it (finding A).

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
