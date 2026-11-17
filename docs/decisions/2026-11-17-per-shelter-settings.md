# Per-shelter settings, slice 1: the Drive folder id (#b4cmn, Part 8)

**Shape.** A column on `shelters` (`drive_root_folder_id`, migration `0398`), not a key/value table. `0395` already put
`receipt_series` and `receipt_issuers` there, no login can write `shelters`, and a second mechanism for the same job is one more
thing to keep in step. A key/value table stays open for the long tail of branding strings if the naming group needs it.
`0398` adds no `shelter_id` to any table and creates none, so `0392`'s policy loop needs no re-run. (`0397` went to
`tenancy-not-null`'s `0397_shelter_id_not_null` first; this file was renumbered before it was applied.)

**The column is added empty and populated per environment**, because the folder id differs between dev, UAT and production and a
migration cannot know it: `node scripts/populate-shelter-settings.mjs --env <env> --apply` copies that environment's own
`GOOGLE_DRIVE_ROOT_FOLDER_ID` into the `lanna` shelter, only where the column is empty.

**Reader.** `driveRootFolderId()` in `src/lib/shelter-settings.ts`: the acting shelter's column, else the environment variable.
It is the one new service-role call (recorded `filtered` in the registry; `shelters` is readable by no login).
**The fallback is deliberate and has a known hole:** a second shelter with no value of its own would use Lanna's folder.
Nothing creates a second production shelter yet; Part 9 (`#o2iyh`) must make an unpopulated shelter fail rather than fall back
before one is onboarded. The fallback is what keeps every reader safe on Lanna before and after populating.

**Byte-for-byte proof.** The chosen proof is the planner's reading: `scripts/check-shelter-settings.mjs`. It fails on any new
direct read of the variable in `src/` or `worker/` (registry: `docs/shelter-settings-registry.json`) and, with `--env`, on a stored
value that differs from the environment's. The folder id is a value, not rendered output, so equal value means equal behaviour; no
PDF diff is needed (PDFs embed timestamps) for this slice.

**Converted:** 12 `src/` files read the variable; all now call `driveRootFolderId()` (`drive.ts` has nine readers).
**Left, recorded as out of scope:** scripts under `scripts/` (CLI infrastructure reading their own environment), tests, comments and
the two dictionary strings that merely name the variable. **Not converted: the naming and branding group** (layout, public nav, PDFs,
archive HTML, release and status mail). The "no new hard-coded Lanna" half of the check is therefore not built: it needs the
conversion first or it would need a 40-file baseline.
