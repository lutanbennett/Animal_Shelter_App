# Merch product photo: choose a file instead of pasting a Drive id (#qtnob)

Lutan, 2026-11-14: *"Can we have an add photo rather than a photoID on the add product form for the merchandise store."*

**Which activity.** The upload route (`src/app/api/merch/photos/route.ts`) asks `merch.manage` at edit, the same activity `saveProduct` asks, so running the shop carries its own photo upload. No second activity, no migration, no role named. The form is only drawn for a login holding `merch.manage` at edit, so the chooser needs no further gate. The existing routes ask their own owners' activities (`events.run` etc.) and record an `attachments` row; a shop product has no attachment row, so none of that applies.

**Why a route, not the action.** Next refuses a Server Action body over 1 MB before the action runs (`2026-09-25-upload-failures-the-1-mb-server-action-limit-and-one-upload.md`). A 4.3 MB PNG was uploaded through the route on dev and returned 200.

**What it does.** File checked by type and signature, 15 MB limit, stored in `Merch/` under the Drive root, id returned and put in the `photo` field. The column and the public shop are unchanged. The id box stays for anyone who has an id. The current photo is shown beside it.

**Found, not fixed.** The photo proxy shows a merch photo only through `is_public_drive_file` (shown products); `can_see_drive_file` does not know `merch_products`, so a product that is not yet shown previews as broken for staff (the preview hides itself). Fixing it is a migration.

**Left alone.** Nav entries (`#fc7te`), currency work, data model. Uploading replaces the field value only on Save; an unsaved upload leaves an orphan file in `Merch/`.
