# 2026-11-07 — Add photos: save with no target, a Done control, a no-place queue row (app half of #40oz4)

**What changed.** `/photos/add` can now store a photo whose animal AND place are both unknown, and has a control that says it is stored.

- **Route** (`POST /api/photos/pending`): `enclosureId` absent or empty is accepted and inserts `enclosure_id = null` (0332). Every rejection is unchanged: a *present* non-uuid is 400, a uuid the login cannot resolve is 404, 403 for a login without `photos.shelter_add`/`photos.resident_publish` + Shelter, bad MIME/size/signature.
- **Drive folder for the no-enclosure case: `Unsorted/No place given`.** Chosen over the `Unsorted` root because the root then holds only folders (one per enclosure) and the unplaced photos are as easy to find and clear as any other; a loose file among folders is how things get missed.
- **Flow:** a primary button **"Don't know either: save for later"** stores every not-yet-tagged photo with no animal and no place. Once every photo is tagged and saved a **Done** button appears; pressing it clears the list and shows "Stored: N photos are saved. M are waiting on Photos to approve to be named." The save itself is still immediate per tag (unchanged); what is new is a moment a person can see and press that says *this is stored*.
- **Queue:** a no-place row says "Stored for later: neither the animal nor the place was known" and "No one to suggest" (the specified behaviour of `pending_photo_candidates()` for a null enclosure, not an error). `pending.ts` types are `string | null`.
- **Gate:** the Save-for-later button is drawn only when `(photos.shelter_add || photos.resident_publish) && Shelter in photoCategoriesFor` — exactly what the route asks. No new card.

**Part B (blank Folder dropdown): NOT REPRODUCED.** On dev, as Admin, in English and in Thai, the select has four options (Shelter, Medical, Foster, Adoption) with readable labels and `color-scheme: dark` (so the native list is dark with light text). The cause of the blank he saw is therefore **not established**. A card-only `add_photos` login gets no dropdown at all (one folder, a sentence). Hardening applied, control kept as he decided: each `<option>` carries explicit `bg-surface text-foreground` so the list cannot draw light-on-light on a browser that ignores `color-scheme` in its popup, and the select's value is forced to a folder the login actually has. Left for Lutan's own eyes on his phone.

**`#ay3d6` `/photos/add` half — confirmed, not repaired.** Dev picker on a card-only `add_photos` login showed 2 residents (R-8472, R-8473), read 2026-11-07 ~16:55Z; Admin sees the same two. Matches #1380's finding (cleared test data).

**Action controls on the page and the activity each asks** (read from the route/action, not the label):
| Control | Asks |
|---|---|
| Take / Choose photo | nothing until tagged (page needs `photos.resident_add` or `photos.shelter_add`) |
| Tag a resident chip / picker | `/api/photos/shelter/[id]` asks `photos.shelter_add` + Shelter folder; other folders their own routes |
| "I don't know" enclosure path | `/api/photos/pending`: `photos.shelter_add` or `photos.resident_publish`, + Shelter |
| Save for later (new) | same as the line above, gated identically |
| Done (new), Retry, All-to-same, Folder select | client-only / re-calls the route above |
| /photos/approve Assign, Discard | `photos.approve` (unchanged, not touched) |

**Found, not fixed.** A login holding `photos.resident_add` but none of `photos.resident_publish`, `photos.shelter_add`, `photos.medical_add` gets an empty `photoCategoriesFor`, so `folder` would be `undefined` in `AddPhotosFlow` (`categories[0]`). The page's gate lets it in; nothing in the shelter's cards does this today. Should ask: redirect or show "no folders" when `categories.length === 0` (`src/app/photos/add/page.tsx`).
Also: the queue heading still reads "N photos tagged to an enclosure" and counts no-place photos too (`photoApproval.pending.heading`, en.ts/th.ts).
