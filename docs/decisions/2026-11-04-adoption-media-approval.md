# 2026-11-04 — Adoption-update photos and videos wait for approval (#7v6d0)

Lutan, 2026-11-03, asked directly: an adoption-update photo or video **should be approved**, photos and videos alike. The
"sharing is the approval" and "only videos" readings are superseded.

## What 0309 changed
`attachments_approval_stamp` (0217, last restated in 0224) approved on save any file with `adoption_update_id`. 0309 restates
0224's body without that one condition. Still approved on save: a non-resident owner, the Medical folder, a script with no
login, and a login that may publish or approve. `public_adoption_updates` (0303) already needs `approved_at`, so a shared update
shows nothing publicly until a file is approved. Harness: `scripts/check-adoption-media-approval.mjs`.

## Is there another way a file is born approved? (deliverable 12)
Those four. 0218 only sets `approved_at` back to null. The adoption-update one was the only exemption tied to this feature.

## Does anything read adoption media around the view? (deliverable 13)
`grep` of `src` for `public_adoption_updates`: only `src/lib/adoption-updates/public.ts` (the stories and journey pages go
through it). Staff pages read `attachments` directly, behind sign-in; not audited line by line.

## Deliverable 2: is photos.resident_publish still needed to attach? Yes.
`record_attachment` (0308) raises "This login can add photos to the Shelter folder only." unless the login can publish, or
`p_adoption_update_id is null` AND the folder is `shelter` AND it holds `photos.shelter_add`. The video finish route also asks
`photos.resident_publish` (`videos/finish/route.ts:80`). Both were written beside the exemption but do not depend on it.
Nothing was widened: whether a card should be able to attach to an update is Lutan's card decision, so `#hdyjp` stays open.

## What the queue renders
Unchanged: `ApproveQueue.tsx` already draws a `<video>` with controls when `media_kind = 'video'` (0229/0303), and
`loadWaitingPhotos` lists every unapproved resident-owned file, adoption-update ones included.
