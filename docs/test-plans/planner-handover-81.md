# Feature test plan — planner-handover-81

## Header

| | |
|---|---|
| Feature | Rewrite `docs/planner-handover.md` for whoever runs `/plan-day` next, at the nine-workstream mark (batches 79, 80, 81) |
| Backlog item | none — the handover is rewritten every nine workstreams by the planner, the way the release manager rewrites `docs/release-handover.md` each release |
| Branch / worktree | `claude/planner-handover-81` @ `C:\Development\Animal_Shelter_planner-handover-81` |
| Dev server | not started — this PR rewrites a document |
| PR | opened from this branch |
| Tested by / date | Claude (daily planner session) / 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `dfd28758` (`main` tip when the worktree was created) + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — one file replaced in full: the 2026-10-08 handover (written during batch 78) becomes the 2026-10-09 one, written after batch 81
- [x] Files/areas touched listed — `docs/planner-handover.md` only, plus this plan. No code, no schema, no configuration
- [x] Roles affected identified — none. No role reads this file in the app
- [x] Anything explicitly **out of scope** written down — the file does not restate `CLAUDE.md` or the skill, and says in its own second paragraph that both outrank it

**It replaces rather than appends**, as the file says of itself. The copy it replaces
was already wrong in its first table within a day: it named `main` at `c827c8a9`, dev
at `165`, `0166` as held and 88 open items — all four superseded by the time this
rewrite began.

**Risk if this is wrong is real but bounded:** a planner who trusts a stale handover
plans around the wrong picture, which is exactly how 2026-10-07 lost four streams.
That is why every figure below was re-read from a command at writing time, and why
the file's header tells the reader it is outranked by three other documents.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing, after an explicit `git fetch`. **Base confirmed against the remote**, which mattered here — `main` moved from `cba421a1` to `dfd28758` during the fact-gathering, as #486, #487 and #488 merged
- [ ] `node scripts/gates.mjs` — n/a: no TypeScript, no build input, no lint surface. CI runs it regardless and is the check that matters
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script directly rather than through a pipe
- [x] **Every figure in the file was measured, not recalled** — `main` from `git rev-parse`; `171 applied, 0 pending, no drift` from `apply-migrations.mjs --status`; `0172` from `ls supabase/migrations/`; 85 open items from an `awk` count above `## Completed`; open PRs from `gh pr list`; the token actuals from `get_usage` at the moment each was readable
- [x] **A figure that could not be measured is marked as such, not estimated** — production's position says *"not read from this session"* and points at `docs/release-handover.md`, because the classifier refuses production reads and that refusal is correct

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `apply-migrations.mjs --status` reviewed — not to apply anything, but because the file states dev's position: `171 applied, 0 pending`, `0 not applied here`, read at writing time rather than carried over
- [ ] `--env production --dry-run` reviewed — n/a: this PR applies nothing, and production is not readable from this session
- [x] Applied to **dev** and recorded in `schema_migrations` — n/a for this PR; checked for the file's claim, which holds
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as an action; the file deliberately states that production was **not** read here and defers to the release handover, rather than repeating a figure it could not verify

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a document, with no runtime behaviour
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing in the app | `docs/` is not served | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders this file
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; the handover is an internal process document with no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a in substance; checked in form: the file is Markdown that nothing imports, and the sections a planner navigates by are all present — *Where things stand*, *The loop*, *Three states that look like faults*, *The lesson that cost the most*, *Token estimates*, *Items whose remaining condition is a person*, *Blocked, and on whom*, *Who does what*, *Writing the next one*
- [x] Any shared file touched checked from a second, unrelated place — `docs/planner-handover.md` is read by the next planner and by nothing else, but **the skill reads it by name**: `.claude/skills/plan-day/SKILL.md` step 0 says *"In a fresh chat, read `docs/planner-handover.md` first"*, and step 8 says to rewrite it at nine. The filename is unchanged, so both still resolve. **Cross-references followed rather than assumed:** `docs/decisions/2026-10-06-director-draft-apply.md`, `docs/decisions/2026-10-08-planner-handover-counter.md` and `C:\Users\Leidos\.claude\tools\render-pdf.ps1` all exist; PRs #459, #471 and #486 are all real and merged
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: rewriting the handover is a planning step, not a backlog item, and nothing in the backlog describes an outcome this PR closes
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the reasoning for the counter and the rewrite-first rule is already `docs/decisions/2026-10-08-planner-handover-counter.md`, and this PR makes no new design decision — it is that rule being followed for the first time
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a file in `docs/`. No line was added to `unreleased`
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see §2. The one claim that is a judgement rather than a measurement, that two app-wide sweeps cannot share a batch, is stated as the planner's constraint and attributed to the batches it shaped, not presented as a rule from `CLAUDE.md`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: a document; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime date derivation. The dates in the file are calendar dates of events, not derived values
- [ ] **Boundary or banding change** — n/a: no threshold or rounding rule. The token bands are guidance for a human reader, not code
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the migration status line and the SHAs are copied from the commands' output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: this PR changes no public page

### Deploy safety

- [ ] **The working tree is clean before deploying** — n/a: no deploy follows this PR
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy follows this PR
- [ ] `strip-baked-env: removed N env var(s)` seen — n/a: no deploy follows this PR
- [ ] `Server Actions key <fingerprint>` matches the Pi build — n/a: no deploy follows this PR
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none
- [ ] **The deploy prints a release mail, and the mail arrives** — n/a: no deploy follows this PR

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, including what it does not cover — `git revert` of this commit, which restores the 2026-10-08 handover. **That is worse than having no handover**, since the restored file states `main` is at `c827c8a9`, dev at `165` and `0166` held, all false. If this file is wrong the fix is to correct it, not to revert it

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The file this PR replaces was stale in all four of its leading figures within a day of being written | **inherent to the file's purpose, not fixable.** It is why the header tells the reader three documents outrank it, and why both copies lead with a dated state table rather than prose |
| 2 | low | Production's position cannot be stated, because production reads are refused from these sessions | **recorded as unknown rather than guessed.** The file says so in the table and points at `docs/release-handover.md`, which is written by a session that can read it |
| 3 | low | Two of batch 81's three streams merged *during* the writing of this file, so its "live worktrees" row was rewritten once | **accepted.** The row names `resident-corrections-script` as still building, true at the commit; a reader is told by the header to trust `git` over this file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the handover reads usefully to a planner starting cold — it is written for a reader who has not seen this session | `docs/planner-handover.md`, start to finish |
| 2 | That the "Blocked, and on whom" list matches what Lutan believes he owes, particularly the facility-map upload and the two clinic-access decisions | `docs/planner-handover.md`, *Blocked, and on whom* |
| 3 | That the correction about the facility map is right — it asserts production never held plan rows, inferred from dev's three and a screenshot Lutan took, **not** from reading production | `docs/planner-handover.md`, *The facility map, corrected 2026-10-09* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (daily planner session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items, all Lutan's, and all are reads of the document rather than checks of behaviour

Manual verification by: pending: Lutan confirming the handover reads usefully cold, that the blocked list matches what he owes, and that the facility-map correction is right

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it
- [x] Handed to the next planner — that is what the file is

Result: pass with accepted defects
