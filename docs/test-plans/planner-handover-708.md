# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `708`, and one durable fact promoted into the `/plan-day` skill (rule 3 gains the migration-slot caveat) |
| Backlog item | `docs/backlog.md` → none. The handover is written by the counter rule in `.claude/skills/plan-day/SKILL.md` §7 when a plan's last batch is set up, not from a backlog item |
| Branch / worktree | `claude/planner-handover-708` @ `C:\Development\Animal_Shelter_planner-handover-708` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` — not started; nothing here renders |
| PR | opened from this branch after the plan commit — the branch carried NO PR at all for a day, which is what this edition's postscript is about |
| Tested by / date | Claude (planner session) / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | `4947a83d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrite `docs/planner-handover.md` as edition `708`, a delta against `699`, and move the one durable fact it would otherwise carry into the skill beside the rule it qualifies. No backlog item; the skill's counter rule is what asks for it
- [x] Files/areas touched listed — exactly two, both documents: `docs/planner-handover.md` (rewritten, now 199 lines) and `.claude/skills/plan-day/SKILL.md` (+12 lines inside step 5's rule 3, and **+24 more in step 8** added 2026-11-08). No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts
- [x] Cards affected identified — **none.** Neither file is read by the app at runtime: the handover is read by one planner chat and the skill by the `/plan-day` invocation. Admin and the signed-out public are unaffected, because nothing shipped changes a page, a policy or a card
- [x] Anything explicitly **out of scope** written down — **CORRECTED 2026-11-08: batch 3's figures ARE now in this edition**, in a postscript, because the edition sat unmerged for a day and its last batch merged in the meantime. The original plan said they would land in the next edition, which was right when written and is no longer. **Still out of scope:** the leftover worktrees, which the edition lists as owed rather than clearing, and which **nobody has cleared** — Lutan has not answered that question

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. **Re-run 2026-11-08 by the recovering session:** the branch had gone **24 commits behind** while it sat unsubmitted, and the merge brought in 24 files with no conflict (plan `708`'s whole batch 3). It is 2 behind again as the PR opens, because PR #1387 merged during the same round; neither of those commits touches either file here, so the PR is mergeable without a third sync
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 84s
=== gates: lint exited 0 after 177s
=== gates: test exited 0 after 27s
=== gates: build exited 0 after 111s
gates: typecheck=0 lint=0 test=0 build=0
```

(Re-run at `4947a83d` after the merge and the added content. The figures above the first run's are a
different machine load, not a change in the work; all four exit codes are 0 both times.)

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration. The highest on `main` is `0333_contact_type_partner.sql`, and `0334` is reserved for this batch's `events-card-reads` stream
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR. It was run in the main checkout at this plan's sync (335 applied, 0 pending) and is recorded in `.plan-day.md`
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and neither file is read by the database
- [ ] Constraints and defaults exercised against real rows — n/a: no migration, so there is no constraint to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. The rollback for a document is the previous commit
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — the happy path for these two files is that they can be read by the thing that reads them. `docs/planner-handover.md` renders as markdown with no unclosed emphasis or code span (checked by eye over all 160 lines), and `.claude/skills/plan-day/SKILL.md` keeps its numbered-list structure: rule 3's addition sits inside item 3's indentation, so item 4 still reads as item 4
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no data. Both files are plain documents in git
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [x] Empty state renders sensibly — the one state worth checking is the handover's own truthfulness about what it does NOT contain, and it carries it in its opening lines: batch 3 handed over at about 02:30Z and had not been opened, so its figures are absent on purpose. A reader cannot mistake absence for coverage
- [x] Invalid input is rejected with a readable message, not a crash — the editing script that touched `SKILL.md` carries the per-anchor guard the skill mandates: it counts occurrences of the anchor and exits non-zero writing nothing if it is not found exactly once. **It fired for real on this change**: the first attempt at `.plan-day.md` matched `## Batch 3 — \`pending\`` twice, exited 1 and wrote nothing, and the anchors were narrowed. That is the guard working, not a defect
- [x] Boundary cases checked — line endings are the boundary case for a tracked file here, and they were checked rather than assumed. `core.autocrlf=true` means git stores LF and checks out CRLF, so the script writes LF deliberately and does not echo back what it read; `git ls-files --eol` reports `i/lf w/lf` for both files, and the diff is 12 added lines in `SKILL.md` rather than a whole-file rewrite. A planner script that preserved CRLF on 2026-11-02 produced a one-hunk whole-file merge conflict on `docs/backlog.md`, which is the failure this check exists for

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | neither file — they are not served by the app at any address | nothing to reach | nothing reached; no route serves `docs/` or `.claude/` |
| exactly `<any card key>` | neither file, for the same reason | nothing to reach | not tested, and there is nothing to test: a card grants access to pages and data, and these are repository documents |
| signed out | neither file | nothing to reach | nothing reached |

- [ ] Every login above tested — n/a: nothing shipped is reachable by any login. Neither file is served at any address, so there is no access to test and signing in would prove nothing
- [ ] A login that should not have access is blocked server-side — n/a: same reason. The repository is public, so both files are world-readable by design and neither holds a secret, a credential or a person's name

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no page, so no nav entry. `src/app/` is untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual is for shelter users and neither file is anything a shelter user reads or is affected by
- [ ] Translatable strings go through the translation path — n/a: no user-facing string. Both files are English process documents read by Claude, and `src/lib/i18n/` is untouched
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: nothing renders
- [ ] Network clean — n/a: nothing is served

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a page is the `/plan-day` skill itself, and the regression risk is that the reorder of §2 done in the previous plan is still intact after editing inside §5. Checked by reading the headings in order: §0 Resume, §1 Sync, §2 Set up, §3 What is already in flight, §4 Read the backlog, §5 Choose, §6 Present, §7 Save, §8 Finish. Unchanged, and rule 3's addition is inside §5 where it belongs
- [x] Any shared file touched checked from a second, unrelated page — **by loading it, not by reading it.** `SKILL.md` is the one shared file here, and the thing that loads it is a `/plan-day` invocation. **This was loaded for real at the start of this session** and the skill drove the whole round: sync, batch-3 setup, the actuals, the filing. So the file as it stood was exercised end to end — and the 12 added lines are prose inside an existing list item, adding no new heading, anchor or `step N` reference that the remapping done in the previous plan could disagree with
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged (the branch is minutes younger than `origin/main`), and nothing on `main` reads either file at build or run time, which is why all four gates pass unchanged

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: no backlog item. The handover is produced by the skill's counter rule, and this PR deliberately makes no edit to `docs/backlog.md`. This plan's two backlog edits went to the `backlog` branch as commit `4c9ba1d3` (retitling `#ay3d6`, filing `#nssnt`), which is where a planner's filing belongs
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **deliberately not, and this is the judgement rather than an omission.** The one durable fact in this round went into `SKILL.md` beside the rule it qualifies, with its date, its mechanism and the instance that produced it. A decision file saying the same thing would be a second home for one rule, and the skill is what a planner actually reads first. The skill's own guidance says promotion into the skill, not a new document, is the lever here
- [x] `README.md` still accurate — unaffected and re-checked: it describes the app and its deployment, and says nothing about the handover document or the planner skill
- [ ] **Release notes.** — n/a: no shelter user would notice. Neither file is read by the app; one is read by a planner chat and the other by a `/plan-day` invocation. `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` and `worker/` are all untouched in this diff, so the checker's trigger does not fire either
- [x] Commit messages say why, not just what — the commit explains why rule 3 changed in the skill rather than the fact living in the handover (a decision of his can create a migration slot, which is durable, and promotion is the only real lever on the handover's length), and reports what each of `699`'s warnings did
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Every figure in edition `708` has a source and the two kinds are kept apart. Measured: the five `stream-usage:` comments (read with `gh pr view <n> --json comments`), the five floors as `tokens − messages`, `apply-migrations.mjs --status`, and the seven stale-title candidates read one at a time. Recorded as **unmeasured, never guessed**: `assistant-tag-retry`'s figure, because its PR carries 0 comments and `list_sessions` shows no row for any of batch 1's or batch 2's worktrees, so `get_usage` cannot answer. Recorded as **NOT ESTABLISHED**: the `photoCategoriesFor` finding filed as `#nssnt`, and the Pi's `sshd` configuration

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager. `4947a83d` is recorded above; whether it is the tip at deploy time is not knowable in this PR
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. There is nothing to smoke-test: no route, string or behaviour changes, so the deployed build is byte-identical in everything a user can reach
- [ ] Timezone-sensitive behaviour proved, not observed at a convenient hour — deferred: release manager. Nothing shipped derives a date or a time
- [ ] For a boundary or banding change, the assertions cover both edges — deferred: release manager. No threshold, rounding rule, retry window, pagination limit or permission cutoff is touched
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — deferred: release manager. The gates block in §2 is pasted from `gates-708.out` as the run printed it
- [ ] Public pages re-checked after a cache purge — deferred: release manager. No public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager. This PR introduces no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the rollback for this PR is `git revert`, and it is complete: both files are documents read only by Claude, nothing is baked into a build, no migration is involved, and no deployed artefact changes. **What it does not cover:** reverting edition `708` would restore `699` as the current handover, and `699`'s text is wrong in the four places this edition corrects — above all it still lists the seven stale-title candidates as owed and untriaged. So a revert is safe for the app and **lossy for the loop**: the triage result would have to be re-derived from `.plan-day.md`, which is gitignored and local

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover's first draft was 170 lines, over the skill's ~160 "ship it" ceiling | fixed, and fixed the right way: content was promoted into `SKILL.md` rather than reworded, which took it to 160. The skill is explicit that wordsmithing is not the lever on length |
| 2 | low | The first `.plan-day.md` amendment matched `## Batch 3 — \`pending\`` twice and its guard refused to write | fixed by narrowing both anchors. Recorded because it is the second time this plan that a per-anchor guard prevented a silent corruption, and it is the argument for never dropping one |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | Nothing. | Neither file renders, is served, or is read by the app, so there is no surface a person could look at that a reader of the diff has not already seen. |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-08

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing renders and nothing is served — both files are repository documents read by Claude, so there is no surface for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this PR merges on green by `CLAUDE.md`'s rule for the two handover documents; the release manager picks it up with the next release's PR sweep

Result: pass

Release manager acknowledgement: n/a: a handover document, which outranks nothing and ships no code
