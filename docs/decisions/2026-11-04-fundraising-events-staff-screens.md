# Fundraising events: the staff screens (0314)

Backlog item `#2zi2j`, app half. Branch `claude/fundraising-events-app`. The shape (its own table, its own card) is Lutan's
2026-11-04 answer in `2026-11-04-fundraising-events-schema.md` and is not reopened. **The public page is the next stream's;
nothing public is built here.**

## What shipped

- **Screens** under `/management/events` (list, `/new`, `/[id]`), gated by `requirePermission("events.run")`. The card's `opens`
  now points there (was `/management/campaigns`, the renamed appeals page). A Management landing tile and a route-registry entry
  (`menu: false`, like Sterilisation drives) were added.
- **Photos** upload through `/api/events/[id]/photos`, which files them with `record_attachment()` as owner type `event` and then
  joins the gallery. Pictures only (the gallery guard in 0312 refuses anything else). Drive home: `Events/<year>/<YYYY-MM-DD Title>/`,
  **apart from `Projects/` on purpose**: the linked project folder is a link, not the gallery.
- **Approval queue**: `/photos/approve` has a third section, event photos, with Approve and Remove (own actions, `owner_type = 'event'`).
  The home tile count includes them. The approval stamp itself was taught in 0312; nothing about approval was invented here.
- **Memes**: answered by construction in 0312 (`is_meme` is a flag on a gallery photo). The screen has *Mark as meme*; a meme is
  never the cover (refused in the action and hidden in the control). The staff meme library stays staff-only; a meme on an event
  is an uploaded copy.
- **Migration 0314** (one file, no enum add-value; `'event'` came with 0312): the four `attachments` policies gain an `event`
  branch (they fell to the bill ELSE, so nobody could read or approve an event photo); `record_attachment()` gains
  `when 'event' then events.run` (the 0311 body, one added arm plus an existence check on the event); the two public views
  `public_fundraising_events` and `public_fundraising_event_photos`; and `is_public_drive_file()` reads the photo view so the proxy
  can serve an approved photo.

## Choices worth keeping

- **The access to an event photo is two activities, not one.** Read: `events.run` **or** `photos.approve` (an approver must see
  what is waiting). Remove and approve: `events.run` **or** `can_approve_photos()`. Neither is a role.
- **Cancelling unpublishes in the same save**; the constraint `fundraising_events_cancelled_not_published` is never what the
  user meets. The form says so beside the status. Dates are checked in `checkEvent()` so `end_date >= event_date` is a sentence.
- **Public views are narrow on purpose.** A photo appears only with `approved_at` set, an image extension, and filed under that
  event. `appeal_id` / `project_folder_id` are returned only if that appeal / project is itself in `public_appeals` /
  `public_projects`, so the website cannot be led to a private record by a link. No creator, no note, no money figure.
- **No delete-event action.** An event is cancelled, not deleted; deleting would orphan Drive files. Not asked for; say if wanted.

## Found, not fixed

1. **An approver without `events.run` sees an event photo with a generic title.** `fundraising_events` is readable only with
   `events.run` (0312), so the queue falls back to "A fundraising event". Fine for judging the picture. Giving approvers a read of
   event titles would be a new policy keyed on `photos.approve`; not done without asking.
2. **The link pickers show only what the login can read.** A login holding only `run_fundraising_events` cannot read `appeals`
   (`appeal.run`) and may not read every project folder, so its pickers can be short or empty. The card does not include
   `run_appeals`; pairing them is a card-assignment decision.
3. **Thai wording is unreviewed**, written to the same standard as other recent Thai (`translatable_fields` queues the event text
   itself for review).
4. **Video is not offered.** Gallery photos are pictures only; a clip would need a different guard.

## Not built, as the brief says

The public events page, the `/events` route, the Worker path list, and any use of `public_fundraising_*` by a page.
