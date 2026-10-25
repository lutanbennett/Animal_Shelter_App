# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `348` (a delta over `339`), Lutan's Admin ruling into `CLAUDE.md`, and four promoted lessons in the `/plan-day` skill |
| Backlog item | none — the skill's step 8 fires the handover at nine workstreams since the last one; the counter reached 10 at batch 3 setup. Lutan asked for it directly: *"Please write the handover document and merge it ready for a new stream to start"* |
| Branch / worktree | `claude/planner-handover-348` @ `C:\Development\Animal_Shelter_planner-handover-348` |
| Dev server | not started — documentation, a rules file and a skill file only |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-25 |
| Carries a migration? | no |
| Tested at SHA | `2963e6e4` on `6928ff8e` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — handover `348` as a delta over `339`, plus the one rule change that should not wait for a feature PR and four lessons promoted out of a document that gets replaced
- [x] Files/areas touched listed — `docs/planner-handover.md` (rewritten, 165 lines), `CLAUDE.md` (+16 lines, one bullet at the top of the hard-coded-security rule), `.claude/skills/plan-day/SKILL.md` (+65 lines across steps 2, 3, 4 and 7), this plan
- [x] Roles affected identified — none; no role reads any of these files in the app. **`CLAUDE.md` changes what future sessions are told about Admin, which is the point of the change and not a runtime effect**
- [x] Anything explicitly **out of scope** written down — the live `.plan-day.md` is gitignored and not in this PR; this round's six backlog edits went on the `backlog` branch as `CLAUDE.md` requires and are not here; **the `src/` work implementing the Admin ruling is not in this PR and does not need to be — the bypass already behaves as he ruled, so only the written rule was missing**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one file, `docs/backlog.md`), branch pushed
- [x] `node scripts/gates.mjs` ends with all four at 0. Closing lines as printed:

```
=== gates: build exited 0 after 147s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply. It was run this round only to read production's position (`0257` and `0258` pending), which the handover quotes
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema or data touched
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR. **The handover does carry the ordering constraint for `0257`/`0258`**, which belongs to the release, not to this change

## 4. Functional checks

- [ ] Happy path works end to end — n/a: three documents, no runtime behaviour. The skill and `CLAUDE.md` additions are prose read by future sessions
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
| second_in_command | nothing new | as above | n/a — no app surface |
| volunteer | nothing new | as above | n/a — no app surface |
| signed out | nothing new | as above | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders these files
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changes in this PR. **`CLAUDE.md` now describes the existing Admin bypass; it does not create or widen it**

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: internal planning and rules documents, no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought only `docs/backlog.md`, and all four gates passed afterwards at `2963e6e4`
- [x] **The skill still reads correctly around all four insertions, and its CRLF line endings survived** — the amendment script normalises to LF, edits, then writes CRLF back, and reported `CRLF preserved: true`. This is the trap the skill documents about itself, and it bit twice before being written down. Two anchors failed on the first run because em dashes had been typed as hyphens; the script's guard caught both and wrote nothing, which is why the guard exists
- [x] **`CLAUDE.md`'s rule section still reads as one argument** — the new bullet sits above *"Forbidden:"* and is framed as the **scope** of the rule rather than an exception to it, so the *"zero exceptions"* line below it remains literally true and nothing else in the section needed changing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item; the handover fires from the skill's own counter. This round's backlog work (six commits: the merge-union resolution, the `site_content` gap, the harness hold, the Admin ruling, the two card reviews, and the Director-on-Admin record) all went on the `backlog` branch, which is where `CLAUDE.md` requires it
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice in this PR. **The durable rules this round produced were promoted into `CLAUDE.md` and the skill**, which is what step 8 asks for and is the whole point of the change
- [x] `README.md` still accurate — it does not list the handover documents
- [ ] **Release notes.** — n/a: a planning document, a rules file and a skill; no shelter user can see any of them, and nothing in `src/` changed
- [x] Commit messages say why, not just what
- [x] **Every claim in the handover was measured at writing time, not reasoned.** This matters in this edition because its defining finding is the planner having repeatedly done the opposite. Re-read for this write-up: `git log`, `gh pr list --state all`, `worktree.mjs list`, `apply-migrations.mjs --status --env production`, `check-backlog-sections.mjs`, `check-hard-coded-security.mjs` (all ten counts), `check-card-grants.mjs`, `check-production.mjs role-cells role-cards role-cards-coverage`, and `get_usage`/`get_session` per session with `context.session` checked against the id passed. The two code claims it corrects — that `canOpen` tests `route.scope` before the activity test, and that `has_permission()` bypasses on `r.key = 'admin'` — were read from `routes.ts:481` and `0196_multi_role_logins.sql:137` rather than inferred
- [x] **The figures this edition retracts are named as retracted, not quietly dropped** — the "45 page rules need new cards" framing, "32 pages no card opens" and the follow-up "10", each with why it was wrong. A superseded number that is deleted rather than marked gets re-derived by the next reader

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys; `docs/` and `.claude/` are not part of the build output
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys

### On the deployed build

- [ ] Deployed to test — n/a: nothing to deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no app change
- [ ] **Timezone-sensitive behaviour proved** — n/a: no time logic
- [ ] **Boundary or banding change covered at both edges** — n/a: no code. The token bands discussed are prose guidance, not a computed threshold
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

- [ ] Rollback position stated — n/a: reverting the PR restores edition `339`, removes the four skill paragraphs and removes the Admin bullet from `CLAUDE.md`. Nothing runtime to roll back. **Note for whoever reverts: Lutan's Admin ruling would then live only on the backlog item, which is the condition that made him repeat himself four times**

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover is **165 lines** against the skill's ~150 target. The skill's own guidance is that a little over is fine, that a trimming pass is the most expensive place to spend the budget the target protects, and that accuracy is never traded for the count | accepted — shipped at 165 without opening a reword pass, as the skill directs |
| 2 | low | `CLAUDE.md`'s *"Why it matters"* bullet still describes `cardTile()` as re-checking a card against access the card itself applied. **That half was removed by #915**; only the page-rule veto remains | accepted — left for `claude/remove-hidden-security-invisible-failures`, which is deleting that line and owns the file's accuracy there. Correcting it here would conflict with that PR for no gain |

## Left for manual verification

Nothing has a screen. The four skill paragraphs and the `CLAUDE.md` bullet are
proven only when a future session reads them and acts correctly — which is that
session's job, and the handover records what to watch.

| # | What to check | Where |
|---|---|---|
| — | none | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-25

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planning document, a rules bullet and four skill paragraphs, with nothing on a screen for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file rather than pasting it
- [ ] Handed to the production release manager — n/a: nothing in this PR deploys

Result: pass with accepted defects

Release manager acknowledgement: n/a: nothing in this PR deploys
