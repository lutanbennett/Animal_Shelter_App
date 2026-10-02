# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `apply-migrations.mjs` warns, never blocks, when a pending file declares (`-- consumer: <path>`) a reader that is not in the release assumed live |
| Backlog item | `docs/backlog.md` → "`apply-migrations.mjs` should warn when it applies a file whose consumer is not yet deployed" |
| Branch / worktree | `claude/apply-migrations-consumer-warning` @ `C:\Development\Animal_Shelter_apply-migrations-consumer-warning` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3004` (not used: script only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (apply-migrations-consumer-warning session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: a print-only warning in `apply-migrations.mjs` driven by a declared header, with the live-release assumption stated in the output
- [x] Files/areas touched listed: `scripts/lib/migration-consumers.mjs` (new), `scripts/check-migration-consumers.mjs` (new), `scripts/apply-migrations.mjs` (one import and one print-only block before the apply loop), `CLAUDE.md`, `docs/backlog.md`, a decision, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: migration tooling; no app role sees it
- [x] Out of scope written down: no backfill of the 126 existing migrations, no inference, no version endpoint (filed on the `backlog` branch)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR
- [x] `node scripts/gates.mjs` — see PR for the closing line
- [x] CI green on the PR — see PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, no UI surface, no code reads these columns
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration (a probe pair of throwaway files was dry-run, see §4)
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

`node scripts/check-migration-consumers.mjs` (13 cases, all ok) covers the
pure logic with stubbed git. Then a real run: two throwaway files (`select 1;`
with a consumer header naming a page that does not exist, and `select 2;` with
no header) were dropped in `supabase/migrations/`,
`node scripts/apply-migrations.mjs --dry-run` was run against the test
database (rolled back), and both files deleted.

- [x] **File whose consumer is undeployed → warns.** Printed `WARNING 9999_tmp_consumer_probe.sql: declared consumer src/app/not-yet-written/page.tsx is not on origin/main at all.` plus notes that "Live" is ASSUMED to be the cut of 0.13.0
- [x] **File whose consumer is live → silent.** Stub case: a path identical at the release commit and on `origin/main` produces no warning and no note
- [x] **Apply behaviour unchanged.** `node --check` passes; the same dry-run still printed `dry-run … ok` for both files in order and `Dry run only — nothing was applied.`; with nothing pending the output is the unchanged `0 pending` line. The new block runs before the loop, is wrapped in `try/catch`, and has no exit path
- [x] "Declares no consumer" is a different sentence from "no consumer found": the header-less probe was counted as "1 file(s) declare no consumer header, so nothing was checked for them"
- [x] Consumer changed since the release is worded "may or may not already read this", not as missing (stub case)
- [x] Could not work out the live release → a "skipped" note, no warning, no crash (stub case)
- [ ] Create / edit / delete — n/a: nothing is stored
- [ ] Empty state — n/a: nothing pending prints nothing new
- [x] Invalid input: a consumer line below the first SQL statement is ignored (case 5)
- [x] Boundary cases: `none`, several comma-separated paths, paths containing `[id]`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | migration tooling, no app surface | n/a |
| management | n/a | migration tooling, no app surface | n/a |
| staff | n/a | migration tooling, no app surface | n/a |
| vet | n/a | migration tooling, no app surface | n/a |
| volunteer | n/a | migration tooling, no app surface | n/a |
| signed out | n/a | migration tooling, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: migration tooling, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `--dry-run` against test, as above; `--status` and `--drift` exit before the new block and are untouched
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`; the follow-up (origin-served version endpoint) went on the `backlog` branch
- [x] Non-obvious design choices recorded in `docs/decisions/2026-10-02-migration-consumer-header.md`; `CLAUDE.md` "Database migrations" says to add the header
- [x] `README.md` still accurate — it does not describe apply-migrations output
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: migration tooling, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims were measured: the warning text above is from the real dry-run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager; `scripts/` is not in the Worker bundle
- [ ] Deployed SHA matches — n/a: nothing in the deployed site changes

### On the deployed build

- [ ] Deployed to test — n/a: nothing in the deployed site changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in the deployed site changes
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: covered in §4
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: deploy.mjs untouched
- [ ] `strip-baked-env` seen — n/a: build path untouched
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. Local tooling only, nothing persistent written

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: every behaviour is a command and its printed output.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (apply-migrations-consumer-warning session)  Date: 2026-10-02

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; script output only, shown above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in the deployed site changes

Result: pass

Release manager acknowledgement: n/a (migration tooling only)  Date: —
