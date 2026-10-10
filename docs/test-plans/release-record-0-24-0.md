# Feature test plan — release-record-0-24-0

## Header

| | |
|---|---|
| Feature | The release record for `0.24.0` (`docs/releases/2026-10-10.md`) and the rewritten handover for whoever runs `0.25.0` |
| Backlog item | none — step 8 of `docs/release-procedure.md`, and the handover rewrite the file itself requires |
| Branch / worktree | `claude/record-0-24-0` @ `C:\Development\Animal_Shelter_record-0-24-0` |
| Dev server | not started — two documentation files, no app code |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-10 |
| Carries a migration? | no. The release's three (`0172`–`0174`) were applied before the deploys and are recorded; `0175` merged after the release and is **not** applied to production, which the record and the handover both state |
| Tested at SHA | `2fecefd3` (`origin/main` when this branch was created) plus this branch's commits. The *release* SHA is `d8b19418` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two files: `docs/releases/2026-10-10.md`, the record of what was deployed and verified, and `docs/release-handover.md`, rewritten from `0.23.0`'s to `0.24.0`'s state
- [x] Files/areas touched listed — `docs/releases/2026-10-10.md` (new) and `docs/release-handover.md` (rewritten). No `src/`, no `worker/`, no migrations, no scripts
- [x] Roles affected identified — none. Neither file is served by the app; both are read by whoever runs the next release
- [x] Anything explicitly **out of scope** written down — (a) the ten `pending:` feature plans, which keep their own signatures and are listed, not copied; (b) applying `0175`, which belongs to `0.25.0`; (c) the two backlog items this release's verification produced, which went to the `backlog` branch as the rules require, not into this PR; (d) the four production-only checks still owed, named in both files

**Risk is that the record says something that is not true.** A release record is
the first artifact anyone reaches for when something has gone wrong, so every
figure in it is either a pasted tool output or a measured timestamp. Where
something could not be checked, it is in **What this record cannot say** rather
than softened.

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly — n/a: nothing to merge. The worktree was created from `origin/main` at `2fecefd3` and `git merge-base HEAD origin/main` returns the same commit, read after a fetch
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Pasted exactly as printed below in §6
- [x] CI green on the PR (runs the same three) — read on PR #508, not ticked in advance. The first run at `b9273baf` was **6 green, 1 red**: `check` 1m23s, `public-views` 1m34s, `audit` 12s, `migration-numbers` 7s, `new-policy-role-names` 9s and `script-integrity` 15s passed, and `test-plan` failed on this very line, which that commit left unticked because the run had not happened yet. Completed here, and the run on this commit is the one that reports seven green. The same two-commit shape as the cut, which the handover now records as normal
- [ ] `node scripts/check-release-guards.mjs` — n/a: this PR changes no release data. It was run on the cut (#505), exit 0, all fifteen cases, and nothing here touches `src/lib/releases.ts` or `package.json`

## 3. Schema and data

Every line is `n/a`: this PR is two Markdown files.

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR. The highest on `main` is `0175`, so the next free number is `0176`, which both files state
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply here. The release's own status, dry runs and apply are recorded in the record
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: as above
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no SQL in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR changes no data
- [ ] Constraints and defaults exercised against real rows — n/a: none in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: the revert for this PR is a git revert of two documentation files
- [x] Production apply plan stated for the release manager — **stated, for the next release**: `0175_map_rooms_names_and_descriptions` is on `main`, applied to dev, and pending on production. It merged after the release SHA, so it is `0.25.0`'s first job. Both the record and the handover say so, and both explain why that reads as `Drift` on the production check without being a fault

## 4. Functional checks

- [x] Happy path works end to end — the record is read, not run. The check that it works is that every claim in it can be traced to a pasted output or a timestamp, which §6 asserts file by file
- [ ] Data persists — reload the page and the change is still there — n/a: nothing is saved by a user; git is the persistence
- [ ] Create / edit / delete all exercised — n/a: no screen creates, edits or deletes these files
- [x] Empty state renders sensibly (no rows yet) — the record's "What this record cannot say" table is the empty state that matters, and it has seven rows rather than being omitted
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the dates are the boundary that bites: the deploy ran at `23:55Z` on 2026-10-09 UTC, which is **2026-10-10 in Thailand**, and the release is dated 2026-10-10 throughout to match the register entry and the file name. Every timestamp in the record is written as UTC with a `Z`, so the two cannot be confused

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any signed-in role | neither file | unchanged — these are repo documents, not app pages | pass — no route, component or gate is touched |
| signed out | neither file | unchanged | pass — as above |

- [x] Every role above tested — tested as the question it is: `git diff --name-only` for this branch lists two paths under `docs/`, so no role's view of the app can have changed
- [ ] A role that should not have access is blocked server-side — n/a: this PR adds no route and changes no permission

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: not touched. The release record is not a manual topic; the user-facing description of this release is the register entry, shipped in #505
- [ ] Translatable strings go through the translation path — n/a: both files are English repo documents, as every previous record is
- [ ] Mobile viewport (375px) — n/a: no app layout changed. **The release's own phone-width sweep is a different thing and it was run** — 290 page views, six roles, both languages, recorded in the record
- [ ] Browser console clean — n/a: no browser check applies to a Markdown file
- [ ] Network clean — no unexpected 4xx/5xx — n/a: no request path changed

## 6. Regression

- [x] The pages nearest the change still work — nothing serves these files, so the nearest thing to a regression is the gates, which pass on this branch:

```
=== gates: build exited 0 after 199s

gates: typecheck=0 lint=0 build=0
```

- [x] Any shared file touched checked from a second, unrelated page — `docs/release-handover.md` is the shared file here: it is read by the next release manager, and it was rewritten rather than appended, as the file's own first paragraph requires. Checked against `docs/release-procedure.md` for contradictions, since the procedure outranks it: the handover adds `test.lannacare.org` as a place to run the phone-width check and says `deploy.mjs` has no `--ref`, neither of which the procedure denies
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in. The branch was created from `2fecefd3` and the diff against its merge-base is two files, compared against the merge-base rather than a moved `origin/main`, per `0.21.0`'s lesson

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: a release record is not a backlog item, and the two findings the release's verification produced were committed on the `backlog` branch, where backlog edits belong. **Nothing in `docs/backlog.md` is closed by this release that was not already ticked by the feature PR that closed it** — checked by searching the backlog for the files, tables and scripts this release touched (`vets`, `vet_doctors`, `vet_appointments`, `staff`, `check-phone-width`, `facility map`, `clinic`): the three open items that matched are the eight silenced harnesses, the two bare buttons at 44 px and the facility-map zoom overlap, and the outcome each describes can still happen
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **not needed, and here is why**: every judgement in this release is either already written down (the note order and the untagged rule in `docs/release-procedure.md` §4; the audit and test-plan rules in `CLAUDE.md`) or is a release decision, which belongs in the release record by the procedure's own structure. The one genuinely new technique — running `check-phone-width.mjs` against `test.lannacare.org` instead of a local dev server — is recorded in the handover as the way to do it next time, which is where a release manager will look for it
- [x] `README.md` still accurate — unchanged by this PR, and it names no version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody using the app would notice two documentation files. The release's own user-facing notes shipped in #505, and `unreleased` is correctly empty on `origin/main`
- [x] Commit messages say why, not just what — the record commit says what the release cost and which lessons are new; the handover commit says what changed from `0.23.0`'s version and why the worktree list is still deliberately absent
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The window (1 m 40 s), the apply (7 s), the build times, the 290 page views and the 2827 component actions are all measurements. Where a figure is an elapsed wall-clock number that includes waiting on a person, the record says so rather than presenting it as a regression

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — the header records both: `2fecefd3` for this branch, and `d8b19418` as the release SHA. **They differ on purpose**, because this PR is written after the deploy
- [x] Deployed SHA matches the tested SHA — **answered, and it is the release's one untidy fact**: the Pi serves `d8b19418`, the Worker built from `8fcb6835`, and the difference is one commit touching only `docs/backlog.md`. Measured with `git diff --name-only d8b19418 8fcb6835` and recorded as defect 3

### On the deployed build

- [ ] Deployed to test — n/a: these two files are not deployed. The release was deployed to test from the same commit as production's Worker, recorded in the record
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in this PR is deployed anywhere, and it was done for the release — the phone-width sweep ran against `test.lannacare.org` on the release build, and both its endpoints report `0.24.0`
- [x] Timezone-sensitive behaviour proved, not observed at a convenient hour — **this is the line that matters in a record written across midnight UTC.** The deploy ran at 23:55Z on 2026-10-09, which is 06:55 on 2026-10-10 in Thailand; the release, the register entry and the file name are all 2026-10-10, and every timestamp in the record carries a `Z`. Proved by reading the Pi's own clock (`06:27:24 +0700`) against the same event's UTC stamp
- [ ] For a boundary or banding change, the assertions cover both edges — n/a: no boundary, threshold or band in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block in §6 is pasted from `gates.mjs`. Every block in the record is pasted from the script, deploy log, endpoint or mail header it names
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: this PR serves no page. Done for the release, in a real browser, with the MISS/HIT/HIT sequence pasted into the record

### Deploy safety

- [ ] `deploy: production → Supabase project` line read and the ref matches production — n/a: this PR runs no deploy. Read for the release and pasted into the record, including the SHA on it, which is what found defect 3
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: this PR runs no deploy. Seen for the release (11 vars) and pasted into the record
- [ ] Any new secret or env var exists in the production Cloudflare environment — n/a: this PR adds none, and neither did the release

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** No, it contains neither — two Markdown files. The release's ordering question (`0172` renames things live code was using) is the subject of the record's longest section, and `0175`'s position is stated in §3
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: nothing in this PR to apply. The release's dry runs, including the two red ones and why each was still correct to proceed from, are recorded
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [x] Apply plan stated: which file, which project, and whether it runs before or after the deploy — stated in §3 for `0175`, and recorded for `0172`–`0174`: all three, production project, before either deploy

### Rollback

- [x] Rollback position stated, **including what it does not cover** — for **this PR**, a git revert of two documentation files, with no effect on anything running. For the **release**, the record states it plainly and it is not symmetrical: a code-only rollback of production after `0172` would leave `0.23.0`'s code naming columns that no longer exist, so the rollback is forward — fix and re-deploy — and reversing `0172` itself would be a hand-written migration and Lutan's decision

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | **`check-phone-width.mjs` cannot be run the way `docs/release-smoke-test.md` describes**: its role list still contains `staff`, retired by this release, so a default run dies at setup. It also has no `second_in_command`, so the 2IC is never measured | **deferred to the backlog** (committed on the `backlog` branch, 2026-10-10), and worked around for this release by naming the six surviving roles. Named in the record and in the handover because the smoke test asks for this script by name |
| 2 | low | **`check-phone-width.mjs --clean` deletes every `phonewidth-*` login it finds**, not just the current run's, so running it removed another stream's in-flight throwaway logins | **deferred to the backlog**, same commit. Dev data is disposable, so nothing was lost that matters; the other stream's run would have to be repeated |
| 3 | low | `docs/release-smoke-test.md` has the **phone-width item twice**, with slightly different wording | **not fixed here, and deliberately**: it is in the release manager's own checklist rather than this release's change, and editing the template inside a record PR would mix a record with a process change. Named here so it is not re-discovered as new |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the record matches the release Lutan actually agreed to — in particular that the `0172` window section describes the decision he made, and that the clinic-name outcome (`Novel`, with `Dr somchai` as its doctor) is what he meant | `docs/releases/2026-10-10.md` |
| 2 | That the handover reads usefully **cold**, to someone starting `0.25.0` with none of this session's context | `docs/release-handover.md` |
| 3 | That the four production-only checks it lists are the four he wants carried, and that `0.20.0`'s Contacts pass is closed rather than carried a seventh time | `docs/release-handover.md`, "Outstanding verification" |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looks may tick this line, so it stays unticked; the signature below names what is outstanding

Manual verification by: pending: the three items under Left for manual verification — Lutan reading the record against the decisions he made, the handover read cold, and the carried-forward list

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager, and the release it records is complete: `0.24.0` is live on production and test, both endpoints agree, and the admin mail arrived

Result: pass with accepted defects

Release manager acknowledgement: Claude (release manager session)  Date: 2026-10-10
