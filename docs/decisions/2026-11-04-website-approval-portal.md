# One website-approval portal, tabbed by stream (#7j2qf)

**Status: built and applied to dev (0315). Page-content drafts cover site_pages only.**

- **One approval activity across every tab** (Lutan, 2026-11-04). `approve_website` holds `website.approve` plus `photos.approve` and `photos.resident_manage`. Accepted cost: the medical lead cannot be given clinical-photo approval without website publishing.
- **Policy reading confirmed.** `0163_management_website_content.sql:30-35` puts `site_content`, `site_content_photos` and `site_pages` under `website.content` for both `using` and `with check`. No later migration changes them.
- **The split is a separate table, not a split of those policies.** `website_drafts` (0315) holds a proposed change as a jsonb patch. `website.propose` can only write there; `website.approve` applies or discards it. `website.content` is untouched and still publishes directly. Scoped to `site_content` and `site_pages`; `site_content_photos` is not drafted because photos already go through `photos.approve` in the same portal.
- **One doorway.** `/photos/approve` is the single portal; tabs are drawn per activity (photo tabs: `photos.approve`; page changes: `website.approve`). The route gets `alsoActivity: "website.approve"`.
- **Found, not fixed:** `page.tsx` imported `EventPhotoQueue` and `loadWaitingEventPhotos` but rendered neither, so event photos never showed. Now rendered as a tab.

## What a proposer can do
A login holding only  opens Admin > Website > a page, edits the title and body, and presses Save as a draft ( asks ). The live page does not change.  proves it against dev: propose alone drafts, cannot approve or discard (42501), a no-card login cannot propose or read drafts, and approve alone publishes.

## Not done (found, not fixed)
- Drafts for the home-page settings (): the table and approve function accept them, no screen feeds them.
- Medical and Drive photos and adoption updates are not separate tabs (adoption media already appear in the resident photo queue).
- The release note waits until 0315 is on production.
- Deliverable 6 (one doorway or a tile per tab): one doorway, /photos/approve, because one activity gates every tab; the home tile for it is unchanged.
