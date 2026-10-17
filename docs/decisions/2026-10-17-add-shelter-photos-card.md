# Add Shelter Photos: the filing half of volunteer photos

2026-10-17. App half, filing only, of the two backlog items *"A separate 'Add resident photos' card ... Shelter folder only"* and *"Photos filed by a volunteer stay unpublished until Management approves them"*. `0217` (`2026-10-17-photo-approval-schema.md`) did all the schema and the public-view filtering. **Neither backlog item is ticked**: nobody can approve a photo until the *Photos to approve* queue (next stream) is merged.

## The card

`add_photos`, card twenty-two, title **Add Shelter Photos** (plural, settled). It opens `/photos/add`. **Its bundle is `photos.shelter_add` and `resident.record` at Read (the who-and-where read the picker needs), and nothing else.** In particular not `photos.resident_publish`, which is what puts a photo on the website, and not `photos.resident_add`. `cards.test.mjs` and `add-photos-card.test.mjs` pin the bundle, so adding a power to it fails a test.

Started from the closed #697 branch (`claude/photo-card-reachable`): the card entry, the plural strings and the card-count checks came from there. Its change to `src/app/photos/add/page.tsx` (narrowing the folder list for everyone) was not brought across.

## `photoCategoriesFor()` and why #697 was closed

The Shelter-only rule belongs to the **activity**, not the page:

| login holds | folders |
|---|---|
| `photos.resident_publish` (Management, Admin) | Shelter, Medical, Foster, Adoption (unchanged) |
| `photos.resident_add` only (Head of Medical) | Medical (unchanged) |
| `photos.shelter_add` only (a volunteer with the card) | **Shelter** |
| `photos.shelter_add` and `photos.resident_add`, no publish | Shelter, Medical |
| none of those | Medical (the old fall-through, so no page is silently opened) |

**The three-row regression check #697 failed**, run as `src/lib/home/add-photos-card.test.mjs` against the real function: Management/Admin still get all four, Head of Medical still gets Medical (not empty), and a login holding the card gets Shelter (not empty). A login that holds the card *and* may publish keeps all four: the card never narrows anything.

## `/photos/add`

The page opens for either `photos.resident_add` or `photos.shelter_add` (`requireAnyPermission`, and `alsoActivity` in the route registry so `canOpen`, the home tile and `check-permission-catalogue.mjs` agree). A Shelter-only login sees no folder choice, only a line saying where the photos go and that they wait for Management. Everyone else's page is unchanged.

## The upload route

A volunteer reads `resident_who_and_where`, not `residents` (0134), so the staff route answered *Resident not found*, and `medical_photo_residents` / `set_resident_drive_folder` require `photos.resident_add`, so the Head of Medical's route was no use either. With no migration, the choice was a third route, `/api/photos/shelter/[id]`, narrower than the other two: Shelter folder only, today's date, no adopter's photo, a resident not Deceased or Adopted, and a resident the login can see through who-and-where.

**It uses the service-role client for one thing**: reading the resident's `drive_folder_id` and, only when the resident has none yet, writing it. Without that a volunteer's first photo of an animal with no Drive folder would create a second folder. Everything is authorised first (`photos.shelter_add`, Shelter folder) and the photo itself is recorded **as the login** through `record_attachment()`, so `0217`'s trigger marks it waiting and the `0152` folder guards still refuse any other folder. The file is allow-listed in `eslint.config.mjs` as the rule requires. The alternative, a small migration adding a who-and-where-friendly folder read and write for this activity, is cleaner and is noted for the queue stream if Lutan prefers the service role gone.

## Waiting for approval

`approved_at` is now in the photo select. A waiting photo shows an amber **Waiting for approval** badge on its tile and a sentence in the viewer. `setResidentProfilePhoto` refuses a waiting photo with a sentence (the database does not, by design) and the viewer says why instead of offering the button. The volunteer's page says that the photos wait, and each saved tag reads "Saved, waiting for approval". Volunteers still cannot delete, move or set a profile photo: those buttons live on the resident hub, which the card does not give them.

## Left for the queue stream

The *Photos to approve* list and its tile with a count, Approve (update `approved_at`), Remove (deletes the Drive file), bulk approve, and the real release-notes line. Nothing here half-builds an approve button.

## Not done on purpose

- **No role was given the card.** `role_cards` is data. Lutan, 2026-10-17: "Once I have the tile with the permissions I'll add it to the volunteer profile." The backlog item asks for Volunteer, Management and the 2IC.
- **No release note** (`n/a` in the test plan): a volunteer can file, but nobody can approve, and the card is on no role, so nothing a shelter user can see works end to end. A note now would be the false promise `2026-10-11-release-note-truth-rule.md` forbids.
