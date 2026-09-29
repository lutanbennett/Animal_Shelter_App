# 2026-09-25 — The photo proxy asks who is asking (`/api/photos/[fileId]`)

The feature half of "The photo proxy serves any known Drive file to a
signed-out visitor"; `0084` (above) supplied the question.

- **Public first, then the caller's own RLS.** The route asks
  `is_public_drive_file` of every caller. Yes: served to anyone, cached as
  public, as before. No: served only if the caller's session can select a
  row holding the id from `attachments`, `project_photos`,
  `maintenance_photos` or `shelter_friends` — the non-public half of
  `is_known_drive_file`, asked as the caller instead of as the definer. The
  route no longer calls `is_known_drive_file`.
- **Why not "signed in → `is_known_drive_file`".** That was the item's
  first suggestion, and it treats a session as access. It isn't: an
  archived login keeps a valid session with no role (0063); the planned
  `public_viewer` role (backlog, "A Public viewer login") is a role with no
  app access; and a vet, who has no policy on `maintenance_photos` or
  `project_photos`, would have been handed files RLS refuses them. A role
  allow-list fixes the first two but not the third, and needs editing with
  every new role. Letting RLS answer fixes all three with no list and no
  migration. Measured on dev: every live role, a roleless session and
  signed out, against a public profile photo, blood-test, procedure and
  unpublished-project attachments, a maintenance-photo fixture and an
  unknown id (test plan §4).
- **Refused looks like missing.** A file the caller may not see is the same
  `404 Photo not found.` as a made-up id, so the proxy does not confirm
  that an internal file exists.
- **Only public files are ever cached, and that is what makes the
  cache-first order safe.** The edge cache is still consulted before the
  database (it exists to spare Drive under bursty public traffic), which is
  only sound because a non-public file is never put in it. Non-public files
  are served `Cache-Control: private, no-store`, not `private, max-age=…`:
  the backlog item names browser history on a shared shelter PC, and a
  browser-cached blood test would outlive the sign-out. Internal files are
  viewed by a handful of staff, so skipping the cache costs Drive little. A
  404 is `no-store` too.
- **New cache key, so the old entries die.** The key was the request URL;
  it is now `/api/photos/<id>?edge=public-v2`. Before this change the edge
  cache held internal files a signed-in user had viewed, for up to 24h,
  under the plain URL; a new key means none of those is matched again
  after the deploy. It also stops a query string from making a second entry
  for the same file. Bump the version to orphan everything again.
- **Accepted: a file that stops being public stays served for up to 24h**
  from the edge (and from any browser that fetched it with the
  `public, immutable` header). Hiding a resident or unpublishing a project
  withdraws its non-profile photos in the database at once, but not from
  caches. That was already true, and the alternative (ask the database
  before the cache on every request) spends the cache's purpose.
- **Where the cache runs.** `caches.default` exists only when the route
  runs on the Worker. When the Worker hands a request to the Pi
  (`ORIGIN_HOST`, docs/pi-hosting.md) the route runs under Node with no edge
  cache and only the `Cache-Control` header applies; `worker/index.mjs`
  does not cache `/api/photos` itself.
