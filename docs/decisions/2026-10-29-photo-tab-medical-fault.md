# Medical photos missing from the Photos tab for `view_medical` (2026-10-29)

## Cause
`src/app/residents/[id]/[section]/sections/photos.tsx` asked `can(perms, "photos.resident_medical")` with no level. `can()` defaults the level to `"edit"`, but `view_medical` holds that activity at level 1 (read), as the `0276` select policy expects. So the database returned the Medical row and the page then filtered it out, leaving "No photos uploaded yet". The first point the photo disappears is that filter. The grant, the policy and the gallery were fine. No migration needed.

## Fix
The tab asks `"photos.resident_medical", "read"`, the level the policy asks. Driven on a `--cards view_medical` login (aal1, reached by clicking through): the resident `d238fc7f…` Photos tab now draws its photos including the Medical folder. Not driven on a login with neither card; that case rests on `can()` returning false for a missing cell.

## (3) The wording on `/medical/photos`
It was keyed on `resident.record`, but `0279` gave `add_medical_photos` the Medical read. It now asks `photos.resident_medical` at read, so the line "you can look at the photos again" shows to whoever can. Proposed `noView` (EN and TH both changed): "This card adds photos but does not show them again. Anyone whose card shows Medical photos can see them on the resident's Photos page." The old text named "the resident's record", which is no longer the test.

## Found, not fixed
Not checked this time: the gallery's action controls were not re-listed. `PhotoGallery` already takes `canManage`, `canMarkPosted`, `canMakeMeme`, `canFileToMedical` props, each from `can(...)` in `photos.tsx` (`photos.resident_manage`, `social.library`, `photos.medical_add`); they were not compared against each action's own server check in this stream.
