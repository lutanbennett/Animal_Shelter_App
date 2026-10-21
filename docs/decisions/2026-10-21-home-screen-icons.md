# 2026-10-21 — Home screen icons: drawn in the browser, shared through Drive

Lutan wanted a ready picture per card to use on iPhone Shortcuts, and (2026-10-21, in chat) a library
in Google Drive that others can use, refreshed by Claude at release rather than by a button or a command.

**What was built.**
- **Account menu → Home screen icons** (`/account/home-screen-icons`), open to any signed-in login. It shows
  one icon for each page `routesFor(perms)` gives that login: the same lucide icon the tile uses, in the app's
  dark or light colours, with or without the name, saved at 180 or 1024 px, with the page address beside it.
- **`scripts/sync-home-icons.mjs`**, run by Claude at each release (`docs/release-procedure.md`), draws all
  cards (8 images each) with `sharp` and replaces the files in the Drive folder "Home screen icons".
- Both draw through `src/lib/home-icons/svg.ts`, so the page and the library cannot differ.

**Where the images come from.** The page rasterises in the browser (SVG onto a canvas), so it needs no new
dependency, no server route and nothing special on the Pi or the Worker. The script uses `sharp`, already a
dependency (its override is untouched), and runs only on Claude's machine. The icon list is read from
`ROUTES` in both, so a new card gets an icon with no extra work.

**Why the page is under Account, not Settings.** Settings opens only for Admin and the route registry
(not edited here, it changes every tile) gates each page by an activity. The item asked for anyone to have
their own cards' icons, so the page needs only a login, like Change password.

**Not built.** The Download all zip: the Drive folder replaces it. The per-page `apple-touch-icon` (item part
2) is a separate piece of work and stays on the backlog.

**Drive.** The sync uses the app's own Google token (`GOOGLE_OAUTH_*`) and the folder under
`GOOGLE_DRIVE_ROOT_FOLDER_ID`; the icons are not sensitive. Sharing the folder with other people is done in
Drive. It deletes nothing, so a removed card's files stay until someone trashes them.

**Limits.** No Thai names on the images (names are the English labels; Helvetica-class font). No migration.
