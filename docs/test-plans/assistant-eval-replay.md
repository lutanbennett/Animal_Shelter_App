# Feature test plan — assistant-eval-replay

## Header

| | |
|---|---|
| Feature | Assistant v2 stream 6: a replay script that scores a model on the could-not-help export; plus the last two harness guard reads |
| Backlog item | `docs/backlog.md` → **Assistant v2 stream 6: eval replay** (ticked) and **HARNESS SWEEP: TWO GUARD READS LEFT** (ticked) |
| Branch / worktree | `claude/assistant-eval-replay` @ `C:\Development\Animal_Shelter_assistant-eval-replay` |
| Dev server | not started — scripts only, no UI surface |
| PR | opened after this plan; number on the PR |
| Tested by / date | Claude / 2026-10-30 |
| Carries a migration? | no |
| Tested at SHA | `74d127b3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a `scripts/` replay that prints intent and resident agreement, no threshold, run on fixtures
- [x] Files/areas touched listed — `scripts/assistant-eval-replay.mjs`, `scripts/lib/assistant-eval.mjs`, `scripts/assistant-eval-replay.test.mjs`, `scripts/fixtures/assistant-eval-sample.csv`, `scripts/check-phone-width.mjs`, `scripts/check-shelter-dates.mjs` (comment only), decision file, backlog ticks
- [x] Roles affected identified — none: developer tooling, nothing a login can reach
- [x] Anything explicitly **out of scope** written down — a live model run (no key), a local-model adapter (stream 7), a resident lookup tool, the export route and `could-not-help.ts` (unchanged)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed.

```
=== gates: build exited 0 after 277s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, no data touched
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/assistant-eval-replay.mjs --fixture` prints intent 75.0% (3 of 4) and resident 66.7% (2 of 3), exit 0; 6 tests in `assistant-eval-replay.test.mjs` pass
- [ ] Data persists — reload the page and the change is still there — n/a: stores nothing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no records
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI; the empty-labelled-set case prints `n/a (nothing to score)` and is tested
- [x] Invalid input is rejected with a readable message, not a crash — no argument prints help and exits 2; a missing file and a CSV without the export's columns exit 2 with a message
- [x] Boundary cases checked — BOM, CRLF, quoted commas and quotes, Thai text, blank labels skipped, model error counted as wrong intent
- [x] `check-phone-width.mjs` guard read — `node --check` passes; READ, not run (a full run is 2.5 to 3 hours, by instruction); the `--clean` and `--public-only` exits now go through `exitWith` with the rest in an `else`
- [x] `check-shelter-dates.mjs` guard read — makes no network call, left alone with a comment; run: exit 0

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing | developer scripts, no route or page | n/a |

- [ ] Every role above tested — n/a: no surface any role can reach
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL exists

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user can see
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: the replay makes no network call under `--fixture`

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page imports the new files; only `check-phone-width.mjs` changed behaviour, and only at exit
- [x] Any shared file touched checked from a second, unrelated page — no shared file touched; `scripts/lib/exit.mjs` only imported
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates below ran after the merge

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — both items
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-30-assistant-eval-replay.md`
- [x] `README.md` still accurate — it does not list scripts
- [ ] **Release notes.** — n/a: a developer script; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Scores are from the fixture run; a live model score is stated as not established

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — n/a: no banding
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the gates block above is pasted unedited
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; scripts only, nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none found | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing a person needs to look at | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. Empty: nothing to look at.

Manual verification by: n/a: scripts only; no UI surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handed over by the PR itself once merged

Result: pass

Release manager acknowledgement: pending
