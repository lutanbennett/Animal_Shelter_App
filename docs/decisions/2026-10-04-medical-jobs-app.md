# 2026-10-04 — The Head of Medical's three remaining jobs, screens (batch 47)

Record Weight, Add Medical Photos and Feed Special Diets, on the cells `0140` granted
(`decisions/2026-10-04-medical-jobs-schema.md`). No migration. With these the Head of Medical is
**complete at five jobs**: Administer Medication, its stock-room pick list, Record Weight, Add Medical
Photos, Feed Special Diets. Her home shows **four tiles**, because the pick list is the first job's
default tab (`?view=pick`), not a page of its own.

`scripts/check-medical-jobs-app.mjs` drives all of it as a real Head of Medical login (a throwaway
password sign-in on dev, role `head_of_medical`); `--upload` also files one photo through the new route
into dev's Drive. Both ended `All expectations held`.

## How the three jobs are expressed

Each is an entry in `JOBS` and in `JOBS_OF_ROLE.head_of_medical` (`src/lib/permissions/jobs.ts`), a
route in the registry, and a page that guards with the same activity. Enforcement stayed at the
activity: `requirePermission("medical.weight")`, `("photos.resident_add")`, `("medical.diet", "read")`,
each plus the clinical-scope refusal the medication list already had. No framework was built; this is the
fifth worked example (with Maintenance's), which is when the layer is formalised, not before.

| Job | Opens | Bundle |
|---|---|---|
| `record_weight` | `/medical/weight` | `medical.weight` Edit, `resident.record` Read |
| `add_medical_photos` | `/medical/photos` | `photos.resident_add` (Yes), `resident.record` Read |
| `feed_special_diets` | `/medical/diets` | `medical.diet` Read, `resident.record` Read |

**One change to the type.** `photos.resident_add` is a yes/no activity, and a bundle entry was a level
activity at a level. `BundleEntry` is now either; a yes/no entry has no level and `bundleOfRole()` holds it
at `"edit"` (cell 2, the way `role_permissions` stores a Yes). `tiles.ts` asks `can()` the matching way.
`AHEAD` is empty in both scripts: all three of `0140`'s cells are jobs now.

## The photo route: a sibling, not a reuse

`/api/medical/residents/[id]/photos` is new; `/api/residents/[id]/photos` is untouched. The staff route
selects from `residents`, reads `resident_current_state` and `.update()`s the folder id, none of which her
login can do. Branching it by caller would have put two code paths, two sets of refusals and an
adopter's-photo branch into the route every vet and staff upload goes through. The sibling is narrower on
purpose:

- reads the resident through `medical_photo_residents`, writes the folder through
  `set_resident_drive_folder()`;
- Medical folder only, today's date, no adopter's photo (the database enforces the first and third too,
  `record_attachment()` in `0140`; the route refuses first because Drive is not RLS and a refused record
  leaves an orphan file);
- **a deceased resident is refused** (409, "ask Management"). The staff route keeps photos open after death
  and regenerates the archive, which needs reads she does not have. If she must photograph a death, that is
  a Management step today.
- no archive refresh, no adoption updates.

It shares the validation helpers (`checkFileSignature`, size, MIME), not the route.

**What the handover's table missed.** `medical_photo_residents` carries no profile photo and no enclosure,
so the *page* header reads `resident_who_and_where` (as the weight page does), while only the *route* reads
the photo view. And she cannot read `attachments` (`hom-zero`), so the page cannot show a gallery: the
uploader shows each photo from the device as it goes, with a tick over it, and the page says plainly that
she can add photos but not look at them again.

## Record Weight

- Today's date, no vet visit, no note. A second reading the same day goes through `updateWeight()` (one per
  day, `0106`); the form says so before she saves (`Today already has 5.35 kg. Saving will replace it.`).
- The staff form's vet-visit picker is not offered: it reads `vet_appointments`, which she cannot.
- The staff form `/weight/new` is a page she *can* open (she holds `medical.weight`), and it answers
  "Resident not found." because it reads `residents`. A polite sentence, not a crash, and left alone: the
  fix is to route her to `/medical/weight`, which is a nicety for whoever finds it.
- **The deceased lock holds under her JWT.** Inserting a weight for a deceased resident as her returns
  *"This resident is deceased — their record is read-only."* (`resident_is_deceased()`, a definer lookup from
  `0026`), and she can still read that resident's history. This was the one thing `0140` flagged as reasoned,
  not exercised; it is now exercised.
- Edit still includes correcting any reading, not only adding one (`0140` §1). Not narrowed.

## Feed Special Diets

Reads `special_diet_list`, groups by zone, enclosure, resident, with the meal chosen in `?round=` (food has
two rounds, so Morning and Evening; the clock pre-selects through `suggestRound("food")`, as for medication).
**The amount shown is per meal**: the view's `daily_quantity` divided by `meals_per_day`, with the day's
meals counted beside it, because the person at the bowl needs the meal, not the day. A diet with no meal
ticked is shown in every meal and flagged in red, never dropped (the medication list's rule). Deceased and
Adopted are dropped in the loader. No form, no action, no client component; nothing is recorded as fed.

## A bug found by driving it as her, and fixed

`requirePermission` refused with `refuse(perms.role.key)`. `refuse()` maps a role to `/no-access` only when
the role is in the legacy allow-list (`hasAppAccess`), and `head_of_medical` is not: so **every refused page
sent the Head of Medical to `/`, the public website**, the thing `refuse()`'s own comment says it exists to
prevent. Nine call sites passed a configured role's key; all now call `refuseFor(perms)` (`require-role.ts`),
which asks the role's own `opensApp`. This is not specific to her: any configured role would have hit it, and
the medication list, already shipped, did.

## Checked, and what it did not cover

- Home: four tiles. Each of the three pages opens in English and Thai. The 375 px width and keypad were
  looked at in the browser (`scrollWidth` 375 = `clientWidth` on every page, both languages).
- She is refused, with the app's own `/no-access` page, at the dashboard, the medication catalogue, the
  prescription form and a resident's weight tab; a resident's medications tab is a 404.
- Under her JWT, `residents`, `resident_current_state`, `vet_appointments`, `diet_types` and `attachments`
  return her nothing; `medical_photo_residents` and `special_diet_list` return rows.
- **Not driven:** the camera on a real phone (`capture="environment"`), the sunrise/moon strip in the
  helpers' hands, and a photograph of a dog with no Drive folder yet beyond the one dev resident the script used.
  Those are the manual line in the test plan.
- **`/residents/<id>` opens for her** (the hub, name and where, from `0134`); that is the borrowed
  volunteer right and was not changed here.

## Overlap

Added to `src/lib/permissions/jobs.ts`: `record_weight`, `add_medical_photos`, `feed_special_diets`, and
`BundleEntry`. Added to the route registry: `/medical/weight`, `/medical/photos`, `/medical/diets`
(`maintenance-role` adds its own entries beside these; different roles, different keys). No home tile file
was edited: `homeTilesFor()` draws a role's tiles from its jobs.
