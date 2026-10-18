# Feature test plan — fable-acceptance-dry-run

Filled from `docs/test-plan-template.md`. **A verification run, no code
changed**: this branch adds a partial UAT report, its raw row notes and this
plan. The run itself — what was tried in the app and what happened — is the
report, `docs/uat/dry-run-2026-10-18.md`, not this plan. This plan only says
whether the *PR* is sound.

---

## Header

| | |
|---|---|
| Feature | Fable dry run of the acceptance checklist, **Admin pass only (partial)**: `docs/uat/dry-run-2026-10-18.md` and `docs/uat/dry-run-2026-10-18/raw-notes-admin.md` |
| Backlog item | `docs/backlog.md` → Fable dry run of the acceptance checklist: functionality and ease of use, ending in a report (left **open** — six roles of six were not finished) |
| Branch / worktree | `claude/fable-acceptance-dry-run` @ `C:\Development\Animal_Shelter_fable-acceptance-dry-run` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` (used for the run; stopped before the gates) |
| PR | #727 |
| Tested by / date | Claude, 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | ac9b671f |

## 1. Scope and risk

- [x] Change is described in one sentence: a partial report of the acceptance dry run (Admin role, English, phone width, rows R001–R127) with a ranked findings table, written to be reviewed before the shelter's own run; it matches the backlog item except that the other five roles, the Thai pass and the desktop sweep were not reached
- [x] Files touched: `docs/uat/dry-run-2026-10-18.md`, `docs/uat/dry-run-2026-10-18/raw-notes-admin.md`, this plan. Nothing under `src/`, `worker/`, `supabase/migrations/` or `scripts/`
- [x] Roles affected identified: none by this PR. The run exercised the **admin** role with a disposable dev login (named in the report)
- [x] Out of scope, written down: the Management, Doctor, Volunteer, Public viewer and Visitor passes; Thai and desktop sweeps; raising any finding (Lutan decides, on the `backlog` branch); correcting `scripts/lib/acceptance-matrix-entries.mjs`; fixing anything found

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (#724–#726 came in: approve-photos card, social-shares schema; none touches this branch's files)
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: build exited 0 after 325s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] CI green on PR #727 at cae98205: all eight checks passed (run 39142562855)

## 3. Schema and data — *skip if no migration*

- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR
- [x] n/a: no migration in this PR

## 4. Functional checks

- [x] n/a: the PR adds documents only; the app's behaviour was exercised by the run and is recorded in the report, row by row
- [x] n/a: documents only
- [x] n/a: documents only
- [x] n/a: documents only
- [x] n/a: documents only
- [x] n/a: documents only

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no app change | — | n/a |
| management | n/a: no app change | — | n/a |
| staff | n/a: retired role, no app change | — | n/a |
| doctor | n/a: no app change | — | n/a |
| volunteer | n/a: no app change | — | n/a |
| signed out | n/a: no app change | — | n/a |

- [x] n/a: nothing in this PR changes what any role can reach
- [x] n/a: nothing in this PR changes what any role can reach

## 5. Cross-cutting

- [x] n/a: `NavLinks.tsx` untouched
- [x] n/a: the manual is untouched
- [x] n/a: no strings added to the app
- [x] n/a: the only new files are markdown under `docs/`
- [x] n/a: no app pages changed
- [x] n/a: no app pages changed

## 6. Regression

- [x] n/a: no app change; the pages the run exercised are listed in the report and were loaded during the run on this branch's checkout
- [x] n/a: no shared file touched
- [x] `main` merged during `sync` brought nothing this branch could break: this branch holds only new files under `docs/`

## 7. Documentation

- [x] n/a: the backlog item is deliberately **not** ticked — the report says which roles were walked and which were not; the brief says to leave it open in that case
- [x] n/a: no non-obvious choice about how the run was conducted beyond what the report's "How it was run" section records (disposable role accounts, set-up opened by script); no decision file needed
- [x] `README.md` still accurate: nothing it describes changed
- [x] n/a: a UAT report, nothing in the app changed
- [x] Commit messages say why (checkpoint commits exist so a stalled session loses nothing)
- [x] Every claim in the report corresponds to something done in the browser; where a half of a row was not done the row says so

## 8. Pre-production gate

### Tested build

- [x] n/a: documents only; nothing to deploy
- [x] n/a: documents only; nothing to deploy

### On the deployed build

- [x] n/a: nothing to deploy
- [x] n/a: nothing to deploy
- [x] n/a: no timezone-sensitive code in this PR (the run notes the 07:00 boundary could not be observed at the hour it ran)
- [x] n/a: no boundary change
- [x] n/a: the gates block above is the only tool output in this plan and is pasted unedited
- [x] n/a: public pages unchanged by this PR

### Deploy safety

- [x] n/a: nothing to deploy
- [x] n/a: nothing to deploy
- [x] n/a: no new secret

### Migration ordering — *skip if no migration*

- [x] n/a: no migration
- [x] n/a: no migration
- [x] n/a: no migration
- [x] n/a: no migration

### Rollback

- [x] n/a: reverting the merge commit removes three markdown files; nothing else to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | — | None in this PR. The run's findings (16, ranked) are in the report for Lutan to review; none is raised here by design | deferred to backlog (Lutan's review) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the report and decide which findings to raise on the `backlog` branch, and which checklist rows to correct in `scripts/lib/acceptance-matrix-entries.mjs` | `docs/uat/dry-run-2026-10-18.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [x] n/a: the list above is Lutan's review of the report, which happens after the merge; there is nothing on a screen for a person to look at in this PR

Manual verification by: pending: Lutan, reading the report and deciding which findings to raise. The dry run itself signs nothing — it is a rehearsal, not the shelter's verification

### Result

- [x] Open defects are either fixed or explicitly accepted above (none in this PR)
- [x] Checklist pasted into the PR
- [x] n/a: documents only; no release-manager handover needed

Result: pass

Release manager acknowledgement: n/a: documents only, nothing to deploy
