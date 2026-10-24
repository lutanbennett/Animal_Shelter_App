# Feature test plan — `planner-handover-330`

## Header

| | |
|---|---|
| Feature | Planner handover edition `330`, and five durable facts promoted from it into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is the skill's step 8 bookkeeping, not a backlog item; it is written at nine or more workstreams since the last edition (this round: ten) |
| Branch / worktree | `claude/planner-handover-330` @ `C:\Development\Animal_Shelter_planner-handover-330` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` (not started — see §4) |
| PR | #895 |
| Tested by / date | Claude (Daily Planner) / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `7eb20c50` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *replaces `docs/planner-handover.md` with edition `330` and moves five durable facts out of it into `.claude/skills/plan-day/SKILL.md`; no backlog item, by design (see header)*
- [x] Files/areas touched listed — **exactly two files**: `docs/planner-handover.md` (rewritten) and `.claude/skills/plan-day/SKILL.md` (+48 lines, three insertion points). No `src/`, no `worker/`, no `supabase/migrations/`, no shared libs, no scripts
- [x] Roles affected identified: **none.** Neither file is read by the application at runtime. `docs/` is not served and `.claude/skills/` is tooling read by Claude sessions. No role's view of the app changes
- [x] Anything explicitly **out of scope** written down — *the handover deliberately does not restate repo-read facts (open counts, migration numbers, PR numbers, release state, candidates); those are re-read every run, per the skill's "never carried forward" rule. It also does not carry the five promoted facts, which now live in the skill*

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly *(one incoming change, `docs/backlog.md`, merged by `ort` with no conflict; branch pushed)*
- [x] `node scripts/gates.mjs` ends with its `gates:` line. Pasted exactly as printed, unedited:

```
=== gates: build exited 0 after 158s

gates: typecheck=0 lint=0 test=0 build=0
```

*(Four gates, not the three the template's wording names — `test` was added since; the line above is the script's actual output, not a tidied version of it.)*

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; this PR touches two documentation and tooling files only
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration, and no table is read by either file
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration. **Note for the release manager anyway: two migrations ARE pending on production (`0252` then `0253`), from other PRs in this release. They are listed in the handover's release-manager section; this PR adds nothing to them**

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime surface. The "happy path" is a future `/plan-day` reading the two files, which §6 covers by checking the skill still parses as the instructions it is
- [ ] Data persists — n/a: no data written; both files are static text
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message — n/a: no input path
- [ ] Boundary cases checked — n/a: no input path

### Role access matrix

n/a for every row: neither file is served by the app or reachable at any URL, so there is no role-dependent access to record. The table is left empty deliberately rather than filled with invented rows.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: file not served by the app |
| management | n/a | n/a | n/a: file not served by the app |
| staff | n/a | n/a | n/a: role retired by `0173` |
| doctor | n/a | n/a | n/a: file not served by the app |
| volunteer | n/a | n/a | n/a: file not served by the app |
| signed out | n/a | n/a | n/a: file not served by the app |

- [ ] Every role above tested — n/a: no role-reachable surface exists in this change
- [ ] A role that should not have access is blocked server-side — n/a: no route is added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no page is added
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The manual is for shelter users; a planner handover is internal process bookkeeping and has no user-facing behaviour to describe
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings added; both files are internal English documents
- [ ] Mobile viewport (375px) — n/a: nothing renders
- [ ] Browser console clean — n/a: no page loaded; no dev server was started for this change, which is why the header's dev-server row says so
- [ ] Network clean — n/a: no page loaded

## 6. Regression

- [x] The pages nearest the change still work — *no pages are near it. What is "near" this change is the `plan-day` skill itself, and that was exercised: `build` compiles the repo with `.claude/` present (`gates` green at §2), and the skill was re-read after editing to confirm the three insertions landed inside the intended sections (band table, step 3 item-reading rules, planner-touches-production rules) and did not break the surrounding bullets*
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file** — *`SKILL.md` is shared between every future `/plan-day`, and it has no "page" to load. The nearest equivalent available was done instead: the file's CRLF line endings were preserved deliberately (read, normalised to `\n` for matching, written back as `\r\n`), because the skill records that mismatched endings silently break every multi-line anchor against it. Verified the file is still CRLF after writing. **This is the weaker check of the two the template names, and it is named as weaker here rather than ticked as if it were the stronger one.*** See the defect table
- [x] Nothing merged from `main` during `sync` was broken by this branch — *the only incoming change was `docs/backlog.md`; this branch does not touch that file, so no interaction is possible. Gates ran green after the merge, not before*

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this change has no backlog item (see header). Three items WERE filed and one retitled on the `backlog` branch during this round, which is where follow-ups belong, not in this PR
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — *n/a would be wrong here: the design choice IS the change. The handover's own "Writing the next one" section and the skill's step 8 record why a fact is promoted rather than carried, and the five promotions are each annotated in the skill with the reading that produced them and the date. A separate decision file would duplicate the skill text it is explaining*
- [x] `README.md` still accurate — *checked: `README.md` does not describe the handover or the skill's internals, so nothing in it is made stale by this change*
- [ ] **Release notes.** — n/a: nobody at the shelter would notice. Neither file is read by the app; this is internal planning bookkeeping. `unreleased` correctly gained no line in this PR
- [x] Commit messages say why, not just what — *the commit explains the round's two findings and lists each promoted fact with the reason it was promoted rather than carried*
- [x] **Claims in commit messages and decisions were measured, not reasoned** — *every figure in the handover was read with `get_usage` and `get_session` while each session's process was alive, and recorded against the slug in `.plan-day.md`; the two unplanned streams are written `unmeasured` rather than estimated. The production claims were each run, not inferred: `apply-migrations.mjs --status --env production` for the two pending files and for whether `0230` was applied, and `check-diets-proportion.mjs --env production` twice, before and after Lutan's change (1 line, then 0). The one claim in the handover NOT measured end to end is flagged in the text as the item's framing rather than proven fact (that `0253` needs no Worker deploy)*

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager. Recorded as `7eb20c50`; whether it is the tip at deploy time cannot be known at PR time
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. *Nothing in this PR has a deployed surface to smoke-test; it is deferred rather than `n/a` because the deploy itself still happens and section 8 is jointly owned*
- [ ] Timezone-sensitive behaviour proved — n/a: no date, time or clock-derived logic is added or changed; both files are static prose
- [ ] Boundary or banding change covers both edges — n/a: no threshold, rounding rule, retry window, pagination limit or permission cutoff is changed. *The band numbers promoted into the skill are guidance Claude reads when estimating, not code any gate evaluates*
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — *the `gates:` block in §2 is verbatim, including the `build exited 0 after 158s` line above it and the `test=0` the template's wording does not mention*
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no secret or env var is added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration, and no code
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in THIS PR. *`0252` and `0253` are pending on production from other PRs in this release; the handover names the order and why it matters*

### Rollback

- [x] Rollback position stated, **including what it does not cover** — *`git revert` of this PR's merge restores the previous handover (`321`) and the previous skill text; both files are plain documents with no runtime effect, so no deploy, rebuild or migration is involved and nothing is left half-reverted. **What it does not cover:** a revert would also undo the five promoted facts, returning them to nowhere — they are deliberately no longer in the handover text, so reverting the skill without re-adding them to the handover would lose them. Anyone reverting should take the facts from this PR's diff*

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | First draft ran to **205 lines** against the skill's ~150 target, which its own rules call "a signal to CUT CONTENT, not to reword". Cut to **169** in two passes, both by promoting durable facts into the skill rather than wordsmithing | Fixed. 169 is still above the ~160 the skill calls "fine"; recorded here rather than bought with a third pass, because the skill is explicit that same-line-count substitution costs a round-trip and saves nothing |
| 2 | Low | §6's second line is the **weaker** of the two checks the template describes — `SKILL.md` was verified by re-reading and by confirming its line endings survived, not by "loading a page", because it has no page | Accepted, and named as weaker in the line itself rather than ticked as if the stronger check had been done |

## Left for manual verification

Empty, and that is a real answer rather than an omission: there is no surface a person would have to go and look at. Both files are internal documents with no rendered form, no role-dependent view and no deployed behaviour. The section 8 deploy-time rows are `deferred: release manager` in section 8 itself and are deliberately **not** repeated here — the template warns that duplicating them gives them a second home nothing ever closes.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner)  Date: 2026-10-24

### Manual verification

Manual verification by: n/a: nothing to look at — neither file renders, is served, nor changes any role's view of the app

Result: pass
