# Feature test plan — planner-handover-84

## Header

| | |
|---|---|
| Feature | Rewrite `docs/planner-handover.md` for whoever runs `/plan-day` next, at the nine-workstream mark (batches 82, 83, 84), plus a `docs/decisions/` file recording the one token band the measurements moved |
| Backlog item | none — the handover is rewritten every nine workstreams by the planner, the way the release manager rewrites `docs/release-handover.md` each release |
| Branch / worktree | `claude/planner-handover-84` @ `C:\Development\Animal_Shelter_planner-handover-84` |
| Dev server | not started — this PR rewrites a document and adds a second |
| PR | opened from this branch |
| Tested by / date | Claude (daily planner session) / 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `3696e59d` (`main` tip when the worktree was created) + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — `docs/planner-handover.md` replaced in full (the 2026-10-09 copy written after batch 81 becomes the 2026-10-09 copy written after batch 84), plus one new `docs/decisions/` file and this plan
- [x] Files/areas touched listed — `docs/planner-handover.md`, `docs/decisions/2026-10-09-quick-win-band-is-130-190k.md`, `docs/test-plans/planner-handover-84.md`. No code, no schema, no configuration
- [x] Roles affected identified — none. No role reads either file in the app
- [x] Anything explicitly **out of scope** written down — **`.claude/skills/plan-day/SKILL.md` is deliberately not touched.** The decision file recommends a band change and states in its own words that editing the skill is Lutan's call, not a session's

**It replaces rather than appends**, as the file says of itself. The copy it replaces was
written the same day and was already wrong in four of its leading figures: `main` at
`dfd28758`, dev at `171`, `0172` free, 85 open items — all superseded by nine merged
streams.

**Risk if this is wrong is real but bounded:** a planner who trusts a stale handover plans
around the wrong picture, which is exactly how 2026-10-07 lost four streams. That is why
every figure below was re-read from a command at writing time, and why the file's header
tells the reader it is outranked by three other documents.

**One new risk this copy introduces, and it is named deliberately.** It tells the next
planner to use a quick-win band that **disagrees with the skill file**. That is a
divergence between two documents a planner reads, which is normally a defect. It is
accepted here because the alternative — a session editing the rules file on its own
judgement — is worse, and because the disagreement is stated in both the handover and the
decision file rather than left for someone to trip over. See *Defects found* #4.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing. **Base confirmed against the remote** — `main` was `3696e59d` at creation and `origin/main` matched it, checked with `git rev-parse`
- [ ] `node scripts/gates.mjs` — n/a: no TypeScript, no build input, no lint surface. CI runs it regardless and is the check that matters
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] **CI will be judged on the run's own conclusion *and* its per-check conclusions** — both, knowing `audit` and `test-plan` are `continue-on-error`
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script directly rather than through a pipe
- [x] **Every figure in the file was measured, not recalled** — `main` `3696e59d` from `git rev-parse`; `173 applied, 0 pending`, `0 not applied here` from `apply-migrations.mjs --status`; the next free number from `ls supabase/migrations/` **plus** the knowledge that `0174` is owned by a live stream, so the file says `0175`; 89 open items from an `awk` count above `## Completed`; `0` open PRs from `gh pr list`; release `0.23.0` / `2026-10-09` and the four `unreleased` lines from `src/lib/releases.ts` and `package.json`; the nine token actuals from `get_usage` at the moment each was readable
- [x] **A figure that could not be measured is marked as such, not estimated** — production's position says *"not read from this session"* and points at `docs/release-handover.md`, because the classifier refuses production reads and that refusal is correct

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `apply-migrations.mjs --status` reviewed — not to apply anything, but because the file states dev's position: `173 applied, 0 pending`, `0 not applied here`, read at writing time rather than carried over
- [ ] `--env production --dry-run` reviewed — n/a: this PR applies nothing, and production is not readable from this session
- [x] Applied to **dev** and recorded in `schema_migrations` — n/a for this PR; checked for the file's claim, which holds
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as an action; the file deliberately states that production was **not** read here and defers to the release handover, rather than repeating a figure it could not verify. It also carries forward the one production-facing hazard a reader must not lose: **`0173` archives the Staff role and an archived role's logins fail closed**, so it must not reach production before production's Staff holders are moved

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two documents, with no runtime behaviour
- [ ] Data persists — n/a: no runtime data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no surface
- [ ] Invalid input is rejected with a readable message — n/a: no input
- [ ] Boundary cases checked — n/a: no input

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing in the app | `docs/` is not served | n/a — no app surface |

- [ ] Every role above tested — n/a: no route renders either file
- [ ] A role that should not have access is blocked server-side — n/a: no access rule in this PR

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched; the handover is an internal process document with no manual topic
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no layout
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work — n/a in substance; checked in form: both files are Markdown that nothing imports, and the sections a planner navigates by are all present in the handover — *Where things stand*, *The loop*, *Four states that look like faults*, *The lesson that cost the most*, *Token estimates*, *Two constraints*, *What briefs should do*, *Items whose remaining condition is a person*, *Blocked, and on whom*, *Who does what*, *Three traps in the tooling*, *Writing the next one*
- [x] Any shared file touched checked from a second, unrelated place — `docs/planner-handover.md` is read by the next planner and by nothing else, but **the skill reads it by name**: `.claude/skills/plan-day/SKILL.md` step 0 says *"In a fresh chat, read `docs/planner-handover.md` first"*, and step 8 says to rewrite it at nine. The filename is unchanged, so both still resolve. **Cross-references followed rather than assumed:** `docs/decisions/2026-10-06-director-draft-apply.md`, `docs/decisions/2026-10-08-planner-handover-counter.md` and `C:\Users\Leidos\.claude\tools\render-pdf.ps1` all exist; PRs #459, #471, #481, #486, #490 and #495–#500 are all real and merged
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` directly

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: rewriting the handover is a planning step, not a backlog item, and nothing in the backlog describes an outcome this PR closes. **Checked, not assumed:** the two items this PR discusses at length (the mobile sweep, the facility-map upload) are both outstanding and are deliberately left open, for the reasons the handover gives
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-09-quick-win-band-is-130-190k.md`. **This is the finding the rewrite produced**, and it is in a decisions file rather than only in the handover precisely because the handover is short-lived by design
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a file in `docs/`. No line was added to `unreleased`, which already holds four lines from batch 83 and is untouched by this PR
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see §2. Three claims are judgements rather than measurements and are each attributed as such in the file: that `HELD` is a snapshot (four observed transitions in one day, named); that a mechanical sweep is cheaper than a design-and-build (two measured streams, named); and that the quick-win band should move (two measured streams, in its own decision file with the evidence)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: documents; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime date derivation. The dates in both files are calendar dates of events, not derived values
- [ ] **Boundary or banding change** — n/a: the token bands are guidance a human planner reads, not a threshold any code evaluates, so nothing rounds, buckets or compares against them. Worth stating plainly because this PR *does* change a band — but no code reads it
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the migration status line, the SHAs, the open-item count and the token figures are copied from the commands' output
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

- [x] Rollback position stated, including what it does not cover — `git revert` of these commits, which restores the batch-81 handover. **That is worse than having no handover**, since the restored file states `main` is at `dfd28758`, dev at `171`, `0172` free and 85 items open, all false, and it describes the Vet→Doctor rename as unstarted work when it shipped as #495 and #496. If this file is wrong the fix is to correct it, not to revert it. Reverting the decision file would separately lose the band evidence, which exists nowhere else

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The file this PR replaces was stale in all four of its leading figures within hours of being written | **inherent to the file's purpose, not fixable.** It is why the header tells the reader three documents outrank it, and why both copies lead with a dated state table rather than prose |
| 2 | low | Production's position cannot be stated, because production reads are refused from these sessions | **recorded as unknown rather than guessed.** The file says so in the table and points at `docs/release-handover.md`, written by a session that can read it |
| 3 | low | The *live worktrees* row names six merged leftovers that `/clean-streams` will remove, probably within the hour | **accepted.** The row is true at the commit and the header tells the reader to trust `git` over this file. Writing "six leftovers" is more useful to the next planner than omitting them |
| 4 | **medium** | The handover tells the next planner to use a quick-win band that **contradicts `.claude/skills/plan-day/SKILL.md`**, which still says 110–170k | **accepted deliberately, and documented in both places.** A session editing the rules file on its own judgement is the worse failure. `docs/decisions/2026-10-09-quick-win-band-is-130-190k.md` states the evidence, states that the skill is unchanged, and states that changing it is Lutan's call. **This is the top item in *Left for manual verification*** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether to change the skill's quick-win band to 130–190k, or leave the recommendation in the decision file.** Lutan's call — the skill is the rules. Until he decides, two documents a planner reads disagree | `.claude/skills/plan-day/SKILL.md`, *Token estimates*, against `docs/decisions/2026-10-09-quick-win-band-is-130-190k.md` |
| 2 | That the handover reads usefully to a planner starting cold — it is written for a reader who has not seen this session | `docs/planner-handover.md`, start to finish |
| 3 | That the *Blocked, and on whom* list matches what Lutan believes he owes, particularly the facility-map upload, the production Staff holders, and the product `.org` name | `docs/planner-handover.md`, *Blocked, and on whom* |
| 4 | That the facility-map correction is still right — it asserts production never held plan rows, inferred from dev's three and a screenshot, **not** from reading production. Carried forward unverified from the batch-81 handover | `docs/planner-handover.md`, *The facility map* |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (daily planner session)  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items, all Lutan's. One is a decision he has to make (the band); three are reads of the document rather than checks of behaviour

Manual verification by: pending: Lutan deciding whether the skill's quick-win band changes, and confirming the handover reads usefully cold, that the blocked list matches what he owes, and that the facility-map correction still holds

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it
- [x] Handed to the next planner — that is what the file is

Result: pass with accepted defects
