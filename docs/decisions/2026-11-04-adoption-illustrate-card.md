# 2026-11-04 — The card that writes an adoption update can illustrate it (#hdyjp, `0311`)

**Lutan, 2026-11-04, asked directly** whether to widen the existing `adoption_news` card or add a second card for
illustrating: *widen the existing card* — "one card, one job, nothing new for you to assign".

## What `photos.resident_publish` grants beyond illustrating an update (deliverable 1)
Its own label is "Put a resident's photo on the public website". Read from code and from `record_attachment` (0308,
`supabase/migrations/0308_bills_delivery_lines.sql`, the `can_publish_resident_photos()` guard and `attachments_approval_stamp`):
- `drive-client.ts:68` — holding it widens the photo **category** list (Shelter, Foster, Adoption).
- `photos/add/page.tsx:32` — whether an uploaded photo waits.
- `api/photos/pending/route.ts:40` — `mayFile`.
- `record_attachment` — files a resident photo **anywhere but Shelter**; `attachments_update_folder_guard` (0269) the same.
- `attachments_approval_stamp` (0309) — a publisher's file is **approved on save**.
- `videos/start` and `videos/finish` asked it for an adopter's video, and the photo route reached it through
  `photoCategoriesFor`.
So bolting it onto `adoption_news` would have let that card put any resident's photo on the website, which `cards.ts:256`
records as deliberately never done. Not what "one card, one job" means.

## Chosen: the adoption-update path asks `resident.adoption_news`, so no grant moves (deliverable 2)
The publish requirement on this path was a leftover: it protected a world where adoption media published on save. Since `0309`
the file waits for approval whatever the filer holds, and `public_adoption_updates` and `is_public_drive_file` both read
`approved_at`. `0311` rebuilds `record_attachment` from 0308 with ONE added path: a file with `p_adoption_update_id`, whose
update is about **this resident**, filed in **that update's own dated folder** (`YYYYMMDD` of `received_on`), by a login holding
`resident.adoption_news`, is allowed without `photos.resident_add` or `photos.resident_publish`. Every other rule (Medical guard,
Shelter-only rule, profile photo rule, other-owner cases) is unchanged. The photo route and both video routes ask
`resident.adoption_news` for an adopter's file and the old activities for everything else; `AdoptionUpdatePage` draws the picker
on `can(perms, "resident.adoption_news")`, so control and action ask the same thing. `cards.ts`, the catalogue and the card
count are untouched (no `card_grants` row moves).

**What this loosens, said plainly:** a publisher with no `adoption_news` can no longer attach through the routes (the database
still admits them). They cannot reach the update form to save one either. The DB guard is looser for the new path only.

## Proof (dev, `scripts/check-adoption-illustrate.mjs`, rollback harness)
One-card login (`dev-signin --cards adoption_news`): cannot publish or approve; files on its own resident's update in the dated
folder, born unapproved and absent from `public_adoption_updates` and the proxy; refused for the Adoption category folder, no
update, plain Adoption/Shelter, another resident's update, Medical and a mismatched resident; a login without the card refused.
Routes as that login: category upload 403; adoption-update path passes the gate.

## Found, not fixed
- The picker was not clicked through in the browser pane (left for manual verification).
- `docs/backlog.md` item `#3cqd9` may describe the old requirement; read at sync, not edited here.
- Release note: not added, `0311` is not on production yet (`2026-10-11-release-note-truth-rule.md`); it belongs with the PR that closes that apply.
