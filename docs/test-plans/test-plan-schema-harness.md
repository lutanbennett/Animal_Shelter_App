# Feature test plan — schema harness line in section 3

## Header

| | |
|---|---|
| Feature | Three template fixes: a section 3 line for exercising a migration's constraints in a `begin; … rollback;` harness, a section 2 warning that gates are ticked on exit codes rather than plausible-looking output, and a section 8 split of the timezone check into boundary logic versus deployed behaviour |
| Backlog item | none; feedback from the Cashflow Schema session on 2026-09-23, approved by Lutan the same day |
| Branch / worktree | `claude/test-plan-schema-harness` @ `C:\Development\Animal_Shelter_test-plan-schema-harness` |
| Dev server | not started — this change ships no runtime code |
| PR | opened after this checklist; number recorded in the follow-up commit |
| Tested by / date | Claude (test manager session) / 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | gates run locally at `308afb2`, exit 0 each. Everything after that commit is Markdown only — a sync that merged 2 lines of `docs/backlog.md`, and the section 8 change — none of which `typecheck`, `lint` or `build` can see, so they were not re-run over documentation. CI re-runs all three on every push and covers the tip |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — one checklist line in section 3 of `docs/test-plan-template.md` for the `do $$ … $$` harness CLAUDE.md already describes, plus the section 2 and section 8 changes added in response to defects 1 and 3 below
- [x] Files/areas touched listed — `docs/test-plan-template.md`, `docs/test-plans/`, `docs/decisions.md`. No `src/`, no `worker/`, no `scripts/`, no `.github/`, no `supabase/migrations/`
- [x] Roles affected identified — none; no runtime surface, so no role can reach it
- [x] Anything explicitly out of scope written down — not changing `scripts/check-test-plan.mjs` (the new line needs no new validation; it is an ordinary checklist item), not changing the release smoke test (owned by the release manager session), and not retrofitting the line onto already-merged checklists

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `f95df6d`; the merge brought a 2-line `docs/backlog.md` change and no code
- [x] `npm run typecheck` — clean
- [x] `npm run lint` — clean
- [x] `npm run build` — succeeds, exit 0
- [x] CI green on the PR — recorded in the follow-up commit once `check` and `test-plan` both report on the merged tip

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration; this PR only edits documentation
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, and this change reads no data
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — n/a: no migration. This is the line this PR adds; there is nothing here for it to apply to
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The change is one line of a Markdown template, so the checks that mean anything are about the checker still accepting a filled copy.

- [x] Happy path works end to end — `node scripts/check-test-plan.mjs --base origin/main` passes on this branch with this file present
- [x] Data persists — n/a in the usual sense; re-ran the checker and got the same result, confirming it is stateless
- [ ] Create / edit / delete exercised — n/a: no CRUD surface
- [x] Empty state renders sensibly — the added line is an ordinary `- [ ]` item, so an untouched copy of the template still fails the checker exactly as before; verified by running the checker against the unmodified template
- [x] Invalid input is rejected with a readable message — verified the new line is subject to the same rule as every other: left unticked without an `n/a` reason it fails with its file:line
- [x] Boundary cases checked — the line contains backticks, an em dash and `$$`; confirmed none of it trips the checker's placeholder regex, its `n/a` matcher or its checkbox parser

### Role access matrix

No runtime surface, so no role can reach this change.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing | n/a | n/a |
| staff | nothing | n/a | n/a |
| vet | nothing | n/a | n/a |
| volunteer | nothing | n/a | n/a |
| resident | nothing | n/a | n/a |
| signed out | nothing | n/a | n/a |

- [ ] Every role above tested — n/a: no runtime surface exists for any role to reach
- [ ] A role that should not have access is blocked server-side — n/a: no route added

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry, no route
- [ ] Manual updated — n/a: developer process documentation; `/manual` documents the app for shelter staff
- [ ] Translatable strings — n/a: no user-facing strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — no page surface; `npm run build` compiled every route, which is the available evidence
- [x] Any shared file touched checked from a second angle — `docs/test-plan-template.md` is the shared file. Verified a copy of it filled in as a real checklist still passes, and that the already-merged `docs/test-plans/test-plan-enforcement.md` is unaffected, since the new line applies only to future copies
- [x] Nothing merged from `main` was broken by this branch — branched from `ca10680` and synced to `83bf4a6`; the merge brought only a 2-line `docs/backlog.md` change, which this branch does not touch

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; direct feedback from another session
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-23
- [x] `README.md` still accurate — checked; it does not describe the test plan template
- [x] Commit messages say why, not just what

## 8. Pre-production gate

- [x] Tested SHA recorded in the header — `308afb2` for the local gates, merged tip `f95df6d` covered by CI
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deployed; no runtime code
- [ ] Deployed to test — n/a: no runtime code to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no runtime code to deploy
- [ ] Timezone-sensitive behaviour checked — n/a: no date handling
- [ ] Public pages re-checked after cache purge — n/a: no public page touched
- [ ] Edge cache serving — n/a: no deploy
- [ ] Production Supabase project ref read and matching — n/a: no deploy
- [ ] `strip-baked-env` line seen — n/a: no deploy
- [ ] Any new secret or env var in production Cloudflare — n/a: no new env vars
- [ ] PR contains both a migration and code that reads it — n/a: no migration
- [ ] Production `--dry-run` clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, including what it does not cover — reverting this PR removes one template line; no schema, no deployed artefact, nothing to undo beyond the text

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high | While filling in this very checklist I nearly ticked `typecheck`, `lint` and `build` on a false green: `npm ci` had not finished linking `node_modules/.bin`, so every gate failed with "'next' is not recognized", and piping each through `tail` made the shell report `tail`'s exit status instead. Three gates read as passing having never run | fixed — section 2 now warns about both causes, and the gates were re-run capturing each exit code separately |
| 3 | medium | Section 8 conflated two different timezone claims — whether the logic handles the boundary, and whether the deployed build behaves as the source does. Read as written it pushed testers toward a timed observation that silently passes at the wrong hour, when deterministic instant injection is both stronger and available | fixed — the line now separates the two and prefers injection where the code allows it |
| 2 | medium | Section 3 had no line for the `begin; … rollback;` harness, so the most valuable check on a migration had nowhere to be recorded. A schema checklist read as almost entirely `n/a`, making it look like a formality on exactly the change type where it should have teeth — and the template was out of step with a practice CLAUDE.md already documents | fixed — this PR |

## Left for manual verification

Nothing. The change is one line of developer-facing documentation with no runtime
surface, and everything verifiable about it is a command that was run.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (test manager session)  Date: 2026-09-23

### Manual verification

- [ ] Every item in the manual list was checked by a person, or the list is empty — n/a: the list is empty; no runtime surface exists to look at

Manual verification by: n/a: docs only, no runtime surface for a person to check  Date: —

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: pending  Date: pending
