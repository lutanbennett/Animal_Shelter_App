# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `339` (a delta over `330`), plus one promoted trap in the `/plan-day` skill |
| Backlog item | none — the skill's own step 8 fires the handover at nine workstreams since the last one; the counter reached 9 at batch 3 setup |
| Branch / worktree | `claude/planner-handover-339` @ `C:\Development\Animal_Shelter_planner-handover-339` |
| Dev server | not started — a documentation file and a skill file only |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `6302f419` on `7fb1955b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — handover edition `339` written as a delta over `330`, and the `session_id` measurement trap promoted into the skill
- [x] Files/areas touched listed — `docs/planner-handover.md` (rewritten, 174 lines), `.claude/skills/plan-day/SKILL.md` (9 lines added in step 2), this plan
- [x] Roles affected identified — none; no role reads either file in the app
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and not in this PR; the backlog correction this round made (`7207d177`) went on the `backlog` branch, as `CLAUDE.md` requires, and is not here either

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date"), branch pushed
- [x] `node scripts/gates.mjs` ends with all four at 0. Closing lines as printed:

```
=== gates: build exited 0 after 254s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply; it was run this round only to read the dev and production positions quoted in the plan
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema or data touched
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two documents, no runtime behaviour. The skill addition is prose read by a future `/plan-day` run
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | `docs/` and `.claude/` are not served | n/a — no app surface |
| management | nothing new | as above | n/a — no app surface |
| doctor | nothing new | as above | n/a — no app surface |
| head_of_medical | nothing new | as above | n/a — no app surface |
| volunteer | nothing new | as above | n/a — no app surface |
| signed out | nothing new | as above | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders these files
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: an internal planning document, no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was already up to date and all four gates passed at `6302f419`
- [x] The skill still reads correctly around the inserted paragraph — read back after the edit; the CRLF line endings were preserved (the patch normalises, edits, then writes CRLF back, which is the trap the skill itself documents)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item; the handover fires from the skill's own counter. This round's backlog correction went on the `backlog` branch (`7207d177`), which is where `CLAUDE.md` requires it
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The one durable rule this round produced was **promoted into the skill** rather than written as a decision, which is what the skill's step 8 asks for
- [x] `README.md` still accurate — it does not list the handover documents
- [ ] **Release notes.** — n/a: a planning document and a skill paragraph; no shelter user can see either, and nothing in `src/` changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the handover were measured, not reasoned.** This matters more than usual in this edition, because its defining finding is the planner having done the opposite. Every figure in it was re-read from a command at writing time: `git log`, `gh pr list --state all`, `apply-migrations.mjs --status` (dev and production), `worktree.mjs list`, `check-backlog-sections.mjs`, and `get_usage`/`get_session` per session. The production claim it corrects was re-read with `scripts/check-production.mjs doctor-cells role-cells role-cards`, and the handover quotes those counts rather than restating the earlier inference. The ~5k-per-screen-state rate is arithmetic shown in full from one measured actual and is labelled as needing a second reading

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; `docs/` and `.claude/` are not part of the build output
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change
- [ ] **Timezone-sensitive behaviour proved** — n/a: no time logic
- [ ] **Boundary or banding change covered at both edges** — n/a: no code. The token bands discussed in the handover are prose guidance, not a computed threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted output is the gates block in section 2, copied as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: reverting the PR restores edition `330` and removes the skill paragraph; nothing runtime to roll back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover is **174 lines** against the skill's ~150 target. Every section present is one of the three step 8 rules (what changed, promoted facts, candidates), and two sections were cut to citations by promoting their content — the `session_id` trap into the skill, the design-band reading into `.plan-day.md`. The skill says never to trade accuracy for the count and that a trimming pass is the most expensive place to spend the budget the target protects | accepted — shipped at 174 rather than opening a reword pass |

## Left for manual verification

Empty: neither file has a screen. The skill paragraph is proven only when a
future `/plan-day` reads a session's figures, which is that run's own job —
and the handover records what to check.

| # | What to check | Where |
|---|---|---|
| — | none | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-24

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document and a skill paragraph, with nothing on a screen for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file rather than pasting it
- [ ] Handed to the production release manager — n/a: nothing in this PR deploys

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR deploys
