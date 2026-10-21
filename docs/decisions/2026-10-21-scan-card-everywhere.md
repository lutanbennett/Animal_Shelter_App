# 2026-10-21 — Scan card on the other per-resident forms

Backlog item "Pick the resident by scanning their name card", the *Still open* line. Extends
`2026-10-16-name-card-scanning.md`; no new mechanism.

## The list: every resident picker, yes or no

| Form | Picker | Scan card? | Why |
|---|---|---|---|
| Add Medical Photos, Record Weight | medical `ResidentPicker` | Yes (done 2026-10-16) | beside the dog |
| Diets | none | n/a | no picker, needs nothing |
| Add photos (`/photos/add`) | medical picker, `onPick` | Yes, Android only (done) | held photos would be lost by an iPhone page load |
| Approve photos: change resident | medical picker, `onPick` | Android button comes with the picker; iPhone no | desk job on the approval queue, a tap there would lose the queue |
| **Record immunizations** (`/immunizations/new`) | modal multi-select | **Yes, built now** | vaccinating on the spot, card to hand |
| Clinic visit booking | modal multi-select | No | booked at a desk, ahead of the visit |
| Procedures, blood tests | none (resident fixed by the resident page) | n/a | no picker |
| Donations, appeals, memes, featured resident | modal | No | office / website work, nobody is beside the dog |

## What was built
- `ScanCardButton` (`src/app/medical/ScanCardButton.tsx`) is now generic over anything with `id` and optional `code`
  (`ScannableResident`), so both pickers share one reader, one `residentForCard` and one set of strings.
- The modal picker (`src/components/ResidentPicker.tsx`) takes an optional `scanStrings`. With it, the list shows
  Scan card (Android Web NFC only) and a found resident is ticked in the list, to be confirmed with Done. The search box
  also takes an R-code, card link or id, exact match only. Nothing is saved by a scan.
- **No iPhone waiting marker** here: the marker leaves the page, and the form's entries would be lost
  (same reason as `/photos/add`). iPhone users search by the printed R-code.
- Immunizations loads `resident_code` from `resident_list_view` (existing column, no migration).
