# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.38.2` — move the three `unreleased` notes into a `0.38.2` entry, `major: false`, tag the nightly-job note `admin`, and set `package.json` to match |
| Backlog item | `docs/backlog.md` → n/a: a release cut is not a backlog item; it is the release procedure's step 4 |
| Branch / worktree | `claude/cut-release-0-38-2` @ `C:\Development\Animal_Shelter_planner-handover-267` — a **reused free leftover**, per `docs/release-procedure.md` paperwork rule 2, rather than a fresh worktree costing a four-minute `npm ci` to hold two edited files |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` — not started: a data-only change to one module, exercised by importing it |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-21 |
| Carries a migration? | **no** — but the release applies three (`0236`, `0237`, `0238`). Apply plan in section 8 |
| Tested at SHA | `46bf004b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what step 4 of the runbook asks for: the three notes in `unreleased` become release `0.38.2` dated 2026-10-21, `major: false`, the first note gains `roles: ["admin"]`, and `package.json`'s version matches the newest entry
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only — no exported function, type or ordering rule changed) and `package.json`'s `version`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Roles affected identified: everyone who opens `/releases`, which opens on the reader's own role. Measured from the tags rather than assumed — **admin 3, management 2, second_in_command 2, head_of_maintenance 2, head_of_medical 2, doctor 2, volunteer 2**. No role opens an empty section this release, which is a change from `0.38.1` where two roles saw nothing
- [x] Anything explicitly **out of scope** written down: the note *texts* are not reworded (only note 1's role tag is added), no migration is applied by this PR, and the deploys are section 8's

**The one judgement worth naming.** Note 1 describes a tile on `/admin/status` and
an email that goes to admins. It arrived untagged, which shows it to every live
role — including `volunteer` and `second_in_command`, who cannot open that page
and are not on that mail. Put to Lutan with the alternative stated; he chose to
tag it `admin`. The other two notes stay untagged deliberately: anyone who records
immunizations or has pages of their own will notice them, and a wrong tag hides a
note from the people it is for, which is the worse failure of the two.

**The release-note truth rule was checked forwards on all three**, not assumed from
the features having merged:

- Note 1's "admins are emailed" is **true**: the signal is one more health check in the Worker's existing quarter-hourly sweep, which already mails admins after two red runs (`docs/decisions/2026-10-21-cron-job-watch.md`). It needs `0238` on production, which section 8 applies **before** the deploy — until then the tile would read red, "function not found"
- Note 3's "kept in a shared Google Drive folder" becomes true when `scripts/sync-home-icons.mjs --env production` runs after the deploys, which is the release manager's own step in the runbook, not an outstanding step belonging to someone else. **If that sync fails, note 3's last sentence is false** and that goes in the release record rather than being quietly tolerated
- Note 2 needs nothing outstanding

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created directly from `origin/main` at `f2773d25` minutes before the cut, so there was nothing to merge. `git status -sb` clean, neither ahead nor behind `origin/main` before the cut commit
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 152s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

Also run, because a release cut is the one change that can break the deploy
guards without breaking a build:

- [x] `node scripts/check-release-guards.mjs` — **exit 0**, all sixteen cases `ok`, including `unreleased refuses`, `package.json behind the newest release is a problem` and `missing migration refuses`

### The mechanical verification of the cut itself

Not a read-over. Both versions of the module were imported and the notes compared
**as values**, so role tags are compared too, and the first two assertions exist
to prove the comparison is not vacuously empty. Output as printed, unedited:

```
ok    old unreleased had 3 notes — 3
ok    new unreleased is empty — 0
ok    newest entry is 0.38.2 — 0.38.2
ok    dated 2026-10-21 — 2026-10-21
ok    major is false (minor release) — false
ok    has a title — The nightly clear-out is watched, scan card on the immunizations form, and home screen icons
ok    note count carried — 3 vs 3
ok    note 1 text identical — System status has a new tile for the nightly …
ok    note 2 text identical — Recording immunizations: Scan card (Android) …
ok    note 3 text identical — Home screen icons: tap your name, then Home s…
ok    nothing invented
ok    nothing lost
ok    note 1 tagged admin only — ["admin"]
ok    note 2 untagged (everyone)
ok    note 3 untagged (everyone)
ok    no other note's tags changed — all three were untagged before; only note 1 was tagged
ok    package.json version matches newest entry — 0.38.2 vs 0.38.2
ok    entry 2 is still 0.38.1 — 0.38.1
ok    every older entry byte-identical — 57 older entries vs 57
ok    versions strictly descending — 58 entries
ok    every note renders as non-empty text, no leaked placeholders — 316 notes checked
ok    the only 'undefined' in any note is 0.33.0's deliberate quote — 1 found
ok    majorReleasesSince("0.38.1") is empty (no mail) — []
ok    majorReleasesSince("0.37.2") still finds 0.38.0 — ["0.38.0"]
     role coverage of 0.38.2: admin 3, management 2, second_in_command 2, head_of_maintenance 2, head_of_medical 2, doctor 2, volunteer 2
ok    no role sees an empty section — {"admin":3,"management":2,"second_in_command":2,"head_of_maintenance":2,"head_of_medical":2,"doctor":2,"volunteer":2}
ok    admin sees all three — 3
ok    no note carries an empty roles array — [admin], untagged, untagged

ALL CHECKS PASSED
```

- [x] All three notes carried across byte-identical, and the 57 older entries compared as values too — so this PR is proved not to have touched release history, which a read-over of a 1,000-line file would not establish
- [x] **The mail check run the right way up for a MINOR**: the pass is the *absence* of a major in the range, and a second assertion against the release before last proves the function still finds one when there is one. Checked by importing the module, not by reading the `major:` flag
- [x] The one deliberate edit is asserted as such: note 1 is `["admin"]`, notes 2 and 3 are untagged, and all three were untagged before — so the diff in tags is exactly one note, not two

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. `origin/main`'s highest is `0238`, so the next free number is `0239`
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Production's status was read before the cut all the same (`236 applied, 3 pending`) and is quoted in section 8; the apply itself is section 8's
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration; the dry-run against production belongs to section 8, immediately before the apply
- [ ] Applied to **dev** — n/a: all three of the release's migrations were applied to dev by their own PRs. Confirmed rather than assumed: `--drift test` reads `No drift: test matches origin/main`, `239 file(s), 239 applied row(s)`, 0 in each direction
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR. The release's apply plan for all three files is in section 8, **Migration ordering**

## 4. Functional checks

- [x] Happy path works end to end: the module imports, `releases[0]` is `0.38.2`, and all three notes read back as the strings their feature PRs wrote
- [x] Data persists — n/a as a database claim; the equivalent here is that the data survives a build: `build` exited 0 and the entry is compiled into the Worker bundle that answers `/api/releases/current`
- [ ] Create / edit / delete all exercised — n/a: a release entry is data in a source file; there is no CRUD surface
- [x] Empty state renders sensibly: `unreleased` is now empty, which is its normal post-cut state, and `check-release-guards.mjs` asserts that a *non*-empty `unreleased` refuses a production deploy
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked: version ordering across the `0.38.1 → 0.38.2` last-number bump asserted with a `compareVersions`-equivalent over all 58 entries, not just the top two; `majorReleasesSince` exercised from two different starting versions; and the role filter exercised for all seven live roles rather than for admin alone

### Role access matrix

`/releases` is readable by every signed-in role and filters on role tags. No
permission, guard or RLS cell is touched by this PR, so what is recorded here is
**what each role sees**, which is the thing this change can actually alter — and
this release is the first in which a cut *changes* a tag, so the matrix is the
check rather than a formality.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all three notes | 3 — asserted from the role tags, not driven in a browser |
| management | `/releases` | scan card, home screen icons | 2 — asserted. **Not the nightly-job note**, which is the deliberate change |
| staff | n/a | retired role (`0173`) | n/a: not a live role |
| doctor | `/releases` | scan card, icons | 2 — asserted |
| volunteer | `/releases` | scan card, icons | 2 — asserted |
| second_in_command | `/releases` | scan card, icons | 2 — asserted. Non-zero this release, unlike `0.38.1` |
| head_of_maintenance | `/releases` | scan card, icons | 2 — asserted. Non-zero this release |
| head_of_medical | `/releases` | scan card, icons | 2 — asserted |
| signed out | none | refused by the gate | unchanged: no permission code touched |

- [x] Every role above tested — by asserting each note's role tags against each live role, which is what decides what is shown, and by asserting that no role's count is zero. Not driven in a browser as each role: no staff session this run, and the filter itself is untouched code
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: this PR changes no guard, no `requirePermission` call and no policy. The `admin` tag on note 1 is a *display* filter on `/releases`, not an access control, and is not claimed as one

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut adds no feature to document; the features' own PRs carry their manual topics
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated, as every released note is
- [ ] Mobile viewport (375px) — n/a: not driven at 375px. The `/releases` page's own layout is unchanged by this PR, and how this release's entry reads on a phone is item 1 of the manual list below
- [ ] Browser console clean — n/a: no browser session this run
- [ ] Network clean — n/a: no browser session this run

## 6. Regression

- [x] The pages nearest the change still work: `/releases` and `/api/releases/current` both read this module, and both are included in the `build` that exited 0. `scripts/deploy.mjs` also loads it directly under Node type stripping — exercised by `check-release-guards.mjs`, which passed
- [x] Any shared file touched checked from a second, unrelated page: `src/lib/releases.ts` is read by the Worker bundle as well as the page, and `check-release-guards.mjs` loads it through the deploy script's own path rather than the app's — a second, independent consumer, run rather than read
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is one commit from `f2773d25`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. The items this release's features closed were ticked in their own PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-release-0-38-2-admin-tag-and-directory-consumers.md`, recording why note 1 was tagged and the directory-consumer finding in Defect 1
- [x] `README.md` still accurate — not touched; it names no version
- [ ] **Release notes.** — n/a: this PR *is* the release notes and adds no new line. It moves three existing notes out of `unreleased` into the `0.38.2` entry, byte-identical, which the verification in section 2 asserts note by note; the only change is one role tag, which narrows who sees a note rather than adding one. **Checked the other way round too:** every feature plan in the range whose release-notes line reads `n/a: <an outstanding step>` was re-read to see whether this release closes that step. `calendar-followup-schema`'s is closed by the app half (#794) shipping here, and `public-trust-block`'s remains open on purpose — its pages are unreachable while `PUBLIC_SITE` is `locked`, so a note would promise what no visitor can see, which is the truth rule working rather than a gap
- [x] Commit messages say why, not just what — the cut commit records why it is minor, whose call that was, why exactly one tag changed, and what was verified rather than read over
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The two that could have been reasoned were not: that no mail goes out is `majorReleasesSince("0.38.1")` returning `[]` with a non-vacuous sanity check beside it, and that the nightly-job note's mail claim is true is `docs/decisions/2026-10-21-cron-job-watch.md` plus `EXPECTED_CRON_JOBS` in `health.ts` read in code — not inferred from the feature having shipped

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `46bf004b`, this branch's cut commit
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. The deployed SHA will be this branch's **merge commit**, not `46bf004b`; it goes in the release record and is read off each `deploy.mjs` and `deploy-pi.sh` banner rather than assumed

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, against `docs/release-smoke-test.md`
- [ ] Timezone-sensitive behaviour proved — **n/a: the only date in this change is the entry's own `date: "2026-10-21"`, a display string.** No logic derives "today" from it; ordering is by version, not date. Nothing here can behave differently at 00:00 Thai than at noon
- [ ] Boundary or banding change — n/a: no threshold, band, retry window or cutoff is touched by the cut. The one ordering boundary (`0.38.1 → 0.38.2`) is asserted in section 2. **The release does ship bands** — the nightly-job tile's amber at 48 hours and red on failure — but they belong to `0238` and its own plan, not to this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines, the whole `verify-cut` block and the predicted-warning list are as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager. **And note what it cannot cover:** `PUBLIC_SITE` is `locked` on both environments, so an anonymous request to any public page gets the staff-testing gate. This matters more than usual this release, because `0237` adds content to `/about`, `/donate` and the public footer that **no visitor can reach**; the enforcing layer is checked directly as the `anon` role instead

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager (Lutan runs the production Worker deploy; the line is read from his `tee`'d log, grepping the **project ref**, since the arrow does not survive the UTF-16 strip)
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: release manager. **Expect 13 on both environments**, which has held for three releases
- [x] Any new secret/env var exists in the production Cloudflare environment — **none is added by this release.** Checked against each feature plan's own section 8 line rather than assumed: all read `n/a: none added`. **The production calendar token is a separate matter and is not required by anything here** — without it the calendar poll is dormant, which is `calendarConfigured()` returning false, not an error

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** **No** — this PR carries no migration. The release's three are already on `main`, each merged ahead of or alongside its reader in its own PR, per the schema-first rule. **But the release as a whole does**: `0238` and its reader `src/lib/status/health.ts` both ship here, so the apply must precede the deploy or the new tile reads red with "function not found" — stated in `docs/decisions/2026-10-21-cron-job-watch.md` and the reason the ordering below is not merely conventional
- [ ] `--dry-run` against production run and clean — deferred: release manager, immediately before the apply
- [x] For a destructive or rewriting migration only: **none of the three is destructive.** `0236` adds columns for calendar cancel reasons and changes; `0237` adds `SiteContent` fields the trust block reads; `0238` adds a security-definer function over `cron.job_run_details`. All additive, none rewrites or drops a row. No production backup gate is therefore engaged
- [x] **Apply plan stated:** all three to `dbkodyyxxhtygxcxmfcu` (production), from the **main checkout**, **after the merge and the pull and before either Worker deploy**, in file order `0236` → `0237` → `0238`, with `--status` then `--dry-run` first and `--status` plus `--drift production` after

**Nine `-- consumer:` warnings are predicted, and four of them are vacuous.**
Predicted before the apply by running the real `consumerReport` against the real
`read`, not by reasoning about which files changed:

```
0236_calendar_followup_schema.sql
  live     src/lib/clinics/calendar-sync.ts  (live)
  WARN     src/app/clinic-visits/  (differs)
  WARN     src/app/admin/status/  (differs)
  WARN     worker/  (differs)

0237_trust_block.sql
  WARN     src/lib/site/content.ts  (differs)
  WARN     src/app/admin/website/  (differs)
  WARN     src/app/adopt/PublicFooter.tsx  (differs)
  WARN     src/app/about/page.tsx  (differs)
  WARN     src/app/donate/page.tsx  (differs)

0238_scheduled_job_status.sql
  WARN     src/lib/status/health.ts  (differs)

=== PREDICTED: 9 warning(s) ===
WARNING 0236_calendar_followup_schema.sql: declared consumer src/app/clinic-visits/ differs from release 0.38.1, so it may or may not already read this.
WARNING 0236_calendar_followup_schema.sql: declared consumer src/app/admin/status/ differs from release 0.38.1, so it may or may not already read this.
WARNING 0236_calendar_followup_schema.sql: declared consumer worker/ differs from release 0.38.1, so it may or may not already read this.
WARNING 0237_trust_block.sql: declared consumer src/lib/site/content.ts differs from release 0.38.1, so it may or may not already read this.
WARNING 0237_trust_block.sql: declared consumer src/app/admin/website/ differs from release 0.38.1, so it may or may not already read this.
WARNING 0237_trust_block.sql: declared consumer src/app/adopt/PublicFooter.tsx differs from release 0.38.1, so it may or may not already read this.
WARNING 0237_trust_block.sql: declared consumer src/app/about/page.tsx differs from release 0.38.1, so it may or may not already read this.
WARNING 0237_trust_block.sql: declared consumer src/app/donate/page.tsx differs from release 0.38.1, so it may or may not already read this.
WARNING 0238_scheduled_job_status.sql: declared consumer src/lib/status/health.ts differs from release 0.38.1, so it may or may not already read this.
```

Every path named arrives in this same release, so each warning is the safe
direction by construction — the schema lands minutes before its reader, which is
the order the runbook requires anyway. **A warning on any path not in that list is
not predicted and is a reason to stop.** Four of the nine carry no information at
all; see Defect 1.

### Rollback

- [x] **Rollback position stated, including what it does not cover.** Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref 1de7bdb4` on the production clone — a rebuild of `0.38.1`. `npx wrangler rollback --env production` reverts only the Worker fallback, and reverting one without the other leaves the two disagreeing. **Neither reverts a migration.** All three of this release's migrations are additive, so they are safe to leave applied under a rolled-back build: `0236`'s and `0237`'s columns go unread, and `0238`'s function goes uncalled because nothing on `1de7bdb4` is in `EXPECTED_CRON_JOBS` — checked in code rather than assumed, since `health.ts` is the one declared consumer and it is the file this release changes. So "rollback available" is a true statement for this release, and that is why it is written out rather than ticked

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **A directory-valued `-- consumer:` path can never read `live`, so it warns on every release regardless of whether anything in it changed.** `consumerState` compares `git show <ref>:<path>`, and for a directory that output's first line is `tree <ref>:<path>/` — which embeds the ref, so the two texts always differ. Proved rather than inferred: `worker/` has **zero** changed files since `1de7bdb4` (`git diff --name-only` empty) and still reports `differs`. Four of this release's nine predicted warnings are of this kind (`src/app/clinic-visits/`, `src/app/admin/status/`, `worker/`, `src/app/admin/website/`) | **deferred to backlog** — filed on the `backlog` branch, not here. It never blocks and never changes what is applied, so it is noise rather than risk; but it is noise in exactly the signal the 2026-10-02 decision added to catch a real ordering fault, and a check that always warns is one people stop reading |
| 2 | low | Note 1 arrived untagged and so would have shown a tile and an alert mail to `volunteer` and `second_in_command`, who can reach neither | **fixed** — tagged `roles: ["admin"]` in this cut, on Lutan's call, and asserted note-by-note in section 2 |

## Left for manual verification

Only items belonging to **this** PR. The nine outstanding items across the
release's feature plans stay in their own plans with their own signatures; they
are listed in the release record as gaps this release shipped with, on Lutan's
explicit decision.

| # | What to check | Where |
|---|---|---|
| 1 | The `0.38.2` entry on the deployed build: the three notes read well to a shelter user, with no broken wording, and the arrow in the icons note renders properly | `/releases`, signed in as admin |
| 2 | **That the new tag reads right rather than merely working**: an admin sees three notes, and a volunteer or 2IC sees two — the nightly-job note absent, and its absence not leaving an odd gap or a stray heading | `/releases`, signed in as admin and then as either role |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-21

### Manual verification

- [ ] The manual list is not empty, so only the person who looked may tick this — n/a: pending, see the signature line below

Manual verification by: pending: the two items above — this release's notes read on the deployed `/releases` page, and that the new `admin` tag reads right to a role that no longer sees that note

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a: this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-21
