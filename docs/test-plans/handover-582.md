# Feature test plan — handover-582

## Header

| | |
|---|---|
| Feature | Planner handover `582`, plus the *one go for all nine streams* rule and two band findings in the plan-day skill |
| Backlog item | `docs/backlog.md` → none. The handover is the skill's own step 8 obligation, and the skill change was asked for by Lutan in chat on 2026-11-02 |
| Branch / worktree | `claude/handover-582` @ `C:\Development\Animal_Shelter_handover-582` |
| Dev server | not started — no runtime surface in this change |
| PR | see the PR this plan is committed to |
| Tested by / date | Claude (planner session)  Date: 2026-11-02 |
| Carries a migration? | no |
| Tested at SHA | `601bc2c5` — the commit carrying the handover, the skill change and the decision file. The gates ran against it; this plan is the commit after it |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three documentation files: a new handover edition, four edits to the plan-day skill, and one decision file. Lutan asked for the skill change in chat; the handover is due by the skill's own trigger.
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced), `.claude/skills/plan-day/SKILL.md` (four insertions), `docs/decisions/2026-11-02-one-go-for-all-nine-streams.md` (new), and this plan. **No `src/`, no `worker/`, no `supabase/migrations/`, no `scripts/`.**
- [ ] Roles affected identified — `n/a: no runtime surface. This change is read by Claude sessions and by Lutan, not by any signed-in login, so no card and no role sees anything different.`
- [x] Anything explicitly **out of scope** written down — the single-go rule changes **only who pulls the trigger**: not the batch sequencing, not the cap of three live worktrees, not the one `AskUserQuestion` that confirms batch 1, and not the counter or the handover trigger. The decision file says so in its own section, because "a single go for all nine" could be misread as "create nine worktrees".

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `n/a` is not available here and a tick needs a reason: the worktree was created from `origin/main` minutes before the change and `git log` confirms `main`'s tip was already its base, so there was nothing to merge in. Re-checked with `git fetch` before pushing.
- [x] `node scripts/gates.mjs` — closing lines pasted exactly as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

  Run in the background with output to a file and polled inside the turn, per the skill's own rule
  that a killed gates run proves nothing. Lint reported `70 problems (0 errors, 70 warnings)` and
  exited 0; the warnings are pre-existing and none is in a file this PR touches.

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — `n/a: no migration in this PR`
- [ ] `apply-migrations.mjs --status` reviewed — `n/a: no migration in this PR`
- [ ] `apply-migrations.mjs --dry-run` reviewed — `n/a: no migration in this PR`
- [ ] Applied to **dev** — `n/a: no migration in this PR`
- [ ] File is re-runnable — `n/a: no migration in this PR`
- [ ] Existing rows still read correctly — `n/a: no migration in this PR, and no row anywhere is read by a document`
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — `n/a: no migration in this PR`
- [ ] Down-migration written, or the reason one is not needed — `n/a: no migration in this PR`
- [ ] Production apply plan stated — `n/a: no migration in this PR. Three migrations ARE pending on production (0298, 0299, 0300) but none of them is from this branch, and they are recorded on the backlog under Deployment`

## 4. Functional checks

- [ ] Happy path works end to end — `n/a: documentation. The nearest thing to a happy path is a future planner reading the skill, which no automated check can exercise`
- [ ] Data persists — `n/a: no data is written by this change`
- [ ] Create / edit / delete exercised — `n/a: no runtime surface`
- [ ] Empty state renders sensibly — `n/a: no runtime surface`
- [ ] Invalid input rejected with a readable message — `n/a: no input`
- [ ] Boundary cases checked — `n/a: no runtime surface`

### Role access matrix

- [ ] Every role tested — `n/a: no runtime surface, so no role sees a difference. Stating this by role at all is only possible because the template asks; the project's standing rule is that analysis is by card, and no card is involved here either`
- [ ] A role that should not have access is blocked server-side — `n/a: no route, no action and no RPC is added or changed`

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; nothing in src/app/`
- [ ] Manual updated and the topic reads correctly at `/manual` — `n/a: the manual is for shelter staff, and this change is read only by Claude sessions and by Lutan`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing string added; both dictionaries untouched`
- [ ] Mobile viewport (375px) — `n/a: no rendered page`
- [ ] Browser console clean — `n/a: no rendered page`
- [ ] Network clean — `n/a: no rendered page`

## 6. Regression

- [x] The pages nearest the change still work — **by the gates rather than by loading pages**: the full `next build` in section 2 compiles every route, and this change touches no file any route imports. Pasted output above is the evidence.
- [x] Any shared file touched checked from a second, unrelated page — the only "shared" file here is the skill, and its reader is a Claude session rather than a page. **Checked the way that reader will meet it:** re-read all four inserted passages in place, confirmed each sits under the heading it belongs to (the single-go section inside step 7, the two band findings inside *Token estimates*, the audit-row confirmation inside its own table cell), and confirmed the table rows I added keep their column count so the table still renders.
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; see section 2.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: this change closes no backlog item. The handover is the skill's own obligation and the skill change came from chat; the decision file is the record instead`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-02-one-go-for-all-nine-streams.md`, which records what the rule does **not** change and marks it a hypothesis until a batch has actually started that way.
- [x] `README.md` still accurate — unchanged by this PR and re-read for anything about how batches are triggered; it says nothing about it, so nothing to correct.
- [ ] **Release notes.** — `n/a: no shelter user can see a documentation change to the planner's own process. Nothing in src/app/, src/components/, src/lib/manual/, src/lib/i18n/ or worker/ is touched`
- [x] Commit messages say why, not just what — the commit leads with Lutan's own words and the reason the second and third goes were ceremony.
- [x] **Claims in commit messages and decision files were measured, not reasoned.** The two band findings quote actual figures from `stream-usage:` comments (197,992 against 125–185k; 357,695 against 210–270k; 138,872 against 160–200k) rather than impressions. **And the one claim that is NOT measured is labelled as such in both the skill and the decision file:** that a `<side-sessions-event>` turn can start a batch is read from the carve-out's wording and **has never been exercised**, so it is written as a hypothesis with its fallback stated, not as a fact.

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: release manager`
- [ ] Deployed to test — `deferred: release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: release manager`
- [ ] Timezone-sensitive behaviour proved — `n/a: no logic of any kind is added; nothing derives a date`
- [ ] Boundary or banding change assertions cover both edges — `n/a: no boundary or banding logic. The token bands this PR edits are prose read by a planner, not code with edges to test`
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — `n/a: the only tool output in this plan is the gates block in section 2, which is pasted unedited`
- [ ] Public pages re-checked after a cache purge — `deferred: release manager`
- [ ] `deploy: production → Supabase project <ref>` line read — `deferred: release manager`
- [ ] `strip-baked-env` seen in the deploy output — `deferred: release manager`
- [ ] Any new secret/env var exists in production — `n/a: no secret or env var added`
- [ ] Both a migration and code that reads it — `n/a: no migration in this PR`
- [ ] `apply-migrations.mjs --env production --dry-run` — `n/a: no migration in this PR`
- [ ] Production backup fresh for a destructive migration — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`
- [ ] Rollback position stated, including what it does not cover — `n/a: reverting this PR removes three documentation files and four passages from a skill. Nothing deployed changes, no schema moves, and no running session is affected — a session already holding the old skill text keeps it until it next reads the file`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The planner's own amendment script initially preserved the CRLF endings it read from a fresh worktree, which is the exact cause of the whole-file `docs/backlog.md` merge conflict of 2026-11-02 for a **tracked** file. | fixed before it was run — the script now writes LF unconditionally with a comment saying why, and `git diff --stat` shows 69 insertions rather than a whole-file rewrite |
| 2 | low | **`docs/test-plan-template.md`'s section 2 quotes a THREE-gate closing line** — ``gates: typecheck=0 lint=0 build=0`` — but `scripts/gates.mjs` prints **four**, `gates: typecheck=0 lint=0 test=0 build=0`, and `CLAUDE.md` says four. A stream that pastes the template's string instead of its own run's output would record evidence that never existed, and the checker only tests that the block is not placeholder text. | **found, not fixed** — reported in this PR and filed by the planner on the `backlog` branch. Not fixed here because this PR is the planner's own paperwork and `docs/test-plan-template.md` is the authority every brief defers to; changing it deserves its own PR rather than riding along inside a handover |

## Left for manual verification

| What | Why Claude could not verify it | Who |
|---|---|---|
| That a batch can actually be started from a `<side-sessions-event>` turn, which is the whole mechanism of the single-go rule | It cannot be tested except by living through it: it needs a real batch to finish while the planner is idle. The carve-out's wording is the only evidence today, and both the skill and the decision file say so rather than claiming it works | The next planner session, on the next plan's batch 2 — and it should record which way it went in `.plan-day.md` and the next handover |

## Sign-off

Automated checks by: Claude (planner session)  Date: 2026-11-02

Manual verification by: n/a: no surface a person can look at — this PR is three documentation files and four passages of a skill. The one unverifiable claim in it is listed above as Left for manual verification rather than signed for.

Result: pass
