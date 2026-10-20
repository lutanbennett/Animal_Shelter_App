# Feature test plan — cut-release-0-38-0

## Header

| | |
|---|---|
| Feature | Cut release `0.38.0`: move the five notes in `unreleased` into a new `0.38.0` entry, **add a sixth** for the visiting vet's medical cells whose outstanding step this release closes, **`major: true`**, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-38-0` @ `C:\Development\Animal_Shelter_cut-release-0-38-0` |
| PR | **#775 — guessed before opening and re-read afterwards, which is what makes it true.** Three cuts in a row have been right (#731, #743, #759); this is the fourth guess. Confirmed from `gh pr create`'s own output, not assumed |
| Dev server | not driven — `/releases` is behind sign-in; see §5 |
| Tested by / date | Claude (production release manager session) / 2026-10-20 |
| Carries a migration? | no — the release's **three** (`0230`, `0231`, `0232`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.38.0` entry, add one more for the visiting vet's medical cells, **`major: true`** on Lutan's call in chat (2026-10-20), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib. `git status --porcelain` showed exactly those two files before this plan was added
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the new section on `/releases`; **and because `major: true`, every admin is mailed.** That is the irreversible part of this release and it is Lutan's decision, taken in chat on 2026-10-20 in answer to the case put to him. The matrix in §4 says what each role sees
- [x] Anything explicitly **out of scope** written down — the cut does not re-tag, reword or reorder another PR's note. **Worth the release manager's notice, and it is good news this time:** unlike `0.37.2` and `0.37.0`, **no role sees an empty section** — the two untagged notes (the cover-role home screen, and medical photos on appeals) reach everyone, so the thinnest role still sees two notes. Measured in §2, not assumed

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically **against `origin/main`'s own copy of the file**, imported and compared as values rather than regex-scraped, so role tags are compared too.

```
5 note(s) read from origin/main's unreleased
6 note(s) in the new 0.38.0 entry
  PASS  origin/main's unreleased held 5 notes (read 5) — a non-empty source to compare against
  PASS  the new entry holds 6 notes (read 6)

Note-by-note comparison (origin/main unreleased -> 0.38.0):
  [0] roles=["admin","management","doctor"] Adding or editing a prescription now has Morning, Lunch and Evening ...
  PASS        carried across byte-for-byte (text 356 chars)
  [1] roles="everyone" If you cover another role for a while, your Home screen now keeps ea...
  PASS        carried across byte-for-byte (text 231 chars)
  [2] roles="everyone" A fundraising appeal can now show a medical photo, chosen one by one...
  PASS        carried across byte-for-byte (text 194 chars)
  [3] roles=["admin","management","second_in_command"] Make a meme: the Residents tab now has a search box. Type part of a ...
  PASS        carried across byte-for-byte (text 183 chars)
  [4] roles=["admin","management","doctor"] You can now add videos of a resident in the same Photos section as p...
  PASS        carried across byte-for-byte (text 388 chars)

ADDED in the cut (expected exactly 1, the 0230 vet note):
  + roles=["admin","management","doctor"] The visiting vet can now record prescriptions, diets, weights, visits and procedures for residents at their own clinic.
  PASS  exactly 1 note added, not absorbed into a total (found 1)
  PASS  the added note is the vet one
  PASS  the added note's roles are admin, management, doctor
  PASS  no note lost (0 missing)
  PASS  unreleased is now empty (0)

Entry: version=0.38.0 date=2026-10-20 major=true
Title: Videos of residents, prescription times of day, and the visiting vet can record medical notes
  PASS  version is 0.38.0
  PASS  date is 2026-10-20
  PASS  major is true — this release MAILS every admin (Lutan's call, 2026-10-20)
  PASS  latestRelease is the new entry

package.json version=0.38.0  newest entry=0.38.0
  PASS  package.json equals the newest entry

majorReleasesSince("0.37.2") -> ["0.38.0"]
  PASS  returns exactly [0.38.0] — so the admin mail goes out for this release and nothing else
  PASS  all 56 entries are in descending version order
  PASS  every note renders as text, no [object Object]/undefined, no unknown role

What each role sees in 0.38.0:
  admin                6 note(s)
  management           6 note(s)
  second_in_command    3 note(s)
  head_of_maintenance  2 note(s)
  head_of_medical      2 note(s)
  doctor               5 note(s)
  volunteer            2 note(s)

verify-cut: all checks passed
```

**The verifier does not locate anything — it imports both modules**, `origin/main`'s copy and this branch's, and compares note objects as values. Its first two assertions exist only to prove the comparison was not empty (`5 note(s) read from origin/main`, `6 note(s) in 0.38.0`), because `0.37.1`'s verifier passed vacuously by finding the `[]` of the type annotation `ReleaseNote[]`. **The one note added in the cut is printed as an addition rather than absorbed into a count**, since an invented note and an intended one are indistinguishable from a total.

**The `majorReleasesSince` assertion is the live one this release, and it is the right way up for the first time in four releases.** `majorReleasesSince("0.37.2")` returns **exactly `["0.38.0"]`**, asserted mechanically rather than by reading the `major:` flag. So on this release the **presence** of `deploy: release mail for 0.38.0` in the production deploy log is the check, and its **absence** would be the defect — the inverse of `0.37.2`, `0.37.1` and `0.36.1`. This is the irreversible step in the release.

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `d69e2bd3`, which was the tip; re-checked before the PR was opened
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — output pasted below, unedited. It prints `test=0` as well as the three the template names

```
=== gates: build exited 0 after 116s

gates: typecheck=0 lint=0 test=0 build=0
```
- [x] CI green on the PR (runs the same three) — **all 8 checks passing, 0 failing, `state: OPEN`, `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`** on PR #775. The run's `headSha` was read from `gh run view` and matched against this branch's HEAD rather than taken from the PR bar's cached reading: `completed success 7f66c26c run=39417293047` against `HEAD=7f66c26cf33278f08044d0bb44bf83150b7cd71d`. **The first run was green by construction for the tenth release running**, because the plan was written and committed before the PR was opened. `test-plan` and `audit` both passed. **Ticking this line is itself a commit, so a second run follows and is expected**; it is confirmed against the new HEAD before the merge

```
audit                  pass   11s
cards-count            pass   8s
check                  pass   1m58s
migration-numbers      pass   12s
new-policy-role-names  pass   8s
public-views           pass   2m12s
script-integrity       pass   17s
test-plan              pass   8s
```
- [x] `node scripts/check-release-guards.mjs` — all 16 guards `ok`, exit 0

```
ok   a cut release with nothing unreleased passes
ok   unreleased notes are a problem
ok   package.json behind the newest release is a problem
ok   a migration the database lacks is refused
ok   a database holding every migration passes
ok   schema ahead of code is fine
ok   could not ask warns and does not refuse
ok   clean release, clean schema: go
ok   unreleased refuses
ok   missing migration refuses
ok   could not ask alone goes ahead, with its warnings
ok   --force goes ahead and keeps every problem for the record
ok   --force with nothing to override records nothing
ok   --env test is not guarded
ok   --force without a reason is refused
ok   --drift reads the arrays it prints from driftReport()
```

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` The release's **three** (`0230_doctor_medical_cells.sql`, `0231_public_photos_exclude_videos.sql`, `0232_calendar_two_way_schema.sql`) merged in #763, #764 and #769, are applied to dev, and are applied to production as a release step **before any deploy**.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration in this PR`. For the release: `origin/main` tops out at `0232`, so the next free number is **`0233`**, read from the tree rather than carried forward from the handover, which said `0230`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`. Read for the release: production **`230 applied, 3 pending`** (`0230`, `0231`, `0232`) against project `dbkodyyxxhtygxcxmfcu`; dev **`233 of 233`, `No drift: test matches origin/main`**, 0 in each direction
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR.` For the release it is a pre-production gate and is recorded under §8 against the production apply. **Which of the three dry-run cases this release got is recorded in `docs/releases/` rather than predicted here.** The per-file rollback trap has no surface this time: none of the three reads an object an earlier *pending* file creates — `0230` inserts into `role_permissions`, `0231` rebuilds a view `0217` already defined, `0232` creates a new table and adds columns to the existing `clinic_visits`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`. Dev holds all 233 with no drift either way (`--drift test`: `No drift: test matches origin/main`, exit 0)
- [ ] File is re-runnable — `n/a: no migration in this PR`. All three are, and each says how: `0230` uses `on conflict … do update set level = greatest(...)`, so re-running **raises a cell and never lowers one**; `0231` is `create or replace view`; `0232` is `create table if not exists` and `add column if not exists`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR`. **For the release, the one narrowing was read in code rather than assumed safe**: `0231` adds `media_kind = 'photo'` to `public_resident_photos`, and `0229` added that column as `text not null default 'photo'`, so **every pre-existing attachment row is already `photo` and nothing drops out of the public view**. `0230` only inserts permission rows; `0232` adds nullable columns
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`. Exercised on their own branches, in their own plans' section 3 harnesses
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`. For the release: **`0230` states its revert in its own header** (`delete from role_permissions where role_id = … and activity like 'medical.%'`); `0231` is undone by restating `0217`'s view; `0232` is additive and undone by dropping what it adds. **None of the three deletes a live row**, which is the difference from `0.37.2`, whose `0227` did
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`, but stated for the release: **`0230`, then `0231`, then `0232`**, project `dbkodyyxxhtygxcxmfcu`, one run of `node scripts/apply-migrations.mjs --env production`, **after this cut merges and before any deploy**

### `0231` has a consumer header that names app code, and it ships in this very release

The handover's item 16 asks for a `-- consumer:` header to be checked against the release rather than the day it was written. This release is the case that matters, and it is the **opposite** of `0.37.2`, where all three declared `none`:

- [x] Read in full, per file. `0230` declares **`-- consumer: none`** and `0232` declares **`-- consumer: none`** (with a note that a later stream will read it). **`0231` declares `-- consumer: src/app/adopt/[id]/page.tsx, src/app/api/videos/[fileId]/route.ts`** — both of which are added by **#764, in this release**. So a `-- consumer:` warning on this apply is **expected and is the safe direction**: the consumer is not yet in the release assumed live, and the deploy that follows minutes later is what brings it in. **A warning here is not a reason to stop**; its absence would be the more surprising result, and either way the actual output is recorded in `docs/releases/`
- [x] **Ordering follows from it, and it is the runbook's own order anyway.** `0231` must be applied **before** the code that reads it is deployed, which is what the runbook already requires — apply, then deploy. Without it an approved video would be listed by the public photo view and drawn as a broken image, and `is_public_drive_file` would call its file public
- [x] **Three migrations in one release, and none touches another's objects** (handover item 17). `0230` writes `role_permissions`; `0231` replaces the `public_resident_photos` view; `0232` creates `calendar_sync_state` and adds two columns to `clinic_visits`. **There is no shared object between them**, so the "did the later one revert the earlier" question has no surface this release. Checked by reading all three files, not by their titles

### One release-note promise comes true, and the note was moved to the PR that closes it

- [x] **`doctor-medical-cells` (#763) wrote its release-notes line as `n/a`** — *"production does not have 0230 yet, so no vet can prescribe until it is applied; the note goes in the PR that closes that step"*. **This release applies `0230`**, so this release closes the step, and by the rule written after #518's false note reached every admin in `0.25.0` the note belongs in **this** PR. It is note `[5]`, added here and printed as an addition in §2. Wording put to Lutan in the opening message before it was written
- [x] **The other two `n/a` lines in the release were checked for the same thing and correctly need nothing.** `videos-app` (#764) already has its note in `unreleased` — carried across as `[4]` — and its `n/a` was about the tick, not a missing note; `appeals-medical-photos-app` (#767) likewise has its note as `[2]`, and the `0216` apply its line named is long since on production (read as `230 applied`). **So one note was owed and one note was added**; nothing else in the release ships an ability invisibly

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.38.0` entry with six notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy, and `worker/release-mail.mjs` reads it to decide who is mailed — **this release, every admin**
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a release entry is added once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — two empty states matter and both were checked. `unreleased` being empty is asserted **not** a problem by `check-release-guards.mjs` (`clean release, clean schema: go`). The other is the one `0.37.2` and `0.37.0` produced and **this release does not**: with two untagged notes, **every one of the seven roles sees at least two notes**, so there is no empty `0.38.0` section anywhere. Measured per role in §2's final block
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the six note lengths were **measured, not estimated**: 356, 231, 194, 183, 388, 119. The longest is **388 characters**, well under the 961 `/releases` has already rendered, so this release carries no new rendering boundary. Role tags were compared against the live `ReleaseRole` list so a retired `staff` tag could not slip through; `date` parses as `YYYY-MM-DD`; the order is asserted newest-first across all 56 entries, and all 309 notes in the file are asserted to render as real text

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all six, and **receives the release mail**, because `major: true` | asserted via `majorReleasesSince("0.37.2")` returning exactly `["0.38.0"]`; the **presence** of the mail line is checked on the deploy in §8 |
| management | `/releases` | sees **six** — every note | tags asserted value-for-value in §2 |
| second_in_command | `/releases` | sees **three** — the two untagged, plus the meme search box | tags carried across unchanged from the feature PRs |
| head_of_maintenance | `/releases` | sees **two** — the cover-role home screen, and medical photos on appeals | the two untagged notes reach every role |
| head_of_medical | `/releases` | sees **two** — the same two | as above |
| doctor | `/releases` | sees **five** — including prescriptions, videos, and the new vet note | the added note is tagged `doctor`, asserted in §2 |
| volunteer | `/releases` | sees **two** — the same two untagged notes | as above |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served, enumerated mechanically in §2 rather than reasoned from the tags. No role's visibility is **narrowed** by this PR, and the tags that decide it are asserted identical to `origin/main` for all five carried notes
- [x] A role that should not have access is blocked server-side — unchanged: this PR touches no route, middleware or policy

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path — `n/a: release notes are not translated through that path`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff`, and the longest note is well under one `/releases` has already rendered
- [x] Browser console clean — `n/a: not driven.` Nothing in this diff executes in the browser beyond the data it renders, asserted free of `[object Object]` across every release and of bare `undefined`/`NaN` in the entry being cut
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — the three consumers of this file are checked where they run: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, exit 0), `worker/release-mail.mjs` bundles it to decide the mail, and the Worker answers `/api/releases/current` from it (exercised by the `build` gate, exit 0)
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is loaded, not read, by all three consumers above, and by the verifier in §2
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The release-level decisions — **major** rather than minor, and moving the vet note into this PR — are recorded in `docs/releases/` with Lutan's reasoning
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: this PR is the release cut — ticking would be false because unreleased gained no line, it was emptied.` **This is the one place that needs reading rather than skimming**, because this cut **does** add a user-visible note: the visiting vet's medical cells, note `[5]`. It is not a new `unreleased` line, which is what this checklist line and the checker are about; it is a note added directly to the release entry, deliberately and under `docs/decisions/2026-10-11-release-note-truth-rule.md` — the note goes in the PR that closes the outstanding step, and this release is what closes it. **Two things deliberately have no note**: `0232`'s calendar objects, because nothing reads them yet and nobody would notice, and **the vet calendar itself**, which stays configured on test only and dormant on production (Lutan, 2026-10-19: *"LEAVE ON TEST UNTIL WE DEPLOY 2 WAY & TEST IT"*)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decisions record were measured, not reasoned** — every number in this plan is a tool's output: the six note lengths (356, 231, 194, 183, 388, 119), the 56-entry and 309-note counts, the per-role note counts, production's `230 applied, 3 pending`, dev's `233 of 233, No drift`, the 16 release guards, `next@16.3.8` read from the installed package against `package.json`, and the three `-- consumer:` headers read from the files rather than from the handover

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; **re-asserted after the merge, and `release-prs.mjs` re-run against the merged release SHA**, because on `0.37.1` a PR merged mid-release and changed it
- [ ] Deployed SHA matches the tested SHA — `deferred: the production release manager`, after the four builds. All four must come from the one release SHA, as they have for seventeen releases

### On the deployed build

- [ ] Deployed to test — `deferred: the production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: the production release manager`. The filled copy of `docs/release-smoke-test.md` goes to `docs/releases/`. **What is already on test was read before starting**: both environments are on a clean `0.37.2` @ `3e94268e`, read from `/api/version` on both hosts, with nobody mid-test and nothing on test worth preserving
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"` — the one date in it is a literal. **Nor does the release introduce one**: unlike `0.37.2`, none of the three migrations schedules a job or adds a time-dependent cutoff. `0232` adds `calendar_event_updated_at`, but nothing reads it yet
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change in this diff.` The release contains two, both covered by their own PRs' plans: the **500 MB / five-minute video cap** (refused in the browser and again by `start`), and the **Drive-space tile's amber at 80% / red at 95%** bands
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the blocks in §2 are copied as printed, including the verifier's own closing line
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked` on **both** environments, so there is no anonymous public page to re-check, and the edge-cache `HIT` check is vacuous because the gate page is served `no-store`. **But the purge itself is not n/a**: it is a required runbook step after every Pi deploy and it is the release manager's. Its success path executed for the first time on `0.37.2`, so this is the second real run

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: Lutan`, on his production Worker deploy; the log is read by the release manager afterwards, grepping for the **project ref** rather than the arrow, which does not survive the UTF-16 conversion
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `deferred: the production release manager`. **Expect 13 on production and 13 on test**, corrected on `0.37.2`: the old "14 on test, the extra is `SCRATCH_RESTORE_DB_URL`" was wrong and that name was in neither list. **A difference between the two is worth reading rather than assuming normal**
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither does the release. Videos use the Drive credentials already in place; `0230`–`0232` need no key. **One is outstanding but not for this release**: a second Cloudflare zone id for the purge, which `tooling-small-fixes` (#762) records as Lutan's step at cutover, not now
- [ ] **The release mail MUST go out, and its presence is the check.** `deferred: the production release manager`, on Lutan's production Worker deploy. **This is the right way up for the first time in four releases** — `majorReleasesSince("0.37.2")` returning exactly `["0.38.0"]` is asserted in §2, so the production log must carry `deploy: release mail for 0.38.0 [UAT]: sent N, skipped M`, and **its absence would be the defect**. Test must **not** mail (`RELEASE_MAIL_ENV` is `""` there). **Do not stop at "sent 1"**: the inbox is checked for the message from `releases@lannacare.org` with `0.38.0` in the subject, because that line is the relay accepting it, not delivery. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED`, a known open question rather than a failure
- [ ] **`0227`'s retention job is actually scheduled on production** — `deferred: Lutan`, and **deliberately still open**, carried from `0.37.2` rather than silently dropped. Nothing reports on the job, the read was refused as `[Production Reads]` on `0.37.2` and was not retried blind. **Put to Lutan again in this release's opening message; he did not ask for it to be retried, so it stays open and is recorded as a stated gap**, with the backlog items that cover both the one-minute check and the fix

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. **But the release does, and that is this release's one real ordering constraint:** `0231` declares `src/app/adopt/[id]/page.tsx` and `src/app/api/videos/[fileId]/route.ts` as consumers and both arrive in #764, in this release. The apply therefore goes **before** the deploy — which is the runbook's order anyway, and which `deploy.mjs` enforces by refusing a production deploy while the database lacks a migration that is on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `deferred: the production release manager`, from the **main checkout** (the worktree has no `.env.deploy.production`). **Which of the three dry-run cases it returns is recorded rather than predicted**, and **one `-- consumer:` warning is expected**, for `0231`, in the safe direction
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **none of the three is destructive**, which is the difference from `0.37.2`, whose `0227` deleted live rows nightly. `0230` inserts and raises; `0231` replaces a view definition; `0232` is additive. **`0231` is the one that *rewrites* rather than adds**, and what it rewrites is a view, not data. The backup position is unchanged, and **the README restore recipe has still never been exercised** — fifteen releases unanswered and still the cheapest item on the outstanding list
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0230`, `0231`, `0232` in that order, project `dbkodyyxxhtygxcxmfcu`, one run, **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a rebuild there pinned to `3e94268e` (`0.37.2`); a `wrangler rollback` reverts only the Worker fallback. **None of the three migrations is reverted by either, and each is harmless left in place** — the schema-first rule working. `0230` would leave the doctor role holding its medical cells with no code using them, which grants nothing a login can reach; `0231` would leave the public photo view excluding videos, which changes nothing while no video exists; `0232`'s objects are read by nothing. **The one thing a rollback cannot undo is the mail.** `major: true` means every admin is written to during Lutan's deploy, and that is irreversible — which is exactly why the major-versus-minor call is his and was taken before anything was cut

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low (process, no impact on this release) | **`release-prs.mjs` reported a DISAGREEMENT, as the handover predicted it would — for the fourth release running.** One file added in the range — `docs/test-plans/test-plan-advisory.md` — belonged to no PR in its list. Traced by hand to **#765**, whose merge commit `4b244fea` is the commit that introduced the file, confirmed with `gh pr view 765`. So the range holds **15 PRs**: #760–#774 inclusive, of which **#760 and #761 are `0.37.2`'s own record and handover PRs** and belong to that release — leaving **13 in this one**. This is the fourth consecutive release to report a disagreement alongside exit 0, and the handover is right that it is simply what a squash merge looks like to this script | **Accepted** — the script is right to flag it and the trace is recorded rather than the list being ticked past. Per the script's own instruction, the pre-deploy test-plan item was **not** ticked against its list: all plans were checked directly with `check-test-plan.mjs --base 3e94268e`, which reports them complete and correct, exit 0 |

No defect is in shipped code, and none changes what this release contains.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.38.0` section renders correctly on `/releases` for an admin, and **that the release mail arrived** — which is the live check this release, in the opposite direction from the last three | `/releases` signed in, and the admin mailbox |
| 2 | **Video playback on a real iPhone and a real Android.** The note promises a video "plays right on the page" and nobody has watched it do that on a real handset. iOS Safari in particular refuses a video whose server cannot answer a range request, which is the whole reason the app streams it through its own route | A resident's Photos section on the deployed build, on a real phone |
| 3 | A medical photo on a fundraising appeal — the three rows in that plan's own table | Appeals, signed in, in dev |
| 4 | The meme maker's new Residents search box, on a phone | Make a meme → Residents tab |
| 5 | The cover-role home screen switch, by someone with a cover login | Home, on a phone |
| 6 | The prescription Morning / Lunch / Evening ticks — the three items in that plan's own table | Add or edit a prescription |
| 7 | **Whether `0227`'s nightly retention job is scheduled on production.** One `SELECT` against `cron.job`. Still open from `0.37.2`; the read was refused by the classifier and not retried | Supabase SQL editor on `dbkodyyxxhtygxcxmfcu`, or a permission rule |

These seven are the release's stated verification gaps. **Lutan was given the whole list as an explicit question before anything was cut** and chose to ship with them recorded rather than hold the release — the same call as `0.15.0` and for the same reason: every one is a look at something, not a known fault.

## Sign-off

- [x] All of the above either ticked or `n/a: <reason>`

Automated checks by: Claude Opus 5  Date: 2026-10-20

Manual verification by: pending: the seven items in Left for manual verification

Result: pass
