# 2026-11-05: UAT gets its own Drive copy (`#rqv5c`)

After the cutover production and UAT are restored from the same data and hold the same Drive ids, so
a tester deleting a photo on UAT would delete the shelter's live one. Lutan, 2026-11-02: *"Copy for the
test site"*. Two scripts, in the §E runbook (`docs/domain-checklist.md`, P7 and step 6a).

## The scripts

- `scripts/drive-copy-tree.mjs`: copies a tree into a new root in the same account, folder names kept.
  Dry run by default (tree size, free space, `Fits`), `--apply` writes. The only Drive writes are
  folder-create and `files.copy` with parents inside the new tree, so the live tree cannot be changed.
  The root is created with no permission call: private, not 'anyone with the link' (`#yy9fz`).
  Resumable: the mapping file (jsonl) is appended as each item lands, and a re-run reuses the same root.
  It makes the same calls as `copyFile`/`createFolder` in `src/lib/google/drive.ts` but does not import
  that file: it is TypeScript with `@/` imports, which a plain `.mjs` script cannot load.
- `scripts/drive-remap-ids.mjs`: rewrites original to copy ids in one database. Dry run by default.

## The real column list (dev, from `information_schema`, 2026-11-05)

24 text columns in public base tables whose name matches `drive_(file|folder)_id$`: found at run
time by the script, not listed in it. The planner's grep was a warning, not a list: `p_drive_file_id`
and `v_drive_file_id` are function parameters and variables, which never appear in `information_schema.columns`.
Querying that view is what separates a column from a parameter. It also keeps out views (they hold no
data) and the `uuid` columns `project_folder_id` and `parent_folder_id`, and `drive_id`/`drive_date`,
which are the app's own keys.

**Ids inside a URL or JSON value:** every text/json column in public tables was searched for any id held
in those 24 columns. Hits: `audit_log.new_row` (560 rows), `audit_log.old_row` (455) and
`write_requests.result` (2). No column holds a Drive URL. **Not rewritten, on purpose:** the audit log
is a history of what was true, and rewriting it would falsify it; nothing reads a Drive id back out of it
to act on a file. `write_requests.result` is two past results. Found, not fixed: if either is ever read to
open a file, UAT would act on a live id.

## What it refuses on

The Supabase project URL the chosen environment resolves to, through `appEnvForSupabaseUrl` in
`src/lib/app-env.ts` (the function that badges the site):

    if (appEnv !== "dev" && appEnv !== "uat") { throw new Error(`Refusing: ... is "${appEnv}" ...`);

Only `dev` and `uat` proceed, and that function answers `production` for every project it does not know,
so the test is an allow-list. `--env production` is also refused outright. The project ref alone could
not be the guard: UAT is the *old production* project, `dbkodyyxxhtygxcxmfcu`. The cutover change sets
`UAT_PROJECT_REF`; until it does, `--env uat` stops because there is no `.env.deploy.uat`.

## Space (deliverable 5)

Measured on `lannaanimalfoundationbwm@gmail.com` (the dev tree is in that account): **tree 1.79 GB
(475 folders, 1,134 files); account 1.83 GB used of 15.00 GB, 13.17 GB free.** A copy fits on dev. Production's
tree was not measured here (no production Drive credentials from a worktree): the dry run in P7 measures it
the same way and prints `Fits: NO` with the shortfall if it will not fit.

## Rehearsal on dev

Copied resident R-0003's folder (6 folders, 15 files) to a new root, remapped dev's database onto it (15
values: 13 in `attachments.drive_file_id`, 1 each in `residents.drive_folder_id` and
`residents.profile_photo_drive_file_id`), confirmed through Drive that the resident's new profile photo
is a real file inside the copy, ran `--apply` again (0), then remapped back with the reversed map. The page
render was not driven in the browser. The copy and the new root remain in dev Drive (disposable).

## Found, not fixed

- Importing the `.ts` file prints Node's `MODULE_TYPELESS_PACKAGE_JSON` warning; the other scripts that do so print it too.
- The root map entry is `source -> new root`; the remap deliberately includes it, because on dev the source can be a resident's own folder column.
