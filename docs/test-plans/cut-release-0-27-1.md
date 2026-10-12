# Feature test plan — cut-release-0-27-1

## Header

| | |
|---|---|
| Feature | Cut release `0.27.1`: move the two notes in `unreleased` into a new `0.27.1` entry, `major: false`, and bump `package.json` |
| Backlog item | `docs/backlog.md` → none — a release cut closes no backlog item |
| Branch / worktree | `claude/cut-release-0-27-1` @ `C:\Development\Animal_Shelter_cut-release-0-27-1` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not driven — `/releases` is behind sign-in; see §5) |
| PR | #562 |
| Tested by / date | Claude (production release manager session) / 2026-10-12 |
| Carries a migration? | no — the release's two (`0186`, `0187`) merged in their own PRs |
| Tested at SHA | the tip of this branch, re-run after the plan was filled in |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — move the two notes in `unreleased` into a new `0.27.1` entry, `major: false` on Lutan's call, and bump `package.json` to match
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/releases.ts` and `package.json` only, plus this plan. No route, no `worker/`, no migration, no shared lib
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — every signed-in role sees the entry on `/releases`; neither note carries a role tag, so neither is filtered. **No admin receives mail**, because `major: false` — asserted as `majorReleasesSince("0.27.0") = []`. That is the difference from the last six cuts and the reason this one has no irreversible effect
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: applying the release's two migrations, both Pi builds, both Worker deploys and the release record. Those are release steps, not this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 41s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 126s
=== gates: build — npm run build
=== gates: build exited 0 after 169s
gates: typecheck=0 lint=0 build=0
```

The cut itself was verified mechanically rather than read over, which is the one
failure mode a release cut has that no gate catches — 16 assertions, 0 failures.
Every multi-line comparison normalises `\r\n` first, which is `0.27.0`'s defect 1
fixed at source rather than met again:

```
ok   origin/main held 2 unreleased notes — 2
  ok   unreleased is now empty — 0
  ok   new entry is first in releases — 0.27.1
  ok   date is today — 2026-10-12
  ok   major is false (no mail) — false
  ok   entry has 2 notes — 2
  ok   every source note used exactly once — order unchanged [0,1]
  ok   text lost 0, invented 0 — 264 chars both sides
  ok   role tags changed: 0 — |
  ok   majorReleasesSince("0.27.0") is empty (minor => no admin mail) — []
  ok   package.json matches newest entry — 0.27.1
  ok   file order still matches compareVersions (newest first)
  ok   no [object Object] / undefined in any note — 235 notes
  ok   all previous entries byte-identical from 0.27.0 down — 97936 vs 97936 chars
  ok   exactly one entry added — 40 -> 41
  ok   no other edits to releases.ts outside the two sites

16 assertions, 0 failed
```

- [ ] CI green on the PR (runs the same three). **This one cannot be true in the commit that creates the PR**, so leave it `n/a: not yet — the PR does not exist at this commit` on the first push and tick it in a follow-up commit once the run is actually green. Every PR hits this; the first push is red on `test-plan` by construction. Do not pre-tick it — a green you have not seen is the exact failure this checklist exists to prevent — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; the release's two (`0186`, `0187`) merged in their own PRs and are applied as a release step, recorded in section 8
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR; reviewed as a release step instead, recorded in section 8
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR; run against production as a release step, recorded in section 8
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; both of the release's two are already applied to dev by their own PRs, confirmed this session as `187 applied, 0 pending`
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR; both of the release's two were read this session and are `create or replace` / `drop trigger if exists`
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR; both of the release's two are applied on dev with `No drift`, which is the evidence for this
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the `do $$ … $$` block CLAUDE.md describes under "Database migrations", whose `raise exception` assertions surface as errors. Say what was asserted, not merely that it ran: typically that checks reject invalid values, that `null` means "not set" rather than zero, that values round-trip at full precision, and that nothing was silently back-filled. This is usually the most valuable single thing done to a migration, and it signs under **Automated checks** — it is scripted and repeatable, not a person looking at a screen — n/a: no migration in this PR; this belongs to `0186`'s and `0187`'s own plans, which carry it
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: stated in section 8's apply plan instead, where the release manager's own gate reads it

## 4. Functional checks

- [ ] Happy path works end to end — n/a: this PR adds no UI surface; it moves two existing notes into a release entry, verified as data by 16 assertions (section 2)
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is written by this PR, so there is nothing to persist
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: this PR adds no create, edit or delete path
- [ ] Empty state renders sensibly (no rows yet) — n/a: `unreleased` is now empty, which is its normal post-cut state and is asserted, not observed
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: this PR takes no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no boundary in this PR; the entry's date is a fixed string and both notes are plain strings with no optional fields

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | Sees the `0.27.1` entry, two notes in source order; **receives no mail**, because `major: false` | `majorReleasesSince("0.27.0")` = `[]`, so no mail fires. Entry read back from the module: 2 notes, order `[0,1]` |
| management | `/releases` | Same entry; neither note carries a role tag, so neither is filtered out | both notes are plain strings — asserted, 0 tagged |
| second_in_command | `/releases` | Same entry, same two notes | as above |
| head_of_maintenance | `/releases` | Same entry, same two notes | as above |
| head_of_medical | `/releases` | Same entry, same two notes | as above |
| doctor | `/releases` | Same entry, same two notes | as above |
| volunteer | `/releases` | Same entry, same two notes | as above |
| signed out | `/releases` | Not reachable — the page loads a session role | unchanged by this PR |

- [ ] Every role above tested — n/a: no role reaches anything new; the entry is read-only data on `/releases`, which every signed-in role already sees, and neither note is role-tagged
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right roles, no dead links — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no manual change — a release entry is not a manual topic
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: release notes are deliberately English-only, as all 41 previous entries are
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no layout change; `/releases` renders this entry with the same component as the other 41
- [ ] Browser console clean — no errors or React warnings — n/a: not driven — `/releases` is behind sign-in and this session has no account; see Left for manual verification
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven — same reason

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven. `/releases` is the only page reading what changed and it is behind sign-in, so nothing was loaded. The build compiles it and the module was imported directly (section 2), which is not the same as loading the page — it is in Left for manual verification
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file**. Reading proves only that you did not edit it; loading proves the value it still supplies at runtime is the one the other page expects. The weaker reading is the tempting one — n/a: no shared file touched — `releases.ts` is imported by `/releases` and `deploy.mjs`, and both were exercised (section 2 build, and `majorReleasesSince` run directly)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the branch was cut from `origin/main` at `c6e19730` and `sync` reported nothing to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: a release cut closes no backlog item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: no non-obvious design choice — the major-versus-minor call and the unchanged note order are recorded in the commit message and in this plan
- [x] `README.md` still accurate — no README statement is about release notes or versions
- [ ] **Release notes.** Would a shelter user notice this change? If so, `unreleased` in `src/lib/releases.ts` has a line for it, **in this PR**, written for a shelter user and not as a commit message. If not, `n/a: <why nobody would notice>` — n/a: this PR *is* the release notes — it moves two notes written by their own PRs into the `0.27.1` entry and empties `unreleased`, so `unreleased` gained no line by design
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** No gate reads prose: `typecheck`, `lint`, `build` and this checklist all pass with a confidently wrong explanation in the commit that ships the fix, and the wrong explanation is what the next person inherits. Worth real attention on timezone, concurrency and floating-point work, where intuition is unusually unreliable and a plausible story is easy to tell

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [ ] Deployed SHA matches the tested SHA — `deploy.mjs` prints both the target project and the short SHA; read that line, do not assume it — deferred: release manager — read at the deploy, not knowable here

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part of every day in Thailand — n/a: nothing in this PR derives a date; the entry's `date` is a fixed string and both notes are a scroll behaviour and an error message. The release's own timezone-sensitive change is `0186`'s date rule, which belongs to its plan and was checked this session against `todayIso()` resolving in Asia/Bangkok
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

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR carries no migration and no code reading one. The release's two are applied before the deploy, per the apply plan below
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager — run against production immediately before the apply
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh. (Additive nullable columns do not need this gate. Note the README restore recipe has never been exercised.) — **three fresh production backups exist**, taken on the Pi this morning while Lutan worked on the restore test: `lannacare-production-2026-10-12T0445Z.dump.age` (1,114,838 bytes, 11:46 Pi local), plus `…T0442Z` and `…T0439Z`, alongside the weekly cron's `…2026-10-10T2000Z`. Neither of the release's migrations holds or rewrites data — `0186` is `create or replace` on a function body, `0187` adds a guard function and four triggers — so this gate is satisfied rather than waived. **The README restore recipe is being exercised by Lutan today**, which is the first time
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — the apply plan, in order:

  1. `node scripts/apply-migrations.mjs --env production --status` — expect `185 applied, 2 pending`
  2. `--env production --dry-run` — read it, but **do not treat a red as a stop without reading the files**: the per-file `begin … rollback` trap has fired in three of the last five releases. These two files are independent of each other, so a clean run is expected
  3. `--env production` — applies `0186`, `0187` to `dbkodyyxxhtygxcxmfcu`
  4. **before** either deploy, and with no user-facing window needed

  Why no window is needed, checked against the live `0.27.0` source rather than taken from the headers. `0186_receipt_date_rule.sql` replaces `issue_donation_receipt` with an **unchanged signature** and adds the rule `received_on <= issued_on <= shelter_today()`; the live app passes `p_issued_on: todayIso()` (`src/app/management/donations/actions.ts:73`), and `todayIso()` formats in the shelter's own zone (`src/lib/format.ts:84`, `SHELTER_DATE_FORMAT`), so what the live app sends is exactly `shelter_today()` and sits inside the new bounds. `0187_medical_archive_trigger.sql` refuses an `archived_at` change without `medical.archive`; the live app already asks that same permission on both the archive and the restore path (`src/app/residents/[id]/archive-actions.ts:49` and `:92`) and renders the control only where it holds (`[section]/page.tsx:161`), reading the same settings grid the trigger reads, and callers with no login are let through. Contrast `0181` two releases ago, which dropped what the live app called on every request

### Rollback

- [x] Rollback position stated, **including what it does not cover**. Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` there (a rebuild); `npx wrangler rollback --env production` reverts only the Worker fallback. Neither reverts migrations — rollback is `./scripts/pi/deploy-pi.sh --ref 47760a81` on the Pi (a rebuild of `0.27.0`), with `npx wrangler rollback --env production` for the Worker fallback. **What it does not cover: the two migrations.** Neither has a down-migration, and `0187` leaves four triggers behind. The practical position is that the schema stays and the app rolls back, which is safe because `0.27.0` sends a receipt date inside `0186`'s rule and already asks `medical.archive` before changing `archived_at` — the same two facts that make the forward direction safe

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `release-prs.mjs 47760a81 HEAD` exited **1**: three test plans in the range belonged to no PR in its list. All three were real PRs — #546, #549 and #557 — **squash-merged**, so no merge commit carries their number. The list is twelve plus those three, fifteen | accepted — not a missed PR, and the script behaved correctly. `0.27.0`'s record predicted exactly this (lesson 8). Named in the release record |
| 2 | low | Four of the release's fifteen test plans carry `pending:` manual verification | accepted by Lutan at the cut (chat, 2026-10-12), shipping with the gaps noted. Listed in the release record, not here — they belong to their own plans |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the `0.27.1` entry on `/releases` as a signed-in person, and check both notes read well. The *content* is asserted (same set, order unchanged, nothing lost or invented); what a person adds is whether it reads well to a shelter user. `/releases` is behind sign-in and this session has no account | `/releases`, any signed-in role |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. **If the list is empty, whoever filled the plan may tick this** and write `n/a: <reason>` on the signature below — there is nothing for a person to look at, so nothing is being signed for. If the list is not empty, only the person who looked may tick it — n/a: the list is not empty, so this stays for the person who looks (see the pending line)

Manual verification by: pending: row 1 above — the `0.27.1` entry read on `/releases` by a signed-in person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: pasted once the PR exists
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-12
