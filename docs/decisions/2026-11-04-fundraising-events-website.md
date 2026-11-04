# Fundraising events: the public pages (second half of #2zi2j)

Branch `claude/fundraising-events-website`. The schema and staff screens were #1282 (`0312`, `0314`); this PR adds the public pages and no SQL.

## What shipped

- `/events` (upcoming, then past) and `/events/[id]` (details, linked campaign / project, social links, photo grid), reading **only**
  `public_fundraising_events` and `public_fundraising_event_photos` through `src/lib/events/public.ts`.
- Registered in `src/lib/public-pages.ts` (Get involved menu, Help footer column, sitemap) and `src/lib/public-paths.ts`; the sitemap also lists each event.
- Thai strings (`publicEvents`) are **unreviewed**, as every recent Thai string is. A manual topic and a release note were added.

## The questions the brief asked

- **Address: `/events`.** `/campaigns` is the renamed appeals page and `/e` is the tag-link prefix. `underPrefix()` matches on a segment boundary, so `/e` does not capture `/events`.
- **Edge cache: cached (NOT added to `NOT_EDGE_CACHED_PAGE_PREFIXES`).** An event's date, text and gallery change on the scale of days, there is no live total, and an unpublish or cancel taking up to ten minutes to leave the edge is the same exposure `/adopt` and `/our-work` already accept. A live fundraising figure on this page would reverse the answer.
- **Locked site: NOT in `LOCKED_PUBLIC_PATHS`.** Every public page except `/privacy` and `/` is unreachable while the site is locked, and the sitemap is empty when locked; a locked site should not expose a new page.
- **One list, not two.** `worker/index.mjs:72` imports `isEdgeCachedPage` from `src/lib/public-paths.ts`; there is no separate Worker path list, so registering the page was one edit.

## A choice worth keeping: the page has no hide switch of its own

The Admin hide switch stores `page:<key>` in `site_content.hidden_public_pages`, and a database check (`0256`, `0290`) accepts a fixed set of keys. There is no `page:events`, and adding one is a migration, which this brief rules out. So `events` carries `noOwnSwitch: true`: `hideableEntries()` leaves it out, the Admin Pages list draws no Hide button for it, and `isPageHidden()` ignores a stray `page:events`. It still disappears when its section (Get involved) is hidden. **For the planner to file:** a follow-up migration adding `page:events` to the check, then drop `noOwnSwitch`.

## Release-note truth rule

`0314` is on dev and not on production. The note is ticked because `scripts/deploy.mjs` refuses a production deploy until every migration on `main` is applied, so the migration cannot be outstanding when users read the note; the release carries both.

## Found, not fixed

1. A service-role insert into `attachments` with `approved_at` null is stamped approved by the database (no signed-in user, so the trigger treats it as trusted). Not a leak, but anything that creates event photos with the service role must reset `approved_at` to test an unapproved photo.
2. Memes (`is_meme`) in an event's gallery are shown in the photo grid, because the view returns them. Only the cover excludes a meme. Say if memes should be left out of the public grid.
3. The detail page returns HTTP 200 with the Not found content for an unpublished or cancelled id in `next dev` (streamed). The content is the not-found page and no event text is sent.
