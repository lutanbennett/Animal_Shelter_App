# Feature test plan

## Header

| | |
|---|---|
| Feature | Cut release `0.39.1` — move the five `unreleased` notes into a `0.39.1` entry, `major: false`, tag the Settings → Diets note `["admin", "doctor"]`, and set `package.json` to match |
| Backlog item | `docs/backlog.md` → n/a: a release cut is not a backlog item; it is the release procedure's step 4 |
| Branch / worktree | `claude/cut-release-0-39-1` @ `C:\Development\Animal_Shelter_handover-ceiling-target` — the **reused leftover** of the squash-merged `handover-ceiling-target` stream, which `worktree.mjs list` reported `free`. Paperwork rule 2 asks for exactly this rather than a fresh four-minute `npm ci` |
| Dev server | `node scripts/worktree.mjs dev` → not started: a data-only change to one module with no imports, exercised by importing it |
| PR | opened from this branch |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-10-22 |
| Carries a migration? | **no** — but the release applies `0246`, which is additive. Apply plan in section 8 |
| Tested at SHA | `441cb4b7` (branch point); cut commit recorded in the PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches step 4 of the runbook: the five notes in `unreleased` become release `0.39.1` dated 2026-10-22, `major: false`, note 5 gains `roles: ["admin", "doctor"]`, and `package.json`'s version matches the newest entry
- [x] Files/areas touched listed: `src/lib/releases.ts` (data only — no exported function, type or ordering rule changed) and `package.json`'s `version`. No route, no `worker/`, no `supabase/migrations/`, no shared lib
- [x] Roles affected identified: everyone who opens `/releases`, which filters on the reader's own role. Measured from the tags rather than assumed — **admin 4, management 3, second_in_command 3, head_of_maintenance 3, head_of_medical 3, doctor 3, volunteer 2**. No role opens an empty section
- [x] Anything explicitly **out of scope** written down: the note texts are not reworded, no migration is applied by this PR, and the deploys are section 8's

**This is a MINOR release, and that is the decision that shaped it.** Put to
Lutan before anything was cut, with the case for each and a recommendation of
**major** — the vet calendar going live is new capability rather than a
refinement. **He chose minor**, which is recorded here because the recommendation
was not taken and the next release manager should see that the question was asked
properly and answered against the advice. The consequence is concrete and was
stated to him: `deploy.mjs --env production` mails every admin only on a major
release new to production, so **no mail goes out for `0.39.1`**. The case for
minor is sound — `0.38.0`, `0.38.1`, `0.38.2` and `0.39.0` have all shipped in the
last three days, two of them mailing, and most of this release tidies up what
`0.39.0` introduced rather than adding to it.

**One note was tagged at the cut**, on my recommendation: note 5 describes
Settings → Diets. The obvious tag is `admin`, and **it would have been wrong.**
The page is gated on the `reference.types` activity, which
`src/lib/permissions/fixed-for-now.ts` grants to the **doctor** box as well as to
admin, so an `["admin"]` tag would have hidden the note from doctors who can open
the page — the precise failure the template warns about when it says a wrong tag
is worse than none. Tagged `["admin", "doctor"]`, read from the permission source
rather than inferred from the URL beginning `/admin/`.

**This is the third release running in which the cut has had to add a role tag.**
`0.39.0`'s record already filed the cause on the `backlog` branch:
`docs/test-plan-template.md`'s release-notes line asks whether a user would notice
and never asks *who*. Finding them at the cut is not the process working.

**Note 1 is deliberately not shown to admin**, and that is inherited, not mine.
Its tag — `management`, `second_in_command`, `head_of_maintenance`,
`head_of_medical` — came from its feature PR, and the verification asserts that
tags changed at the cut on **note 5 only**. Recorded because my first verification
run asserted "admin sees every note" and failed on it; the assertion was wrong, not
the cut. Whether an Admin who configures Who does what should see a note about
other roles' home screens is a fair question, but retagging another stream's note
at the cut is not the release manager's call, so it is left and written down.

**The release-note truth rule was checked forwards on all five**, not assumed from
the features having merged. Four need nothing beyond the deploy. **The fifth is
the one to look at, and it is why the production command changes this release:**

- **Note 3** ("vet visits are now written to the shelter's Google Calendar … on the live site") is true only if the production Worker gets `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` as secrets. `docs/decisions/2026-10-22-vet-calendar-on-production.md` records this as a **release step owed at the deploy**, and both values are already in `.env.deploy.production` (confirmed by name, not read). That makes it a section 8 deploy step of the same kind as a migration apply — the deploy itself performs it — rather than an outstanding manual step of the kind that made #518's note false. **But it is performed only if the deploy carries `--secrets`.** A plain `deploy.mjs --env production` would ship this note false. That is a release-manager handover risk, not a defect in the note, and it is carried into section 8 and the record rather than left in prose
- **Note 2** ("adding a group now needs only an English name") needs `0246` on production, which section 8 applies **before** either deploy
- Notes 1, 4 and 5 need nothing but the build

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: the branch was created directly from `origin/main` at `441cb4b7` minutes before the cut, so there was nothing to merge. `git status -sb` clean, neither ahead nor behind `origin/main` before the cut commit
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: typecheck exited 0 after 47s
=== gates: lint exited 0 after 103s
=== gates: test exited 0 after 14s
=== gates: build exited 0 after 121s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

Also run, because a release cut is the one change that can break the deploy
guards without breaking a build:

- [x] `node scripts/check-release-guards.mjs` — **exit 0**, output pasted in the PR

### The mechanical verification of the cut itself

Not a read-over. Both versions of the module were imported and the notes compared
**as values**, so role tags are compared too. Output as printed, unedited:

```
PASS  new entry is the cut version — 0.39.1
PASS  note count matches unreleased — 5 vs 5
PASS  note 1 text identical — Home screens: Management and the 2IC now have tiles for…
PASS  note 2 text identical — Settings → Who does what: adding a group now needs only…
PASS  note 3 text identical — Clinic visits: vet visits are now written to the shelte…
PASS  note 4 text identical — Purchasing: on a laptop, the To buy list now comes firs…
PASS  note 5 text identical — Settings → Diets is now a recipe book. Diets and Ingred…
      roles changed on note 5: null -> ["admin","doctor"] (intentional tag)
PASS  nothing invented — none
PASS  nothing lost — none
PASS  unreleased emptied — 0 left
PASS  majorReleasesSince("0.39.0") is empty (no admin mail) — []
PASS  presence check: majorReleasesSince("0.38.2") still finds 0.39.0 — ["0.39.0"]
PASS  the cut is not itself major — false
PASS  package.json matches newest entry — 0.39.1 vs 0.39.1
PASS  file order is newest-first by compareVersions — 0.39.1 > 0.39.0 > 0.38.2 > 0.38.1 …
PASS  no duplicate versions
PASS  notes render with no [object Object]/undefined/empty — none
PASS  all role tags are live roles — none

cut verification: PASS

PASS  older entry count unchanged — 59 vs 59
PASS  every older entry byte-identical as a value — 59 entries
PASS  entry 2 is the previous release — 0.39.0
PASS  every note is non-empty text — 330 notes checked
PASS  no [object Object] anywhere
      role coverage of 0.39.1: admin 4, management 3, second_in_command 3, head_of_maintenance 3, head_of_medical 3, doctor 3, volunteer 2
PASS  no role sees an empty section — {"admin":4,"management":3,"second_in_command":3,"head_of_maintenance":3,"head_of_medical":3,"doctor":3,"volunteer":2}
PASS  no note carries an empty roles array
      tags changed at the cut on note(s): 5
PASS  tags changed at the cut on exactly note 5 — [5]
PASS  note 1's non-admin tag is inherited, not added at the cut — ["management","second_in_command","head_of_maintenance","head_of_medical"]
PASS  every note is visible to at least one role

extra verification: PASS
```

- [x] All five notes carried across identical, and the 59 older entries compared as values — so this PR is proved not to have touched release history, which a read-over of a 1,000-line file would not establish
- [x] **The mail check run the right way up for a MINOR**, as an absence *and* a presence: `majorReleasesSince("0.39.0")` is `[]`, so no mail goes out; and `majorReleasesSince("0.38.2")` still returns `["0.39.0"]`, so a function that always returned `[]` — which would satisfy the absence check on its own — could not have passed. This pairing is `0.38.1`'s rule, applied
- [x] `majorReleasesSince` was mapped to versions before comparing. `0.39.0`'s record logged a verification script that failed for its own reasons because it compared release *objects* to a version *string*; that trap is closed here rather than re-met
- [x] The deliberate edit is asserted as such: tags changed on exactly note 5, named, not "some", and note 1's inherited tag is asserted unchanged

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: this PR carries no migration. `origin/main`'s highest is `0246`, so the next free number is `0247`, and no unmerged branch claims one (`gh pr list` empty at the cut)
- [ ] `--status` reviewed before applying — n/a: this PR carries no migration. Production's status was read before the cut all the same (`246 applied, 1 pending`) and is quoted in section 8
- [ ] `--dry-run` reviewed — n/a: this PR carries no migration; the dry-run against production is section 8's and is quoted there
- [ ] Applied to **dev** — n/a: `0246` was applied to dev by its own PR (#828). Confirmed rather than assumed in section 8's drift check
- [ ] File is re-runnable — n/a: no migration in this PR. `0246` states its own re-runnability (`DROP NOT NULL` on a nullable column is a no-op)
- [ ] Existing rows still read correctly — n/a: no migration in this PR
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: this PR carries no migration. The release's plan for `0246` is in section 8

## 4. Functional checks

- [x] Happy path works end to end: the module imports, `releases[0]` is `0.39.1`, and all five notes read back as the strings their feature PRs wrote
- [x] Data persists — n/a as a database claim; the equivalent here is that the data survives a build: `build` exited 0 and the entry is compiled into the Worker bundle that answers `/api/releases/current`
- [ ] Create / edit / delete all exercised — n/a: a release entry is data in a source file; there is no CRUD surface
- [x] Empty state renders sensibly: `unreleased` is now empty, its normal post-cut state, and `check-release-guards.mjs` asserts that a *non*-empty `unreleased` refuses a production deploy
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [x] Boundary cases checked: version ordering across the `0.39.0 → 0.39.1` **last-number** bump asserted with `compareVersions` over all 60 entries, not just the top two; `majorReleasesSince` exercised from two starting versions, in both directions; the role filter exercised for all seven live roles

### Role access matrix

`/releases` is readable by every signed-in role and filters on role tags. No
permission, guard or RLS cell is touched by this PR, so what is recorded is **what
each role sees**, which is the thing this change can alter.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/releases` | four; **not** note 1, which its feature PR scoped to other roles | 4 — asserted from the role tags, not driven in a browser |
| management | `/releases` | three; **not** the two Settings notes | 3 — asserted |
| staff | n/a | retired role (`0173`) | n/a: not a live role |
| doctor | `/releases` | three, **including** the Diets note — the reason the tag is not `["admin"]` | 3 — asserted |
| volunteer | `/releases` | two | 2 — asserted. The lowest count, and non-zero |
| second_in_command | `/releases` | three | 3 — asserted |
| head_of_maintenance | `/releases` | three | 3 — asserted |
| head_of_medical | `/releases` | three | 3 — asserted |
| signed out | none | refused by the gate | unchanged: no permission code touched |

- [x] Every role above tested — by asserting each note's role tags against each live role, which is what decides what is shown, and by asserting no role's count is zero. Not driven in a browser as each role: no staff session this run, and the filter itself is untouched code
- [x] A role that should not have access is blocked server-side — unchanged and not re-proved: this PR changes no guard, no `requirePermission` call and no policy. A role tag is a *display* filter on `/releases`, not an access control, and is not claimed as one

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new route
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release cut adds no feature to document; the features' own PRs carry their manual topics
- [ ] Translatable strings go through the translation path — n/a: release notes are deliberately not translated, as every released note is
- [ ] Mobile viewport (375px) — n/a: not driven at 375px. The `/releases` layout is unchanged by this PR and this entry is five notes, well short of `0.39.0`'s nine
- [ ] Browser console clean — n/a: no browser session this run
- [ ] Network clean — n/a: no browser session this run

## 6. Regression

- [x] The pages nearest the change still work: `/releases` and `/api/releases/current` both read this module, and both are in the `build` that exited 0. `scripts/deploy.mjs` also loads it directly under Node type stripping — exercised by `check-release-guards.mjs`, which passed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: the only files touched are `src/lib/releases.ts` and `package.json`'s version; neither is a shared UI module, and the module's two readers are named on the line above
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the branch was cut from `origin/main` directly, and the gates ran on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a release cut closes no backlog item. Each feature's own PR ticked its item
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the one judgement in this PR (the `["admin", "doctor"]` tag, and why `["admin"]` alone is wrong) is recorded in section 1 of this plan and in the release record, where a release manager will look for it. The recurring cause is already filed on the `backlog` branch from `0.39.0`
- [x] `README.md` still accurate — unchanged by this PR; it names no version
- [ ] **Release notes.** — n/a: this PR *is* the release notes change. It adds no new note; it moves the five that feature PRs wrote into a dated entry. Ticking it would assert `unreleased` gained a line, and `unreleased` is deliberately now empty
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every count in this plan — note counts, the seven role counts, the 59 unchanged older entries, both `majorReleasesSince` answers — is printed by the verification above rather than asserted in prose. The one claim that is *not* a measurement is named as such: that `--secrets` must be on the production command, which is read from `deploy.mjs` and the decision file, and is carried into section 8 so it is checked at the deploy rather than believed here

## 8. Pre-production gate

Owned jointly with the release manager. `test.lannacare.org` runs the **dev**
database; `lannacare.org` runs **production** (`dbkodyyxxhtygxcxmfcu`).

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** Workers run in UTC wherever they are, so anything deriving "today" is wrong for part — n/a: no date logic in this PR. A release entry's `date` is a literal string, written once and never derived from a clock
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — n/a: no threshold or banding change. The nearest thing is version ordering, asserted over all 60 entries above
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** Both blocks above are the scripts' own stdout, pasted whole
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager. **This is the live one this release, not a formality.** `GOOGLE_CALENDAR_REFRESH_TOKEN` and `GOOGLE_CALENDAR_ID` are in `.env.deploy.production` but are not yet on the production Worker, so the production deploy must carry **`--secrets`** or note 3 ships false and the quarter-hourly calendar sweep keeps doing nothing

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: this PR contains neither. The release's `0246` and its readers merged together in #828 and #833, which is why the apply precedes both deploys
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager. Already run clean at the cut (exit 0, `0246 … ok`, two predicted consumer warnings, the third absent and proved absent by an empty diff); re-read at deploy time
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: `0246` is additive in effect — it drops a `NOT NULL`, widening what the column accepts. Nothing is dropped, rewritten or back-filled, so the `0.39.0` pre-drop backup gate does not engage
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager. The plan is `0246_role_groups_name_th_optional.sql` → `dbkodyyxxhtygxcxmfcu`, **before** both deploys, as both deploy guards require

### Rollback

- [x] Rollback position stated, **including what it does not cover**. **Rollback is clean this release**, unlike `0.39.0`: `./scripts/pi/deploy-pi.sh --ref ca7e4dd2` on each Pi rebuilds the previous release, and `0246` can be left applied — it only widens what `role_groups.name_th` accepts, so `0.39.0`'s code, which always sends a Thai name, still works against it. What a rebuild does **not** cover: the Worker fallback (`npx wrangler rollback --env production`, separately), and the calendar secrets, which stay on the Worker once pushed and would need removing by hand if the calendar had to be switched off

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | My first extended-verification run reported `FAIL admin sees every note — 4`. The assertion was wrong, not the cut: note 1's feature PR deliberately scoped it away from admin. Corrected to assert *which* notes changed tags at the cut | fixed — and recorded rather than quietly dropped, because `0.39.0` hit the same shape and a verification script that fails for its own reasons is how a real failure gets waved through |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That a doctor, not only an admin, sees the Settings → Diets note — the tag was read from `fixed-for-now.ts` rather than driven in a browser as a doctor | `/releases` signed in as a doctor |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-10-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the manual list is not empty, so this is left for the person who looks

Manual verification by: pending: a doctor's view of `/releases`, item 1 above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass

Release manager acknowledgement: Claude Opus 5 (production release manager session)  Date: 2026-10-22
