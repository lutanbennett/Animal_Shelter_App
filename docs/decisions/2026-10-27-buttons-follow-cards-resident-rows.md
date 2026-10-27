# Buttons follow cards, second slice: resident medical rows and edit-page links (2026-10-27)

Continues `2026-10-27-buttons-follow-cards.md` (#987). Same rule, same pattern: a control is drawn only when `can(perms, <the activity its own action asks>)` is true, read from the same place; the server and database checks are untouched; no role is named; Admin is unchanged.

## Fixed

| Control | File | Activity (read from) |
|---|---|---|
| Remove file and Attach files on each blood test | `src/components/BloodTestList.tsx`, via `canManage` (default false) from `sections/blood-tests.tsx` | `medical.blood_tests` (`blood-tests/actions.ts`, `api/blood-tests/[id]/attachments`) |
| Remove file and Attach files on each procedure | `src/components/ProcedureList.tsx`, via `canManage` (default false) from `sections/procedures.tsx` | `medical.procedures` (`procedures/actions.ts`, `api/procedures/[id]/attachments`) |
| Edit page "return from hospital" link | `edit/EditResidentForm.tsx`, `canReturnFromHospital` (default false) from `edit/page.tsx` | `placement.hospital` (`hospital/return/page.tsx`) |
| Edit page "return from carer" link | same, `canReturnFromCarer` | `placement.rehome` (`rehome/return/page.tsx`) |

A login holding only `view_medical` (read) saw Attach files and Remove file on every test and procedure and was refused; `medical_records` (edit) keeps them. The edit page opens for `resident.record`, which does not imply either placement activity.

## Already gated, so recorded and left alone

- Immunizations rows: the archive control is behind `canArchive` (`medical.archive`); Log link behind `medical.immunizations`.
- Blood tests / procedures / immunizations *Log* links: already behind their activity.
- Adoption updates: Edit and Delete are behind `resident.adoption_news` (`canWrite`); the form page is blocked without it.
- `move`, `hospital`, `hospital/return`, `rehome`, `rehome/return`, `deceased`, `deceased/undo`: the form is drawn only when `placement.move` / `placement.hospital` / `placement.rehome` / `placement.death` / `placement.death_withdraw` holds, the same activity the page's action asks. `DeceasedBanner` retry and undo are behind `canRetryArchive` / `canUndo`.
- Microchip edit (hub, section page, clinic visit page): `resident.microchip`; the post-procedure prompt is gated the same.
- The edit form's "upload photos" link goes to the photos section, which gates its own uploader; it is navigation, not an action.

## Driven on dev (2026-10-27, port 3007)

`view_medical` only: no Log blood test, no Attach files. `medical_records`: both present. Not driven: the two edit-page return links (needs a hospitalised or fostered resident and a login holding `resident.record` edit); covered by the source guard only. Procedures share the blood-test code path and were not driven separately.

## Found and NOT fixed

None in this slice's scope. The guard `src/components/resident-row-buttons-follow-cards.test.mjs` is narrow like #987's: it checks the gates are present and cannot detect a new ungated control.

**Still unswept (the third slice):** everything outside `/residents` (stocktake, purchasing, deliveries, maintenance, contacts, donations, bills, memes), the website surfaces, and `/admin/security` / `/admin/who-does-what`. Not examined here either: the clinic-visit, prescription, weight and diet *row* controls on their own pages (`/clinic-visits/[id]`, `/prescriptions`, `/weight`, `/diet`), which are outside `src/app/residents/` and so were not in this brief.

## Card-review lists

Closed by this slice: the *remove buttons that refuse* entries for blood-test and procedure file controls and the edit page's two return links. The planner should mark those; the standing-rule item stays open.
