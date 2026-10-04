# 2026-10-04 — The Head of Medical's three remaining jobs, database half (`0140`)

Three backlog items folded into one schema PR: Record Weight, Add Medical Photos, Feed Special
Diets. The screens are the next batch. `scripts/check-medical-jobs.mjs` is the proof (157 checks, under
a real Head of Medical JWT, in a rolled-back transaction); `check-medical-role.mjs`,
`check-permission-parity.mjs`, `check-volunteer-narrowing.mjs` and `check-perm-convert-medical.mjs` are
green before and after.

## 1. Record Weight: the cell is the whole grant

The item asked whether a weight page needs "a policy on `weight`, a scope change, or a narrow view".
**None of the three.** `0135` made `weight` answer `has_permission('medical.weight')` and
`sees_all_clinical()`, and the Head of Medical's scope is `any`. So `0140` adds one `role_permissions`
row (`medical.weight`, Edit) and the table is hers. The page can be reached because it never opens a
resident's record: the picker is `resident_who_and_where` (`0134`, which the borrowed volunteer rights
already admit her to) and the write goes straight to `weight`.

Found by signing in as her, as `0136`'s decision said to: the deceased lock (`resident_is_deceased()`)
is a definer lookup, so it still holds for a role that cannot read the resident's state. The one-per-day
and one-per-visit indexes and the positive-kg check are table constraints and hold too.

What the cell cannot narrow: Edit includes correcting and archiving *any* reading, not only adding one,
which is what staff can do. A "record only" weight would need a trigger; not built, because the form's
same-day correction is part of the job.

## 2. Add Medical Photos: the existing activity, a new gate branch, a database-enforced scope

**Which activity.** No new one. `photos.resident_add` (Yes) already exists, and the upload route already
files a role without `photos.resident_publish` in the Medical folder only (`photoCategoriesFor`). The
backlog's "an Edit activity for medical photos" is that cell. The volunteer lost it in `0134`, so
nothing else changes for it.

**`record_attachment()`.** It named four roles. It still does (a legacy login is unchanged, byte for
byte) and gains a second way in: a **resident's** photo from a login that holds `photos.resident_add` and
all-resident clinical scope. A blood-test or procedure file still needs one of the four roles: a
configured role gets only what it was given.

**What the database now guarantees, which §12 said it did not.** `scope_photos = 'medical_only'` was
"honoured by app code, not the database". For a login that arrives by the new branch and whose role says
`medical_only`, the function refuses any folder but Medical (case and spaces ignored, as
`public_resident_photos` reads it) and any adopter's photo. The four legacy roles are not asked: their
scope is `all`. **What it still does not guarantee:** the file itself is in Google Drive, which is not
RLS; the route uploads before it records, so a refusal here leaves an orphan file in Drive. The route's
own folder check (`photoCategoriesFor`) stays and refuses first.

**What the route reads of a resident.** Not in the brief, found by reading the route: it selects
`name, resident_code, drive_folder_id` from `residents`, `is_deceased` from `resident_current_state`, and
writes `drive_folder_id` when the resident has none. A volunteer-based role can read none of it (a
screen built on the old route would find "Resident not found"). So:

- `medical_photo_residents`: id, names, code, folder, deceased. Fixed columns, owner rights, gated on the
  cell and `sees_all_clinical()`, same shape as `0136`'s views.
- `set_resident_drive_folder(resident, folder)`: definer, gated on the same cell, writes only when the
  folder is null, so it can never repoint a resident.

**Left as it was:** the first photo filed for a resident with no profile photo becomes the profile photo,
Medical or not. That is today's behaviour for staff and vets, and the public views already exclude the
Medical folder (`0103`). A Head of Medical photo can therefore be the in-app profile picture. Cheap to
change if wanted; not changed here.

**She cannot see what she filed.** `attachments` stays unreadable to her (`hom-zero` in the check), so
the screen cannot show a gallery. It can show the file it just uploaded from the response.

## 3. Feed Special Diets: a view, same shape as the medication list

`special_diet_list`, because `diet_types` still names roles and carries cost, stock and reorder columns,
and a policy hides rows, not columns. Non-standard means `diet_types.is_standard = false` (Lutan,
2026-10-04; the flag exists since `0087`), so **no new column**. Columns: resident (id, names, photo,
status), where (enclosure and zone, both languages), the diet (type id, name, unit), `meals_per_day`,
`daily_quantity`, the diet's `notes` and `round_keys`.

- **Amount** is the resident's own `daily_quantity`, else the type's default for the resident's size
  (the rule `0051` states), computed in the view so the screen never reads `diet_types`.
- **Current** means started and not ended, in shelter time (`shelter_today()`).
- **`round_keys`** is where `0137` put the meals, in round order, so the screen can group by Morning and
  Evening like the medication list.
- **Status is not filtered.** The screen drops Deceased and Adopted (as the medication list does), so one
  list rule lives in one place and a row can still be audited from SQL.
- Not in it: the type's cost, stock, safety stock, reorder lead, label photo or notes.

## 4. The cells, and why they are granted before the screens

`0140` writes three `role_permissions` rows: `medical.weight` Edit, `photos.resident_add` Yes,
`medical.diet` Read. `0136` held that "a cell with no screen is a promise the role cannot use", and the
brief for this batch asked for everything the database must allow, tested under her real JWT, which needs
the cells. They are granted now **and `jobs.ts` is not changed**: the role's home tile is still one, and
no screen can reach what the cells give. `check-medical-role.mjs` and `check-medical-jobs.mjs` both name
the three as `AHEAD`, so `role_permissions` still cannot drift unseen. **When batch 47 adds a job whose
bundle carries one, delete it from `AHEAD`** (both scripts): `bundleOfRole()` then covers it, and the
check fails if both say it.

## What batch 47 starts from

| Screen | Reads | Writes | Gate to use |
|---|---|---|---|
| Record Weight | picker: `resident_who_and_where`; history: `weight` (flat table); the day's existing reading, for the same-day correction | `weight` insert or update, through `recordWeight()` / `updateWeight()` in `src/lib/weight/record.ts` | `can(perms, "medical.weight")`; the route is not `/residents/...`; the vet-visit picker reads `vet_appointments`, which she cannot, so **the form must not offer it to her** |
| Add Medical Photos | the resident through `medical_photo_residents` (not `residents`, not `resident_current_state`) | Drive upload, then `rpc("record_attachment", { p_owner_type: 'resident', p_sub_folder: 'Medical', … })`; the folder id through `rpc("set_resident_drive_folder")`, not `.update()` on `residents` | `can(perms, "photos.resident_add")`; **the existing `/api/residents/[id]/photos` route reads `residents` and `.update()`s it, so it cannot be reused as is** for this role: either point it at the view and the function when the caller is not staff, or add a sibling route |
| Feed Special Diets | `special_diet_list`, grouped by zone then enclosure, then by round | nothing recorded | `has_permission('medical.diet','read')`, `can(perms, "medical.diet", "read")`; route needs `scope: { clinical: "any" }` like the medication list |

Plus, for all three: put the role's new jobs in `JOBS` and `JOBS_OF_ROLE` in the same commit as the
screen, and delete the matching `AHEAD` rows. The medication list's loader and views are the pattern to
copy (`src/lib/medication-list/load.ts`): read the views, join in code.

## What was not done

- **Production.** Apply `0140` from the main checkout, `--dry-run` first, after the merge. The apply
  prints a consumer warning (the readers are not live): the safe direction, since it adds a view, two
  functions, a function change and three cells.
- **A deceased-resident weight under her JWT was reasoned, not exercised**: the lock is a definer lookup
  read from `0026` (`resident_is_deceased()` is `security definer`), not driven. A pass over a deceased
  resident's weight under her login is a fair line for the screen's own test plan.
