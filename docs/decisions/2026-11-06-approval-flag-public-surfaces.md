# 2026-11-08 — approval flag on public surfaces: NO flag for the QR code or the logo (`#h3w7c`)

**Outcome: no migration, no `src/` change.** Deliverable 1 answered "no" for both surfaces, which the brief names as a finished
stream rather than a failed one. The gap is confirmed (step zero below); it is a deliberate gap, recorded here so nobody
re-finds it as a fault.

## Step zero — the gaps are real
- `donation_channels.qr_drive_file_id` (`0191_donation_channels.sql`) and `shelter_friends.logo_drive_file_id`
  (`0076_shelter_friends.sql`) are plain text columns; nothing approval-shaped is on either table.
- `is_public_drive_file()` admits `logo_drive_file_id` through `public_shelter_friends` (`0084`, `0123`) on view membership alone.
- `0322` is free (`0321` is the newest on `main`).

## Who can set each file today (by card)
- **QR code:** `uploadDonationQr` / remove / the whole channel row ask `website.content` (`src/app/admin/website/actions.ts`).
- **Logo:** upload / remove ask `friends.manage` (`src/app/management/shelter-friends/actions.ts`).
- The same card also controls whether the thing is published at all (`donation_channels.shown`, `shelter_friends.published`).

## Why no second stage adds anything
1. **The approver would be the setter.** An approval stage only protects when a *different* login, holding a different card,
   checks what a first one placed. Here the card that sets the file also flips it public. A flag set by the same person on their
   own file is ceremony — the same argument `#7aev4` already accepted for page management.
2. **For the QR code the file is not the risky part of the row.** The same `website.content` holder types the bank name, account
   number, PromptPay id and payment URL on that very row. Reviewing the picture while the numbers beside it go unreviewed would
   guard the least-changeable field and leave the money fields open. A real control there would be a review of the whole channel,
   which is a different, larger feature and needs a distinct approver card — not a three-state flag on one column.
3. **No volunteer path exists.** Neither file arrives through the photo-upload queue; both are placed deliberately by a card
   holder on an admin screen, one at a time, and are visible on the admin screen as they go live.
4. Building it would also need a new card (so approver ≠ setter), a settings control (a second stream, brief deliverable 7) and
   a decision about existing rows, all for no extra check on who sees the file.

## The other deliverables
- **3 back-fill / before-after counts:** n/a — no migration, nothing about what is public changed. No QR or logo left the site.
- **4 consumer header, 5 harness, 6 dev apply:** n/a — no migration file written.
- **7 `src/`:** none.
- **9 release note:** `n/a: no user-visible change`. (Had a migration been written it would also have needed `0322` on production.)
- **10:** `#7aev4`'s three remaining things (approve-on-save in `0217`, the ready/visible link, the second gate) are untouched and
  `#7aev4` is not ticked. `#f214a` and `#k2p8w` were already closed (`0319`); (D) of `#314hq` is not this stream's and is untouched.
- **`site_content_photos`** (`0018_site_content.sql:36`) is page management, `#7aev4`'s declared exception. Not touched.

## If this is ever reopened
The honest version is a *separate-approver* review of the whole donation channel (bank details included) with its own card,
decided by the shelter — not a flag on the QR column.
