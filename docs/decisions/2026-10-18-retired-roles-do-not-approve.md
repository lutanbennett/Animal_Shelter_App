# A retired role is not an approver (`0222`), and the Approve photos card

2026-10-18. App half of "An Approve photos card, assignable to any role, and Add resident photos cannot be given out until some role can approve". The schema half is `2026-10-18-approve-photos-schema.md` (PR #721, `0221`).

## Decided by Lutan (2026-10-18)

**Retired roles do not count as approvers, in the database and on the screen.** His words: *"exclude retired roles as this will future proof the system going forward."* This answers the finding in the schema decision ("a retired role also approves": on dev, `staff` held `photos.resident_publish` through Residents, so removing Residents from Management was not refused). It is his ruling, not drift.

## How it is done

- **"Retired" is `roles.archived_at is not null`.** That is the flag Staff got in `0173` and the one Security and Who does what already use. No new column; no role name is hard-coded, so the next retired role drops out by itself.
- **`0222`** `create or replace`s `set_role_cards()`. The only change: the "does another role approve?" lookup joins `roles` and requires `archived_at is null`. The edited role is still counted by the bundle it is handed; both messages, the permissiveness and the grants are `0221` exactly. No cell is written. Applied to dev.
- **One function on the screen:** `src/lib/permissions/approvers.ts` (`approverNames`) asks the same question (live, not Admin, holds the activity). One stream changed both, so they cannot drift. `scripts/check-home-cards.mjs` compares it with a database query on dev.
- **Not done, on purpose:** the `staff` role is not removed or tidied. Excluding it from the count is what was asked.

## The card

`approve_photos` opens `/photos/approve`. Bundle: `photos.resident_publish` (the guard keys on this activity), `photos.resident_manage` (what Remove and re-filing a waiting photo ask, `0152`; without it the Remove button would pass the page and be refused by the database), and `resident.record` at Read. Nothing else: no record edit, no `photos.resident_add`, no placement or medical cell. `src/lib/home/approve-photos-card.test.mjs` proves the exact set. Residents (Management) still approves, by union. The waiting count on the tile is the existing approval badge, put on whoever holds the activity.

## On Who does what

Add resident photos' **+** is disabled with *"Needs a role that can approve photos"* while no live non-Admin role holds the activity, and the reason is written beside it (a tooltip alone is invisible on a phone). The Approve photos and Add resident photos details list who approves now. The database's two refusal messages are shown as written (`23514` with those exact openings); any other check failure keeps the generic words.

## Dev after the ruling

Management is the only approver on dev (Staff, retired, no longer counts), so the last-approver refusal is live: taking Residents off Management is refused while any role holds Add resident photos. The rolled-back harness proves it. Nobody holds Approve photos or Add resident photos yet: both are Lutan's to tick onto roles.

## Production

Apply `0222` with the release, after `0221`. It only changes which roles the refusals count; no data moves.
