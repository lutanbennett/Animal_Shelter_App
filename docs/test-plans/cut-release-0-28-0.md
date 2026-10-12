# Feature test plan — cut-release-0-28-0

## Header

| | |
|---|---|
| Feature | Cut release `0.28.0`: move the one note in `unreleased` into a new `0.28.0` entry, `major: true`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-28-0` @ `C:\Development\Animal_Shelter_cut-release-0-28-0` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #576 |
| Tested by / date | Claude (production release manager session) / 2026-10-13 |
| Carries a migration? | no — the release's five (`0188`, `0189`, `0190`, and two numbered `0191`) merged in their own PRs |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the one note in `unreleased` into a new `0.28.0` entry, `major: true` on Lutan's call, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`; the note carries no role tag, so it is not filtered. **Every admin receives mail**, because `major: true` — asserted as `majorReleasesSince("0.27.1") = ["0.28.0"]`. That is this cut's one irreversible effect, and it fires on Lutan's production Worker deploy, not on the merge
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying the release's five migrations, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 14s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 72s
=== gates: test — npm test
=== gates: test exited 0 after 2s
=== gates: build — npm run build
=== gates: build exited 0 after 31s
gates: typecheck=0 lint=0 test=0 build=0
gates exit: 0
```

The cut itself was verified mechanically rather than read over, which is the one
failure mode a release cut has that no gate catches — 16 assertions, 0 failures.
Every comparison of parsed notes normalises `\r\n` first; the whole-file
comparison normalises **both sides** to LF, because `git show` emits LF while the
checkout is CRLF (see Defect 2 — the first form of that assertion failed for that
reason alone and was corrected rather than waived):

```
  ok   origin/main held 1 unreleased note(s) — 1
  ok   unreleased is now empty — 0
  ok   new entry is first in releases — 0.28.0
  ok   date is today — 2026-10-13
  ok   major is true — true
  ok   entry has 1 note(s) — 1
  ok   every source note used exactly once — order [0]
  ok   text lost 0, invented 0 — 404 chars both sides
  ok   role tags changed: 0 — null
  ok   majorReleasesSince("0.27.1") — ["0.28.0"] (major => admins mailed)
  ok   package.json matches newest entry — 0.28.0
  ok   file order still matches compareVersions (newest first)
  ok   no [object Object] / undefined in any note — 236 notes
  ok   all previous entries byte-identical from 0.27.1 down — 94586 vs 94586 chars
  ok   exactly one entry added — 41 -> 42

15 assertions, 0 failed
verify-cut exit: 0
  ok   no other edits to releases.ts outside the two sites — rebuilt 102998 vs origin/main 102998 chars; the new entry is 603 chars
verify-outside exit: 0
```

- [x] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `all 7 jobs `completed success` on run 38295241354 at `9c08cc6e`, the branch tip: test-plan, public-views, check, new-policy-role-names, migration-numbers, script-integrity, audit. Read from `gh run view <id> --json jobs`, not from `gh pr checks`` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR. The release's five merged in their own PRs and are applied as a release step, recorded in section 8. **Two of them are both numbered `0191`** — see Defect 1
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead, recorded in section 8
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step, recorded in section 8 — all five `ok`, exit 0
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; all five are already applied to dev by their own PRs, confirmed this session as `192 applied, 0 pending` with nothing on either side of the `origin/main` comparison
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; all five were read this session and use `create or replace` and `drop policy if exists`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; all five are applied on dev with `No drift`, which is the evidence for this
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR; this belongs to the five files' own plans, which carry it
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves one existing note into a release entry, verified as data by 16 assertions (section 2)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now empty, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and the note is a plain string with no optional fields

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.28.0` entry and its one note; **receives mail**, because `major: true` | `majorReleasesSince("0.27.1")` = `["0.28.0"]`, so the mail fires on the production Worker deploy. Entry read back from the module: 1 note, order `[0]` |
| management | `/releases` | Same entry; the note carries no role tag, so it is not filtered out | the note is a plain string — asserted, 0 tagged |
| second_in_command | `/releases` | Same entry, same note | as above |
| head_of_maintenance | `/releases` | Same entry, same note | as above |
| head_of_medical | `/releases` | Same entry, same note | as above |
| doctor | `/releases` | Same entry, same note | as above |
| volunteer | `/releases` | Same entry, same note | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees, and the note is not role-tagged
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic. The release's own manual change belongs to the `photo-first-tagging` PR and its plan
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 41 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 41
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file touched — `releases.ts` is imported by `/releases` and `deploy.mjs`, and both were exercised (section 2 build, and `majorReleasesSince` run directly)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `808f9613` and `sync` reported nothing to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice — the major-versus-minor call is recorded in the commit message, this plan and the release record
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves the note written by the `photo-first-tagging` PR into the `0.28.0` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string and the note describes a photo-upload flow. Nothing in the release's five migrations derives a date either — checked this session, and none of them touches a date column or a `shelter_today()` bound
  - *Does the logic handle the boundary?* Where the code lets an instant be injected, assert it rather than waiting for the clock — n/a: no instant is derived in this PR
  - *Does the deployed build behave as the source does?* A different claim, and only `test.lannacare.org` answers it — n/a: no date-derived behaviour in this PR
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named** — n/a: no boundary or banding change in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** A hand-maintained table of results is prose about a measurement rather than the measurement, and it drifts from the run without anyone noticing — which is precisely what the evidence was there to prevent. Regenerate it; do not tidy it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret or env var, and neither does the release

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code reading one. The release's five are applied before the deploy, per the apply plan below. Three of them declare consumers that are **not on `origin/main` at all** — the bills-inbox and donate-channels app code, which is still unmerged — and `apply-migrations.mjs` warned about each. That is the safe direction: schema lands before its reader
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager — run again against production immediately before the apply. Run once already this session: all five `ok`, exit 0
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — **three production backups from 2026-10-12 exist on the Pi** in `~/backups/lannacare`: `lannacare-production-2026-10-12T0445Z.dump.age` (1,114,838 bytes, 11:46 Pi local), plus `…T0442Z` and `…T0439Z` — the three Lutan took by hand while exercising the restore recipe. **None of the release's five migrations holds or rewrites a single row** — `0188` adds enum values, `0189` creates two tables, a view, two functions and replaces policies, `0190` replaces a function body, and the two `0191`s add a table and a policy — so this gate is satisfied rather than waived. Noted while checking: **the daily backup cron has not written a backup since 2026-10-11 03:00** (`lannacare-production-2026-10-10T2000Z`); no run is recorded at 03:00 on 2026-10-12 although the Pi has been up since 2026-10-02 and `cron` is active. Raised with Lutan at the cut; not a blocker for this release, since the three hand-made dumps are newer than anything the cron would have produced, but it is the first thing to check after tonight's 03:00 run — and this release ships the System status tile whose job is to catch exactly this
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `187 applied, 5 pending`
  2. `--env production --dry-run` — read it, but **do not treat a red as a stop without reading the files**: the per-file `begin … rollback` trap has fired in three of the last six releases, and this release is the exact shape that provokes it — `0188` adds four `attachment_owner_type` enum values and `0189` *uses* them, which cannot share the runner's per-file transaction. It came back clean anyway on the first run
  3. `--env production` — applies `0188`, `0189`, `0190`, `0191_donation_channels`, `0191_stock_receipts_update_policy` to `dbkodyyxxhtygxcxmfcu`
  4. **before** either deploy, and with no user-facing window needed

  Why no window is needed, checked against the live `0.27.1` source rather than taken from the headers. Two of the five touch code paths the live app uses on every attachment:

  - **`0189_bills.sql`** replaces all four `attachments_*_perm` policies. The five existing arms (`resident`, `blood_test`, `procedure`, `maintenance`, `project`) were compared against their live definitions in `0152_perm_convert_photos.sql` and are **character-for-character identical** across all four policies. The only change is the `else` branch, `false` → `bill_owner_can(owner_type, …)`, which is reachable only by the four owner types `0188` adds and which nothing live can produce. Strictly a widening.
  - **`0190_record_attachment_bills.sql`** replaces `record_attachment()`, which the live app calls on every upload path (`src/app/api/residents/[id]/photos/route.ts:191`, `…/medical/residents/[id]/photos/route.ts:106`, `…/blood-tests/[id]/attachments/route.ts:139`, `…/procedures/[id]/attachments/route.ts:155`). Diffed against `0178`'s body: the change is **four added `when` arms** for the new bill types. Every existing arm, every guard and the signature are untouched.
  - The remaining three are additive: `0188` adds enum values, `0191_donation_channels` adds a table nothing reads yet, `0191_stock_receipts_update_policy` adds an `update` policy that was missing since `0143` — a login that could already insert and delete a delivery gains the update the grant always allowed.

  So the silent-failure question for this release answers **no**, on the evidence above rather than on the headers' own descriptions. Contrast `0181` three releases ago, which dropped what the live app called on every request.

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — rollback is `./scripts/pi/deploy-pi.sh --ref 3c7632ca` on the Pi (a rebuild of `0.27.1`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: the five migrations, and the release mail.** None of the five has a down-migration. The practical position is that the schema stays and the app rolls back, which is safe because `0.27.1` produces no bill owner type, reaches only the five unchanged policy arms and calls `record_attachment()` with a signature `0190` does not change — the same facts that make the forward direction safe. The mail cannot be unsent: it goes out on the production Worker deploy, so the point of no return is Lutan's one command, not the merge

## Left for manual verification

Anything above that Claude could not honestly verify, listed here so it is a
short, concrete handover rather than a vague "please check it". Empty is a valid
answer when the change has no surface a person needs to look at.

**Do not repeat a section 8 deploy-time check here.** Applying a migration,
reading the deploy output, smoke-testing the deployed build and running
`--drift production` all have their own state in section 8 — `deferred: <owner>` —
which passes the checker and names who picks it up.

| # | What to check | Where |
|---|---|---|
| 1 | The `0.28.0` entry reads correctly on `/releases`, with its one note — the page is behind sign-in, so no session can load it | `/releases`, production, any signed-in role |
| 2 | The release mail for `0.28.0` arrived, from `releases@lannacare.org` with the version in the subject. `lannacareforanimals@gmail.com` is expected to be skipped with `E_RECIPIENT_NOT_ALLOWED` — a known open question, not a delivery failure | the admin inbox |

## Sign-off

Two signatures, because they certify different things and neither covers the
other. A sign-off line that does not correspond to someone having actually
looked is worse than no sign-off, because it turns an unknown into a false
assurance.

### Automated and scripted checks

Gates, scripts, server-side behaviour, and any browser check that was actually
driven rather than assumed. Signed by whoever ran them — Claude may sign this.

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-13

### Manual verification

The items in **Left for manual verification** above, signed by the person who looked.

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so only the person who looked may tick it

Manual verification by: pending: the two rows above — the entry read on `/releases`, and the release mail arriving

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries the file itself
- [ ] Handed to the production release manager — n/a: this is the release manager's own plan

Result: pass with accepted defects

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **Two migrations in this release are both numbered `0191`** — `0191_donation_channels.sql` and `0191_stock_receipts_update_policy.sql`, from two different streams. CLAUDE.md allows only one in-flight branch to carry a migration at a time, precisely to stop this | accepted — harmless here and not worth a renumber of applied files. The two are independent (one adds a table, the other adds a policy on an unrelated table), so apply order cannot matter, and both are already applied to dev cleanly with `No drift`. Named in the release record |
| 2 | low | The cut-verification script's last assertion — "no other edits outside the two sites" — failed on its first run for a reason that had nothing to do with the cut: `git show origin/main:…` emits **LF** while the checkout is **CRLF**, so the two files differed at character 3 | fixed before the plan was filled in: both sides are normalised to LF, and the assertion then passes with `rebuilt 102998 vs origin/main 102998 chars`. Recorded because the same trap will catch the next cut — `0.27.0`'s defect 1 was the same mechanism in the per-note comparisons, fixed there but not in the whole-file one |
