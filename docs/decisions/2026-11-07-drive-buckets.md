# Drive buckets: Prod, UAT and Test roots inside the one account (2026-11-07, `#rqv5c`)

## The fault

Dev, test and production wrote into ONE Drive folder through ONE refresh token. 220 files were named by both
the production and the dev database, so a test user deleting a photo deleted the shelter's. (42 call sites in
`src/` trash, delete or move Drive files; `src/lib/google/drive.ts` has no environment guard.)

## Measured (2026-11-07, `scripts/drive-partition-tree.mjs` dry run, same figures as the planner's audit)

1,159 files / 479 folders under the old root. Named only by production 655 (191 + 464 home-screen icons), only by
dev 230, **by both 220**, by neither 54. Production names 468 ids, all present. Dev names 522, 5 already gone.
The Prod, UAT and Test roots are Lutan's own folders (`170MwT_wbLbdt0p5Z2BLKGnYB0AigsZ21`,
`16DhllkzpM0dqCn0Yy0cErQ7XgvhJpW9J`, `1gEAHO9t1E4VqsXXLcHmpUdWBGF0pXADU`), created inside the old root; the script
skips them when it walks.

## A Drive move keeps the file id (proved, not assumed)

On a throwaway tree in the same account, a file moved with `addParents`/`removeParents` kept its id and still
downloaded its content. So production's database needs **no change**: its 468 ids keep working while files move.

## Algorithm (per file and per folder, not a whole-folder fast path)

- File named only by production, or a generated icon, or under `/Admin/Backups` (Lutan: the Backups files go to
  Prod) -> **moved** to Prod. Only by dev -> **moved** to Test. By both -> original **moved** to Prod, a **copy**
  made in Test, test's database remapped onto the copy. By neither -> never touched.
- Folder named by production (or holding Prod-only files) has its home in Prod and is moved there keeping its id;
  dev-only -> Test; named by both -> Prod, plus a new same-named folder in Test (its pair is in the map so test's
  `drive_folder_id`s follow). Where a bucket needs a folder it does not own, a new one is made under that bucket's
  counterpart of the parent (the mixed folders: 253 were created).
- The script can only create folders, copy files and move by changing parents. There is no delete, trash or update
  call in it. Dry run by default, `--apply` explicit, resumable by `--state`, and `--map` holds ONLY test-bucket
  pairs in the format `drive-remap-ids.mjs` already reads (so production is never remapped).

## Run order, and what a person would see if it died at each step

1. `--phase copy`: makes Test's folders and copies the 220 shared files. Nothing existing changes. Died here: the
   copies sit in Test and are unused; a re-run continues.
2. `drive-remap-ids.mjs --env test --apply`: test's database now names the copies. Died here: not applicable, it is
   one statement per column.
3. `--phase move`: moves originals. Every id survives a move, so neither database is ever broken at any point;
   dying mid-way leaves some files in the old root and some in their bucket, and a re-run finishes. Order chosen
   because the only step that could break something is the remap, and it needs the copies to exist first.

## What was proved (real files)

One of the 220 (`Residents/Khao (Bor-Kha-Ya) (R-0035)/Photos/Shelter/2512/e9678e81.File.092042.jpg`): production's
database names the original and it sits in `Production/…`; test's database names the copy and it sits in
`Test/…`; both files exist. After the run: Prod 915 files, Test 462, UAT 0. The delete test is a reasoned
argument only (a test deleting a file now deletes its own bucket's copy); no file was deleted.

## UAT's root is deliberately EMPTY

It fills later as a copy of the Prod bucket, when UAT's own data restore happens (`#u7d3b`); that copy brings the
Admin and shared files with it (Lutan, 2026-11-07). Empty is not unfinished.

## Unreferenced files (54 at the start)

The 16 under `/Admin/Backups` went to Prod. The other 38 are test leftovers Lutan will remove over time; **their
files are untouched**, but 36 of them changed **path** because their folder was moved whole (a folder keeps its id
only by moving with everything in it). Lutan agreed. His review list is the CSV he was given, by Drive id.

## One change to `drive-remap-ids.mjs`

The remap hit the deceased-resident lock (`0026`: attachments and profile rows of a deceased resident are
read-only). Rewriting an id changes no content, so the apply now sets the sanctioned transaction-local bypass
`app.deceased_lock_bypass` (the one the imports and `fix-panda-placements.mjs` use). Lutan approved it in chat.
The production refusal is unchanged. 291 values were rewritten on dev: attachments 205, residents.drive_folder_id
39, profile photos 28, deceased index/summary 6+6, project_folders 4, site_content_photos 3. A re-run prints zero.

## The settings Lutan must change (NOT changed by this stream)

`GOOGLE_DRIVE_ROOT_FOLDER_ID` per environment, in gitignored secret files:

| File | Value |
|---|---|
| dev machine `.env.deploy.production` | `170MwT_wbLbdt0p5Z2BLKGnYB0AigsZ21` (Production) |
| dev machine `.env.deploy.uat` | `16DhllkzpM0dqCn0Yy0cErQ7XgvhJpW9J` (UAT) |
| dev machine `.env.local` | `1gEAHO9t1E4VqsXXLcHmpUdWBGF0pXADU` (Test) |
| Pi test clone `~/Animal_Shelter_App_test/.env.local` | `1gEAHO9t1E4VqsXXLcHmpUdWBGF0pXADU` (Test) |
| Pi production clone | `170MwT_wbLbdt0p5Z2BLKGnYB0AigsZ21` |

Then restart the matching service. **Ordering trap:** the files are already in the buckets, so change the setting
now; but until it is changed, the app still looks at the OLD root, where moved files are no longer, and photos will
not load. Change each environment's setting promptly after this merges. `BACKUP_DRIVE_FOLDER_ID` resolves to a
`Backups` folder under the root: with production now pointed at Prod, backups land in `Production/Admin/Backups`.

## Not separated (reported, out of scope)

- **Google Calendar is shared**: one `GOOGLE_CALENDAR_ID` across all three environments, so a dev or test run can
  write onto the shelter's real calendar. For the planner to file.
- The old root still holds the 38 unreferenced files and the three bucket roots.
- The home-screen icons live in Prod (found by name under whichever root an environment is pointed at, so Test and
  UAT build their own set).

## Found, not fixed

The remap script has no handling for triggers other than this one; a future table with a lock would fail the same
way (it fails safe: the statement rolls back).
