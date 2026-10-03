# Feature test plan — dry-run-staff

Filled from `docs/test-plan-template.md`. **A verification run, no code
changed**: this branch adds a report, its screenshots, this plan and a status
line on the backlog item. The run itself — what was tried in the app and what
happened — is the report, `docs/uat/dry-run-2026-10-03-staff.md`, not this
plan. This plan only says whether the *PR* is sound.

---

## Header

| | |
|---|---|
| Feature | Fable dry run of the acceptance checklist, **staff role only**: `docs/uat/dry-run-2026-10-03-staff.md` and its screenshots |
| Backlog item | `docs/backlog.md` → Fable dry run of the acceptance checklist: functionality and ease of use, ending in a report |
| Branch / worktree | `claude/dry-run-staff` @ `C:\Development\Animal_Shelter_dry-run-staff` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` (used for the run; stopped before the gates) |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence: the report of a dry run of the staff sheet of the acceptance checklist — both lenses, phone first, English and Thai — with a ranked findings table; it is one role of the seven the item asks for
- [x] Files touched: `docs/uat/dry-run-2026-10-03-staff.md`, 30 screenshots under `docs/uat/dry-run-2026-10-03-staff/`, this plan, and a status line on the item in `docs/backlog.md`. No file under `src/`, `worker/`, `scripts/` or `supabase/`
- [x] Roles affected identified: none by this PR. The run exercised the **staff** role (and was management for five minutes to seed recurring jobs — stated in the report)
- [x] Out of scope, written down: the other six roles; raising any finding (Lutan decides, on the `backlog` branch); correcting `scripts/lib/acceptance-matrix-entries.mjs` (the report lists the corrections instead); fixing anything the run found; the signed edition `docs/uat/acceptance-<date>.md`, which belongs to the shelter and was not created

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (#312 and #313 came in; neither touches `src/app`, `src/components`, `src/lib/manual` or `src/lib/i18n` — `git diff --stat 8743055 origin/main` over those paths printed nothing)
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: build exited 0 after 128s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR: `check`, `test-plan`, `migration-numbers`, `script-integrity`, `audit` and `public-views` all SUCCESS at `0f23b78`, read from `gh pr view 314` and the app's PR status

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a verification run, no code changed; what the app did is recorded row by row in the report
- [ ] Data persists — n/a: a verification run, no code changed
- [ ] Create / edit / delete all exercised — n/a: a verification run, no code changed
- [ ] Empty state renders sensibly — n/a: a verification run, no code changed
- [ ] Invalid input is rejected with a readable message — n/a: a verification run, no code changed
- [ ] Boundary cases checked — n/a: a verification run, no code changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface changed | n/a |
| management | n/a | no app surface changed | n/a |
| staff | n/a | no app surface changed | n/a |
| vet | n/a | no app surface changed | n/a |
| volunteer | n/a | no app surface changed | n/a |
| signed out | n/a | no app surface changed | n/a |

- [ ] Every role above tested — n/a: this PR changes no access; the staff role's access is what the report records (31 must-not rows and 4 boundaries, all held)
- [ ] A role that should not have access is blocked server-side — n/a: no endpoint added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI changed
- [ ] Manual updated — n/a: no feature; the manual gaps the run found are findings in the report, not edits
- [ ] Translatable strings — n/a: no UI changed
- [ ] Mobile viewport — n/a: no UI changed; the 375 px observations are the report's subject
- [ ] Browser console clean — n/a: no UI changed
- [ ] Network clean — n/a: no UI changed

## 6. Regression

- [ ] The pages nearest the change still work — n/a: nothing but documents and images was added
- [ ] Shared file checked from a second page — n/a: no shared file touched except one line of `docs/backlog.md`
- [x] Nothing merged from `main` during `sync` was broken by this branch: the build exited 0 after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately not ticked; this is the staff role only and six roles remain. A status line naming the PR and the role was added instead
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: nothing was designed or decided; how the staff account was obtained is recorded in the report, where the next role's run will look for it
- [x] `README.md` still accurate — it does not describe the dry run
- [ ] **Release notes.** n/a: a report and screenshots only, nothing ships to a shelter user
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned, **and the report says which are which**: every P, F and pixel figure was observed in the browser; the three causes named (the chip regex at `src/app/residents/page.tsx:119`, the missing staff insert policy on `blood_tests`, the local and UTC clock at the time of the "future" refusal) were read from the code or printed by the machine. **Inferred, and labelled so:** that the "future" refusal is a UTC date (seen at one hour only), and that a same-day hospital admission and return would be refused like the same-day move

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at the next `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at the next `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: no code changed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no code changed; the run used the local dev server only
- [ ] Timezone-sensitive behaviour — n/a: no date logic changed; the run's timezone observation is finding F-03 in the report
- [ ] Boundary assertions — n/a: no thresholds changed
- [ ] Evidence pasted is unedited tool output — n/a: the only pasted output is the gate lines above, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. It adds documents and images and one line to the backlog; nothing reads them. It does **not** remove what the run left in the dev database (a disposable staff account, six recurring jobs, three residents and their records — listed at the end of the report)

## Defects found

Defects **in this PR**: none. The 22 findings about the app are in the report's
findings table and are deliberately not raised here.

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| – | – | none in the PR itself | – |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Read the report** and decide which of F-01 … F-22 go onto the `backlog` branch, and which checklist corrections to make in `scripts/lib/acceptance-matrix-entries.mjs` | Lutan |
| 2 | **Confirm F-01 and F-02 by hand** before acting on them — log a blood test as a staff account, and scan a chip you have just recorded | dev or `test.lannacare.org` |
| 3 | **Pause or delete the six `DRYRUN` recurring jobs** and archive `dryrun-staff-20261003@example.test`, or leave them for the next role's run | Management → Recurring jobs; Settings → Security |
| 4 | The rows the run could not test — a real phone, a scanner, a Thai reader, a mailbox — listed in the report's *Could not test* | The shelter's own run |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see `pending:` below

Manual verification by: pending: Lutan, reading the report and deciding which findings to raise. The dry run itself signs nothing — it is a rehearsal, not the shelter's verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises the plan and names its file rather than pasting it, since every line but the gate output is `n/a`
- [ ] Handed to the production release manager — n/a: nothing here ships

Result: pass

Release manager acknowledgement: pending
