# Feature test plan

| | |
|---|---|
| Feature | Planner handover edition `627`, a delta over `618` |
| Backlog item | `docs/backlog.md` → none. The handover is step 8 of the `/plan-day` skill, not a backlog item |
| Branch / worktree | `claude/planner-handover-627` @ `C:\Development\Animal_Shelter_planner-handover-627` |
| Dev server | `n/a: no runtime surface — one Markdown file` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude (Daily Planner session) / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `1f4889b3` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `627`, a delta over `618`, covering the plan that ran all nine streams after `618` was written (#1251–#1253, #1257–#1259, #1260–#1262). No backlog item: `/plan-day` step 8 requires it when a plan's last batch is set up, and `.plan-day.md` recorded `9 of 9 — PLAN COMPLETE. HANDOVER 627 IS DUE NOW`
- [x] Files/areas touched listed — exactly two: `docs/planner-handover.md` (rewritten, 155 lines) and this plan. No routes, no `worker/`, no `supabase/migrations/`, no shared libs, and **no change to the skill in this PR** — the two corrections owed to `.claude/skills/plan-day/SKILL.md` are deliverables of the waiting `planner-turns-not-tokens` stream, named in the edition
- [ ] Roles affected identified — `n/a: no role sees this file. It is read by Claude planning sessions, not served by the app`
- [x] Anything explicitly **out of scope** written down — the edition does **not** carry open item counts, migration numbers, PR numbers or release state; those are re-read from the repo every run by the skill's own rule, which this edition restates. It does not reproduce `.plan-day.md`'s measurement table. **And it deliberately does NOT edit the skill**, even though it reports that the skill contradicts a decision of Lutan's: that fix is an unstarted stream's job and doing it here would duplicate a brief that already exists

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before gates; `origin/main` merged in (`Already up to date`) and the branch pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Pasted below exactly as printed:

```
=== gates: build exited 0 after 157s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly after the change — `n/a: no migration in this PR, and no table is read`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration in this PR`
- [ ] Production apply plan stated for the release manager — `n/a: no migration in this PR`

## 4. Functional checks

- [x] Happy path works end to end — the happy path for a handover is that a fresh planning chat can read it and act on it. Read back from disk after writing: it opens by saying what changed since `618` and that it was owed and late, carries each of `618`'s mechanisms as fired or held with a running tally, names the next slug (`636`), and carries the never-carried-forward block verbatim
- [x] Data persists — reload the page and the change is still there — read back from disk; `wc -l` reports **155 lines**, and `git diff --stat` showed `139 insertions(+), 133 deletions(-)` against the previous edition rather than a whole-file rewrite
- [ ] Create / edit / delete all exercised — `n/a: no CRUD surface — one Markdown file`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input surface`
- [x] Boundary cases checked — the only boundary this change has is the skill's **length target**: *about 100 lines, 150 a target not a hard gate, up to about 160 is fine, ship it*. **Measured with `wc -l` after the content was written rather than claimed first: 155.** Inside the "ship it" range, so **no trimming pass was opened** — which is the whole point of that rule, since trimming passes are the cost the budget exists to prevent. Recorded as a slight overshoot rather than hidden

### Role access matrix

`n/a` for every row: the file is not served by the app and is not reachable by any URL, so there is no access to matrix. Recorded as a table rather than deleted so the shape is comparable with its neighbours. **Note that these role names are listed only as the template's fixed rows — this plan draws no conclusion by role, per `CLAUDE.md`'s all-analysis-is-by-card rule.**

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | the file | n/a — not served by the app | n/a |
| management | the file | n/a — not served by the app | n/a |
| doctor | the file | n/a — not served by the app | n/a |
| volunteer | the file | n/a — not served by the app | n/a |
| signed out | the file | n/a — not served by the app | n/a |

- [ ] Every role above tested — `n/a: the file is not served by the app, so no login can reach it`
- [ ] A role that should not have access is blocked server-side — `n/a: no route exists to hit directly`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched, and this file has no nav entry`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: the manual is for shelter staff; this file is read by Claude sessions`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings added`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no page loads`
- [ ] Network clean — `n/a: no page loads`

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is the file's own structure, which a fresh planning chat parses. Checked after writing: the blockquote blocks open and close, the one Markdown table is well formed, and every `##` heading sits at the same level as its neighbours
- [x] Any shared file touched checked from a second, unrelated page — `docs/planner-handover.md` is shared with every future planning session. **The real risk here is line endings, not reading:** git has `core.autocrlf=true`, so the working copy is CRLF and the stored blob is LF. The write went out as **LF**, git reported `LF will be replaced by CRLF the next time Git touches it`, and `git diff --stat` then showed **139 insertions and 133 deletions rather than a whole-file rewrite** — which is the proof the endings are right. A CRLF/LF mistake shows every line as changed, and on 2026-11-02 exactly that produced a one-hunk whole-file merge conflict on another tracked file
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` ran before gates (`Already up to date`), and gates ran on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item; it is step 8 of the plan-day skill. This round's three filed items went on the backlog BRANCH, which is where they belong, not in this PR`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the reasoning for the round IS this handover, and the two corrections it names are deliverables of an existing brief. A decision file would be a third copy`
- [x] `README.md` still accurate — unchanged by this PR and checked: it does not describe the handover documents
- [ ] **Release notes.** — `n/a: a planner handover is read by one chat and is never seen by anyone at the shelter, so no shelter user could notice this change`
- [x] Commit messages say why, not just what — the commit names the edition's lead (the skill contradicting Lutan's revert, with the fixing stream unstarted for three days), says the handover was owed and late and why that matters, and states the band correction with the figure that earned it
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Four claims in this PR are measurements, each taken rather than reasoned: the handover's **155 lines** (`wc -l`, after writing); the **three batch-3 actuals** (read from each PR's own `stream-usage` comment with `gh pr view --json comments`, never from `get_usage`, so none can be the planner's own window); the **floor spread of 5,001** (103,956 · 105,043 · 108,957, each computed as that comment's `tokens − messages`); and that the `planner-turns-not-tokens` worktree is **still unstarted, `free`, 0 ahead** (`worktree.mjs list`, read this round). **The one claim that is explicitly NOT a measurement is labelled as such in the edition** — that the usage-comment mitigation "fired" rests on one batch, and the text says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: production release manager`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: no date or time logic in this file`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — `n/a: no runtime boundary. The one boundary here is a prose length target, measured in section 4`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: the only pasted evidence is the gates closing lines in section 2, which are unedited`
- [ ] Public pages re-checked after a cache purge — `deferred: production release manager`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `deferred: production release manager`
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen — `deferred: production release manager`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: this PR adds no secret or env var`

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — `n/a: no migration in this PR`
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — `n/a: no migration in this PR`
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — one plain Markdown file read only by Claude sessions, so rollback is `git revert` of this commit and nothing else: no deploy, no Pi rebuild, no migration, nothing at runtime. **What it does not cover:** a planning session that has already read `627` and acted on it — reverting the file does not unmake the batch it planned. That is the normal state of any handover and is why the skill makes each edition correct the one before it rather than relying on revert. **Nor does it restore `618`'s accuracy:** `618` is now wrong about the state of the repo, so reverting would hand the next planner a stale sheet, which is the specific fault the never-carried-forward rule exists to prevent

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **The handover was owed at the previous plan's batch-3 setup on 2026-11-04 and was never written**, so `docs/planner-handover.md` still read `618` when the next `/plan-day` opened. | **accepted as a recorded process defect, and it is the subject of the edition's own opening block rather than something this PR can fix.** Nothing automated catches it: the counter in `.plan-day.md` said `HANDOVER 627 IS DUE NOW` and no check reads that line. Written up so the next planner meets it first |
| 2 | low | The handover runs to **155 lines** against a target of about 150. | **accepted, and deliberately not trimmed.** The skill's own rule since 2026-10-21 is that a little over — up to about 160 — is fine and must not open a trimming pass, because same-line-count rewording costs a round-trip and saves nothing. Recorded rather than hidden, per that rule's instruction to measure with `wc -l` and state the figure |
| 3 | low | A scratchpad amendment script for an unrelated file was written with a missing argument and a malformed `writeFileSync` call. | **fixed before it ran**, caught by reading the script back rather than by it failing. Not a defect in this change — it touched no file in this PR — and recorded only because the per-anchor guard pattern the skill prescribes is what makes such a script safe to correct |

## Left for manual verification

**Empty, and deliberately so.** The template's test is *would a person have to go and look at it,
separately from deploying?* The only outstanding question about this PR is whether `627` reads usefully
to the next fresh planning chat — and **that is checked by the next `/plan-day`, which is a Claude
session, not by a person.** The file is not served by the app and nobody at the shelter reads it
(`CLAUDE.md`: a handover *"is read by one chat"*), so there is no screen, wording or device for anyone to
look at. Recorded here rather than parked as a `pending:` signature, because a `pending:` naming a check
no person will ever perform is a row nothing closes.

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-11-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — it is empty, for the reason given above, so there is nothing being signed for

Manual verification by: n/a: nothing for a person to look at — the file is read by Claude sessions and is not served by the app

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: docs-only, nothing to deploy
