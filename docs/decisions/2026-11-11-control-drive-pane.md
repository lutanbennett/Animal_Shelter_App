# 2026-11-11 — Driving `/memes/make` and listing the click-only controls (`#79sqf`)

Stream `control-drive-pane`, port 3002. Used the hard boundary on purpose: deliverables 2, 3 and 6 done, 4 and 5 not.

## Step zero

`check-control-activity.mjs` (27.8 s): **no new findings, 4 known allow-list rows, 69 UNRESOLVED.** No decision file records the
canvas or the click-only controls as driven, so the gap was still there.

## Fault found and fixed: `/memes/make` refused every photo for a `meme_add` login

Driven as `dev-signin.mjs --cards meme_add` (bundle: `social.library:edit`, `resident.who_and_where:read`). The resident search and
the photo picker worked (0354's `resident_photo_list` view), but choosing a photo showed *"That photo cannot be made into a meme."*

Cause: `resolveSource` (`src/lib/memes/source-server.ts`) read `attachments` directly, which a login without a photo card cannot
select (RLS), so the photo came back as not found. The picker and the check read different doors. 0354 fixed the picker only.
Fix: when `attachments` returns nothing, look the file up in `resident_photo_list` (approved, non-medical, gated on
`resident.who_and_where`) and use its `resident_id`s. A login that can read `attachments` takes the old path and keeps its
medical / not-approved messages. The medical rule is not weakened: the view already excludes medical.
Re-driven after the edit: canvas renders (1080x1080), caption typed, **Save to the library** wrote a meme, and the meme page read
back *Residents in it: Test 1* and tag *#meme maker*. Archive and Delete are absent for this card (they ask
`social.library_manage`, which it does not hold); Download, Record a share and Edit are drawn.

## Deliverable 2 — click-only controls (the check's no-gate rows)

These are the controls the check prints as "no gate; a host page has no static guard". The activity is read from the action; the
card is the card in `cards.ts` whose bundle carries it. **Not driven except where stated.**

| Control (file:line) | Action asks | Card(s) carrying it |
|---|---|---|
| `BillsInbox.tsx:447` record general bill | `bills.general` + 4 others (see row) | `bills` |
| `BillsInbox.tsx:459` file as utility bill | `bills.utilities` | `bills` |
| `BillsInbox.tsx:476` match bill to job | `maintenance.bills`, `stock.delivery`, `medical.visits` | `bills`; `record_delivery`; `medical_records` |
| `BillsInbox.tsx:506` / `:513` save / delete card | the five bill activities | `bills` (+ the others above) |
| `MyTaskList.tsx:221` | `recurring.do_any`, `recurring.do_own` | `recurring_jobs`; `my_tasks` (own only) |
| `AdoptionUpdateForm.tsx:236` | `resident.adoption_news` | `adoption_news`, `residents` |
| `RecordDeathForm.tsx:51` | `placement.death` | `medical_records` |
| `UndoDeathForm.tsx:52` | `placement.death_withdraw` | **no card; Admin only by design** |
| `SendToHospitalForm.tsx:45`, `ReturnFromHospitalForm.tsx:78` | `placement.hospital` | `medical_records` |
| `MoveResidentForm.tsx:65` | `placement.move` | `residents` |
| `RehomeForm.tsx:92`, `ReturnToShelterForm.tsx:98` | `placement.rehome` | `residents` |
| `ArchiveRecordControl.tsx:64` / `:72` restore / archive | `medical.archive` | `medical_records` |
| `BloodTestList.tsx:121` | `medical.blood_tests` edit | `medical_records` |
| `MicrochipForm.tsx:63` | `resident.microchip` | `residents`, `record_microchip` |
| `PhotoGallery.tsx:781` / `:812` delete / set profile | `photos.resident_manage` | `residents`; the photo-approval cards |
| `TranslationPanel.tsx:179` and `ConfirmDialog` clear | `translations.manage` | `translations` |
| `ConfirmDialog` assistant record death | `assistant.record`, `placement.death` | `assistant`; `medical_records` |

**Count:** 25 no-gate rows in 18 files (the rest of the 69 UNRESOLVED are 44 callback props whose action the caller defines). These
rows are not faults: each host page sits behind a whole-page guard at the action's activity or the component is passed a `can…`
prop, which is why the check cannot decide them statically. Each is a candidate to drive, not a known defect.

## F2 — why a static check cannot catch a prose notice

A control carries an activity: an `onClick`/`onSubmit` resolves to a server action, whose `can(perms, …)` is a string the AST can
read. A notice is a sentence in a dictionary (`src/lib/i18n/dictionaries/en.ts`) rendered by a component. Nothing in the sentence
names an ability: "Log repairs and work needed on this enclosure…" is plain text, and the activity it promises (`maintenance.jobs`)
exists only in the reader's head. To check it, a tool would have to (1) decide which dictionary strings promise an ability, which
is natural-language judgement, (2) map each to an activity, with no field to read it from, and (3) trace the component that draws
it. Step 1 has no mechanical answer, so the check cannot be completed. It stays a render-time finding, found by driving a page
as a one-card login and reading what it says. This is the written form of what `2026-11-09-destination-activity` recorded as "not
catchable". Not re-driven this stream beyond `/memes/make`, where no promise-notice was met.

## What is still undriven (for the next stream)

- Every control in the table above: **none was pressed this stream.**
- `/enclosures/[id]` with residents: **already driven by sweep 15** (`2026-11-11-control-listing-sweep-15.md`); not repeated.
- Shelter Friend card, per-row diet controls and `/operations/*` rows: no fixtures exist.
- A `meme_add` login driving *Record a share* and *Edit* on the new meme (drawn, not pressed).

## `#79sqf`

**Not ticked.** The title still states what is open only if it is rewritten: the `/memes/make` canvas and tag save are now
driven (and found a real fault); what remains is pressing the click-only controls listed above, the three fixture gaps, and the 9
false-positive rows (teach the check). A fixture meme `Drive pane test` (Test 1) was left in dev.
