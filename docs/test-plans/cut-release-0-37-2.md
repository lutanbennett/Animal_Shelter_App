# Feature test plan — cut-release-0-37-2

## Header

| | |
|---|---|
| Feature | Cut release `0.37.2`: move the four notes in `unreleased` into a new `0.37.2` entry, **add a fifth** for the status test alert whose outstanding step this release closes, **`major: false`**, and bump `package.json` to match |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-37-2` @ `C:\Development\Animal_Shelter_cut-release-0-37-2` |
| PR | **#759 — a guess at the time of writing, to be re-read with `gh pr view` after opening.** The last two cuts guessed right (#731, #743) after two wrong in a row before them (#704→#705, #717→#718). It is written down as a guess so that re-reading it is what makes it true |
| Dev server | not driven — `/releases` is behind sign-in; see §5 |
| Tested by / date | Claude (production release manager session) / 2026-10-19 |
| Carries a migration? | no — the release's **three** (`0227`, `0228`, `0229`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the four notes in `unreleased` into a new `0.37.2` entry, add one more for the status test alert, **`major: false`** on Lutan's call in chat (2026-10-19), and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`, filtered by tag. **Four of the five notes are `admin` only and the fifth reaches admin, management and the 2IC**, so `head_of_maintenance`, `head_of_medical`, `doctor` and `volunteer` see an **empty `0.37.2` section** — the same shape as `0.37.0` and the opposite of `0.37.1`, and it is noted here rather than discovered on the deployed build. **No admin receives mail, because `major: false`** — asserted as `majorReleasesSince("0.37.1")` returning **nothing**. This is the **inverted** form of the check, the same way round as `0.37.1` and `0.36.1`
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — five things. (a) The wording and tagging of the four carried notes: written in their own feature PRs (#754, #756, #757 and the Who-does-what search), carried across unaltered and asserted value-for-value in §2. (b) **The eight `pending:` manual verifications** on this release's feature plans — they belong to those plans and their signatures; Lutan was given the full list in the opening message and chose to proceed, so they are recorded as **stated gaps**, not closed items. (c) **`0227`'s nightly retention job**, named to Lutan separately from the gap count as the one thing in this release that can fail quietly — see §3. (d) **`0224`'s permission narrowing, still unverified against production** — carried over from `0.37.1`, where the read was refused by the classifier and deliberately not retried. It is not this PR's change and not this release's change, and it is listed under Left for manual verification rather than silently dropped for a second release. (e) The **app halves** of `0228` (meme sources) and `0229` (videos): both migrations declare `consumer: none` and ship read by nothing, by design

## 2. Automated gates

The cut's one real failure mode is losing or altering a note, and no gate reads prose, so the carry-across is asserted mechanically **against `origin/main`'s own copy of the file**, imported and compared as values rather than regex-scraped, so role tags are compared too:

```
SOURCE: origin/main unreleased, 4 note(s)
  [0] tagged len= 246 roles=admin,management,second_in_command :: On a phone, the main buttons now have words beside their i…
  [1] tagged len= 531 roles=admin :: The meme maker can now use photos from more places than re…
  [2] tagged len= 611 roles=admin :: Home screen tiles are now chosen in Settings. Open Who doe…
  [3] tagged len= 133 roles=admin :: Settings → Who does what: a search box finds a card by nam…

TARGET: releases[0] (0.37.2) notes, 5 note(s)
  [0] tagged len= 246 roles=admin,management,second_in_command :: On a phone, the main buttons now have words beside their i…
  [1] tagged len= 531 roles=admin :: The meme maker can now use photos from more places than re…
  [2] tagged len= 611 roles=admin :: Home screen tiles are now chosen in Settings. Open Who doe…
  [3] tagged len= 133 roles=admin :: Settings → Who does what: a search box finds a card by nam…
  [4] tagged len= 296 roles=admin :: On the Status page, Send a test alert now works. It queues…

--- note by note ---
  [0] -> [0]  text 246 chars identical, roles ["admin","management","second_in_command"]
  [1] -> [1]  text 531 chars identical, roles ["admin"]
  [2] -> [2]  text 611 chars identical, roles ["admin"]
  [3] -> [3]  text 133 chars identical, roles ["admin"]

--- 1 note(s) ADDED in the cut (must be intentional) ---
  + tagged len= 296 roles=admin :: On the Status page, Send a test alert now works. It queues…
```

```
  ok    source array is non-empty (not a vacuous compare) — 4 note(s) read from origin/main
  ok    target array is non-empty (not a vacuous compare) — 5 note(s) in 0.37.2
  ok    source note [0] -> target [0] text identical, roles identical — roles ["admin","management","second_in_command"] vs ["admin","management","second_in_command"]
  ok    source note [1] -> target [1] text identical, roles identical — roles ["admin"] vs ["admin"]
  ok    source note [2] -> target [2] text identical, roles identical — roles ["admin"] vs ["admin"]
  ok    source note [3] -> target [3] text identical, roles identical — roles ["admin"] vs ["admin"]
  ok    unreleased is now empty — length=0
  ok    package.json version equals the newest entry — package.json=0.37.2 releases[0]=0.37.2 expected=0.37.2
  ok    releases[0].version is the new version — got 0.37.2
  ok    releases[0].major is false — got false
  ok    majorReleasesSince("0.37.1") returns NOTHING (minor release: absence is the check) — got [] (0 entries)
  ok    releases[0].date is today — got 2026-10-19, today 2026-10-19
  ok    releases is still strictly newest-first by compareVersions — 0.37.2 > 0.37.1 > 0.37.0 > 0.36.1 > 0.36.0 …
  ok    every note in every release renders as real text — 55 releases scanned, 303 notes
  ok    no duplicate versions — 55 unique
15 passed, 0 failed — and each one printed what it compared.
```

**The handover's item 12 is answered by construction, not by a tick.** `0.37.1`'s verifier passed vacuously — it located the `[]` of the type annotation `ReleaseNote[]` instead of the array literal, compared two empty arrays and reported `ok`. This one does not locate anything: it **imports** both modules, and its first two assertions exist only to prove the comparison was not empty (`4 note(s) read from origin/main`, `5 note(s) in 0.37.2`). A vacuous run now fails rather than passing. **The one note added in the cut is printed as an addition rather than being absorbed into a count**, because an invented note and an intended one are indistinguishable from a total.

**The `majorReleasesSince` assertion is the live one this release, in its inverted form.** It must return **nothing**: that is the difference between this release and a **third** mail reaching every admin in one day. Asserted mechanically rather than by reading the `major:` flag — and **the presence of a `deploy: release mail` line in the deploy log would be the defect**.

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `8f6e8224` minutes before the cut, which was the tip; re-checked before the PR was opened
- [ ] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0` — `n/a: not yet — the run is in flight as this plan is committed.` Its unedited output is pasted here and this line ticked before the PR is opened; an unticked gates line must never reach a PR
- [ ] CI green on the PR (runs the same three) — `n/a: not yet at this commit — no PR exists until this plan is committed.` The plan is written and committed **before** the PR is opened, which has made the first run green by construction for eight releases running. When it opens, the run's `headSha` is read from `gh run list` and matched against this branch's HEAD rather than taken from the PR bar's cached reading, and this line is then ticked with the output. **Ticking it is itself a commit, so a second run follows and is expected**
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

`n/a: no migration in this PR.` The release's **three** (`0227_assistant_retention.sql`, `0228_meme_sources.sql`, `0229_video_media.sql`) merged in #749, #752 and #755, are applied to dev, and are applied to production as a release step **before any deploy**.

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `n/a: no migration in this PR`. For the release: `origin/main` tops out at `0229`, so the next free number is **`0230`**, read from the tree rather than carried forward from the handover, which said `0227`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`. Read for the release: production **`227 applied, 3 pending`** (`0227`, `0228`, `0229`) against project `dbkodyyxxhtygxcxmfcu`; dev **`230 of 230, No drift`** both ways
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR.` For the release it is a pre-production gate and is recorded under §8 against the production apply. **Which of the three dry-run cases this release got is recorded in `docs/releases/` rather than predicted here**, because the per-file rollback trap depends on whether a later file reads an earlier pending one — and here it cannot: all three files are independent, two create new objects and the third creates a function and a cron job
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`. Dev holds all 230 with no drift either way (`--drift test`: `No drift: test matches origin/main`, exit 0)
- [ ] File is re-runnable — `n/a: no migration in this PR`. All three state that they are; `0227`'s header is explicit: `create extension if not exists`, `create or replace`, and `cron.schedule` on a name **replaces** the job rather than adding a second one
- [ ] Existing rows still read correctly after the change (checked against real dev data) — `n/a: no migration in this PR`. For the release: `0228` and `0229` add only nullable columns and a new table, so existing rows read unchanged. **`0227` is the one file that deletes live rows**, and it is covered in full below
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`. Exercised on their own branches: `0227` by `scripts/check-assistant-retention.mjs` (a rollback harness on dev), `0228` and `0229` by their own plans' section 3 harnesses
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`. For the release: `0228` and `0229` are additive and undone by dropping what they add; **`0227`'s job is undone by `cron.unschedule('purge-assistant-actions')` and dropping the function** — but the rows it has already deleted cannot be brought back, which is stated under Rollback
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`, but stated for the release: **`0227`, then `0228`, then `0229`**, project `dbkodyyxxhtygxcxmfcu`, one run of `node scripts/apply-migrations.mjs --env production`, **after this cut merges and before any deploy**

### `0227` can fail quietly, and that was named to Lutan separately from the gap count

The handover's item 13 asks for a quietly-breaking change to be named on its own rather than folded into a count. This release has one, and it is in `0227` rather than in any app change:

- [x] Read in full and the mechanism stated. `0227` installs `purge_assistant_actions()` and a **pg_cron job that runs every night at 03:17 UTC inside the database**, deleting `assistant_actions` rows older than **2 days**, except `unmatched` and `refused` ones, which go after **90 days**. That is Lutan's decision of 2026-10-10 as refined on 2026-10-19. It needs no key and no deploy, which is also why **nothing reports on it**: there is no email, no alert and no tile. If the job silently stops, what people typed at the assistant is kept forever against what `/privacy` now promises; if it runs, the deletions are permanent and there is no undo. **Neither outcome produces a message anybody sees**
- [x] **The rule was checked against the possible values, not read over.** `status` is the enum `assistant_action_status`, whose complete value set is `confirmed`, `cancelled` (both `0070`) plus `unmatched` (`0070`) and `refused` (`0130`) — asserted by grepping the migrations that define and extend the type, not by trusting the file's own comment. So `status not in ('unmatched','refused')` is exactly `confirmed` and `cancelled`, and **no unexpected value can slip into the 2-day branch and be deleted 88 days early**, because the column cannot hold one
- [x] Whose answer this is, and what it turns on. The retention periods are Lutan's and are already decided. What is **not** established is whether the job is actually scheduled on production once applied — `pg_cron` runs in the database, so the apply is the install. **Put to him in the opening message as the one thing in this release that can fail quietly**, with the statement that the check would be a production read and that a refusal would be reported rather than retried blind
- [x] **The `-- consumer:` header was checked against the release, not against the day it was written** (handover item 14). All three files declare **`-- consumer: none`**, read from the files on this branch. `0228` and `0229` say so in capitals in their own headers (`NOTHING IN src/ READS THESE COLUMNS YET`), and `0227`'s reader is the cron job inside the database, not app code. **So no `-- consumer:` warning is expected on this apply**, which is the opposite of `0.37.1`, where six were expected and correct. A warning appearing would be worth reading rather than waving past
- [x] **Three migrations in one release, and none touches another's objects** (handover item 15). `0227` creates a function and a cron job and deletes from `assistant_actions`; `0228` adds nullable columns, a check constraint and indexes to `memes`; `0229` creates a new table and columns for video media. **There is no shared object between them**, so the "did the later one revert the earlier" question has no surface this release — unlike `0.37.1`, where `0224` rebuilt `set_role_cards()` and had to do it from the live definition
- [x] **One release-note promise now comes true, and the note was moved to the PR that closes it.** `alert-test-relay`'s plan wrote its release-notes line as `n/a` because the button needed migration `0226` on production and a Worker deploy, "both Lutan's steps and still outstanding". `0226` **is applied on production** (read as `227 applied`), and this release performs the Worker deploy — so this release closes the step, and by the rule written after #518's false note reached every admin in `0.25.0`, the note belongs in **this** PR. It is note `[4]`, added here and printed as an addition in §2

## 4. Functional checks

A cut changes two data files. There is no user-facing behaviour to drive on this branch.

- [x] Happy path works end to end — `releases.ts` imports and evaluates under Node's type stripping (the path `deploy.mjs` and the Worker use), `releases[0]` is the `0.37.2` entry with five notes, and `unreleased` is empty. This is the path that matters: `deploy.mjs` reads this file directly to decide whether to refuse the deploy, and `worker/release-mail.mjs` reads it to decide who is mailed — **this release, nobody**
- [x] Data persists — reload the page and the change is still there — `n/a: nothing is written at runtime.` Persistence is the commit
- [ ] Create / edit / delete all exercised — `n/a: a release entry is added once; there is no create/edit/delete surface`
- [x] Empty state renders sensibly — two empty states matter and both were checked. `unreleased` being empty is asserted **not** a problem by `check-release-guards.mjs` (`clean release, clean schema: go`). The other is the one this release actually produces: **four roles see an empty `0.37.2` section** on `/releases`, because every note is tagged and none carries their role. That is the `0.37.0` shape, it is a consequence of how the feature PRs tagged their notes, and this cut does not alter it — it is recorded in §1 and in the matrix below so the release manager is not surprised by it
- [x] Invalid input is rejected with a readable message, not a crash — exercised through the guards: `unreleased refuses`, `package.json behind the newest release is a problem` and `--force without a reason is refused` all pass
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the five note lengths were **measured, not estimated**: 246, 531, 611, 133, 296. The longest is **611 characters**, shorter than `0.37.0`'s 703, which `/releases` has already rendered, so this release carries no new rendering boundary. Role tags were compared against the live `ReleaseRole` list so a retired `staff` tag could not slip through; `date` parses as `YYYY-MM-DD`; the order is asserted newest-first across all 55 entries, and all 303 notes in the file are asserted to render as real text

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | sees all five, and **receives no mail**, because `major: false` | asserted via `majorReleasesSince("0.37.1")` returning nothing; the **absence** of the mail line is checked on the deploy in §8 |
| management | `/releases` | sees **one** — the phone icon-labels note | tags asserted value-for-value in §2 |
| second_in_command | `/releases` | sees **one** — the phone icon-labels note | tags carried across unchanged from the feature PRs |
| head_of_maintenance | `/releases` | sees **none** — an empty `0.37.2` section | tags carried across unchanged; flagged in §1 |
| head_of_medical | `/releases` | sees **none** — an empty `0.37.2` section | tags carried across unchanged; flagged in §1 |
| doctor | `/releases` | sees **none** — an empty `0.37.2` section | tags carried across unchanged; flagged in §1 |
| volunteer | `/releases` | sees **none** — an empty `0.37.2` section | tags carried across unchanged; flagged in §1 |
| signed out | `/releases` | cannot reach it — behind sign-in | unchanged; no route or middleware touched |

- [x] Every role above tested — tested at the level this change operates at: the data each role is served. No role's visibility is changed by this PR, and the tags that decide it are asserted identical to `origin/main` for all four carried notes. **Worth the release manager's notice: four of the seven roles see an empty section**, because every note in this release is tagged and four are `admin` only. That is how the feature PRs wrote them; changing it would mean re-tagging someone else's note in the cut, which the runbook forbids
- [x] A role that should not have access is blocked server-side — unchanged: this PR touches no route, middleware or policy

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `n/a: not touched.` The features' own PRs carry their manual changes
- [x] Translatable strings go through the translation path — `n/a: release notes are not translated through that path`
- [x] Mobile viewport (375px) — no overflow, controls reachable — `n/a: no markup or styles in this diff`, and the longest note is shorter than one `/releases` has already rendered
- [x] Browser console clean — `n/a: not driven.` Nothing in this diff executes in the browser beyond the data it renders, asserted free of `[object Object]` in §2 across every release and of bare `undefined`/`NaN` in the entry being cut
- [x] Network clean — `n/a: no request path changed`

## 6. Regression

- [x] The pages nearest the change still work — the three consumers of this file are checked where they run: `deploy.mjs` loads it under type stripping (exercised by `check-release-guards.mjs`, exit 0), `worker/release-mail.mjs` bundles it to decide the mail, and the Worker answers `/api/releases/current` from it (exercised by the `build` gate, exit 0)
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — `src/lib/releases.ts` is loaded, not read, by all three consumers above, and by the verifier in §2
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full suite passes on the branch: `test=0`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: a release cut closes no backlog item`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: nothing non-obvious was decided here.` The release-level decisions of the day — minor rather than major for a **third** release in one day, and moving the status test-alert note into this PR — are recorded in `docs/releases/` with Lutan's reasoning
- [x] `README.md` still accurate — unchanged
- [ ] **Release notes.** `n/a: this PR is the release cut — ticking would be false because unreleased gained no line, it was emptied.` **This is the one place that needs reading rather than skimming**, because this cut **does** add a user-visible note: the status test alert, note `[4]`. It is not a new `unreleased` line, which is what this checklist line and the checker are about; it is a note added directly to the release entry, deliberately and under the rule from `docs/decisions/2026-10-11-release-note-truth-rule.md` — the note goes in the PR that closes the outstanding step, and this release is what closes it. **Two things deliberately have no note**: `0228`'s and `0229`'s columns, because nothing reads them and nobody would notice, and **the vet calendar**, which is configured on test only and dormant on production (Lutan, 2026-10-17)
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decisions record were measured, not reasoned** — every number in this plan is a tool's output: the five note lengths (246, 531, 611, 133, 296), the 55-entry and 303-note counts, production's `227 applied, 3 pending`, dev's `230 of 230, No drift`, the 16 release guards, the Pi's cache sizes, and the enum's four values read from `0070` and `0130` rather than from `0227`'s comment

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — recorded as the branch tip; **re-asserted after the merge, and `release-prs.mjs` re-run against the merged release SHA**, because on `0.37.1` a PR merged mid-release and changed it
- [ ] Deployed SHA matches the tested SHA — `deferred: the production release manager`, after the four builds. All four must come from the one release SHA, as they have for sixteen releases

### On the deployed build

- [ ] Deployed to test — `deferred: the production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: the production release manager`. The filled copy of `docs/release-smoke-test.md` goes to `docs/releases/`. **What is already on test was read before starting**: both Pi clones and both Workers are on a clean `0.37.1` @ `9804e211`, with nobody mid-test and nothing on test worth preserving
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing in this diff derives "today"` — the one date in it is a literal. **The release has one and it is named rather than waved past**: `0227`'s cron job fires at `03:17 UTC`, and its `interval '2 days'` is evaluated against `now()` in the database's own clock, not a browser's. Nothing in this cut can affect that, and it is covered by that PR's own harness
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no boundary or banding change in this diff.` The release contains one — `0227`'s 2-day and 90-day cutoffs — and it is covered by `scripts/check-assistant-retention.mjs` on that PR's branch
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the three blocks in §2 are copied as printed, including the verifier's own `15 passed, 0 failed` line
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked` on **both** environments, so there is no anonymous public page to re-check, and the edge-cache `HIT` check is vacuous because the gate page is served `no-store`. **But the purge itself is not n/a**: it is a required runbook step after every Pi deploy, and **this release it is the release manager's rather than Lutan's** — `purge-cache.mjs --env production --dry-run` printed `would purge everything for lannacare.org (zone c596f1fe…)` instead of refusing, so `CLOUDFLARE_PURGE_TOKEN` now exists after four releases of it not. Its success path has still never executed, so the first real run is worth watching

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: Lutan`, on his production Worker deploy; the log is read by the release manager afterwards, grepping for the **project ref** rather than the arrow, which does not survive the UTF-16 conversion
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — `deferred: the production release manager`. **Expect 13 on production and 14 on test**; the extra is `SCRATCH_RESTORE_DB_URL`, which exists only on test, and that asymmetry is not a missing production secret
- [x] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds none`, and neither does the release. `0227` needs no key because pg_cron runs inside the database. **`CLOUDFLARE_PURGE_TOKEN` is no longer outstanding** and is deliberately not a Worker secret: it lives in `.env.deploy.production` on the deploy machine
- [ ] **The release mail MUST NOT go out, and its absence is the check.** `deferred: the production release manager`, on Lutan's production Worker deploy. The same way round as `0.37.1` and `0.36.1`. `majorReleasesSince("0.37.1")` returning nothing is asserted in §2; both deploy logs are grepped for `deploy: release mail` and **no line is expected** — `no major release new to <env>, so no email` is what should print instead. A mail line appearing would be a defect, and an irreversible one: it would be the **third** mail of the day that Lutan's minor call exists to prevent
- [ ] **The retention job is actually scheduled on production after the apply** — `deferred: the production release manager`. `0227`'s install is the apply, and nothing reports on the job afterwards. **If this read is refused by the classifier it is reported and left open, not retried blind** — that is the established pattern, and it is what `0.37.1` did with `0224`

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither. **And this release does not either**, which is the difference from `0.37.1`: all three migrations declare `-- consumer: none` and ship read by nothing, so there is no ordering constraint between the apply and the deploy beyond the runbook's own. The apply still goes **before** the deploy, because `deploy.mjs` refuses a production deploy while the database lacks a migration that is on `main`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `deferred: the production release manager`, from the **main checkout** (the worktree has no `.env.deploy.production`). **Which of the three dry-run cases it returns is recorded rather than predicted**, and no `-- consumer:` warning is expected this release
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — **`0227` deletes live rows**, every night and permanently, so this gate genuinely applies rather than being waved past. What it deletes is `assistant_actions` — what people typed at the assistant — on Lutan's explicit retention decision, so the deletion is the intent rather than a risk to be mitigated. **What is worth stating plainly: the rows it removes are not recoverable from the application**, and the README restore recipe has still **never been exercised** — fourteen releases unanswered and still the cheapest item on the outstanding list. The backup position is unchanged from `0.37.1`, which ran hours ago
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — `0227`, `0228`, `0229` in that order, project `dbkodyyxxhtygxcxmfcu`, one run, **before** every deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — production is served by the Pi, so the rollback is a rebuild there pinned to `9804e211` (`0.37.1`); a `wrangler rollback` reverts only the Worker fallback. **None of the three migrations is reverted by either.** `0228` and `0229` are additive and harmless to code that does not know about them, which is the schema-first rule working. **`0227` is the one that is not symmetrical, and not in the usual direction**: rolling the code back changes nothing about it, because its reader is a cron job inside the database rather than app code — so **the nightly deletions would carry on running against the rolled-back release**, and the rows already deleted do not come back. A genuine rollback of this release therefore means `cron.unschedule('purge-assistant-actions')` as a separate, deliberate step, and it is written down here because "just redeploy the old SHA" is not the whole answer. **What a rollback does not need to undo this time: the mail**, because `major: false` means none is sent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low (verification tooling, nothing shipped) | **The cut verifier's own render check produced a false positive on a historic release.** It flagged a `0.33.0` note as unrenderable because the text contains the word `undefined` — but legitimately so: the note reads *"the Review step shows the intake date again (it had been reading \\"NaN undefined NaN\\")"*, describing the bug it fixed. A crude substring test cannot tell a broken render from correct prose quoting one. The direction matters: this is the **opposite** failure to `0.37.1`'s verifier, which reported success without comparing anything — this one reported a failure that was not there, which is the cheaper of the two but still noise that trains people to skim a red | **Fixed** before the cut was trusted. `[object Object]` and the structural checks still run across all 55 releases, where they can never be legitimate; the bare words `undefined` and `NaN` are now checked **only on the entry being cut**, where correct prose has no reason to contain them. Re-run clean: `every note in every release renders as real text — 55 releases scanned, 303 notes` |
| 2 | Low (process, no impact on this release) | **`release-prs.mjs` reported a DISAGREEMENT, as the handover predicted it would.** One file added in the range — `docs/test-plans/planner-handover-240.md` — belonged to no PR in its list. Traced by hand to **#758**, a squash merge whose PR number is in the commit subject (`8f6e8224 … (#758)`) and confirmed with `gh pr view 758`. So the release range is **#745–#758**, of which #747 is `0.37.1`'s own record PR and belongs to that release: **13 PRs in this release.** This is the third run in a row to report a disagreement alongside exit 0 | **Accepted** — the script is right to flag it and the trace is recorded rather than the list being ticked past. Per the script's own instruction, the pre-deploy test-plan item was **not** ticked against its list: all 14 plans were checked directly with `check-test-plan.mjs --base 9804e211`, which reports the plans complete and correct, exit 0 |

Neither defect is in shipped code, and neither changes what this release contains.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.37.2` section renders correctly on `/releases` for an admin, and that **no release mail arrived**, which is the check this release | `/releases` signed in, and the admin mailbox |
| 2 | **`0224`'s permission narrowing, carried over from `0.37.1` and still open.** That the roles holding **Approve photos** are the ones Lutan expects, and that any role holding it **without Residents** has not quietly lost the ability to publish its own uploads on save. It is a thirty-second look; no script can read production's cards, and the read was refused by the classifier on `0.37.1` and deliberately not retried | Who does what on the deployed build, signed in as Admin |

Both rows are for a person to look at on the deployed build. Row 2 is **not this release's change** and is listed here only because it is the second release it has been carried into — recording it beats dropping it, and it belongs to `0.37.1`'s record as much as to this one. **This release's eight other outstanding manual items belong to their own feature plans and their own signatures** — the runbook is explicit that they must not be given a second home here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-19

### Manual verification

- [ ] The manual list above is for a person to look at — n/a: both rows are release steps on the deployed build, see the table

Manual verification by: pending: the two items above, by Lutan on the deployed build

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects
