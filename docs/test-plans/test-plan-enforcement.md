# Feature test plan — test plan template + CI enforcement

## Header

| | |
|---|---|
| Feature | Per-feature test plan template, plus a CI check that blocks merging a PR without a completed one |
| Backlog item | none; requested directly by Lutan 2026-09-23 |
| Branch / worktree | `claude/test-plan-template` @ `C:\Development\Animal_Shelter_test-plan-template` |
| Dev server | not started — this change ships no runtime code |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/55 |
| Tested by / date | Claude (test manager session) / 2026-09-23 |
| Carries a migration? | no |
| Tested at SHA | 0009ac6 — the commit under test. The follow-up commit that writes this line edits only this field and the CI line below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked — adds `docs/test-plan-template.md`, `scripts/check-test-plan.mjs` and a `test-plan` CI job that fails a PR with no completed checklist
- [x] Files/areas touched listed — `docs/test-plan-template.md`, `docs/test-plans/`, `docs/decisions.md`, `scripts/check-test-plan.mjs`, `.github/workflows/ci.yml`. No `src/`, no `worker/`, no `supabase/migrations/`
- [x] Roles affected identified — none; the change has no runtime surface, so no role can reach it. It affects developers and CI only
- [x] Anything explicitly out of scope written down — the `qa-signed-off` label the release manager proposed, the schema-only exemption (rejected by Lutan), marking `test-plan` a required check in branch protection (a GitHub settings change, not a code change), and the CLAUDE.md rule text (being written by the release-train session)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `npm run typecheck` — clean
- [x] `npm run lint` — clean
- [x] `npm run build` — succeeds, exit 0
- [x] CI green on the PR — `check` and `test-plan` both passing on 0009ac6, 2 passing / 0 failing

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, and this change reads no data
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The feature here is a CLI check, so the happy path is the script's behaviour.

- [x] Happy path works end to end — `node scripts/check-test-plan.mjs --base origin/main` passes on this branch with this file present
- [x] Data persists — verified instead that the check is stateless and gives the same result on re-run
- [ ] Create / edit / delete all exercised — n/a: the change has no CRUD surface
- [x] Empty state renders sensibly — verified the no-checklist case exits 1 with the `cp docs/test-plan-template.md …` instruction rather than a stack trace
- [x] Invalid input is rejected with a readable message, not a crash — verified unticked-box, `n/a`-without-reason, unfilled placeholder, bad `Result:` and empty `Tested by:` all fail with a file:line message
- [x] Boundary cases checked — a checklist with zero checkbox lines is rejected; a missing base ref exits 2 with a `git fetch` hint rather than a raw diff error

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
- [ ] Manual updated — n/a: developer and CI tooling, not a user-facing feature; `/manual` documents the app for shelter staff
- [ ] Translatable strings — n/a: no user-facing strings; script output is developer-facing English
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — no page surface, but `npm run build` compiled every route, which is the available evidence that nothing regressed
- [x] Any shared file touched checked from a second angle — `.github/workflows/ci.yml` is shared: verified the existing `check` job is unchanged and the new `test-plan` job is additive and gated on `github.event_name == 'pull_request'`, so pushes to `main` are unaffected
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` was a no-op

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; requested directly
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-23
- [x] `README.md` still accurate — checked; it documents deploy and migrations, neither of which this change alters
- [x] Commit messages say why, not just what

## 8. Pre-production gate

- [x] Tested SHA recorded in the header — 0009ac6
- [ ] Deployed SHA matches the tested SHA — n/a: nothing is deployed; this change ships no runtime code
- [ ] Deployed to test — n/a: no runtime code to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no runtime code to deploy
- [ ] Timezone-sensitive behaviour checked on test — n/a: the script does no date arithmetic
- [ ] Public pages re-checked after cache purge — n/a: no public page touched
- [ ] Production Supabase project ref read and matching — n/a: no deploy
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy
- [ ] Any new secret or env var exists in production Cloudflare — n/a: no new env vars
- [ ] PR contains both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, including what it does not cover — reverting this PR removes the CI job and the template; it cannot leave the repo broken because the job only ever fails a PR, never `main`, and no schema or deployed artefact is involved

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Bootstrap wrinkle: this PR's own tested SHA cannot be written into the commit that creates it, so it lands in a follow-up commit on the same branch. Every later feature records it normally | accepted |
| 2 | low | `test-plan` is not a required check in branch protection, so it reports red but does not physically block merge | accepted — deliberate. Lutan's call 2026-09-23: run it as a red flag first, promote it to a hard block once the process has bedded in. Backlog item raised for the revisit |
| 3 | medium | The check only looked at committed diffs, so running it locally before committing reported "no completed test plan" even when the file was sitting in the working tree. Would have trained people to distrust it | fixed — now unions the committed diff with `git status --porcelain -- docs/test-plans` |
| 4 | medium | The `Tested by:` emptiness check never fired: the regex matched the `Date:` text on the same line, so a blank name passed. Sign-off could have been anonymous | fixed — anchored on `Date:`, and the date is now validated as `yyyy-mm-dd` |

## Sign-off

- [x] All applicable boxes ticked, every `n/a` justified
- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Tested by: Claude (test manager session)  Date: 2026-09-23

Release manager acknowledgement: pending  Date: pending
