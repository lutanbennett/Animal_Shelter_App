# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.39.0` — move the nine `unreleased` notes into a `0.39.0` entry, `major: true`, tag the two Settings → Who does what notes `admin`, and set `package.json` to match |
| Backlog item | `docs/backlog.md` → n/a: a release cut is not a backlog item; it is the release procedure's step 4 |
| Branch / worktree | `claude/cut-release-0-39-0` @ `C:\Development\Animal_Shelter_cut-release-0-39-0` — a **fresh worktree**, because all three leftovers `worktree.mjs list` reported were `HELD` by live sessions, so paperwork rule 2's "reuse a free leftover" had nothing to reuse |
| Dev server | `node scripts/worktree.mjs dev` → not started: a data-only change to one module with no imports, exercised by importing it |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-21 |
| Carries a migration? | **no** — but the release applies seven (`0239`–`0245`), one of them destructive. Apply plan in section 8 |
| Tested at SHA | `f40495b8` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches step 4 of the runbook: the nine notes in `unreleased` become release `0.39.0` dated 2026-10-21, `major: true`, notes 6 and 7 gain `roles: ["admin"]`, and `package.json`'s version matches the newest entry
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only — no exported function, type or ordering rule changed) and `package.json`'s `version`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Roles affected identified: everyone who opens `/releases`, which filters on the reader's own role. Measured from the tags rather than assumed — **admin 9, management 7, second_in_command 7, head_of_maintenance 7, head_of_medical 7, doctor 7, volunteer 7**. No role opens an empty section
- [x] Anything explicitly **out of scope** written down: the note texts are not reworded, no migration is applied by this PR, and the deploys are section 8's

**This is a MAJOR release, and that is the one irreversible thing in it.**
`deploy.mjs --env production` mails every admin when it sees a major release new
to production, and once sent it cannot be recalled. Put to Lutan before anything
was cut, with the alternative and a recommendation; **he chose major.** The case,
recorded because the next release manager will face the same judgement: this
release *changes things people already use* rather than adding to them — a
resident's diet form loses its daily amount for a portion multiplier, Purchasing
and the food forecast now read ingredients, and the Home screen panel in Settings
is gone. The minor case was that `0.38.0` mailed admins the day before last; it
lost because two of these changes alter a number or remove a control someone
relies on.

**Two notes were tagged at the cut**, on his call: both describe
Settings → Who does what, which only an Admin can open, so `volunteer` and
`second_in_command` were about to be shown notes about a board they cannot reach.
The texts are untouched and the verification below asserts that tags changed on
exactly notes 6 and 7. **This is the second release running in which the cut has
had to add a role tag**, which makes it a process gap rather than an accident —
filed on the `backlog` branch and reasoned in
`docs/decisions/2026-10-21-release-0-39-0-admin-tags-and-silent-number-risk.md`.
A role tag belongs in the feature PR, where someone knows who the feature is for.

**The release-note truth rule was checked forwards on all nine**, not assumed from
the features having merged. No note promises anything that depends on a step still
outstanding: there is no deploy, hand edit or token left to come for any of them.
The two that could have gone wrong this way were read in code rather than
reasoned —

- **Note 3** ("Purchasing, the food forecast, Cashflow and stock usage then work from each ingredient") needs `0239` and `0242` on production, which section 8 applies **before** either deploy. Its last sentence, "until a diet is given more than one ingredient, it behaves exactly as before", is `0239`'s bridge behaviour and is what makes the note true on the day it ships rather than after someone edits a diet
- **Note 1** ("a Donors list under Management → Donations → Donors") needs `0244`, same apply, and nothing else — no Drive folder, no secret, no sync step

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created directly from `origin/main` at `5ce57149` minutes before the cut, so there was nothing to merge. `git status -sb` clean, neither ahead nor behind `origin/main` before the cut commit
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 110s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

Also run, because a release cut is the one change that can break the deploy
guards without breaking a build:

- [x] `node scripts/check-release-guards.mjs` — **exit 0**, every case `ok`, including `unreleased refuses`, `package.json behind the newest release is a problem` and `missing migration refuses`

### The mechanical verification of the cut itself

Not a read-over. Both versions of the module were imported and the notes compared
**as values**, so role tags are compared too, and the first two assertions exist
to prove the comparison is not vacuously empty. Output as printed, unedited:

```
ok    old unreleased was non-empty — 9
ok    new unreleased is empty — 0
ok    newest entry is the new version — 0.39.0
ok    dated 2026-10-21 — 2026-10-21
ok    major is true — true
ok    has a title — Diets are recipes, a Donors list, and role home screens in groups
ok    note count carried — 9 vs 9
ok    note 1 text identical — Donations: there is now a Donors list under Mana…
ok    note 2 text identical — Feed Special Diets and the diet sheet now show e…
ok    note 3 text identical — Diets are now recipes. Under Settings → Diets an…
ok    note 4 text identical — Assistant: you can now record a vaccination by t…
ok    note 5 text identical — Clinic visits: cancelled visits are no longer co…
ok    note 6 text identical — Settings → Who does what: the separate Home scre…
ok    note 7 text identical — Settings → Who does what: Admin can now put a ro…
ok    note 8 text identical — Home screen: if you have recurring tasks, your h…
ok    note 9 text identical — Assistant: type "Panda came back from foster" (o…
ok    nothing invented
ok    nothing lost
      note 1 tags: null -> null
      note 2 tags: null -> null
      note 3 tags: null -> null
      note 4 tags: null -> null
      note 5 tags: null -> null
      note 6 tags: null -> ["admin"]
      note 7 tags: null -> ["admin"]
      note 8 tags: null -> null
      note 9 tags: null -> null
      tags changed on note(s): 6, 7
ok    no note carries an empty roles array
ok    older entry count unchanged — 58 vs 58
ok    every older entry byte-identical as a value — 58 entries
ok    entry 2 is the previous release — 0.38.2
ok    versions strictly descending — 59 entries
ok    package.json version matches newest entry — 0.39.0 vs 0.39.0
ok    every note is non-empty text — 325 notes checked
ok    no [object Object] in any note
ok    the only 'undefined' in any note is 0.33.0's deliberate quote — 1 found
ok    majorReleasesSince("0.38.2") finds the new major (MAIL GOES OUT) — ["0.39.0"]
ok    majorReleasesSince("0.38.1") also finds it — ["0.39.0"]
      role coverage of 0.39.0: admin 9, management 7, second_in_command 7, head_of_maintenance 7, head_of_medical 7, doctor 7, volunteer 7
ok    no role sees an empty section — {"admin":9,"management":7,"second_in_command":7,"head_of_maintenance":7,"head_of_medical":7,"doctor":7,"volunteer":7}
ok    admin sees every note — 9
ALL CHECKS PASSED
```

- [x] All nine notes carried across byte-identical, and the 58 older entries compared as values too — so this PR is proved not to have touched release history, which a read-over of a 1,000-line file would not establish
- [x] **The mail check run the right way up for a MAJOR**: the pass is that `majorReleasesSince("0.38.2")` *finds* `0.39.0`, so the mail is asserted to be going out rather than inferred from the `major:` flag; asked from `0.38.1` as well, so a function that always returned the newest entry regardless would still have been caught by the byte-identical history assertion above
- [x] The deliberate edit is asserted as such: notes 6 and 7 are `["admin"]`, the other seven are untagged, and all nine were untagged before — so the diff in tags is exactly two notes, named, not "some"

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. `origin/main`'s highest is `0245`, so the next free number is `0246`. **`0239` is no longer claimed by an unmerged branch** — the `0.38.2` record's warning about #803 is closed, because #803 merged
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Production's status was read before the cut all the same (`239 applied, 7 pending`) and is quoted in section 8
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration; the dry-run against production is section 8's, and it is quoted there including the two files it reports FAILED and why that is expected
- [ ] Applied to **dev** — n/a: all seven were applied to dev by their own PRs. Confirmed rather than assumed: `--drift test` reads `No drift: test matches origin/main`, `246 file(s), 246 applied row(s)`, 0 in each direction
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a for this PR; the release's plan for all seven is in section 8

## 4. Functional checks

- [x] Happy path works end to end: the module imports, `releases[0]` is `0.39.0`, and all nine notes read back as the strings their feature PRs wrote
- [x] Data persists — n/a as a database claim; the equivalent here is that the data survives a build: `build` exited 0 and the entry is compiled into the Worker bundle that answers `/api/releases/current`
- [ ] Create / edit / delete all exercised — n/a: a release entry is data in a source file; there is no CRUD surface
- [x] Empty state renders sensibly: `unreleased` is now empty, its normal post-cut state, and `check-release-guards.mjs` asserts that a *non*-empty `unreleased` refuses a production deploy
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked: version ordering across the `0.38.2 → 0.39.0` **middle-number** bump asserted with a `compareVersions`-equivalent over all 59 entries, not just the top two — the first middle-number bump since `0.38.0`, and the one a cut is most likely to get wrong; `majorReleasesSince` exercised from two starting versions; the role filter exercised for all seven live roles

### Role access matrix

`/releases` is readable by every signed-in role and filters on role tags. No
permission, guard or RLS cell is touched by this PR, so what is recorded is **what
each role sees**, which is the thing this change can alter.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | all nine notes | 9 — asserted from the role tags, not driven in a browser |
| management | `/releases` | seven; **not** the two Who does what notes | 7 — asserted. The deliberate change |
| staff | n/a | retired role (`0173`) | n/a: not a live role |
| doctor | `/releases` | seven | 7 — asserted |
| volunteer | `/releases` | seven | 7 — asserted |
| second_in_command | `/releases` | seven | 7 — asserted |
| head_of_maintenance | `/releases` | seven | 7 — asserted |
| head_of_medical | `/releases` | seven | 7 — asserted |
| signed out | none | refused by the gate | unchanged: no permission code touched |

- [x] Every role above tested — by asserting each note's role tags against each live role, which is what decides what is shown, and by asserting no role's count is zero. Not driven in a browser as each role: no staff session this run, and the filter itself is untouched code
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: this PR changes no guard, no `requirePermission` call and no policy. The `admin` tag is a *display* filter on `/releases`, not an access control, and is not claimed as one

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut adds no feature to document; the features' own PRs carry their manual topics
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated, as every released note is
- [ ] Mobile viewport (375px) — n/a: not driven at 375px. The `/releases` layout is unchanged by this PR; how this release's nine-note entry reads on a phone is item 1 of the manual list below, and it is the longest entry in the register's history, which is why it is listed rather than waved through
- [ ] Browser console clean — n/a: no browser session this run
- [ ] Network clean — n/a: no browser session this run

## 6. Regression

- [x] The pages nearest the change still work: `/releases` and `/api/releases/current` both read this module, and both are in the `build` that exited 0. `scripts/deploy.mjs` also loads it directly under Node type stripping — exercised by `check-release-guards.mjs`, which passed
- [x] Any shared file touched checked from a second, unrelated consumer: `src/lib/releases.ts` is read by the Worker bundle as well as the page, and `check-release-guards.mjs` loads it through the deploy script's own path rather than the app's — a second, independent consumer, run rather than read
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch is one commit from `5ce57149`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. The items this release's features closed were ticked in their own PRs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-21-release-0-39-0-admin-tags-and-silent-number-risk.md`, recording why two notes were tagged and why a wrong-number risk ships unverified on his explicit decision
- [x] `README.md` still accurate — not touched; it names no version
- [ ] **Release notes.** — n/a: this PR *is* the release notes and adds no new line. It moves nine existing notes out of `unreleased`, byte-identical, which section 2 asserts note by note; the only change is two role tags, which narrow who sees a note rather than adding one. **Checked the other way round too:** every feature plan in the range whose release-notes line reads `n/a: <an outstanding step>` was re-read to see whether this release closes that step. None is closed by this cut, and none of the nine notes depends on a step still to come
- [x] Commit messages say why, not just what — the cut commit records why it is major, whose call that was, which two tags changed and what was verified rather than read over
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The two that could have been reasoned were not: that the mail *does* go out is `majorReleasesSince("0.38.2")` returning `["0.39.0"]`, and note 3's dependence on `0239`/`0242` was read in those files rather than inferred from the diets PRs having merged

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `f40495b8`, this branch's cut commit
- [ ] Deployed SHA matches the tested SHA — deferred: release manager. The deployed SHA will be this branch's **merge commit**, not `f40495b8`; it goes in the release record and is read off each `deploy.mjs` and `deploy-pi.sh` banner rather than assumed

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager, against `docs/release-smoke-test.md`
- [ ] Timezone-sensitive behaviour proved — **n/a: the only date in this change is the entry's own `date: "2026-10-21"`, a display string.** No logic derives "today" from it; ordering is by version, not date
- [ ] Boundary or banding change — n/a for this PR beyond the version ordering asserted in section 2. **The release does ship bands** — the portion-multiplier plausibility limits in `src/lib/diets/plausible.test.mjs` — but they belong to `#809` and its own plan
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines, the whole verification block, the dry-run extract and the predicted-warning list are as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager. **And note what it cannot cover:** `PUBLIC_SITE` is `locked` on both environments, so an anonymous request to any public page gets the staff-testing gate. `0245` adds a public story Drive file to `/adopt`, which **no visitor can reach** for the same reason — seventh release running

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager (Lutan runs the production Worker deploy; the line is read from his `tee`'d log, grepping the **project ref**, since the arrow does not survive the UTF-16 strip)
- [ ] `strip-baked-env: removed N env var(s)` seen — deferred: release manager, **on both environments this time**, the test one `tee`'d rather than `tail`'d. **Expect 13**, which has held for four releases
- [x] Any new secret/env var exists in the production Cloudflare environment — **none is added by this release.** Checked against each feature plan's own section 8 line rather than assumed. **The production calendar token remains outstanding and is not required by anything here**

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** **No** — this PR carries no migration. **But the release as a whole does, and this is the release where it matters most:** `0239`/`0242` and the diets app code that reads recipes all ship here, and `0243` **drops** the columns the old app writes. So the order is not conventional — it is load-bearing, and it is stated below
- [ ] `--dry-run` against production run and clean — **run before the cut; exit 0, and it reports two files FAILED.** Quoted and explained below, because a red dry-run normally means do not apply and here it means the opposite
- [x] **For a destructive or rewriting migration: a production backup exists and is fresh.** `0243_dead_schema_drop.sql` drops `diet_types.daily_qty_small/_medium/_large`, `diet_types.is_standard`, `resident_diets.diet_type_id` and `resident_diets.daily_quantity`, plus `role_home_tiles` and five functions/triggers. **Not relying on the 03:00 nightly backup**: a fresh one was taken on the Pi with the cron job's own command, **`lannacare-production-2026-10-21T1406Z.dump.age`**, 1.32 MB, encrypted for one recipient, uploaded to Drive and kept at `~/backups/lannacare` (16 kept). Taken from the Pi rather than this machine because `BACKUP_GOOGLE_OAUTH_*` is deliberately not in `.env.deploy.production` — `backup.mjs --env production` refuses here and names exactly that, which is the designed behaviour and not a fault
- [x] **Apply plan stated:** all seven to `dbkodyyxxhtygxcxmfcu` (production), from the **main checkout**, **after the merge and the pull and before either Worker deploy**, in file order `0239` → `0245`, with `--status` then `--dry-run` first and `--status` plus `--drift production` after

**The per-file dry-run trap fires on this release — twice.** Quoted because the
correct action on seeing it is to apply:

```
dry-run 0242_special_diets_and_intake_read_recipes.sql … FAILED
Failed to run sql query: ERROR:  42P01: relation "diets" does not exist
NOT a fault in 0242_special_diets_and_intake_read_recipes.sql: it runs cleanly after 0239…, 0240…, 0241….
A real apply commits each file first, so this one is expected to apply.

dry-run 0243_dead_schema_drop.sql … FAILED
Failed to run sql query: ERROR:  2BP01: cannot drop column daily_qty_small of table diet_types because other objects depend on it
DETAIL:  view special_diet_list depends on column daily_qty_small of table diet_types
NOT a fault in 0243_dead_schema_drop.sql: it runs cleanly after 0239…, 0240…, 0241…, 0242….
A real apply commits each file first, so this one is expected to apply.
```

`0239` creates `diets`, which `0242` builds a view on; `0242` restates
`special_diet_list` without the legacy columns, which is what lets `0243` drop
them. Each is rolled back before the next file runs, so the dry-run cannot see
it. **Both are expected to apply, and the script now says so itself** rather than
leaving the reader to recognise the trap — the running tally is **three times
fired, ten not**.

**Eight `-- consumer:` warnings are predicted, and none of them is vacuous** —
which is itself new. Predicted by running the real `consumerReport` against the
real `read` (it is what the dry-run above prints), not by reasoning about which
files changed:

```
WARNING 0242_special_diets_and_intake_read_recipes.sql: declared consumer src/lib/diets/special-list.ts differs from release 0.38.2, so it may or may not already read this.
WARNING 0242_special_diets_and_intake_read_recipes.sql: declared consumer src/app/medical/diets/page.tsx differs from release 0.38.2, so it may or may not already read this.
WARNING 0242_special_diets_and_intake_read_recipes.sql: declared consumer src/app/residents/new/page.tsx differs from release 0.38.2, so it may or may not already read this.
WARNING 0242_special_diets_and_intake_read_recipes.sql: declared consumer src/app/residents/new/actions.ts differs from release 0.38.2, so it may or may not already read this.
WARNING 0242_special_diets_and_intake_read_recipes.sql: declared consumer src/app/residents/new/IntakeForm.tsx differs from release 0.38.2, so it may or may not already read this.
WARNING 0243_dead_schema_drop.sql: declared consumer src/app/admin/diets/actions.ts differs from release 0.38.2, so it may or may not already read this.
WARNING 0243_dead_schema_drop.sql: declared consumer src/app/admin/diets/page.tsx differs from release 0.38.2, so it may or may not already read this.
WARNING 0245_public_story_drive_file.sql: declared consumer src/app/api/photos/[fileId]/route.ts differs from release 0.38.2, so it may or may not already read this.
```

Every path named is a **file**, and every one arrives in this same release, so
each warning is the safe direction by construction. **`0.38.2`'s finding is
closed:** four of its nine warnings were directory-valued and could never read
`live`; #814 shipped in this release, every header in this range names files, and
**not one vacuous warning appears.** `0239`, `0240`, `0241` and `0244` warn not at
all, which per the runbook means their declared readers were already live — the
safest order there is. **A warning on any path not in that list is not predicted
and is a reason to stop.**

### Rollback

- [x] **Rollback position stated, including what it does not cover.** Production is served by the Pi, so the rollback is `./scripts/pi/deploy-pi.sh --ref ce754d32` on the production clone — a rebuild of `0.38.2`. `npx wrangler rollback --env production` reverts only the Worker fallback, and reverting one without the other leaves the two disagreeing. **Neither reverts a migration, and this release is the first in a long while where that is not a formality.** Six of the seven are additive and safe to leave applied under a rolled-back build. **`0243` is not**: it drops the columns `0.38.2`'s app writes when an admin adds a diet ingredient, so a Pi rebuild of `0.38.2` would restore a build that can fail on those paths. **So the honest rollback position is: the build rolls back, the schema does not, and `0.38.2` would be running against a schema it predates.** The route out is the fresh backup named above, restored by the administrator who holds the private key — not a step any session can take. **This is stated rather than ticked away because "rollback available" would be a false assurance for this release**, and it is the strongest argument for the diets screens being looked at soon rather than eventually

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Two of the nine notes described an Admin-only page while untagged, so `volunteer` and `second_in_command` would have been shown notes about a board they cannot open. **Second release running that the cut has had to fix this** | **fixed here, cause deferred to backlog** — tagged `roles: ["admin"]` on Lutan's call and asserted note-by-note in section 2. The cause is upstream: `docs/test-plan-template.md`'s release-notes line asks whether a user would notice and never asks *who*. Filed on the `backlog` branch |
| 2 | medium | **The diets portion-multiplier path ships with no person having looked at it**, and its failure mode is a wrong food amount rather than an error | **accepted, on Lutan's explicit decision** — put to him separately from the count of fourteen, with what five minutes would cover. Recorded as a stated gap in the release record, not ticked. Mitigations established in code, not assumed: a one-ingredient diet behaves exactly as before (`0239`'s bridge), and the forecast arithmetic is proved by script in #809's own plan. Reasoned in the decision file |
| 3 | low | My first run of the cut verification reported two FAILs on the mail check | **fixed** — the script's bug, not the cut's: `majorReleasesSince` returns release *objects* and the assertion compared them to a version *string*. Mapped to versions and re-run; the cut was correct all along. Recorded because a verification script that fails for its own reasons is exactly how a real failure gets waved through |

## Left for manual verification

Only items belonging to **this** PR. The fourteen outstanding items across the
release's feature plans stay in their own plans with their own signatures; they
are listed in the release record as gaps this release shipped with, on Lutan's
explicit decision.

| # | What to check | Where |
|---|---|---|
| 1 | The `0.39.0` entry on the deployed build: nine notes read well to a shelter user, no broken wording, the arrows and quotation marks render properly, and **it is the longest entry in the register's history — so that it reads on a phone rather than as a wall** | `/releases`, signed in as admin, at phone width |
| 2 | **That the two new tags read right rather than merely working**: an admin sees nine notes, a volunteer or the 2IC sees seven — both Who does what notes absent, and their absence not leaving an odd gap or a stray heading | `/releases`, signed in as admin and then as either role |
| 3 | **The release email as an admin actually received it** — subject names `0.39.0`, and the body carries the admin-tagged notes. This is a major, so it goes to every admin; the relay accepting it is not the same as it arriving | the admin inbox, after the production deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5  Date: 2026-10-21

### Manual verification

- [ ] The manual list is not empty, so only the person who looked may tick this — n/a: pending, see the signature line below

Manual verification by: pending: the three items above — this release's nine notes read on the deployed `/releases` page at phone width, that the two new `admin` tags read right to a role that no longer sees those notes, and the release email as an admin received it

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a: this session is the production release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-21
