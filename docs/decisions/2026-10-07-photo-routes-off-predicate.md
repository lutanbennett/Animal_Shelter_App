# The blood-test and procedure file routes ask their own activity (2026-10-07)

`claude/photo-routes-off-predicate`, no migration. The last literal gap in foundation 3's app half
that `docs/decisions/2026-10-04-permissions-sweep-rest.md` left on purpose "until the photo split".
The split landed as `0152` (#402), so the reason expired.

## What was wrong: the app was asking a different question from the database

`assertPhotoWriteAccess()` asked `photos.resident_add`, the *resident photo* cell, for every caller.
`0152` settled what a blood-test and a procedure attachment ask: `medical.blood_tests` and
`medical.procedures` (edit), plus `sees_all_clinical()`. So for these two routes the app and the
database disagreed, and the disagreement ran **both ways**:

| Holds | Old route | Database (`record_attachment()`) | Result |
|---|---|---|---|
| `photos.resident_add`, no clinical cell | allowed | refuses | **file uploaded to Drive, row refused: an orphaned file** |
| clinical cell, no `photos.resident_add` | refused | allows | refused for no reason the database shares |

Dev today: `head_of_medical` and `second_in_command` hold `photos.resident_add` and neither
`medical.blood_tests` nor `medical.procedures`, so both were in the first row. `management` and
`staff` hold all three; nobody on dev is in the second row. The brief called the app "stricter than
the database"; for the roles that exist it was the reverse, and it only gets stricter in the second
row if the Director's draft moves a clinical cell onto a role without a photo cell. Both are the same
defect, two questions that differ.

The old helper's own comment said the point of the guard is to refuse before Drive is touched, since
Drive is not RLS-protected. That is why the wrong question mattered in the first row.

## The helper: option 3, deleted

`assertPhotoWriteAccess()` had **no other caller**. The resident photo route already asked `can()`
directly (and so did the projects, maintenance and medical-photos routes), so the name was left
over from before the sweeps and the helper only served these two. I deleted it rather than
parameterising it: a one-line `can()` is shorter than a helper that takes the activity, and the
shared name was what made two attachments look like resident photos. Each route now loads
permissions and asks its own activity, with the same `t.photos.errors.notAuthorized` message, so no
manual or dictionary text changed.

## What is not asked in the app: the clinic scope

`0152` also asks `sees_all_clinical()`. The two routes do not repeat it. The only role with
`scope_clinical = own_clinic` is the vet, who has no cell rows yet and so fails `can()` here as it did
before (its own `vet_*` policies are left for the Vet conversion). A configured role with the cell
and `own_clinic` would pass the route and be refused by the database, which is the safe direction
(the route is the early refusal, the database is the authority). If Vet converts and holds these
cells, the route will need `perms.scopes.clinical` or the vet's own-clinic rule in front of Drive.

## Left alone

Nothing else was widened. The photo split, `photos.resident_manage` and A5 are untouched.
No third route was found in the same position: `grep assertPhotoWriteAccess` over `src` found only
these two.
