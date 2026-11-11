# The last three direct Drive links are served by the app (#dv7k3)

2026-11-11, branch `claude/drive-links-app-served`. Gates the Production lockdown (#yy9fz, Friday 13 November).

**Step zero:** `grep drive.google.com src/` still showed all three builders (`drive-client.ts` `driveFolderUrl`, `resident-index-html.ts` `driveUrl`, `home-screen-icons/page.tsx`). Not built before.

## The activity each control asks

`/api/documents/[fileId]` has no `can(perms, …)`: it asks `can_see_drive_file(fileId)` (security invoker), and the answer is each table's own RLS. For the deceased summary and index that is a read of the `residents` row (0286). Nothing new was granted and no card was added.

- **Folder link on the banner** now goes to `/residents/<id>/archive-files`. That page reads the `residents` row as the caller (RLS: same read the hub needs), then lists the folder as the app owner and keeps only files for which `can_see_drive_file()` is true for the caller, so the list can never show a file its own link refuses. Each file opens at `/api/documents/<id>`. The link is drawn only when the archive is done and a folder exists.
- **A folder is not a document**, so a folder is a page, not a proxy. Depth is capped at 3 and 200 files. A file in the folder that no table knows (so `can_see_drive_file` is false) is not listed; the generated summary and index and registered attachments are.
- **Home-screen-icons**: UNCHANGED, by Lutan’s ruling the same day: the icons folder stays "anyone with the link", as it was left on UAT. It is the one deliberate direct Drive link and an exception to the lockdown: `scripts/drive-sharing.mjs` must not strip the `Home screen icons` folder on Production. The folder holds only generated card pictures. So the item’s "no drive.google.com URL built by app code" is met for all but this one link.

## The export file: option (ii), link back to the app

The export leaves the system, but it already bundles the files (photos and attachments are written beside it, `relativePath`); the Drive link was only a fallback for a file that did not copy. So (i) is largely true already, and what remains is a pointer for a missing file. Chose (ii): `Open in the app` linking to `<origin>/api/documents/<id>`, where the reader signs in and the card check applies. A link that asks for a sign-in is honest about who may read a medical file. Origin comes from the request (`getSiteOrigin`); outside a request no link is written (never a Drive one).

## Found, not fixed

`driveFolderUrl` was exported and had one caller; it is removed. Dictionary keys `account.homeIcons.driveLink` / `driveHint` are now unused and left in place.
