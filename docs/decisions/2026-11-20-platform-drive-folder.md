# Platform files out of a shelter's Google Drive (#shfil)

**2026-11-20.** Lutan asked for the shared files that sit inside a shelter's Drive structure to move to one folder on the
Cooper Jaidee Drive and the Pi, and ruled the same day that the icon library moves too.

## What was found (step zero)

The app was already clean: every upload resolves the served shelter's own root through `driveRootFolderId()`. The fault was in
scripts. `scripts/sync-home-icons.mjs` wrote the icon library under `GOOGLE_DRIVE_ROOT_FOLDER_ID` (a shelter's root), and
`scripts/drive-partition-tree.mjs` classified both `/Home screen icons` and `/Admin/Backups` as `prod`. The backups were
already moved by `#civwx` (own account, app registration and folder), so only the icon library and the mechanism remained.

## Decisions

1. **Where the registry lives (deliverable 3): `docs/platform-files-registry.json`**, its own file, not a section of
   `docs/shelter-settings-registry.json`. That one is about which files may read a *shelter setting*; this one is about which
   scripts may write *platform* files. Different subject, different check, and a neighbouring file would make each check
   fail on the other's edits. Shape copied from it: a `rule`, then lists of `{path|file, ..., reason}`.
2. **The check is by script, not by path string** (`scripts/check-platform-files.mjs`, in `npm run lint`). Drive paths are
   built from folder names in several ways, so a regex over path literals would miss the next one. Every script that touches
   Drive's write side must appear in `platformPaths` (with its folder variable and a reason) or in `otherDriveWriters` (with a
   reason it is shelter data or read-only). A platform writer that reads `GOOGLE_DRIVE_ROOT_FOLDER_ID`, or never reads its own
   folder variable, also fails. It was seen to fail on a fixture (see the PR) and the test file asserts four failure cases.
   It cannot see a file put in Drive by hand, and it is not an inventory of the tree.
3. **`PLATFORM_DRIVE_FOLDER_ID`** is declared in `scripts/lib/runtime-config.mjs` in `BACKUP_DRIVE_FOLDER_ID`'s shape
   (`where: both`, `secret: true`, `required: false`) and in `.env.example`. `sync-home-icons.mjs` fails when it is unset:
   **no fallback to a shelter root, and none to the app's token.**
4. **Credentials for the platform folder are the backups' own identity** (`BACKUP_GOOGLE_OAUTH_*`, the platform's own account
   from `#civwx`), not a new one. No account was created and no token minted.
5. **The icon prefix in `drive-partition-tree.mjs` is now `leave`, not `prod`.** `prod` means "move or copy this file into
   production's shelter tree", which is exactly what a platform file must not get. `leave` copies and moves nothing, so the
   partition no longer places platform files in any shelter. An old copy still under a shelter root stays where it is until
   the move below. `/Admin/Backups` stays `prod`: it is `#civwx`'s and is not re-pointed here.
6. **The Pi mirror** pulls the platform folder into `<dest>/_platform`, a sibling of the shelter folders, when
   `PLATFORM_DRIVE_FOLDER_ID` and the `BACKUP_GOOGLE_OAUTH_*` identity are in its env file. If the folder is set without the
   identity the run fails and says so, rather than silently skipping. Still pull-only. Nothing was run on the Pi.

## Deliverable 6: can this machine move the files? No.

`.env.local` and `.env.deploy.production` hold none of `PLATFORM_DRIVE_FOLDER_ID` or `BACKUP_GOOGLE_OAUTH_*`, so the Cooper
Jaidee account is not reachable from this worktree. The code and registry are shipped and **the move is outstanding**: it is
the planner's to run once the folder exists and its id and the backups' identity are set in the environment. It is
`scripts/drive-copy-tree.mjs` (copy the existing `Home screen icons` folder into the platform folder), or simply
`node scripts/sync-home-icons.mjs --env production`, which is idempotent and redraws every icon into the platform folder.

## Out of scope, and said so

Files put in the Drive tree by hand cannot be found from the repository. That is a separate question for Lutan; the registry
covers script-written paths only.
