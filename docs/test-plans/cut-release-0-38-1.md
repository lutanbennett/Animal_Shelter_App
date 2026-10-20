# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.38.1` — move the four `unreleased` notes into a `0.38.1` entry, `major: false`, and set `package.json` to match |
| Backlog item | `docs/backlog.md` → n/a: a release cut is not a backlog item; it is the release procedure's step 4 |
| Branch / worktree | `claude/cut-release-0-38-1` @ `C:\Development\Animal_Shelter_cut-release-0-38-1` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` — not started: a data-only change to one module, exercised by importing it |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-20 |
| Carries a migration? | **no** — but the release applies three (`0233`, `0234`, `0235`). Apply plan in section 8 |
| Tested at SHA | `9fd21c46` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the four notes in `unreleased` become release `0.38.1` dated 2026-10-20, `major: false`, and `package.json`'s version matches the newest entry
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only — no exported function, type or ordering rule changed) and `package.json`'s `version`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Roles affected identified: everyone who opens `/releases`, which opens on the reader's own role. Measured per role rather than assumed — admin 4, management 4, doctor 3, head_of_medical 2, volunteer 1, **second_in_command 0, head_of_maintenance 0**. The two zeroes are recorded as a fact of this release's note set, not a defect of the cut: `0.38.0` happened to reach every role and this one does not
- [x] Anything explicitly **out of scope** written down: the notes themselves are not reworded (see below), no migration is applied by this PR, and the deploys are section 8's

**The one risk worth naming, because it was a decision and not an accident.** Two of
the four notes promise more than production can do today — the vet-calendar
sync-back (production has no calendar token) and the desexing sign-up form (no
visitor reaches it while `PUBLIC_SITE` is `locked`). Both were put to Lutan
before cutting, with holding recommended, and **he chose to ship them as
written**. Recorded in `docs/decisions/2026-10-20-release-0-38-1-notes-shipped-as-written.md`
with what makes it tolerable here and what would not transfer to a major release.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `70a2388b` minutes before the cut, so `sync` had nothing to merge. `git status -sb` clean against `origin/main`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line exactly as printed:

```
=== gates: build exited 0 after 104s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

Also run, because a release cut is the one change that can break the deploy
guards without breaking a build:

- [x] `node scripts/check-release-guards.mjs` — **exit 0**, all eight cases `ok`, including `unreleased refuses` and `missing migration refuses`

### The mechanical verification of the cut itself

Not a read-over. Both versions of the module were imported and their notes
compared **as values**, so role tags are compared too, and the first two
assertions exist to prove the comparison is not vacuously empty. Output as
printed, unedited:

```
PASS  the PREVIOUS file had notes in `unreleased` — 4 note(s)
PASS  the NEW release entry has notes — 4 note(s)
PASS  nothing lost — 4 in, 4 out
PASS  nothing invented — no additions
PASS  every carried note byte-identical
PASS  `unreleased` is now empty — 0 left
PASS  new entry version is 0.38.1 — 0.38.1
PASS  date is today — 2026-10-20
PASS  major is FALSE (this is a minor release) — false
PASS  title is a non-empty string — Prescriptions set how often directly, desexing drives, and vet visits sync back from Google Calendar
PASS  majorReleasesSince("0.38.0") returns NOTHING — so no mail goes out — returned []
PASS  sanity: majorReleasesSince("0.37.2") still finds 0.38.0, so the check is not vacuous — returned [0.38.0]
PASS  package.json version equals the newest entry — package.json=0.38.1, newest=0.38.1
PASS  releases are still in descending version order — top five: 0.38.1 > 0.38.0 > 0.37.2 > 0.37.1 > 0.37.0
PASS  every note renders as real text
PASS  no note carries an empty roles array — 4, 2, 5, 3

verify-cut: ALL CHECKS PASSED
```

- [x] All four notes carried across byte-identical, with their role tags, and all four printed in full for a reader to compare
- [x] **The mail check run the right way up for a MINOR**: the pass is the *absence* of a major in the range, and a second assertion against the release before last proves the function still finds one when there is one. Checked by importing the module, not by reading the `major:` flag

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. `origin/main`'s highest is `0235`, so the next free number is `0236`
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Production's status was read before the cut all the same (233 applied, 3 pending) and is quoted in the release record; the apply itself is section 8's
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration; the dry-run against production belongs to section 8, immediately before the apply
- [ ] Applied to **dev** — n/a: all three of the release's migrations were applied to dev by their own PRs; `--drift test` reads `No drift: test matches origin/main`
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR. The release's apply plan for all three files is written out in section 8, **Migration ordering**

## 4. Functional checks

- [x] Happy path works end to end: the module imports, `releases[0]` is `0.38.1`, and all four notes read back as the strings their feature PRs wrote
- [x] Data persists — n/a as a database claim; the equivalent here is that the data survives a build: `build` exited 0 and the entry is compiled into the Worker bundle that answers `/api/releases/current`
- [ ] Create / edit / delete all exercised — n/a: a release entry is data in a source file; there is no CRUD surface
- [x] Empty state renders sensibly: `unreleased` is now empty, which is its normal post-cut state, and `check-release-guards.mjs` asserts that a *non*-empty `unreleased` refuses a production deploy
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked: version ordering across the `0.38.0 → 0.38.1` last-number bump asserted with `compareVersions` over the whole list, not just the top two; `majorReleasesSince` exercised from two different starting versions

### Role access matrix

`/releases` is readable by every signed-in role and filters on role tags. No
permission, guard or RLS cell is touched by this PR, so what is recorded here is
**what each role sees**, which is the thing this change can actually alter.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all four notes | 4 — asserted from the role tags, not driven in a browser |
| management | `/releases` | all four | 4 — asserted |
| staff | n/a | retired role (`0173`) | n/a: not a live role |
| doctor | `/releases` | prescriptions, name card, calendar | 3 — asserted |
| volunteer | `/releases` | name card only | 1 — asserted |
| second_in_command | `/releases` | **nothing in this release** | **0 — asserted.** An empty section for this role; see the manual item below |
| head_of_maintenance | `/releases` | **nothing in this release** | **0 — asserted** |
| head_of_medical | `/releases` | prescriptions, calendar | 2 — asserted |
| signed out | none | refused by the gate | unchanged: no permission code touched |

- [x] Every role above tested — by asserting the role tags of each note against each live role, which is what decides what is shown. Not driven in a browser as each role: no staff session this run, and the filter itself is untouched code
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: this PR changes no guard, no `requirePermission` call and no policy

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut adds no feature to document; the features' own PRs carry their manual topics
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated (they are written for the reader in English, as every released note is)
- [ ] Mobile viewport (375px) — n/a: not driven at 375px. The `/releases` page's own layout is unchanged by this PR, and how this release's entry reads on a phone is item 1 of the manual list below
- [ ] Browser console clean — n/a: no browser session this run
- [ ] Network clean — n/a: no browser session this run

## 6. Regression

- [x] The pages nearest the change still work: `/releases` and `/api/releases/current` both read this module, and both are included in the `build` that exited 0. `scripts/deploy.mjs` also loads it directly under Node type stripping — exercised by `check-release-guards.mjs`, which passed
- [x] Any shared file touched checked from a second, unrelated page: `src/lib/releases.ts` is read by the Worker bundle as well as the page, and `check-release-guards.mjs` loads it through the deploy script's own path rather than the app's — a second, independent consumer, run rather than read
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is one commit from `70a2388b`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. The items this release's features closed were ticked in their own PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-20-release-0-38-1-notes-shipped-as-written.md`, recording Lutan's call on the two half-true notes and, deliberately, what does **not** transfer from it
- [x] `README.md` still accurate — not touched; it names no version
- [ ] **Release notes.** — n/a: this PR *is* the release notes and adds no new line. It moves four existing notes out of `unreleased` into the `0.38.1` entry, byte-identical with their role tags, which the verification in section 2 asserts note by note. Nothing a shelter user could notice is added by the cut itself. **Checked the other way round too, per the standing item 14:** every feature plan in the range whose release-notes line reads `n/a: <an outstanding step>` was re-read to see whether this release closes that step — `desexing-drives-schema` ("until the page lands") and `prescription-dose-schema` ("no code reads the column") are both closed by features shipping in this same release, and both of those features carry their own note, so nothing is missing. `domain-split-build`'s is not closed here: its first visible change is the cutover edit, which carries its own note later. `stock-receipts-immutable` and `cron-job-confirmed` need nothing
- [x] Commit messages say why, not just what — the cut commit records why it is minor, whose call that was, and what was verified rather than read over
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The two claims that could have been reasoned were not: that no mail goes out is `majorReleasesSince("0.38.0")` returning `[]` with a non-vacuous sanity check, and that production has no calendar token is `calendarConfigured()` read in code plus the backlog's record of Lutan's own ordering — not inferred from the feature having shipped

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `9fd21c46`, this branch's cut commit
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. The deployed SHA will be this branch's **merge commit**, not `9fd21c46`; it goes in the release record and is read off each `deploy.mjs` and `deploy-pi.sh` banner rather than assumed

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, against `docs/release-smoke-test.md`
- [ ] Timezone-sensitive behaviour proved — **n/a: the only date in this change is the entry's own `date: "2026-10-20"`, a display string.** No logic derives "today" from it; `compareVersions` orders by version, not date. Nothing here can behave differently at 00:00 Thai than at noon
- [ ] Boundary or banding change — n/a: no threshold, band, retry window or cutoff is touched. The one ordering boundary (`0.38.0 → 0.38.1`) is asserted in section 2
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` line and the whole `verify-cut` block are as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager. **And note what it cannot cover:** `PUBLIC_SITE` is `locked` on both environments, so an anonymous request to any public page gets the staff-testing gate. The public pages are not smoke-testable at all this release; the enforcing layer is checked directly as the `anon` role instead

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager (Lutan runs the production Worker deploy; the line is read from his `tee`'d log)
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: release manager. **Expect 13 on both environments**, which held exactly last release
- [x] Any new secret/env var exists in the production Cloudflare environment — **none is added by this release.** Checked against each feature plan's own section 8 line: all read `n/a: none added`. **The production calendar token is a separate matter and is not required by anything here** — without it the calendar poll is dormant, which is `calendarConfigured()` returning false, not an error

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** **No** — this PR carries no migration. The release's three are already on `main`, each merged ahead of or alongside its reader in its own PR, per the schema-first rule
- [ ] `--dry-run` against production run and clean — deferred: release manager, immediately before the apply
- [x] For a destructive or rewriting migration only: **none of the three is destructive.** `0233` creates new tables, views, policies and a trigger; `0234` adds a nullable column plus a back-fill over rows it also created the column for; `0235` adds a `before update` trigger that *refuses* non-cost edits and changes no row. No production backup gate is therefore engaged
- [x] **Apply plan stated:** all three to `dbkodyyxxhtygxcxmfcu` (production), from the **main checkout**, **after the merge and the pull and before either Worker deploy**, in file order `0233` → `0234` → `0235`, with `--status` then `--dry-run` first and `--status` plus `--drift production` after

**Two `-- consumer:` warnings are expected, and predicting them here is the point
of writing this before the apply runs:**

- `0233_desexing_drives.sql` declares `scripts/check-public-views.mjs`
- `0235_stock_receipts_cost_only_update.sql` declares `src/app/bills/actions.ts`

Both name code that **arrives in this same release** (#778/#783 and #784), so each
warning is the safe direction by construction — the schema lands minutes before
its reader, which is the order this runbook requires anyway. `0234` declares
`-- consumer: none` and should warn about nothing. **A warning on any other file,
or on `0234`, is not predicted and is a reason to stop.**

### Rollback

- [x] **Rollback position stated, including what it does not cover.** Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 8d385e10` on the production clone — a rebuild of the previous release. `npx wrangler rollback --env production` reverts only the Worker fallback, and reverting one without the other leaves the two disagreeing. **Neither reverts a migration.** All three of this release's migrations are additive or refusing rather than destructive, so they are safe to leave applied under a rolled-back build: `0233`'s objects go unread, `0234`'s column goes unread, and `0235`'s trigger would refuse a whole-row delivery update — which **no code on `8d385e10` performs**, checked rather than assumed (the only `stock_receipts` update anywhere writes `cost` alone). So "rollback available" is a true statement for this release, and that is why it is written out rather than ticked

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Two of the four notes promise more than production can do today: the vet-calendar sync-back (no production token) and the desexing sign-up form (no visitor reaches it while `PUBLIC_SITE` is `locked`) | **accepted** — put to Lutan before cutting with holding recommended; he chose to ship both as written. No mail goes out on a minor. `docs/decisions/2026-10-20-release-0-38-1-notes-shipped-as-written.md` |
| 2 | low | `second_in_command` and `head_of_maintenance` see an empty section on `/releases` for this release | **accepted** — a fact of the note set, not of the cut. No note was written for either role by any feature in the range, and inventing one to fill the section would be worse |

## Left for manual verification

Only items belonging to **this** PR. The nine outstanding items across the
release's feature plans stay in their own plans with their own signatures; they
are listed in the release record as gaps this release shipped with, on Lutan's
explicit decision.

| # | What to check | Where |
|---|---|---|
| 1 | The `0.38.1` entry on the deployed build: the four notes read well to a shelter user, with no broken wording, and the arrow and Thai characters inside the prescriptions note render properly | `/releases`, signed in as admin |
| 2 | How the page looks to `2IC` and `Head of Maintenance`, who have no note in this release — whether the empty section reads as "nothing for you this time" or as a fault | `/releases`, signed in as either role |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-20

### Manual verification

- [ ] The manual list is not empty, so only the person who looked may tick this — n/a: pending, see the signature line below

Manual verification by: pending: the two items above — this release's notes read on the deployed `/releases` page, and how the page looks to the two roles with no note in this release

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a: this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-20
