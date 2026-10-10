# Feature test plan — release-record-0-25-0

## Header

| | |
|---|---|
| Feature | The release record for `0.25.0`: a `## 0.25.0` section added to `docs/releases/2026-10-10.md`, and the rewritten `docs/release-handover.md` for whoever runs `0.26.0` |
| Backlog item | none — step 8 of `docs/release-procedure.md` |
| Branch / worktree | `claude/record-0-25-0` @ `C:\Development\Animal_Shelter_record-0-25-0` |
| Dev server | not started — this PR is documentation |
| PR | opened from this branch |
| Tested by / date | Claude (production release manager session) / 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `590a9d35` plus whatever `origin/main` had when this branch was cut; the release itself is `590a9d35` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two documentation files: the `0.25.0` section of today's release record, and the handover rewritten for the next release manager
- [x] Files/areas touched listed — `docs/releases/2026-10-10.md` (a new `## 0.25.0` section appended; the `0.24.0` section is not touched) and `docs/release-handover.md` (rewritten, as it is each release). No code, no migration
- [x] Roles affected identified — none. Nothing here is read by the app; `docs/` is not bundled
- [x] Anything explicitly **out of scope** written down — (a) the ten `pending:` feature plans, which keep their own signatures and are listed, not copied; (b) the production-only checks the release could not do, which are carried in the handover; (c) the two backlog items this release raised, already filed on the `backlog` branch and not in this diff

**The risk in a release record is that it is wrong in a way nobody can check
later**, which is why every figure in it is either a pasted command output or
explicitly labelled as a bracket rather than a measurement. The one place that
distinction is made out loud is the Pi build duration: it is recorded as "under
36 seconds" with a note saying it is a bracket and that the next release should
budget on `0.24.0`'s measured 1m40s instead.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, or nothing to merge; checked against the remote after a fetch rather than a cached ref
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — pasted in the commit
- [x] CI green on the PR (runs the same three) — read on the PR, not ticked in advance
- [ ] `node scripts/check-release-guards.mjs` — n/a: this PR changes no release data. `unreleased` is empty and `package.json` is `0.25.0`, both set by #519 and untouched here

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. The release's three were `0175`–`0177`; the next free number is `0178`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — reviewed as part of the release and recorded: production went `174 applied, 3 pending` to `177 applied, 0 pending`
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — run against production before the apply; all three `ok`, exit 0, no production-only guard. Recorded in the release record
- [x] Applied to **dev** and recorded in `schema_migrations` — dev held all three before the release under the schema-first rule; the post-release drift check confirms `177 applied`, no drift
- [ ] File is re-runnable — n/a: no file in this PR
- [x] Existing rows still read correctly after the change — verified for the release, not for this PR: the silent-failure reading in §3 of `cut-release-0-25-0` established that none of the three migrations breaks the live `0.24.0` build, and the post-deploy checks found nothing
- [ ] Constraints and defaults exercised against real rows — n/a: no constraints in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The revert for this PR is a git revert of two documentation files
- [x] Production apply plan stated for the release manager — n/a as a plan, since the apply already happened; it is recorded instead, with its start and end timestamps

## 4. Functional checks

- [x] Happy path works end to end — the record's purpose is to be read cold by the next release manager. The handover is written to that test and names what not to re-derive
- [ ] Data persists — n/a: documentation; git is its persistence
- [ ] Create / edit / delete all exercised — n/a: no screen
- [x] Empty state renders sensibly (no rows yet) — the handover's "In flight" section deliberately records **nothing left open by the release itself**, and says so rather than leaving the section blank
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — today's file now holds **two** release sections, `0.24.0` and `0.25.0`, which is the case the runbook anticipates ("add a `## <version>` section to that day's file if one already exists, as 2026-10-02's holds four"). The `0.24.0` section is byte-identical to what was there

### Role access matrix

Not applicable in the usual sense: nothing in this PR is served to any role. The
matrix that matters is the one in the record, listing which roles the release's
five notes reach, and it is asserted in `cut-release-0-25-0.md` §4 rather than
restated here.

- [x] Every role above tested — n/a as a route test; the role question for this release is the note tagging, asserted at the cut as `role tags changed: 0`
- [ ] A role that should not have access is blocked server-side — n/a: no route in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. A release record is not a manual topic
- [ ] Translatable strings go through the translation path — n/a: internal documentation, English only
- [ ] Mobile viewport (375px) — n/a: no UI. The release's own phone-width sweep is recorded in the record
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — no page reads `docs/`. The build passing is the only coupling and it passed
- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is rewritten each release by design and is read by people, not code. Its predecessor was read in full at the start of this release and its instructions followed, which is the strongest available check that the format works
- [x] Nothing merged from `main` during `sync` was broken by this branch — this branch touches two files nothing else is editing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a release record is not a backlog item. **The two items this release raised were filed on the `backlog` branch**, not here: the replacement for `0.20.0`'s carried Contacts pass, and the stale `ReleaseRole` union
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the record *is* where release decisions live. The one durable rule this release produced — never hand over a command before the moment it should be run — belongs in the handover and in `CLAUDE.md`'s neighbourhood rather than in `docs/decisions/`, because it is about how a release is run, not about the software
- [x] `README.md` still accurate — unchanged, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: internal documentation. No shelter user sees `docs/`, and `unreleased` is correctly empty immediately after a cut
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Every figure in the record is a pasted command output, with one exception that is labelled as such in the text: the Pi build duration is a bracket (start time, and the completion line already present at the next read), and the record says so and tells the next release to budget on `0.24.0`'s measured figure instead

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the release is `590a9d35`; this PR is written after it and ships nothing
- [x] Deployed SHA matches the tested SHA — **production Worker built from `590a9d35`, the release SHA exactly**, read from its own project-ref line. The test Worker built from `39ec60b6`, diffed and found to be the release plus two `docs/backlog.md` commits

### On the deployed build

- [x] Deployed to test — test Worker and test Pi both on the release; `test.lannacare.org/api/version` reports `0.25.0` @ `590a9d35`
- [x] Smoke-tested on `test.lannacare.org` — the phone-width sweep ran against it across six roles in both languages
- [x] Public pages re-checked after a cache purge or a 10-minute wait — the edge-cache check was done in a real browser, same URL three times, `HIT` with CSP `ENFORCING`, served by the Pi
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — n/a for this PR's own content; the release contains no timezone change, `0.24.0` having been the one that moved dashboard months to Thai time
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — as is every block in the record itself

### Deploy safety

- [x] `deploy: production → Supabase project` line read and the ref matches production — `dbkodyyxxhtygxcxmfcu (590a9d35)`, read from the `| tee` log after `tr -d '\000'`
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — 11 vars, and both Server Actions keys matched their Pi builds (`cbd55beae8d8` production, `ecc41837fc0b` test)
- [ ] Any new secret or env var exists in the production Cloudflare environment — n/a: this PR adds none. Whether the two Cloudflare analytics secrets are set on production is carried as an outstanding check, because it decides whether the release's fifth note is true

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, neither. The release's three were applied before any deploy, in 10 seconds, and both databases now report no drift
- [x] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — all three `ok` at the first attempt, exit 0
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: none of the three is destructive
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — recorded with timestamps

### Rollback

- [x] Rollback position stated, **including what it does not cover** — for this PR, a git revert of two documentation files, which affects nothing running. For the release, a Pi rebuild at `--ref d8b19418`; and unusually it is a *safe* option here, because all three migrations keep the previous build working. That is stated in `cut-release-0-25-0.md` §8 and repeated in the record

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | **The production deploy was run several steps early, before the migrations were applied**, because Claude put the command in a write-up of what the remaining steps would be and the desktop app renders every shell block with a Run button. The guard refused it | **no impact, and the rule is written down.** Nothing shipped; the deploy guard is exactly the control for this and worked. Recorded as medium rather than low because it reached the point of a production deploy being attempted out of order, which is the class of mistake the whole runbook is arranged to prevent. The remedy is in the handover and in Claude's own memory: never hand over a command before the moment it should be run; describe upcoming steps in words |
| 2 | low | **`gh pr merge` was refused twice** by auto mode's classifier as "Merge Without Review", after two releases where it was not refused at all | **accepted; cleared when Lutan asked in chat.** No workaround attempted. The handover now says to expect it rather than to treat it as the exception |
| 3 | low | Ten of the release's thirteen feature plans are `pending:` | **accepted and recorded, on Lutan's call**, asked as its own question in the same round as major/minor and after the silent-failure question was answered separately. Each keeps its own signature |
| 4 | low | **`ReleaseRole` still lists the retired `staff`** and offers no `second_in_command`, `head_of_maintenance` or `head_of_medical`, so a note cannot be tagged for three live roles | **filed on the `backlog` branch, 2026-10-10.** Nothing in this release was affected; both tagged notes use `admin` / `management` |
| 5 | low | **2IC remains the one role never measured at phone width** — `check-phone-width.mjs` has no `second_in_command` | **already on the backlog**, carried from `0.24.0`. Named so the record does not report the sweep as full coverage |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the record reads correctly against the decisions Lutan actually made — the major call and its unusual grounds, and the ship-with-ten-pending call | `docs/releases/2026-10-10.md`, the `0.25.0` section |
| 2 | That the handover reads usefully **cold**, by someone who was not in this session, and that the list of what he owes is right | `docs/release-handover.md` |
| 3 | The four production-only checks the release could not do: the Clinics screens, a donation receipt, a facility-map upload, a Management → Website save | production, signed in |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (production release manager session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked

Manual verification by: pending: the three items under Left for manual verification — the record read against the decisions made, the handover read cold, and the four production-only checks

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager

Result: pass with accepted defects

Release manager acknowledgement: Claude (production release manager session)  Date: 2026-10-10
