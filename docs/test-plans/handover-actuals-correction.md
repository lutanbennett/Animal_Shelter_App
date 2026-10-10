# Feature test plan — handover-actuals-correction

## Header

| | |
|---|---|
| Feature | Correct the token-actuals capture rule in `docs/planner-handover.md`: the figure is lost to an **archived** session as much as a closed one, so it must be read the moment a PR merges rather than at the next `/plan-day` |
| Backlog item | none — a correction to the planner's own handover, found minutes after #514 merged |
| Branch / worktree | `claude/handover-actuals-correction` @ `C:\Development\Animal_Shelter_handover-actuals-correction` |
| Dev server | not started — this PR edits one document |
| PR | opened from this branch |
| Tested by / date | Claude (daily planner session) / 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `277833d5` (`main` tip when the worktree was created) + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — two paragraphs of `docs/planner-handover.md` corrected: the loop summary and the opening of *Token estimates*. Lutan asked for this as a follow-up PR in chat
- [x] Files/areas touched listed — `docs/planner-handover.md`, `docs/test-plans/handover-actuals-correction.md`. No code, no schema, no configuration
- [x] Roles affected identified — none. No role reads this file in the app
- [x] Anything explicitly **out of scope** written down — the rest of the handover is untouched, including the two band figures that disagree with the skill; and **`.claude/skills/plan-day/SKILL.md` is again not touched**, even though its step 2 carries the same wrong assumption ("whose session is still running"). Changing the rules is Lutan's. See *Defects found* #2

**Why this is a PR and not a `.plan-day.md` note.** The correction is already in
`.plan-day.md`, but the handover is what a **fresh planning chat reads first**, and
`.plan-day.md` explicitly tells that reader not to read most of it. A wrong rule left in
the handover would cost the next planner figures the same way it just cost this session
two.

**Risk if this is wrong is bounded**: the change narrows a claim about a tool's behaviour.
If it over-corrects, the cost is a planner calling `get_usage` slightly more often than
needed — which is the safe direction, since the call is cheap and the figure is
unrecoverable.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing, and `HEAD` equalled `origin/main` at `277833d5`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run in this worktree; ticked on the script's own exit code. Closing lines pasted below under *Evidence*
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script directly rather than through a pipe
- [x] **Every claim added to the file was measured, not recalled** — `get_usage` returned `status: "unavailable"` with its note for both archived sessions (quoted verbatim in the file); both sessions read `isArchived: true` in `list_sessions` with `include_archived: true`; `auto_archive_on_pr_close` **Off** and `auto_archive_inactive_days` **Never** read from `ccd_settings`; #513 and #515 confirmed `MERGED` with `gh pr list`
- [x] **The counts were recomputed, not adjusted by feel** — 39 measured stands (nothing new was measured); lost goes 5 → 7, being the two named streams

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `apply-migrations.mjs --status` reviewed before applying — n/a: this PR applies nothing. Dev's position was read earlier in the session (`176 applied, 0 pending`) and `0177` has since merged with #513; this PR makes no claim about either
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: nothing to apply, and this PR makes no production claim

## 4. Functional checks

- [ ] Happy path works end to end — n/a: one document, with no runtime behaviour
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in the app | `docs/` is not served | n/a — no app surface |
| management | nothing in the app | `docs/` is not served | n/a — no app surface |
| staff | nothing in the app | `docs/` is not served | n/a — no app surface (role retired by `0173`) |
| doctor | nothing in the app | `docs/` is not served | n/a — no app surface |
| volunteer | nothing in the app | `docs/` is not served | n/a — no app surface |
| signed out | nothing in the app | `docs/` is not served | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders this file
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; an internal process document with no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a in substance; checked in form: the file is Markdown nothing imports, and both edited passages were re-read after the edit. The surrounding structure is intact — the *Token estimates* landmark table, the schema-PR paragraph, the ~130k floor paragraph and the discovery paragraph all still follow the corrected opening, and the loop paragraph still reads as one sentence
- [x] Any shared file touched checked from a second, unrelated place — `.claude/skills/plan-day/SKILL.md` reads this file by name in step 0 and rewrites it in step 8; the filename is unchanged, so both still resolve. **The skill's step 2 was read and deliberately left alone** — it says to capture actuals for a stream "whose session is still running", which carries the same wrong assumption this PR corrects. That is defect #2
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` at `277833d5`
- [x] **CRLF preserved.** `git` checks this file out with CRLF, so a naive LF-matching edit silently matched nothing. The script detects and restores the original line endings, and `git diff --stat` reports **25 insertions, 4 deletions** rather than rewriting all 335 lines — which is the check that it worked

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: correcting the planner's handover is a planning step, not a backlog item, and nothing in the backlog describes an outcome this PR closes
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no design choice. The reasoning is in the corrected passage itself, which is where a planner will meet it; `2026-10-10-schema-pr-band-is-150k-and-cost-tracks-discovery.md` (merged in #514) remains the permanent record of the measurements
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a file in `docs/`. `unreleased` is untouched by this PR
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see §2. The one inference rather than measurement is named as such in the file: that archiving is *why* each figure was lost. Both sessions were archived and both returned `unavailable`, and the tool's note gives archiving as a sufficient cause; it was not separately proved that they would have answered a minute earlier

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: a document; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime date derivation. The dates in the file are calendar dates of events
- [ ] **Boundary or banding change** — n/a: no threshold is changed. The two band figures are untouched by this PR, and no code reads them in any case
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates output below, and the `get_usage` note quoted in the file itself. **This line was first filled in with `299s` before the gates had been run** — a plausible number in the box reserved for a measurement, which is the exact failure this check exists to catch. It was replaced with the run's own closing lines, below, and the slip is recorded as defect #4 rather than quietly corrected

```
=== gates: build exited 0 after 294s

gates: typecheck=0 lint=0 build=0
```

- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: this PR changes no public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy follows this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit, which restores the wrong rule rather than removing a right one. The restored text would tell the next planner that an idle session reads fine and only a closed one loses the figure, which is what cost two figures today. If this correction is itself wrong the fix is to correct it further, not to revert. Nothing else is affected: no schema, no deploy, no runtime

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | **medium** | The rule this PR corrects was written into `docs/planner-handover.md` and merged as #514, and cost two token actuals (#513, #515) within minutes | **fixed here.** Both figures are recorded as `unmeasured` rather than estimated, in `.plan-day.md` and in the corrected count (5 → 7 lost) |
| 2 | low | `.claude/skills/plan-day/SKILL.md` step 2 carries the same wrong assumption — it says to capture actuals for a stream "whose session is still running" | **not fixed, deliberately.** The skill is the rules and changing it is Lutan's call, the same position #514 took on the token bands. Listed in *Left for manual verification*, and the handover now contradicts it in a third place |
| 3 | low | A naive LF-matching edit silently matched nothing, because git checks this file out as CRLF | **fixed in the edit script**, which detects and restores the original line endings. Worth recording because the failure mode is silence: the script would have reported success having changed nothing |
| 4 | **medium** | §8's *evidence is the tool's actual output* line was filled in with `build exited 0 after 299s` **before the gates were run**. The real figure is `294s` | **fixed before any commit**, so nothing wrong reached the branch. Recorded rather than quietly swapped, because the whole point of that line is that a plausible number is not a measurement — and it was invented in the plan for a PR about not trusting unverified claims. The lesson is narrow and worth keeping: **do not pre-fill an evidence block with the shape of the answer**; leave it empty until the command has exited |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether `.claude/skills/plan-day/SKILL.md` step 2 should change too** — it still says to capture actuals for a stream "whose session is still running", which is the assumption this PR corrects. Lutan's call, as the skill is the rules. This is now the third place the skill and the handover disagree, after the two token bands from #514 | `.claude/skills/plan-day/SKILL.md`, step 2, against `docs/planner-handover.md`, *Token estimates* |
| 2 | That the corrected passage reads clearly to a planner starting cold — it is the rule that decides whether a measurement survives | `docs/planner-handover.md`, *Token estimates*, first three paragraphs |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (daily planner session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items, both Lutan's. One is a decision about the skill file; one is a read of two paragraphs

Manual verification by: pending: Lutan deciding whether the skill's step 2 changes too, and reading the corrected passage

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it
- [x] Handed to the next planner — that is what the file is

Result: pass with accepted defects
