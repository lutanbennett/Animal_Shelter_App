# Feature test plan — cut-release-0-14-0

## Header

| | |
|---|---|
| Feature | Cut release `0.14.0`, **major**: move the five `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-14-0` @ `C:\Development\Animal_Shelter_cut-release-0-14-0` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-02 |
| Carries a migration? | no — but **three are pending**, and `0127` needs an ordering this project has never used before. See §3 |
| Tested at SHA | `8112e6a` + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: a `0.14.0` entry holding the five notes written by PRs #286–#298, and `package.json`'s version field, plus one note rewritten on Lutan's instruction (below)
- [x] Files/areas touched listed — `src/lib/releases.ts` (data only) and `package.json`. No `src/app/`, no `worker/`, no migrations
- [x] Roles affected identified — one note untagged (the sign-out), two `admin, management`, one `admin, management, staff, vet`, one `vet, volunteer`. `major: true`, so **every admin with an email is mailed**
- [x] Anything explicitly **out of scope** written down — (a) the deploys, Lutan's go; (b) applying `0126`–`0128` (§3); (c) the release record; (d) the open MFA rotation and the Sunday backup deadline, both raised in chat and recorded in §8 because the deploy bears on them

**Decision confirmed in chat by Lutan, 2026-10-02:** `0.14.0` with `major: true`. Note 1 tells every user they were signed out and why; notes 4 and 5 change what vets and volunteers can see and do.

### Note 1 was rewritten before cutting, and the reason matters

As first written, note 1 said the sign-out followed "**we found old copies of the shelter's backups had been kept in a place they should not have been**". **Lutan corrected the premise in chat: there was no incident.** He commissioned a security audit, it identified that the database backups were not encrypted (assessment finding DB-1, High), and this release is the remediation. Nobody was hacked or compromised.

The original wording was defensible against the rollout record — `docs/decisions/2026-10-02-backup-encryption-rollout.md` does use the word "exposed" — but read as a disclosure of a lapse discovered by accident, which is both inaccurate and worse for the shelter than the truth. **This text is emailed to every admin**, so it was changed on his instruction before the cut, to:

> Everyone was signed out on 2 October 2026 and has to sign in again once. A security review the shelter commissioned found that the database backups were not encrypted; they now are, and only the administrator can open them. Signing everyone out was a precaution taken at the same time — nothing was lost or changed, and every account and record is exactly as it was. Sign in as usual.

Recorded at length because a release note that describes a security event is the one kind of note where a wrong adjective travels furthest, and because the correction came from the person who commissioned the work, not from the repository.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed and verified rather than assumed: 0 behind `8112e6a`
- [x] `npm run typecheck` — clean. Via `node scripts/gates.mjs`: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR — n/a: recorded at push time, before CI has reported
- [x] Newest release version matches `package.json` — both `0.14.0`
- [x] `unreleased` is empty — emptied by this PR; it held exactly 5 entries and the cut refused any other count
- [x] **`majorReleasesSince("0.13.0")` returns `["0.14.0"]`** — the check that makes the deploy mail admins, verified rather than inferred
- [x] **The date was read from the local clock** — `2026-10-02`, matching the entry; UTC agrees today
- [x] The register parses the way `deploy.mjs` loads it — `0.14.0` / `2026-10-02` / `major: true` / 5 notes
- [x] Order intact — `0.14.0 > 0.13.0 > 0.12.1`, the register's file order still matching a re-sort by `compareVersions` across all twenty-two entries
- [x] **The cut was verified against a pre-cut copy** — text, roles and total character count identical for all five, `unreleased` empty. **Four of the five are the multi-line object form.** The note-1 rewrite was applied *after* that comparison and re-read from the parsed register, so the only intended difference is the one described above
- [x] **The mail builds clean** — 5 bullets, 0 `[object Object]`, 0 `undefined`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] **`--drift production` reviewed — three pending**: `0126_narrow_contacts_for_vets_and_volunteers`, `0127_drop_user_roles_vet_id`, `0128_safety_stock`. `Against origin/main 8112e6a: 128 file(s), 125 applied row(s)`, nothing applied that `main` lacks
- [ ] `--dry-run` reviewed — n/a: owed for the release, on all three
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR. Dev is current through `0128`
- [ ] File is re-runnable — n/a: no migration in this PR. All three say they are, and `0127` says so explicitly ("Re-runnable: guarded throughout")
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated — below, and **it is not the usual one**

### `0127` wants the opposite order to every release so far, and the guard will not allow it

**`0127_drop_user_roles_vet_id.sql` drops a column the live release still reads.** Line 108 is `alter table user_roles drop column if exists vet_id`, and the file's own "Deploy order" section says:

> The release live today (0.13.0) still reads `user_roles.vet_id` on Settings → Security, so on production this migration and the code in the same PR go together: apply it only as that release goes out.

So the safe order for `0127` alone is **deploy, then apply** — the mirror image of the rule every release in this sequence has followed, and the mirror image of the failure that broke `/adopt/[id]` on `0.10.1`. There, code shipped ahead of its schema. Here, schema would be removed ahead of the code that stopped needing it.

**Two mechanisms make the obvious workaround unavailable:**

1. **The runner has no way to apply a subset.** Its flags are `--status`, `--drift`, `--dry-run`, `--baseline`, `--env`; a run applies every pending file in order. So `0126` and `0128` cannot be applied while `0127` is held back. This is the same constraint that made `0108` and `0109` a single decision on 2026-09-29.
2. **`deploy.mjs`'s schema guard (#254) refuses a deploy whose commit carries unapplied migrations**, and has no override — the only flags are `--secrets`, `--skip-build`, `--no-mail`. So "deploy first, then apply" is refused by the very guard this session asked for after `0.10.1`.

**Therefore the only available order is: apply all three, then deploy immediately.** The consequence, stated plainly rather than discovered: **between the apply and the deploy finishing, Settings → Security will error for admins**, because the live `0.13.0` build reads a column that is no longer there. That window is the length of a deploy — minutes — and it affects one admin-only page, no public page and no data.

- [x] **Apply plan stated for the release manager:**
  1. `node scripts/apply-migrations.mjs --drift production >> deploy.log 2>&1`
  2. `--dry-run`, then apply all three — **and start the deploy straight away**, not after other work
  3. `check-public-views.mjs --env production` after, **owed rather than optional**: `0126` rewrites the `contacts` read policies for vets and volunteers, which is an access change
  4. Then the Pi
- [x] **`0128` is additive and safe in either order** — it adds `safety_stock` columns consumed by the new Purchasing page, so only the new code needs it
- [x] **`0126` is a narrowing, safe to apply early** — it drops and replaces `vet_read_contacts` and `volunteer_read_contacts`. Applying ahead of the deploy tightens what a vet or volunteer can read slightly early, which is the safe direction

## 4. Functional checks

- [x] Happy path works end to end — the register was loaded the way `scripts/deploy.mjs` loads it: `0.14.0`, `major: true`, `2026-10-02`, 5 notes, `unreleased` length 0
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: `releases` has twenty-two entries; `unreleased` is empty, its correct post-cut state
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [x] Boundary cases checked — four of five notes are the multi-line object form, covered by the before/after comparison in §2. The register resolves to 1 string and 4 objects, every note readable through `noteText()`, six-space indentation, CRLF preserved
- [x] **The release mail was built and read** — 5 bullets, 0 `[object Object]`. Note 1 is the one that matters here, and it was re-read from the parsed register after the rewrite rather than from the diff

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five; **is emailed** | mail built and read above |
| management | `/releases` | sees four — not the vet/volunteer contacts note | not verified on a deployed build at PR time |
| staff | `/releases` | sees the sign-out and the multi-clinic doctor note | not verified on a deployed build at PR time |
| vet | `/releases` | sees the sign-out, the doctor note and the contacts narrowing — the last two change their job | not verified on a deployed build at PR time |
| volunteer | `/releases` | sees the sign-out and the contacts narrowing | not verified on a deployed build at PR time |
| signed out | the sign-in lock | unchanged by this PR, though note 1 is about being sent there | unchanged by *this* PR |

- [x] Every role above tested — n/a as a per-role exercise: this PR changes the data the page renders, not who may see it. The cut carried four role tags across intact, which §2 verifies
- [x] A role that should not have access is blocked server-side — not re-verified and not claimed here. The release's own access changes are `0126`, `0127` and #289, covered by their own plans

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change in this PR. The release adds Management → Purchasing, covered by #295's plan
- [ ] Manual updated — n/a: this PR publishes notes; each feature updated the manual in its own PR
- [ ] Translatable strings go through the translation path — n/a: release notes are English only by design (#62)
- [ ] Mobile viewport (375px) — n/a: no layout change in this PR
- [ ] Browser console clean — n/a: no browser involved for this PR
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route
- [x] Any shared file touched checked from a second, unrelated page — `releases.ts`'s four consumers were exercised in §2 and §4
- [x] Nothing merged from `main` during `sync` was broken by this branch — 0 behind `8112e6a`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this is the release-cut step
- [ ] **Release notes.** — n/a: a release cut *removes* entries from `unreleased`. All five were written by the PRs that made each change; note 1's wording was corrected here on Lutan's instruction, which §1 records
- [ ] Non-obvious design choices recorded in `docs/decisions/` — n/a: no design choice in this PR. The `0127` ordering finding belongs to that migration's own file, which already states it
- [x] `README.md` still accurate — unaffected; it names no version
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `8112e6a` plus this branch's commits
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. `main` has moved during the preparation of seven of the last eight releases

### On the deployed build

- [ ] Deployed to test — deferred: this session, after merge. Before production
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan. **Worth most attention**: Management → Purchasing (new, and the one thing `0128` feeds), the Shelter Friend wizard's five steps, and that a vet sees only their own doctor's clinics
- [ ] Timezone-sensitive behaviour checked on test — deferred: release manager. **Relevant**: Purchasing works in periods (1 week / 2 weeks / 1 month) and flags counts "more than three weeks old"
- [ ] Public pages re-checked after a cache purge — deferred: release manager. Low relevance: no note changes a public page
- [ ] **`check-public-views.mjs --env production`** — deferred: release manager, after applying. Owed because `0126` rewrites contact read policies

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: release manager. **Expect 10**
- [x] Any new secret/env var exists in the Cloudflare environment — **one to check, and it is not from this PR**: `BACKUP_DRIVE_FOLDER_ID` is new and optional (`#296`), read by `backup.mjs` and the status tile. It is set where the backup runs, which is the Pi, not the Worker
- [x] **Release mail — this release sends, and note 1 is why it must.** `majorReleasesSince("0.13.0")` is `["0.14.0"]`. Expect `deploy: release mail for 0.14.0 [UAT]: sent N, skipped M`
- [x] **Both copies must be deployed** — the Worker by `node scripts/deploy.mjs --env production >> deploy.log 2>&1`, the Pi by `./scripts/pi/deploy-pi.sh`. **Claude can now run the Pi half over SSH** (set up 2026-10-02) up to its final `sudo systemctl restart lanna-care`, which still needs a person unless the sudoers rule is added
- [x] **Rollback** — not fully reversible: `major: true` sends mail. And `0127` drops a column, so rolling the code back to `0.13.0` would leave Settings → Security reading a column that no longer exists. **Rolling this release back means restoring that column, not just the Worker** — the first release in this sequence where rollback is not simply `wrangler rollback` plus a Pi rebuild

### Two items carried in from chat, neither caused by this release

- [x] **The MFA factor rotation is still open.** `docs/decisions/2026-10-02-backup-encryption-rollout.md` records under "What is not done" that MFA factors were not cleared and that Lutan's TOTP secret was in the unencrypted dumps, with `delete from auth.mfa_factors;` and re-enrolment recommended. Sessions and refresh tokens *were* rotated — a sign-out does not rotate a TOTP secret, so note 1's forced sign-out does not cover this. **Not a release blocker and not evidence of compromise**, which Lutan has confirmed; it is an audit-remediation step still marked open in his own record
- [x] **The Pi needs this release before Sunday 2026-10-04 03:00.** The same file: before that cron run the Pi must have the `backup.mjs` change, "or the cron makes a new `Backups/` in the app root". The Pi was at `14fef21` after the `0.13.0` deploy, which predates it. **Deploying this release to the Pi satisfies it** — so the Sunday deadline is a reason to finish this release rather than leave it cut
- [ ] The Pi's current state could not be checked while writing this — **both `lanna-pi.local` and `lanna-pi` stopped resolving**, having worked twenty minutes earlier. Deferred: release manager, to confirm the Pi is reachable before relying on the SSH path

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration in this PR. For the release, §3 sets out the ordering in full, including why the usual rule is inverted for `0127` and why the only available order is apply-then-deploy-immediately
- [ ] `--env production --dry-run` run and clean — deferred: release manager, on all three
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — deferred: Lutan. **`0127` drops a column, so this is the first release where this line is not a formality.** The encrypted Sunday backup is the current one; the first encrypted run was 2026-10-02 07:59 UTC
- [x] Apply plan stated — §3

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | medium | Note 1 described audit remediation as though a problem had been stumbled upon | **fixed** before cutting, on Lutan's correction — §1 |

Checked across the release rather than in this PR:

- **Thirteen PRs** (#286–#298), enumerated with `node scripts/release-prs.mjs 14fef21`: exit 0, **14 added migration and test-plan files cross-checked, no orphans**
- **All thirteen have a completed plan, but one is not where its name suggests.** #296 and #298 (`claude/backup-encryption-rollout`) added no plan of their own — they *updated* `docs/test-plans/backup-encryption.md` from #243 in `0.12.0`, which is the documented post-merge sign-off pattern. A name-based check reported it missing before the diff was read. **Worth knowing that `release-prs.mjs`'s cross-check cannot catch this class either**: it verifies that every *added* artifact belongs to a listed PR, so a PR that only modifies an existing plan is invisible to it
- None reports `Result: fail`; three report `pass with accepted defects`

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Note 1 as rewritten.** It is emailed to every admin and describes a security matter. The wording is Lutan's correction applied by me; it should be read once more as the shelter's own statement | `src/lib/releases.ts`, the `0.14.0` entry |
| 2 | **The title**, which becomes the subject line. Mine, unreviewed, and it leads with "Encrypted backups and a one-off sign-out" — which puts the security item first in every admin's inbox. That may be right, or it may be better led by the Purchasing page | `src/lib/releases.ts` |
| 3 | The four role tags as a set — particularly that the contacts narrowing is tagged `vet, volunteer`, so the people losing visibility are told and management is not | `src/lib/releases.ts` |
| 4 | **Settings → Security after the deploy**, specifically. It is the page `0127` affects, and the one that will have been briefly broken between the apply and the deploy | `lannacare.org` |
| 5 | After both deploys: `/releases` shows `0.14.0` to a signed-in user — the external check that the **Pi** took it | `lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — five items are open. Items 1 and 2 matter most: this release mails, and note 1 concerns a security matter

Manual verification by: pending: Lutan to re-read note 1 as rewritten (item 1), judge the title (item 2), confirm the role tags (item 3), check Settings → Security after the deploy (item 4) and `/releases` on the Pi (item 5)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the release manager — this session, with the items above outstanding

Result: pass
