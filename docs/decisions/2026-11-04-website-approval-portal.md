# One website-approval portal, tabbed by stream (#7j2qf)

**Status: partly built, branch `claude/website-approval-portal`, no PR yet.**

- **One approval activity across every tab** (Lutan, 2026-11-04). `approve_website` holds `website.approve` plus `photos.approve` and `photos.resident_manage`. Accepted cost: the medical lead cannot be given clinical-photo approval without website publishing.
- **Policy reading confirmed.** `0163_management_website_content.sql:30-35` puts `site_content`, `site_content_photos` and `site_pages` under `website.content` for both `using` and `with check`. No later migration changes them.
- **The split is a separate table, not a split of those policies.** `website_drafts` (0315) holds a proposed change as a jsonb patch. `website.propose` can only write there; `website.approve` applies or discards it. `website.content` is untouched and still publishes directly. Scoped to `site_content` and `site_pages`; `site_content_photos` is not drafted because photos already go through `photos.approve` in the same portal.
- **One doorway.** `/photos/approve` is the single portal; tabs are drawn per activity (photo tabs: `photos.approve`; page changes: `website.approve`). The route gets `alsoActivity: "website.approve"`.
- **Found, not fixed:** `page.tsx` imported `EventPhotoQueue` and `loadWaitingEventPhotos` but rendered neither, so event photos never showed. Now rendered as a tab.

## Not done
0315 not applied to dev (no `SUPABASE_ACCESS_TOKEN` in this worktree); no save path that writes a draft from `/admin/website`; no one-card sign-in proof; no manual topic or release note (a release note must wait until 0315 is on production); `check-card-grants.mjs` not run; test plan, gates and PR still to do.
