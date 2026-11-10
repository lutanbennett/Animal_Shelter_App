# Drive "anyone with the link" is inherited from one parent folder (#yy9fz)

**Date:** 2026-11-10. **Branch:** `claude/drive-unshare`.

## What was built

`scripts/drive-sharing.mjs`: reports by default, `--env` is required (no default), `--remove` and
`--restore` change things, production is refused outright, and changing the shared dev/test tree also
needs `--shared-tree-ok`. It walks the tree recursively, pages `files.list`, and counts folders, files and
shortcuts separately. A re-run skips items already clean. It prints Google's own reason on any refusal
and never prints a credential.

## What the rehearsal found (measured 2026-11-09/10, not predicted)

- **Every UAT item (347 folders, 916 files) carried `anyone: reader`, and `--remove` changed none of them.**
  Google refused all 1,263 deletes with `cannotDeletePermission`. The permission was *inherited*
  (`permissionDetails.inherited: true`) from the folder **"LCA Health System"**, which holds the
  `UAT`, `Test` and `Production` trees, a `Database` spreadsheet and `empty.txt`.
- So the three trees were separate in content but shared **one** public link. Removing sharing on any
  one tree from inside it was impossible; the link had to come off the parent.
- **No file held a link of its own.** After the parent's link was removed, the UAT report showed 0 of
  347 folders and 0 of 916 files shared. The brief's concern (old files keeping their own permission)
  did not apply on UAT. The script still counts files apart, so it would show it on another tree.

## What was changed in Drive (at Lutan's direction, 2026-11-10)

1. Deleted the `anyoneWithLink` permission on "LCA Health System".
2. Added `anyone: reader` to the **Production** folder only (inherited by its children; sampled three).
   Production's link was off for about two minutes: the first add returned 200 but was folded into the
   inherited permission and vanished when the parent's was deleted, so it was added again.
3. UAT and Test are now private. Production is unchanged in effect. The `Database` spreadsheet and
   `empty.txt` lost their public link; nothing was checked that relied on them.

Production's files were **not** individually checked for their own permissions.

## What breaks when a tree is private (read in code, one dev check)

- **Receipts are fine.** Issuing, the PDF (`/management/donations/receipts/<id>/pdf`) and the receipt's
  "Open on Drive" link all go through the app, as the owner login and checked by `donation.receipt`.
  Tested with a login holding only `donations_receipts` on dev: it issued LCA0009013, downloaded a
  148,900-byte `%PDF-` and opened the Drive copy through `/api/documents/<id>`.
  The brief's claim that the receipt link opens `drive.google.com` was **out of date**.
- **Still direct to `drive.google.com`, so they need the owning Google account on a private tree:**
  `driveFolderUrl` (the archived-resident folder link on the deceased banner,
  `DeceasedBanner.tsx:105`), the links written into the archive export file
  (`src/lib/archive/resident-index-html.ts:59`), and the home-screen-icons folder link
  (`src/app/account/home-screen-icons/page.tsx:58`). The summary and index file links on the banner
  already go through the app.
- The export file leaves the system, so a login-checked link inside it needs its own answer.

## Not done, and why

- No app code changed (out of this branch's scope).
- UAT click-through with a real UAT session: not possible from here. Dev stands in for the receipt path.
- `--restore` was never exercised (nothing was removed by the script).
- Production's credential question stays open; the script refuses production until it is settled.
