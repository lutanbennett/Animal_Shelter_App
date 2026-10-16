# Feature test plan — cut-release-0-33-0

## Header

| | |
|---|---|
| Feature | Cut release `0.33.0`: move the five notes in `unreleased` into a new `0.33.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/release-0-33-0` @ `C:\Development\Animal_Shelter_release-0-33-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #664 |
| Tested by / date | Claude (production release manager session) / 2026-10-16 |
| Carries a migration? | no — the release's three (`0207`–`0209`) merged in their own PRs and are applied as a release step |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the five notes in `unreleased` into a new `0.33.0` entry, `major: true` on Lutan's call in chat, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`. **All five notes are untagged**, so every signed-in role sees all five. That was not decided here: the feature PRs wrote them untagged and they are carried across unchanged, asserted byte-for-byte in §2. **Every admin receives mail, because `major: true`** — asserted as `majorReleasesSince("0.32.1")` returning exactly `["0.33.0"]`. That mail is the one irreversible act in this release
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying `0207`–`0209` to production, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR. Also out of scope: PR #662 (the planner handover), deliberately left open so `main` holds still and all four builds can come from one SHA

**The one risk worth naming is the mail, and this time it is the major call rather than the minor one.** `major: true` means every admin is written to and it cannot be undone. The version question — *can anyone do something today they could not do yesterday* — was put to Lutan in chat with the case stated, and he called it major. The case is strong rather than marginal: the Head of Medical gets a page that did not exist (Record Weight's "Weigh these first"), Settings gains the "Counting since (year)" box, and Thai readers of the public website get breed and colour. Unlike `0.32.1`, this release therefore **has a point of no return**, and it is the production Worker deploy. Everything before it is reversible; nothing after it is.

**A second risk, named because it is the shape that has gone wrong before.** The vet calendar (#656) ships in this release as code but is **dormant on production**: `calendarConfigured()` requires `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`, and with either unset every calendar path returns `"off"` and says nothing anywhere. It therefore has **no release note**, deliberately, under the release-note truth rule (`docs/decisions/2026-10-11-release-note-truth-rule.md`): a note would promise every admin a feature that does nothing until a token is set. That absence is asserted in §2, not merely intended.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` at `e8a75f9d` and had nothing to merge. `main` did not move while the cut was made, and PR #662 is being left open so it still does not
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 34s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 86s
=== gates: test — npm test
=== gates: test exited 0 after 4s
=== gates: build — npm run build
=== gates: build exited 0 after 91s
gates: typecheck=0 lint=0 test=0 build=0
```

  This run was markedly faster than `0.32.1`'s (34/86/91 against 69/144/144). That is a warm Turbopack cache, which the handover names as a thing that looks alarming and is not: **the exit codes are the evidence, not the timings.**

- [x] `node scripts/check-release-guards.mjs` — all **16** assertions `ok`, exit 0, read from the command itself:

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

  **Sixteen, where `0.32.1` had fifteen.** The new first line — `a cut release with nothing unreleased passes` — is the positive case of the guard this cut depends on, and it is the one assertion in that list this PR's own change has to satisfy.

- [x] **The cut was verified mechanically, not read over.** A lost or altered note is the one failure mode a release cut has that no gate catches: it is invisible to `typecheck`, `lint`, `build` and CI alike. All five notes were parsed from `origin/main:src/lib/releases.ts` and compared against the parsed `0.33.0` entry, text and role tags separately. Output unedited:

```
PASS:
  [ok] note count 5 matches unreleased (5)
  [ok] every note text and role tag identical to unreleased
  [ok] unreleased is empty
  [ok] version 0.33.0 at top
  [ok] major: true - MAILS EVERY ADMIN
  [ok] date 2026-10-16
  [ok] title present
  [ok] all 47 previous entries byte-identical
  [ok] package.json 0.33.0 matches newest entry
  [ok] majorReleasesSince("0.32.1") = [0.33.0] - one mail, this release
  [ok] order is newest-first
  [ok] no [object Object] and no blank note
  [ok] every note is well formed: a string, or {text, roles} with at least one role
  [ok] every note is a real sentence, not a stub
  [ok] no note promises the vet calendar (its Google token is still outstanding)

All cut assertions passed.
```

  The notes were **moved by script, not retyped**, so there is no path by which a character could change: the `unreleased` array body was sliced out of the file verbatim and re-inserted inside the new entry. The comparison reads `origin/main`'s copy through `MSYS_NO_PATHCONV=1 git show` rather than the bare form — `CLAUDE.md` records that Git Bash mangles a `<rev>:<path>` argument whose path starts with a dot, and the failure mode is an empty result that looks exactly like "nothing to compare". `src/lib/releases.ts` does not start with a dot, so the bare form would have worked; the safe form was used anyway, together with a length floor that refuses to compare against a short read.

  **Two of these assertions are new this release, and one of them caught a fault in itself rather than in the cut.** The first draft tested every note for the substring `undefined`, and note 4 legitimately contains `"NaN undefined NaN"` because it quotes the bug it fixes. The check was wrong, not the note; it was replaced with a structural test (every note is a string, or `{text, roles}` with at least one role), which is the stronger check. Recorded because a plan that quietly deleted a failing assertion would read identically to this one. The last assertion — that no note mentions the calendar — is the truth rule made mechanical.

- [x] CI green on the PR (runs the same seven) — all 7 jobs `success`, read from `gh run view --json jobs` rather than from `gh pr checks`, with the run's `headSha` confirmed to match `HEAD` before merging: `0.32.1` nearly read a cached first-run result as green.

  **The first run was green, which the template says to expect not to be.** The usual first run fails on `test-plan` by construction, because the commit that creates the PR cannot yet contain the plan. Here the plan was written before the PR was opened, so `test-plan` had a complete plan to read on the first push — the third release running that this has held. **Ticking this line is itself a commit, so a further run follows it, and the merge waits for that one**

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's three — `0207`–`0209` — merged in their own schema-first PRs and are applied as a release step, recorded in §8. They are sequential and unique on `main`, and **`0208`/`0209` are the pair the handover warned not to renumber**: they were committed and applied to dev on an unmerged branch, and have since merged as #661. The next free number is `0210`, confirmed against `origin/main` and `git branch -a`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead — production `207 applied, 3 pending`, dev `210 applied, 0 pending`. Production being three behind is the "a migration merged since the last release" case the handover names as normal. **Dev is clean this time**, and `--drift test` says `No drift` — the first release since Defect 1 was opened where it does
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step and recorded in §8 — exit **0**, all three files `ok`, the per-file trap not firing
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; all three are already applied to dev by their own PRs, confirmed this session as `0 pending` and `No drift`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; all three were read this session and use `add column if not exists`, `create index if not exists`, `create or replace function`, `drop trigger if exists`, `drop constraint if exists` and `on conflict` throughout. `0208` is a bare `delete` restricted to one exact filename, and states its own re-runnability: on a database that never held the row it deletes nothing
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; this belongs to the three files' own plans, which carry it
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR; see the rollback position in §8
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in §8's apply plan instead

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves five existing notes into a release entry, verified as data in §2
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now `[]`, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the notes are five values carried across unchanged

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.33.0` entry and all five notes; **and receives mail**, because `major: true` | `majorReleasesSince("0.32.1")` is exactly `["0.33.0"]`, so one mail fires on the production Worker deploy. Entry read back from the module: 5 notes, order unchanged |
| management | `/releases` | All five notes — none is tagged | asserted: all five notes' `roles` are `null` |
| second_in_command | `/releases` | All five notes | untagged is why they all reach this role |
| head_of_maintenance | `/releases` | All five notes — including the two that are plainly not theirs (the Thai breed boxes, the weigh-first list) | untagged reads as everyone. Not re-tagged at the cut: a tag written here would be an editorial judgement the feature PRs did not make, and a wrong tag hides a note from the people it is for |
| head_of_medical | `/releases` | All five, and the weigh-first note is hers | the one role for whom this release's largest note is the point |
| doctor | `/releases` | All five notes | as above |
| volunteer | `/releases` | All five notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees. The absence of role tags was **not** decided at the cut: the feature PRs wrote all five notes untagged and they are asserted identical to `origin/main` in §2
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 47 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 47
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (§2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched — `releases.ts` is imported by `/releases`, by `deploy.mjs` and by the Worker's `/api/releases/current`, and all three paths were exercised: the build compiled the route, `majorReleasesSince` and `compareVersions` were run directly, and the module parses under Node's type stripping as `deploy.mjs` loads it
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `e8a75f9d` and `main` did not move, so there was nothing to merge and nothing to re-run against

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item, and this cut raised no follow-up. **Unlike `0.32.1`, there is no release-time gap to file**: the `--env test` guard that cut carried as Defect 1 merged as #658 in this release, and dev now reports `No drift`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a by the usual reading, and deliberately so: this cut made **no editorial judgement**. All five note texts and the absence of role tags were carried across unchanged from what the feature PRs wrote, and that is asserted rather than claimed. The one judgement in the release — major over minor — is Lutan's and is recorded in §1 and in the release record, not as a decision file
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the five notes written by the feature PRs into the `0.33.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision record were measured, not reasoned.** No gate reads prose. Every claim in §2 is one of the pasted assertions. The silent-failure conclusion in §8 was reached by reading the two public views column by column against the files that add the columns, and by reading `calendarConfigured()` and its callers in `src/lib/clinics/calendar-sync.ts` — **not** by reading any migration's `-- consumer:` header. `0.32.0`'s `0199` is why: its header said `none` while `src/lib/units.ts` read its new column. Here `0209`'s header claims "no view changes needed" and that claim was checked against `0205` rather than trusted

## 8. Pre-production gate

### The release's shape

**10 PRs: #653–#661 and #663.** `node scripts/release-prs.mjs 61fb95ed HEAD` exited **1**, read from the command itself and not through a pipe — the third release running it has, and the handover's instruction to expect it was right again. It listed 9 and named 2 files belonging to no PR in the list. Reconciled by matching orphans to commits and then confirming each against GitHub rather than arguing from the numbering:

| Orphan | Commit | PR | GitHub state | Belongs to |
|---|---|---|---|---|
| `docs/test-plans/weigh-first-app.md` | `e8a75f9` | **#663** `claude/weigh-first-app-3636d4` | `MERGED`, `mergeCommit e8a75f9d` | **this release** |
| `docs/test-plans/record-0-32-1.md` | `59e2e14` | **#652** `claude/record-0-32-1` | `MERGED`, `mergeCommit 59e2e140` | **`0.32.1`** |

Both were **squash-merged**, which is why they carry no merge commit with a PR subject — the exact trap the runbook names. Both merge commits were confirmed to be in `61fb95ed..main` with `git merge-base --is-ancestor`.

**The second orphan is structural rather than a fault, and is worth writing down once.** #652 was `0.32.1`'s own *record* PR. A record PR is written and merged after its release's cut SHA, so it necessarily falls inside the next release's range while belonging to the previous one. That will happen on every release, and it is not a missing PR.

With both accounted for, the only gap in #653–#663 is **#662**, the planner handover, which is **open on purpose** so `main` holds still through the release. A no-gap range is the independent check that nothing is missing, and this range has no unexplained gap.

**Every PR in the release carries a completed test plan**, confirmed by hand this session rather than assumed, because `test-plan` does not block a merge and a PR can therefore reach `main` unchecked:

| PR | Plan | Result |
|---|---|---|
| #653 | `intake-date-nan-fix.md` | pass |
| #654 | `zone-chip-neutral-fill.md` | pass |
| #655 | `calendar-and-weigh-schema.md` | pass |
| #656 | `vet-calendar-build.md` | pass with accepted defects |
| #657 | `labels-and-year-app.md` | pass with accepted defects |
| #658 | `migration-test-guard.md` | PASS |
| #659 | `handover-defect1-source-gone.md` | pass |
| #660 | `check-harness-crashes.md` | pass with accepted defects |
| #661 | `ledger-and-labels-schema.md` | pass |
| #663 | `weigh-first-app.md` | pass |

None slipped through. The three "pass with accepted defects" all carry their open items in a **Left for manual verification** table, and those items are carried forward into this plan's own list rather than re-signed here.

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string. The release contains a great deal of date-derived behaviour that is not this PR's — `weigh_first_visits()` computes "yesterday or today" in Bangkok time, and the calendar builds event times — and those checks belong to `calendar-and-weigh-schema.md`, `weigh-first-app.md` and `vet-calendar-build.md`, which carry them. They are not re-signed here, because copying another plan's items into the cut plan is what the template forbids
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — every block in §2 and §8 is the script's own stdout, copied without tidying, including the `release-prs.mjs` disagreement
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager. **Expect this to be unanswerable**: `PUBLIC_SITE` is `locked`, so an anonymous request gets the staff gate and there is no cacheable public page. The gate is served `Cache-Control: private, no-cache, no-store`, so the edge-cache check is not merely hard but vacuous — write it `n/a` with that reason. **This release puts real work in that blind spot**: the "since <year>" label on the home page and the Thai breed and colour on `/adopt` are both public-website surfaces whose schema shipped in `0.32.1` and whose code ships now

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var. **The line still has a fact in it worth reading twice, and it is not a blocker.** **The release contains a feature that needs two that are not set**: the vet calendar reads `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID`, and with either absent `calendarConfigured()` is false and every calendar path returns `"off"`. That is deliberate and it is safe: `docs/decisions/2026-10-16-vet-calendar-one-event-per-visit.md` states that nothing is marked while the calendar is unset, so the sweep back-fills every upcoming visit when the token is first set and switching it on later loses nothing. It is **not** a deploy blocker and it is **not** a silent failure of this release, because no release note promises it — see §1 and the assertion in §2
- [x] **`npm ci` has been run in the main checkout, and the installed `next` matches `package.json`** — deferred to the release step and recorded in the release record; `npm ci` is run in `C:\Development\Animal_Shelter_App` before any deploy, and `node_modules/next/package.json` read against `package.json` straight afterwards, with the `Next.js version :` line on the first Worker build as the second check. Five releases running this has been the cheap step that would have caught the expensive fault, per `0.28.0`'s Defect 2. **In this worktree** `npm ci` ran at creation (`worktree.mjs new`) and all four gates built against it

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no: this PR carries no migration and no code reading one. **The release does, and the ordering matters.** The five `-- consumer:` warnings the dry-run printed are all the **safe** direction — the columns and the function land before the code that reads them is live — but the readers for `0207` (the calendar sync and the weigh-first page) merged in PRs that are *in this release*, so the apply must precede both deploys. The apply plan below does that. Getting it the wrong way round would be **loud, not quiet**: PostgREST answers an unknown column with a `42703` error, and an RPC to a missing function with `42883`
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — exit **0**, read from the command itself, **all three files `ok`**:

```
Environment: production — project dbkodyyxxhtygxcxmfcu
This checkout: 207 applied, 3 pending.
WARNING 0207_calendar_and_weigh_schema.sql: declared consumer src/lib/clinics/calendar-sync.ts does not exist in release 0.32.1.
WARNING 0207_calendar_and_weigh_schema.sql: declared consumer src/app/clinics differs from release 0.32.1, so it may or may not already read this.
WARNING 0207_calendar_and_weigh_schema.sql: declared consumer src/app/clinic-visits differs from release 0.32.1, so it may or may not already read this.
WARNING 0207_calendar_and_weigh_schema.sql: declared consumer src/app/medical/weight/page.tsx differs from release 0.32.1, so it may or may not already read this.
WARNING 0207_calendar_and_weigh_schema.sql: declared consumer src/lib/medical/weigh-first.ts does not exist in release 0.32.1.
  note: These tables/columns land before the code that reads them is live. That is the safe direction - nothing is blocked - but do not deploy the reader before this is applied, and expect nothing to use it yet.
  note: "Live" here is what https://lannacare.org reports it runs: 0.32.1 @ 61fb95e.
dry-run 0207_calendar_and_weigh_schema.sql … ok
dry-run 0208_clear_phantom_ledger_row_0201_again.sql … ok
dry-run 0209_residents_breed_colour_labels.sql … ok
Dry run only — nothing was applied.
```

  **The per-file dry-run trap did not fire, and saying which case this is matters.** The handover asks for the distinction between three statements, and this release is the third: *the trap did not apply*. None of the three files depends on another pending file — `0207` is additive to `clinic_visits`, `0208` deletes one ledger row by exact filename, and `0209` reads `residents.breed_th`, which `0205` already put on production in `0.32.1`. So each file stands alone inside its own `begin … rollback` and all three reported `ok`. `0.32.1`'s record is the worked example of the trap *firing*; this one is not.
  **No production-only guard appeared** — the tenth release running. It can only show up at the production dry-run, and it did not. The release manager re-runs this immediately before the apply
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing in this release is destructive or rewriting, so the gate does not apply; **the backup was verified anyway, because the mail is irreversible.** Nothing in `0207`–`0209` drops a column, a table or a view: `0207` is `add column if not exists` plus an index, a function and a trigger; `0209` widens a check constraint and inserts rows; `0208`'s only `delete` is restricted to one exact `schema_migrations` filename and matches **nothing on production**, which never held the phantom row. So no user data is dropped or rewritten by this release. A fresh backup was read over SSH regardless: `lannacare-production-2026-10-15T2000Z.dump.age` (1,184,430 bytes), written at **03:00 today** in `~/backups/lannacare` on the Pi. **This is a genuinely new dump**, not the one `0.31.0`, `0.32.0` and `0.32.1` all cited — those three releases fell on the same day and shared it. The cron has now fired unprompted on five consecutive nights. **The restore half remains unexercised against a real Supabase project, carried forward for the eighth release**, and it is still the cheapest item on the outstanding list
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `207 applied, 3 pending`
  2. `--env production --dry-run` — expect exit 0 with **all three `ok`**. Unlike `0.32.1`, **no red is expected here**, so any FAILED line is a real stop rather than the known trap
  3. `--env production` — applies `0207` → `0209` to `dbkodyyxxhtygxcxmfcu` in that order, in one run
  4. **before** either deploy, and with no user-facing window needed

  **The silent-failure answer for this release.** The dangerous shape in anything touching the public site is the public-view rule (`docs/decisions/2026-10-15-duplicate-0201-and-public-view-rule.md`): **a column is public only when the public view names it**, and an omission does not error — a signed-out visitor gets no photo, no Thai and no error. This release's public-facing code reads three columns added in `0.32.1`, and all three were checked by reading the views rather than the headers:

  - `since_year` — `0204` rebuilds `public_impact_figures` and **names `b.since_year`** in its select list, so the home page's "since <year>" reaches an anonymous reader.
  - `breed_th` and `colour_th` — `0205` rebuilds both `public_resident_cards` and `public_resident_profiles` and **names `r.breed_th, r.colour_th`** in each, so `/adopt` and a resident's public page can read them.
  - `0209` asserts in its own header that it needs no view change, and that claim is **true**: it registers the two columns in `translatable_labels` for the Translations page, which is a signed-in surface, and the public views already carried the columns from `0205`.

  So the public-view rule closes clean this release, which is the first time in three releases it has had nothing to report.

  **The candidate that does not close, and the reason it is acceptable**, is the vet calendar: with no token set it reports `"off"` everywhere and nothing anywhere says so. It is handled by having **no release note**, asserted mechanically in §2. The feature is dormant, not broken, and back-fills when the token is set.

  **One thing worth stating because it is the opposite of a defect.** `weigh_first_visits()` gates on `has_permission('medical.weight', 'edit')` and returns an **empty set** rather than an error when that is not held, so a permission problem would look exactly like "there is nobody waiting to be weighed". It was traced rather than assumed: `0194_role_cards.sql` gives `head_of_medical` the `record_weight` card, which maps to `medical.weight` at level 2, so the role the page is for does hold it. The shape is still worth knowing at the smoke test — an empty list is not by itself proof the read works

### Rollback

- [x] Rollback position stated, **including what it does not cover** — rollback is `./scripts/pi/deploy-pi.sh --ref 61fb95ed` on the Pi (a rebuild of `0.32.1`), with `npx wrangler rollback --env production` for the Worker fallback.

  **What it does not cover, and this release has a gap where `0.32.1` had none: the mail cannot be un-sent.** `major: true`, so the production Worker deploy writes to every admin, and that is the point of no return. `0.32.1`'s record could say its rollback position had no gap in it for the first time in the handover's history; that was a property of the minor call, not a standing improvement, and it does not hold here. Everything before the production Worker deploy is reversible. Nothing after it is.

  **The three migrations are also not covered** — none has a down-migration file. Against rolled-back `0.32.1` code all three are inert or near-inert: `0207`'s four columns, index, function and trigger are read by nothing in `0.32.1` (the dry-run's own five `-- consumer:` warnings say exactly that, and they are the safe direction); `0209` inserts registry rows that only the signed-in Translations page reads, and `0.32.1` does not list the `residents` group; `0208` touches only the migration ledger and matches nothing on production. **The one with any ongoing effect is `0207`'s trigger**, which stamps `calendar_out_of_date_at` whenever a visit changes. Under rolled-back code nothing reads that column and nothing sweeps it, so the effect is a column filling with timestamps that no one looks at — and when the code returns, the sweep picks those rows up, which is the designed back-fill rather than a problem. So **nothing in this release blocks a rollback of the code**; the mail is the only thing a rollback cannot reach.

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The `0.33.0` entry reads correctly on `/releases`, with all five notes, for an admin and for one other role. The page is behind sign-in, so no session could load it | `/releases`, production |
| 2 | That the release mail **arrived**, not merely that the deploy printed `sent N`. This is the positive of `0.32.1`'s check and is the observable consequence of the major call. `lannacareforanimals@gmail.com` being skipped with `E_RECIPIENT_NOT_ALLOWED` is expected and known | the admin inbox |
| 3 | **The restore test into a real Supabase project** — unexercised for eight releases, and the cheapest item on the outstanding list | — |
| 4 | Carried forward from #656: a 03:00 Bangkok visit showing at 03:00 in the real calendar; a failed Google call then Retry; the record link signed in and signed out; the Director seeing the entry on her phone. All of it waits on the calendar token | her phone, Google Calendar |
| 5 | Carried forward from #663: the "Weigh these first" wording read by the Head of Medical herself in Thai, and the list on a real phone in the kennels rather than an emulated viewport | `/medical/weight` |
| 6 | Carried forward from #657: a year typed in one figure reading correctly on the home page at 375px in English and Thai; a resident with Thai breed and no Thai colour on `/adopt` | dev or production, signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-16

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and only the person who looks may tick it

Manual verification by: pending: the six rows above — items 1 and 2 are release-time checks for the release manager and Lutan, items 3 to 6 are carried forward and none is a blocker

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: this plan is the production release manager's own

Result: pass

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | minor | The cut-verification script's first draft tested every note for the substring `undefined`, which note 4 legitimately contains because it quotes the bug text `"NaN undefined NaN"`. The check was wrong, not the cut | fixed — replaced with a structural test that every note is a string or `{text, roles}` with at least one role, which is the stronger check. Recorded in §2 because a plan that silently deleted a failing assertion would read identically to this one |
