# Release handover — written 2026-10-30 after `0.40.12`

A **delta**. The durable rules are in `docs/release-procedure.md` and this release's own record is
`docs/releases/2026-10-30-0-40-12.md`. **Both outrank this file.**

## START HERE

**`0.40.12` is deployed on BOTH environments and verified.** Production Worker and both Pis at
`7ec19061`; the test Worker at `e078ee78`, which differs only by three backlog commits (code-identity
diff empty). **289 of 289**, `No drift` on both databases, cron healthy, cache purged and proved on
both hosts. No email, by Lutan's answer.

**Fetch before you say anything about `main`.** This session opened by reporting "nothing to
release: four documents since `0.40.11`". An hour later it was **25 PRs and seven migrations** — the
checkout simply had not been fetched. A release manager's first claim is the one everything else is
planned on.

**Re-measure before trusting any of this.** `git fetch`, `git diff --stat 7ec19061..origin/main`,
`gh pr list`, `--status --env production`, `node scripts/check-production.mjs all`, `/api/version`.

## The new fault: a Pi build fails whenever a release DELETES a page

`deploy-pi.sh` builds into `.next.new`, but `tsconfig.json` includes `.next/types/**/*.ts`, so the
type check reads the **live** build's `validator.ts`, which still imports the deleted page. `0.40.12`
removed `/admin/frequencies` and the Pi refused the build (`TS2307 … admin/frequencies/page.js`).
**The refusal is safe** — the old build keeps serving — **but the migrations were already on**, so
users stayed on old code against `0288`'s schema for about 20 minutes.

- **Until the script is fixed, check before every release:** `git diff --diff-filter=D --name-only
  <prev sha>..HEAD -- 'src/app/**/page.tsx' 'src/app/**/route.ts'`. If anything prints, get
  `.next/types` moved aside on **both** Pi clones **before** the apply, not after the failure.
- **You cannot do the move yourself.** The classifier refuses Claude remote writes outside
  `deploy-pi.sh` (`[Remote Shell Writes]`). It is one `ssh … "mv … && mv …"` line for Lutan — and it
  is a touch, so ask it in the same round as the email question.
- The two stale folders are at `~/stale-next-types-{prod,test}-0.40.11` on the Pi; delete them once
  a later Pi deploy has succeeded. **Backlog item filed** under *Deployment* for the script fix.

## Corrections and closures to the last edition

- **The runbook's `git reset --hard` recipe is CORRECTED** in this PR, after six editions naming it.
  It now says `git checkout -b claude/record-<version> origin/main`.
- **New and worth knowing: the cut's worktree may be gone when you come back for the record.** Another
  session's clean-up removed it minutes after #1111 merged (fully merged branch, free folder). Nothing
  was lost, but a record written into the husk folder was nearly lost. Check with `git worktree list`.
- **The seven unassigned cards are now six:** `0287` retired Add while recording.
- **`doctor-cells` still `MISSING 4 of 13`**, the same four. Expected; read it fresh anyway.
- **`audit:prod`** still exits 1 on the one `glob` advisory, as expected.

## Where things stand

| | |
|---|---|
| Live, production | **`0.40.12`** — Worker `49c05161`, Pi at `7ec19061`, endpoints agree, cron healthy |
| Live, test | **`0.40.12`** — Worker `f09faebe` (built from `e078ee78`), Pi at `7ec19061` |
| Previous release SHA, for the next range | **`7ec19061c436e7cbca03556493d2a36d8507161e`** |
| Production database | **`289 applied, 0 pending`**, `No drift`. **Run it yourself** |
| Dev database | **`289 applied, 0 pending`**, `No drift` |
| Next free migration number | **`0289`**. Check `origin/main` *and* open `*-schema` PRs anyway |
| The mail | **None**, correctly. Tenth release running |
| Cards | `card-grants-applied` and `card-cells-backed` clean |

**Counters:** `npm ci` skipped again on a measured reason (empty `package.json`/lockfile diff);
`strip-baked-env` at **14** on both, fourth release running; **Server Actions keys** production
`cbd55beae8d8`, test `ecc41837fc0b`, unchanged. **Releases that mailed: 1 in the last sixteen.**

## The method that kept paying

**Predict the after-picture, then read it.** `0282` deletes the `record_death` card. Prediction from
the before-picture: holders of `record_death` without Manage medical lose one cell, Manage medical
holders gain one, nothing else moves. **Observed exactly that.** It also surfaced a consequence worth
putting to Lutan before the deploy rather than after: until Manage medical is assigned, only its
holders and Admin can record a death. He accepted it.

**A script someone retired can still owe a run.** `0283`'s decision file said to run
`check-prescription-schedule-backfill.mjs --env production` "before the app stream ships"; #1108
retired it first. Recovered from history (`7cee2ebd^`), read, run: clean. **When a decision file
asks for a production check, grep whether it was ever done** before writing a note that depends on it.

**Notes owed by an apply go in the cut, and `--verify` then needs a built base.** Plain `--verify`
fails `nothing invented [7 vs 5]` — correctly. Build the base mechanically (`origin/main`'s file plus
exactly the added lines), diff it against `origin/main` to show only those lines, then
`--verify --base <file>`. Method in `docs/test-plans/cut-release-0-40-12.md`.

## Touches: five against two, and three were avoidable

The email answer, the record-a-death answer, the deploy, the Pi `mv`, and Lutan asking for the deploy
command to be shown on its own. **Avoidable:** the record-a-death question belonged in the first round
with the email; the Pi `mv` is the fault above; and **the first hand-over put the command in a code
block in the middle of a paragraph of other prose.** He reads for the command. **Lead with it, alone,
then say how long it takes and that you are waiting.**

The classifier refused `apply-migrations --env production` once and the plain retry went through.
**Try once, retry once in the runbook's exact form, then hand it over.**

## In flight and open

- **Manage medical**: give it to whoever records deaths, or decide not to. The record-a-death note is
  withheld until then (`check-deferred-notes.mjs` will raise it again; the answer is still "open").
- **Six unassigned cards** from `0280`/`0281`, and the **Translations** card, unchanged.
- **Seven plans' manual items**, Lutan's choice to ship with them open: mostly Thai wording and phone
  width. Listed in the record.
- **`/shop` has not been seen signed out** (`PUBLIC_SITE` is `locked`, and nothing shows until an
  entry is set to shown).
- **Carried unchanged, re-measure each:** `0257`'s stale `-- consumer:` header; the restore drill,
  never exercised; video playback on a real handset. **`tee` under PowerShell still writes UTF-16** —
  `tr -d '\000'` before grepping.
