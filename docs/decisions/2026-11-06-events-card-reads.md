# Events card reads (`#yacd2`) — 2026-11-06

All analysis is by card. Roles are not used as evidence.

## Step zero
Not already built. `run_fundraising_events` (`cards.ts:375`) is exactly `events.run` and the comment at `:372` makes the narrowness deliberate. `fundraising_events_perm` (`0312`) is one `for all` policy on `events.run`. `appeals_perm` (`0210`) asks `appeal.run`; project folders ask `projects.folders` (`0149`, `0323`). The generic title is `anEvent` (`en.ts:5388`), used as the fallback in `src/app/photos/approve/EventPhotoQueue.tsx` when `eventTitle` is null.

## (1) Should `approve_photos` see the event named? — No, not now
The approver is judging a picture, not a title; the generic string is sufficient for that. Naming it needs a new read policy on `fundraising_events` keyed on `photos.approve`, which widens who can read event rows. That is a change to who sees what, so **it needs Lutan's word and is not built.** Narrowest mechanism if he wants it: a policy (or a security-definer function returning only id+title for events with a waiting photo) keyed on `photos.approve`; never the whole row, which holds drafts.

## (2) Link pickers — leave the reads, assign by card when wanted
No read is widened. A login holding only `run_fundraising_events` cannot read campaigns (`appeal.run`, held by `run_appeals`) or project folders (`projects.folders` at read, held by `project_folders` and others). Pairing `run_fundraising_events` with `run_appeals` and/or a project-folders card is a **card-assignment decision**, recorded here, with no `cards.ts` edit.

## Built
`EventForm` now shows a note under each picker when `can(perms, "appeal.run")` / `can(perms, "projects.folders", "read")` is false, so a short list reads as missing access. Both dictionaries; **Thai unreviewed**. Gate matches what the picker loads (`loadLinkChoices`), not the label.

## Found, not fixed
- `requirePermission("events.run")` on the three events pages and `/photos/approve` take the default edit level; classification belongs to `page-level-classification`.
- Event Thai wording unreviewed; video deliberately not offered in the gallery.
