# 2026-11-09 — The default flips to "not reviewed", INSERT is guarded, approve-on-save is removed (`#7aev4`, third half; migration 0346)

**What shipped.** `0346_approval_default_null.sql`:

1. `text_approval` defaults to `NULL` (not reviewed) on `residents`, `adoption_updates`, `appeals`, `fundraising_events`, `project_folders`,
   `desexing_drives`. `alter … set default null` only: **no row was rewritten** (proved by the rolled-back harness's before/after hash and by
   the public-view checks). `shelter_friends` and `shop_links` keep `public_ok`; nothing reads their column.
2. `text_approval_stamp()` now refuses an INSERT that *names* `public_ok` or `private_only` unless the caller holds `text.approve`
   (`has_permission`, so Admin passes through the existing Admin path and no role is named). An INSERT that omits the column lands `NULL` and
   is unaffected, so a filer without the card keeps working. A caller with no `auth.uid()` (a script on the service role) is not refused, as in `0345`.
3. `attachments_approval_stamp()` no longer approves on save a session with no login, a login that may publish resident photos, or a login that
   may approve photos. A photo saved by anyone waits in the photo queue. Kept, because it was never about the website: files whose owner is not a
   resident, an event or a project image (blood tests, procedures…), and Medical-folder files.

## The publisher's-own-save question, in Lutan's words

DONE WHEN of `#7aev4` asks for this answer to be written down. It was given on 2026-11-05, asked directly: *"Every photo and any text will be
reviewed by the Director."* So **nothing is approved on save, including by the person who publishes it**: a publisher's own save lands blank and
goes to the queue like everyone else's. On 2026-11-09 he confirmed the load is small: *"Photo volume: 20–30 a week, with more in the first month"*,
and text *"rarely, maybe once a fortnight"*, so removing approve-on-save is not a reason to design differently. The first-month photo spike is a
one-off to warn the Director about.

## The shop-link ruling (his answer B1 on `#7aev4`), recorded beside `#h3w7c`'s two

The shop-link photo has the same shape as the QR code and the Friends logo: *"Yes same shape"*. **No separate approval**, because whoever uploads
it also decides whether the row is shown. (`#h3w7c`'s two rulings are in `2026-11-08-…`/the item itself; this is the third, filed when the app half landed.)

## Not changed, on purpose

- `Ready for adoption` = `Show on website` stays. *"At this stage Ready for adoption = Show on website — This may be adjusted in the future…"*
- `public_resident_cards` still lists every resident (DB-7), so a *Public ok* profile photo of a resident not flagged for the website is still
  shown there. That is the one clause of `#7aev4`'s DONE WHEN that does **not** hold, which is why the item is not ticked.

## Consequences to know

- **Script-written rows now land blank.** `scripts/load-residents.mjs`-style loads and anything on the service role need the queue. On dev **no
  existing row changed** (the flip rewrites none); a row made by a script after `0346` is blank until approved (shown in the browser check below).
- **Three checks were corrected, not weakened:** `check-photo-approval`, `check-adoption-media-approval`, `check-fundraising-events-schema` now
  assert that a script's, a publisher's and an approver's photo **waits**. The first two also picked "a login that is not a publisher" by taking the
  first non-admin in `user_roles`; that login now holds `photos.approve` on dev, so the check built a false premise. They now create a disposable
  login holding no card. `check-adoption-media-approval` names `text_approval = 'public_ok'` on its fixture update because its subject is the files.
- **Three failures in `check-fundraising-events-schema` are older than this change** (reproduced with `0318`'s trigger restored on dev, then
  `0346` re-applied): the card holder's attachment update returns -2 where 0 is expected, `record_attachment('event', …)` now fails 23502 (the
  signature has moved on), and "no role holds the card" reads the live dev role set. They are the check's stale expectations, not this migration.

## Browser check (dev, reached by clicking from Home)

A resident made by a script after `0346` had `text_approval = NULL` and 0 rows in `public_resident_profiles` as `anon`. Signed in as a login holding
only `approve_text`, Home → Approve public text listed it ("1 piece of text is waiting"); Approve took the queue to 0; the row then read `public_ok`
and `anon` saw 1 profile.
