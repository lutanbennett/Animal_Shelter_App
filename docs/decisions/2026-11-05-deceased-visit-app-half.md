# 2026-11-05 — Deceased visit app half: every `isDeceased` block accounted for (backlog #314hq)

Stream `deceased-visit-app-half`. No migration, no card, nothing keyed by a role, no app code changed.

## Step zero
`0310` opens exactly one thing (`clinic_visits` UPDATE changing only `cost` and `notes`) and the visit page and edit page
already use it (`clinic-visits/[id]/page.tsx:133,247`, `edit/actions.ts:83`). The gap that remained was the two verification
rows, an itemised account of every block, and the manual wording. Carried on; nothing to stop for.

## Deliverable 1: a login without the visit card (driven, dev, 2026-11-05)
Login holding exactly `view_medical` + `bills` (`dev-signin.mjs --cards view_medical,bills`; `medical.visits` is read only,
the edit level lives in `medical_records`). Reached by clicking through: Residents → show deceased → Canyon (R-0015) →
Clinic visits → the visit. The visit page showed the closed-record note, the fields and "No bill photo yet", and drew **no**
bill upload (no file input), **no** *Correct cost and notes* link and no button of any kind. The button rule holds.
Seen in passing: the closed-record note says "You can still add the bill, the cost and notes" even to a login that cannot.
It is a statement about the record, not a control, so left alone.

## Deliverable 2: activity read from the action, not the label
- Correct cost and notes link and bill control: `canCorrect = canEdit = can(perms, "medical.visits", "edit")`
  (`src/app/clinic-visits/[id]/page.tsx:61,132`).
- Edit action (`src/app/clinic-visits/[id]/edit/actions.ts:80-100`): no `can()` call; the `clinic_visits` update is guarded by
  the database policy, and a refused update returns zero rows, which the action reports as not authorised (line ~104).
  The page gate is `medical.visits` edit (`edit/page.tsx:22,72`). It sends only `{notes, cost}` for the dead (line 83).
  Bill photo: `record_attachment()` asks `medical.visits` (0190, per the 2026-11-04 paper; not re-read here).
- `/bills` match: `mayMatch` → `can(perms, "medical.visits", "edit")` for a clinic visit (`src/app/bills/actions.ts:50`).

## Deliverable 3: all `isDeceased` sites (`grep -rn isDeceased src`, 62 hits in 19 files)
Opened = `0310` permits it. Everything else stays closed or is display only.

| File:line | What it does | Verdict |
|---|---|---|
| `clinic-visits/[id]/page.tsx:99,133,199,247` | `writable` closes edit/report/blood/rx/weight/procedure links; note; correct link | **Opened** for cost, notes, bill photo (`canCorrect`); rest closed: 0310 permits no other column |
| `clinic-visits/[id]/edit` (`actions.ts:83`) | cost and notes only | **Opened**, same reason |
| `api/residents/[id]/photos/route.ts:168,225` | refreshes the archive after a photo | Display/archive logic, not a block |
| `diets/new/page.tsx:49`, `diets/[id]/edit/page.tsx:38`, `diets/resident.ts:29` | refuses a diet for a dead animal | Closed: `resident_diets` is locked, 0310 names nothing there |
| `residents/[id]/edit/EditResidentForm.tsx:38,228,397`, `edit/page.tsx:94,115` | hides housing, bio/photos only | Closed: only bio columns open since 0052 |
| `residents/[id]/page.tsx:307` | passes the flag to the hub | Plumbing |
| `ResidentHub.tsx:178,219,223` | prop and archive-state comment | Plumbing |
| `ResidentHub.tsx:309,350,360,365` | adopt, placement, medical and booking actions | Closed: placement_history, vet bookings locked |
| `ResidentHub.tsx:423,613,618,626,636` | current diets, date of death, banner | Display |
| `ResidentHub.tsx:546,568,578,794` | record death, size, microchip, other actions | Closed: nothing in 0310 for these |
| `[section]/page.tsx:91,158` | reads and passes the flag | Plumbing |
| `[section]/page.tsx:106,195` | archive and microchip | Closed: not in 0310 |
| `sections/types.ts:24` | type | Plumbing |
| `sections/blood-tests.tsx:9,54,68`, `procedures.tsx:9,58,73` | add entry; read-only list | Closed: Lutan's open question, below |
| `sections/clinic-visits.tsx:18,104,146,224` | add visit, booking | Closed: INSERT refused by 0310 |
| `sections/diet.tsx:16,42,89,106,118` | add or edit diet, size | Closed (diet locked); line 42 display |
| `sections/housing.tsx:13,49` | status label | Display |
| `sections/immunizations.tsx:11,98`, `prescriptions.tsx:16,125,156`, `weight.tsx:14,82,136,138` | add, end, edit entries | Closed: locked tables, not in 0310 |

## Deliverable 4: Thai
No string changed. Existing pair checked in both dictionaries: `deceasedNote` and `correctCostNotes`
(`en.ts:4755-4756`, `th.ts:4586-4587`). Rendered in Thai on the visit page and reads correctly in layout. **Thai is
unreviewed by a Thai speaker; not ticked as reviewed.**

## Deliverable 5: the bill match
**Not driven.** Making a bill that matches needs an inbox card with a real Drive file, and the one visit offered
(Canyon's) already carries a cost so it is no longer offered. Read instead: `matchBill` writes only
`clinic_visits.cost` (`bills/actions.ts:132`), the shape 0310 opens, then moves the photos, which are not locked.
Left as a manual row.

## Deliverable 6: manual
`src/lib/manual/en.ts:708` already says only bio and photos plus cost, notes and bill photos on a visit via *Correct cost
and notes* can change after death. It matches 0310; no edit.

## Deliverable 7: release note
`n/a`: `0310` is not confirmed applied to production (Lutan's command), so a note would promise users what does not work yet.

## Lutan's question, deliberately not built
Whether a blood result arriving after death, or notes on placements, weight, prescriptions, immunizations and procedures,
should open. Still open. Not asked here, not built: it is a second migration and stream.
