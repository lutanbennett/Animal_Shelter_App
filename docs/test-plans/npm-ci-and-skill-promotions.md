# Feature test plan — npm-ci-and-skill-promotions

## Header

| | |
|---|---|
| Feature | `npm ci` in the daily sync (`CLAUDE.md` and plan-day step 1), plus the facts planner handovers `519` and `528` named and did not apply |
| Backlog item | `docs/backlog.md` → **Add `npm ci` to the daily sync of the main checkout** (ticked, moved to Completed / Documentation) |
| Branch / worktree | `claude/npm-ci-and-skill-promotions` @ `C:\Development\Animal_Shelter_npm-ci-and-skill-promotions` |
| Dev server | not started — two markdown files, no UI surface |
| PR | pending: opened after this plan passes the checker |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | no |
| Tested at SHA | `c0a586b1` (merged with `origin/main` by `worktree.mjs sync`; the plan itself is the only later change) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the sync sequence now ends with `npm --prefix C:/Development/Animal_Shelter_App ci`, in both places, with the reason for its position; the handovers' unapplied promotions are moved into the skill and `CLAUDE.md`
- [x] Files/areas touched listed — `CLAUDE.md`, `.claude/skills/plan-day/SKILL.md`, `docs/backlog.md` (one item ticked and moved), `docs/decisions/2026-10-31-npm-ci-and-skill-promotions.md`, this plan. No `src/`, `scripts/`, migration or workflow
- [x] Roles affected identified — none; these are instructions to Claude sessions. `CLAUDE.md` is read by `scripts/`, which is why the gates were run
- [x] Anything explicitly **out of scope** written down — `docs/planner-handover.md` and `docs/release-handover.md` untouched (the source); no band re-tuned and the bands table not rewritten; three observations in `528` that were not marked for promotion left in the handover (listed in the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (release record `0.41.0`, release-procedure and handover files; none overlap this change)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit code read from the script's own closing lines:

```
=== gates: build exited 0 after 255s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or reason stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

The "behaviour" here is whether the edited instructions are correct and landed. Checked by reading the
files after the edit and by running the one command that was added.

- [x] Happy path works end to end — `npm --prefix . ci --dry-run` run from this worktree completes and resolves the lockfile, so the `--prefix` form added to the sync is valid. The sync itself was not run against the main checkout from here, which is the main checkout's own business
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no input
- [x] Boundary cases checked — both files are CRLF and were edited through a guarded script that normalises to LF, requires each anchor to match exactly once, and writes CRLF back; `git diff --stat` shows +73/-4 rather than a whole-file rewrite, so line endings were preserved

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed | unchanged | n/a — no UI, no permission code |
| management | nothing changed | unchanged | n/a — as above |
| staff | nothing changed | unchanged | n/a — as above |
| doctor | nothing changed | unchanged | n/a — as above |
| volunteer | nothing changed | unchanged | n/a — as above |
| signed out | nothing changed | unchanged | n/a — as above |

- [ ] Every role above tested — n/a: no access rule, page or policy changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: developer documents only, nothing a shelter user reads
- [ ] Translatable strings — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no browser needed; two markdown files
- [ ] Network clean — n/a: no browser needed; two markdown files

## 6. Regression

- [x] The pages nearest the change still work — the nearest consumers are the scripts that read `CLAUDE.md`; `node scripts/check-backlog-sections.mjs` (`ok — 65 open items, all above ## Completed`) and the gates, which include lint, ran after the edit
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched (`NavLinks.tsx`, `manual/en.ts` untouched)
- [x] Nothing merged from `main` during `sync` was broken by this branch — the sync brought release-record and handover docs only; gates ran after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — the `npm ci` item, moved to Completed / Documentation with a closing note. The promotions close no item because they were never filed as one (said in the PR). Searched the backlog for `plan-day`, `daily sync`, `npm ci` and `package-lock`: the other hits (Pi network review, acceptance testing, the assistant SDK removal) are about different work; the SDK-removal item's cross-reference to "the `npm ci` item above" is unchanged by this
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-31-npm-ci-and-skill-promotions.md` (position, unconditional, what was promoted from where, the supersession, what was not promoted)
- [x] `README.md` still accurate — it does not describe the daily sync
- [ ] **Release notes.** — n/a: developer process documents; nobody at the shelter would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — figures in the skill are copied from the handovers and `.plan-day.md`'s batch 5 table (checked line by line against the +20% / +33% / +28% rows); the one command was run

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold in code; the token bands in the skill are prose and none was re-tuned
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Destructive or rewriting migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — revert the commit; nothing deploys from it and no migration is involved. Note that a plan-day session already running keeps the skill text it loaded

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | A `sed` fix to the amendment script half-applied and garbled two lines of the floor paragraph before the script was run | fixed — caught on read-back, repaired with Edit, script run once after |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Read the new text as a planner would: the order of the `npm ci` line in step 1, and the superseded-judgement-rule paragraph in Token estimates | `.claude/skills/plan-day/SKILL.md` steps 1 and 6 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list has one row and no person has looked yet; see the pending signature below

Manual verification by: pending: a person reading the new skill text for sense and for any rule whose meaning moved

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: documents only, nothing to deploy

Result: pass

Release manager acknowledgement: n/a: not yet released
