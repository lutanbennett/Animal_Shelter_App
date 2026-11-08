# Feature test plan

## Header

| | |
|---|---|
| Feature | `plan-day-trim` — cut `.claude/skills/plan-day/SKILL.md` from 2,176 lines to 331, moving the rest into two sibling files |
| Backlog item | `docs/backlog.md` → none; Lutan asked for this directly in chat on 2026-11-08 |
| Branch / worktree | `claude/plan-day-trim` @ `C:\Development\Animal_Shelter_plan-day-trim` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` (not started; no runtime surface) |
| PR | #1396 |
| Tested by / date | Claude Opus 5 / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | `6a3648f7` — the commit the gates ran against. The only commit after it, `4d19a463`, adds two markdown files under `docs/` (this plan and the decision file), which no gate reads |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `SKILL.md` keeps only what changes what a planner does and opens with "the list comes first"; the brief blocks and the incident evidence move to `brief-blocks.md` and `reference.md`. There is no backlog item: it matches what Lutan asked in chat, *"Yes cut down the skill and then we can build back in if needed later"*
- [x] Files/areas touched listed — `.claude/skills/plan-day/SKILL.md` (2,176 → 331 lines), new `.claude/skills/plan-day/brief-blocks.md` (290), new `.claude/skills/plan-day/reference.md` (421), new `docs/decisions/2026-11-08-plan-day-skill-cut.md`. **No `src/`, no `worker/`, no `scripts/`, no `supabase/`, no dictionaries.**
- [x] Cards affected identified — **none.** No card, activity, policy or permission is read, written or described by this change; it alters instructions Claude reads, not access. Admin and the signed-out public are unaffected, as is every card-holding login
- [x] Anything explicitly **out of scope** written down — `CLAUDE.md` is untouched (it carries the workstream, merge-train, migration, testing and card rules, and this change only cites it); the other two skills are untouched; no stream brief already on disk was rewritten, so the three live batch-2 briefs still carry the blocks as assembled before this change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (it reported `Already up to date.`, then pushed the branch)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every `<N>` is `0`. Run in the background with output redirected to a file, then read from that file:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 66s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 185s
=== gates: test — npm test
=== gates: test exited 0 after 34s
=== gates: build — npm run build
=== gates: build exited 0 after 176s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no code reads any table differently
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; the rollback is a git revert
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a skill file has no runtime surface; it is instructions read by Claude when `/plan-day` is invoked. What stands in for a happy path is section 6's content check
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

n/a: this change reads and writes nothing, opens no page, and grants nothing. No login's access
changes, so there is no row to fill. Stated rather than left blank so it is clear the matrix was
considered and found inapplicable, not skipped.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a — no access surface | n/a | n/a | n/a |

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no route and no nav entry
- [ ] Manual updated and the topic reads correctly at `/manual` — n/a: the user manual documents the app for shelter staff; this file is Claude's own instructions and has no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string; nothing here is shown to anyone in the app
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: nothing renders
- [ ] Network clean — n/a: no requests

## 6. Regression

- [x] The pages nearest the change still work — the nearest things are the skill's own machinery, and all three were checked: the **YAML frontmatter** is byte-for-byte what `git show HEAD:…` prints (`name: plan-day` plus the unchanged `description`), which is what makes the skill discoverable at all; `brief-blocks.md` holds **all nine** verbatim blocks, in brief order, asserted by the generating script's own guards on the test-plan and finish-line blocks; and `reference.md` and `SKILL.md` cross-reference each other by filename with no broken pointer
- [x] Any shared file touched checked from a second, unrelated place — the three live batch-2 briefs (`suppliers-app`, `guard-release-asserts`, `reel-tag-admin-pass`) were **assembled before this change** from the old `SKILL.md`, so they are unaffected and still carry the full blocks; confirmed by their line counts being unchanged (363 / 321 / 321). The two sibling skills (`clean-streams`, `upload-blood-work`) share nothing with this file and were not edited
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported `Already up to date.`, so nothing came in to break, and the four gates passed afterwards on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: there is no backlog item. Lutan asked for this in chat and the work was done in the same session, so there was nothing filed to tick. No other open item describes this outcome: checked by grepping the open items for `plan-day`, `SKILL.md` and `planner`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-08-plan-day-skill-cut.md`, which records why reordering the file in 2026-11-07 did not fix the fault, the criterion used to decide what stayed, and **the risk this change takes** (a rule in `reference.md` will be followed less often than one in `SKILL.md`) with what to watch for
- [x] `README.md` still accurate — unaffected; it does not describe the skills
- [ ] **Release notes.** — n/a: no shelter user can see this. It changes instructions Claude reads when planning the day; no page, string, route or behaviour in the app changes. (This PR also touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`.)
- [x] Commit messages say why, not just what — the commit records his three questions, the 2,176-vs-178-and-228 size comparison that is the actual diagnosis, and that the 2026-11-07 reordering was tried and did not work
- [x] **Claims in commit messages and decision files were measured, not reasoned** — the line counts are `wc -l` output (2,176 before; 331 / 290 / 421 after), the sibling sizes are `wc -l` on those files, the frontmatter is a byte comparison against `git show`, and the survival of his decisions was checked by grepping for his own quoted words across all three files rather than by reasoning that nothing important had been dropped. **One such check failed and was investigated rather than waved through:** "Keep recommending low" reported missing, and proved to be the backticks in `` `low` ``

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys. A skill file is not part of the app bundle, the Worker, or the Pi build
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys
- [ ] Deployed to test — n/a: nothing deploys
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployed surface to smoke-test
- [ ] Timezone-sensitive behaviour proved — n/a: no date or time logic
- [ ] Boundary or banding change assertions — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff changes. (The band *table* is reproduced in `SKILL.md`, but no code reads it — it is advice to a planner)
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: this is a deploy-time gate and nothing deploys. Section 2's gates block is this run's own closing lines, pasted unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: nothing deploys
- [ ] `strip-baked-env` seen in the deploy output — n/a: nothing deploys
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var
- [ ] Migration ordering — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated, including what it does not cover — n/a: nothing deploys, so there is no deployed build to roll back. For completeness, the rollback is `git revert` of this commit, which restores the 2,176-line file exactly; it needs no deploy, no Pi rebuild and no down-migration, and it reaches a new planner session as soon as it is on `main`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | The first write of `SKILL.md` **dropped the YAML frontmatter**, which carries `name` and `description` and is what makes the skill discoverable. The harness strips frontmatter when it injects a skill, so it was never visible in the file as read — a skill without it would simply stop being offered | fixed — restored byte-for-byte from `git show HEAD:…` before any commit, and re-checked in section 6 |
| 2 | — | A content-preservation grep reported "Keep recommending low" as missing from all three files | **not a defect** — the check's own false positive: the text reads `` `low` `` with backticks, and `SKILL.md:33` carries the rule. Recorded because the check firing at all is what makes the other twelve results trustworthy, and because it was investigated rather than waved through |

## Sign-off

### Automated checks

Covers the four gates, the content-preservation greps, the frontmatter byte comparison and the
block-count assertions — all scripted and repeatable.

Automated checks by: Claude Opus 5  Date: 2026-11-08

### Manual verification

Nothing in **Left for manual verification** needs a person before merge: this change has no screen, no
string and no deployed surface. The one thing a person could judge — whether the cut file is now too
thin — is a judgement Lutan asked for and will form by using it, and the decision file says what to
watch for.

Manual verification by: n/a: no UI surface, no deployed surface, and no shelter-visible behaviour; the only judgement available is whether the file reads too thin, which is answered by using it

Result: pass

## Left for manual verification

| What | Who | Why it could not be verified here |
|---|---|---|
| Whether `SKILL.md` is now too thin in practice — a rule that moved to `reference.md` being followed less often than one that stayed | the next `/plan-day` planner | It can only be answered by running a planning round against the cut file. The decision file names it as the risk this change takes and asks the next planner to report either way |
