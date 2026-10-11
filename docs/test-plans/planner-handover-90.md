# Feature test plan — planner-handover-90

## Header

| | |
|---|---|
| Feature | Rewrite `docs/planner-handover.md` at the ten-workstream mark (the urgent `visitor-count-live`, then batches 88, 89, 90), **plus** the `.claude/skills/plan-day/SKILL.md` change Lutan asked for (a model/effort recommendation per stream, estimates as bands, and the schema band corrected), and a `docs/decisions/` file recording all of it |
| Backlog item | none — the handover is rewritten every nine workstreams by the planner, the way the release manager rewrites `docs/release-handover.md` each release. The skill change was asked for in chat on 2026-10-11 and folded in here on Lutan's instruction (*"fold it into the handover PR"*) rather than spending a separate PR |
| Branch / worktree | `claude/planner-handover-90` @ `C:\Development\Animal_Shelter_planner-handover-90` |
| Dev server | not started — this PR changes three documents and no code |
| PR | opened from this branch |
| Tested by / date | Claude (daily planner session) / 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `cefd91a8` (`main` tip when the worktree was created, confirmed equal to `origin/main`) + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — `docs/planner-handover.md` replaced in full (the 2026-10-10 copy written after batch 87 becomes the 2026-10-11 copy written after batch 90), `.claude/skills/plan-day/SKILL.md` edited in four places, one new `docs/decisions/` file, and this plan
- [x] Files/areas touched listed — `docs/planner-handover.md`, `.claude/skills/plan-day/SKILL.md`, `docs/decisions/2026-10-11-model-and-effort-in-the-planning-loop.md`, `docs/test-plans/planner-handover-90.md`. No app code, no schema, no configuration the app reads
- [x] Roles affected identified — none. No role reads any of these files in the app; `.claude/skills/` is read by Claude Code, not by the running app
- [x] Anything explicitly **out of scope** written down — **`scripts/check-test-plan.mjs` is deliberately untouched**, and the decision file says so: it can see whether a §7 line exists, never whether it is true, and that is a limit to record rather than a bug to fix. **`CLAUDE.md` is untouched.** The one-migration-per-batch rule is unchanged

**This PR is unusual in that it edits a rules file**, which a session normally must not do on
its own judgement. `docs/decisions/2026-10-10-schema-pr-band-is-150k-and-cost-tracks-discovery.md`
explicitly left `SKILL.md` alone on the grounds that changing it is Lutan's call. **Both
changes here were asked for by him**: the model/effort step on 2026-10-11 (*"As part of this
process can you also suggest for each workstream what the optimal model and effort would
be"*), and the schema band corrected on a direct question put to him in the same chat, with
three options and a recommendation. **Neither was a session's initiative.**

**Risk if the handover is wrong is real but bounded:** a planner who trusts a stale handover
plans around the wrong picture, which is how 2026-10-07 lost four streams. Every figure in it
was re-read from a command at writing time — see §2.

**Risk if the skill change is wrong is larger and longer-lived**, because the skill is read on
every planning run and is not re-verified the way the handover's figures are. The specific
hazard: a planner reads "default: Sonnet/low" as settled fact and stops thinking. **Mitigated
in the text itself** — the skill states that the entire pre-2026-10-11 dataset ran one setting,
that batch 89 changed the task as well as the model, and that the model therefore cannot be
credited. See *Defects found* #1.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing. **Base confirmed against the remote** — `git rev-parse --short HEAD` and `git rev-parse --short origin/main` both returned `cefd91a8`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — run in this worktree, ticked on the script's own exit code (0), not on output that looked plausible. The run exceeded the 600s foreground limit and finished in the background; its exit code was read from the task result and its closing lines from the output file, exactly as printed:

```
=== gates: build exited 0 after 388s

gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR — read from `gh pr checks` on this PR and judged on **each check's own conclusion** as well as the run's, knowing `audit` and `test-plan` are `continue-on-error: true` and so cannot fail a run. Ticked in a follow-up commit once the run existed, as the template requires, rather than pre-ticked on the push that created the PR
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script directly rather than through a pipe
- [x] **Every figure in the handover was measured, not recalled** — `main` `cefd91a8` from `git rev-parse`; `179 applied, 0 pending` and `0 not applied here` from `apply-migrations.mjs --status`; the highest migration file `0179_role_floor_schema.sql` from `ls supabase/migrations/`, **plus** the fact that `0180` is owned by the live `perm-drop-enum` stream, so the file says `0181`; `0` open PRs from `gh pr list`; release `0.25.0` and the empty `unreleased` from `src/lib/releases.ts`; the batch 88/89 token actuals from `get_usage` at the moment each was readable; **the model and effort of every batch-88 and batch-89 stream from `get_session`**, which is what established that the whole pre-2026-10-11 dataset ran one setting
- [x] **A figure that could not be measured is marked as such, not estimated** — production's position says *"not read from this session"* and points at `docs/release-handover.md`, because the classifier refuses production reads and that refusal is correct. The open-item count is given as `~95` rather than a false exact, because items were being added on the `backlog` branch by other sessions while this was written

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `apply-migrations.mjs --status` reviewed — not to apply anything, but because the handover states dev's position: `179 applied, 0 pending`, `0 not applied here`, read at writing time rather than carried over
- [ ] `--dry-run` reviewed — n/a: this PR applies nothing
- [ ] Consumer header present — n/a: no migration file
- [ ] Re-runnable — n/a: no migration file
- [ ] Rows checked before and after — n/a: this PR touches no data

## 4. Functional checks

- [x] The handover's four-document precedence block is intact and correct — it names `CLAUDE.md`, `SKILL.md`, `.plan-day.md` and itself, states that all four outrank it, and tells the reader to check the date at the top. **Verified by reading the written file**, not assumed from the template it was based on
- [x] The handover's reading order is still accurate — `.plan-day.md` is now ~9,200 lines and the file says so, with the instruction to read only the top line and the last few hundred. The previous copy said ~8,100, which would have been a mild under-read
- [x] Every cross-reference in both changed files resolves — each `docs/decisions/` filename, `docs/roles-and-permissions.md` line numbers, `scripts/` names and PR numbers cited were checked to exist. `scripts/check-who-does-what.mjs`, `src/lib/permissions/fixed-for-now.ts` and `render-pdf.ps1` confirmed present
- [x] The skill's four edits are self-consistent — §5 now asks for model/effort columns and points at the new subsection; §6's table is widened to `slug | model | effort | scale | estimated | actual`; the token table's schema row carries the four measurements; the new *Model and effort* subsection sits directly after the token-estimates prose where a planner reading about cost will meet it
- [x] The skill still reads as one document — the new subsection uses the same voice and heading depth as its neighbours, and does not duplicate guidance already in §4 or §7

### Role access matrix

- [ ] Each role's access verified — n/a: no role reads these files in the app, and none is reachable from any route

## 5. Cross-cutting

- [ ] Both dictionaries updated — n/a: no user-facing string changed. These are internal documents
- [ ] 375 px checked — n/a: no screen
- [ ] Dark mode checked — n/a: no screen
- [ ] Thai checked — n/a: no user-facing string
- [ ] Accessibility checked — n/a: no screen
- [x] No secret, token or real person's name added — checked deliberately, because **this repo is public** and the handover discusses the Director and named roles. It refers to *the Director*, *Lutan* and *Anchalee* as the repo already does throughout, adds no new real name, no address, no donor and no credential, and the Cloudflare and Pi material names keys only, never values

## 6. Regression

- [x] Nothing else that reads these files is broken — `docs/planner-handover.md` is read by humans and by a planning session; `.claude/skills/plan-day/SKILL.md` is loaded by Claude Code when `/plan-day` runs. **The skill was re-read in full after editing** to confirm it still parses as Markdown with intact frontmatter and no broken list nesting
- [x] The previous handover's still-true content was carried forward, not dropped — the person-blocked list, the tooling traps, the husk that needs `--force`, the "who does what" section and the capture-at-merge rule all survive, with four items updated and three added. **Three figures were deliberately not carried**: the old `main` SHA, the old dev count and the old next-migration number, all superseded
- [x] `docs/release-handover.md` is untouched and still the authority on production — the planner handover points at it for production's position rather than restating it

## 7. Documentation

- [x] Backlog item ticked — n/a: no backlog item. The handover is a standing process artifact, and the skill change was a chat request folded in on Lutan's instruction. **The process question it relates to** — may §7 be ticked when a manual step is outstanding — **is already its own backlog item** (`7fda919f`) and is not closed by this PR
- [x] `docs/decisions/` entry added — `2026-10-11-model-and-effort-in-the-planning-loop.md`, recording all four decisions **including the one that records my own recommendation as wrong**, with the caveat that the model cannot be credited for batch 89's result
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe the planning loop
- [x] Release-notes line answered for real — **`n/a: no shelter user would notice.** These are three internal documents: a handover for a planning session, a skill Claude Code loads, and a decision record. Nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched, so no user-visible behaviour changes and `src/lib/releases.ts` is deliberately not edited

## 8. Pre-production gate

### Tested build

- [x] Tested at the SHA named in the header — `cefd91a8` plus this branch's commits, confirmed equal to `origin/main` at worktree creation

### On the deployed build

- [ ] Checked on the deployed build — n/a: nothing deploys. No file in this PR is read at runtime by the app or the Worker

### Deploy safety

- [x] Safe to deploy at any time — these are documents. **There is no release-time hazard and that is stated explicitly rather than left blank**, because an absent statement reads the same as an unknown to the release manager
- [x] No feature flag, no configuration change, no secret required

### Migration ordering — *skip if no migration*

- [ ] Migration applied before the code that reads it — n/a: no migration

### Rollback

- [x] Rollback is `git revert` of this PR, with no data or schema consequence. **The one thing a revert would lose** is the corrected schema band and the model/effort step, returning the skill to saying `unmeasured` and pointing at a stream whose session no longer exists

## Defects found

1. **Accepted, and named in the text: the skill now states a default (`sonnet-5-5` / `low`) on one batch's evidence.** Three streams at one setting is thin, and the task changed between batches 88 and 89 as well as the model. **Accepted** because the alternative is leaving the planner with the retired Opus/high recommendation, which had *no* evidence and was shown wrong on inspection. The skill and the decision file both say the model cannot be credited and instruct varying one dial per batch.
2. **Accepted: the skill and this handover now agree, where the previous pair deliberately disagreed.** The batch-87 handover carried quick-win and schema bands that contradicted the skill on purpose, because editing the skill was Lutan's call. He has now made that call for the schema band, so that divergence closes — **but the quick-win band divergence was not raised with him and is left as it stands.** Not a regression; worth a question on a future run.
3. **Accepted: `~95` open backlog items is approximate.** Other sessions were committing to the `backlog` branch while this was written, so an exact count would have been false precision. Marked as `~` rather than given a spurious figure.

## Left for manual verification

| What | Why it needs a person | Who |
|---|---|---|
| Whether the handover is actually usable by a fresh planning chat | Only reading it cold, in a new chat, shows whether it leads to the right first moves. Nobody in this session can read it cold — the whole point is that this session has the context the file is trying to replace | Lutan, or the next planning session, which should say if anything misled it |
| Whether the model/effort defaults match his intent | He asked for "the best mix of accuracy along with optimised usage". The skill's answer is now Sonnet/low by default with Opus reserved for nothing in particular, which is a real shift in how his allowance is spent | Lutan |
| Whether the quick-win band should also be corrected in the skill | Defect #2. He answered the schema-band question; the quick-win divergence was not put to him and should not be changed on a session's judgement | Lutan |

## Sign-off

### Automated and scripted checks

Covers the gates, `check-test-plan.mjs`, CI, and the measurement of every figure in the
handover (`git rev-parse`, `apply-migrations.mjs --status`, `ls supabase/migrations/`,
`gh pr list`, `get_usage`, `get_session`). Does **not** cover whether the handover reads
correctly to someone who was not in this conversation, which is the one thing that matters
most and is in the table above.

Automated checks by: Claude (daily planner session)  Date: 2026-10-11

### Manual verification

Manual verification by: pending: the three rows above are Lutan's, and the first of them
cannot be done by this session by definition — reading the handover cold is the test, and
this session has the context the file exists to replace.

### Result

Result: pass with accepted defects
