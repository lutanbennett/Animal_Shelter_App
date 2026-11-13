# 2026-11-13 — Friday's Drive "lockdown" is a confirmation, and it confirms (#yy9fz)

**Decided/recorded by:** the `drive-lockdown-confirmation` stream, on the date Lutan scheduled (2026-11-10). Nothing in
this file changed production: the only thing run against it was the report.

## 1. Today's production figures (deliverable 2)

Run bare, foreground, from this worktree, on **2026-11-13 at about 08:55–09:10 (SEAST)** — `node scripts/drive-sharing.mjs --env production`:

```
Environment: production   root: 170MwT_wbLbdt0p5Z2BLKGnYB0AigsZ21   mode: report only (nothing is changed)
Summary
  walked:        357 folders, 988 files, 0 shortcuts
  anyone-shared: 0 folders, 0 files, 0 shortcuts
  failed:        0
```

Exit code **0**. (The harness moved it to the background at 600 s, as the brief said it would; it finished with 0.)

**What differs from 2026-11-12 (`357 / 972 / 0 / 0 / 0`):** folders are the same, **files went from 972 to 988 (+16)**. Every
other figure is the same: still **0 `anyone`-shared** anywhere, including the root (the walk seeds its queue with the root id).
The +16 is the live tree growing between two days of a running shelter; the app does not share what it uploads
(`uploadImageToFolder()` deliberately grants no `anyone` permission), and all 16 were walked and measured as unshared, so it
does not change the finding. It is reported first because it is the one figure that moved.

**This is the confirmation Lutan scheduled for today.** Production is clean on the date he set.

## 2. Why this is a confirmation by construction

`scripts/drive-sharing.mjs` refuses `--remove` and `--restore` on production before it authenticates, with no override
(`docs/decisions/2026-11-10-drive-unshare.md`, lines 1–40 of the script). So there was never a production lockdown a session
could perform; the removal was done by Lutan on 2026-11-10 (he deleted the inherited parent link on *LCA Health System*),
and what is left to do on the date is to measure. It was measured.

## 3. Whose identity the production reading was taken as (deliverable 3)

- `loadEnv("production")` layers **shell > `.env.deploy.production` > `.env.local`**. Production's overlay sets
  `GOOGLE_DRIVE_ROOT_FOLDER_ID`, `BACKUP_DRIVE_FOLDER_ID`, the calendar pair and `GOOGLE_SIGNIN_CLIENT_SECRET` — and **none of
  the three `GOOGLE_OAUTH_*` keys** (names read; values never printed). They fall through to `.env.local`.
- So the reading used the client **`1036347359893-dfbupbdp60l8ukicc08dhf0jipafinb6`** — *Lanna Care Drive Access*, a Desktop
  client in the Google project **`lanna-care-dev`** (number `1036347359893`), owned by `lannaanimalfoundationbwm@gmail.com`.
  `docs/google-cloud-inventory.md` says this one client is "All Drive access … for every environment". (UAT, by contrast, has its
  own `GOOGLE_OAUTH_*` in `.env.deploy.uat`.) The *refresh token* is the part that picks the account; it is not printed anywhere and
  the inventory's owner of the roots (`lannaanimalfoundationbwm@gmail.com`) is the account this client is under.
- **Could the tree hold items this identity cannot enumerate, so "0 anyone-shared" is about 988 files rather than the whole
  tree?** What I established from the code: the walk lists children of each folder with `trashed=false`, so it
  (a) **does not see trashed items**, (b) **does not follow shortcuts** into other folders (there are 0 here), and (c) can only
  list what the authenticated account can see. For (c), an item uploaded by the app is owned by this same account, and an item a
  person dropped into a folder this account owns is visible through the folder's access, so I have no reason to think the
  app-written tree has hidden items — but **I cannot prove it from here**: an item in the tree that some *other* account owns and
  has never shared with this one would not appear, and a permissions call on an item this account can only read may list only
  the permissions it is allowed to see. Every one of the 1,345 items' permission calls succeeded (`failed: 0`), which is
  evidence of reach, not proof of completeness. **Also not established:** whether the Worker's own `GOOGLE_OAUTH_*` secrets are the
  same client/refresh token (`secret list` prints names only). Neither was settled by asking Lutan to run anything, as instructed;
  that sentence is the deliverable.

## 4. The UAT rehearsal, and what it did and did not exercise (deliverable 4)

UAT's own credentials (its own client in `.env.deploy.uat`) were used.

- `--env uat` (report): `walked 347 folders, 916 files, 0 shortcuts / anyone-shared 0 / failed 0`, exit 0.
- `--env uat --remove`: `walked 347 folders, 916 files, 0 shortcuts / anyone-shared 0 / changed 0 / skipped 1263 (already had no anyone permission) / failed 0`, exit 0. A no-op, as expected on a tree that is already private (347 + 916 = 1,263 items, all skipped).

**Exercised** (read from the code): the recursive walk from the root, folder paging, folders **and files** both handled, the
three-way folder/file/shortcut count, per-item `permissions.list`, and the skip path for an item that already has no `anyone`
permission. **Not exercised:** the `permissions.delete` call itself, the `cannotDeletePermission` refusal on an inherited
permission, and `--restore`.

**Remainder:** to rehearse the delete for real, UAT would have to be `--restore`d first, putting `anyone: reader` on every item in
UAT's tree (1,263 on 2026-11-10; 916 files + 347 folders today) for the duration; the script cannot scope either flag to a
sub-folder. **Re-sharing UAT is Lutan's decision.** Recommendation: don't, unless he wants the delete path proven again — it
already worked on UAT on 2026-11-10 (1,263 → 0) and the production tree is already clean, so the rehearsal no longer guards any
pending change. I ran no `--restore`.

## 5. Found, not fixed

- **`worktree.mjs new` copies only `.env.local`**, so `drive-sharing.mjs --env production|uat` (and any `loadEnv` script) in a
  fresh worktree stops with *".env.deploy.production is missing or empty"*. I copied the two gitignored `.env.deploy.*` files in
  from the main checkout to run the reports. Not changed in `worktree.mjs`.
- The report's own walk skips trashed items and shortcuts (§3). Not changed.

## 6. What this settles

`#yy9fz`: production is measured clean on the scheduled date, production writes are refused by construction, and the identity
caveat is written down in terms (§3). What survives is only Lutan's call on re-sharing UAT to rehearse the delete path, which
is optional.
