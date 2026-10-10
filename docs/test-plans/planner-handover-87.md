# Feature test plan — planner-handover-87

## Header

| | |
|---|---|
| Feature | Rewrite `docs/planner-handover.md` for whoever runs `/plan-day` next, at the nine-workstream mark (batches 85, 86, 87), plus a `docs/decisions/` file recording the two token bands the measurements moved |
| Backlog item | none — the handover is rewritten every nine workstreams by the planner, the way the release manager rewrites `docs/release-handover.md` each release |
| Branch / worktree | `claude/planner-handover-87` @ `C:\Development\Animal_Shelter_planner-handover-87` |
| Dev server | not started — this PR rewrites a document and adds a second |
| PR | opened from this branch |
| Tested by / date | Claude (daily planner session) / 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | `4081637d` (`main` tip when the worktree was created, confirmed equal to `origin/main`) + this branch's commits |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — `docs/planner-handover.md` replaced in full (the 2026-10-09 copy written after batch 84 becomes the 2026-10-10 copy written after batch 87), plus one new `docs/decisions/` file and this plan
- [x] Files/areas touched listed — `docs/planner-handover.md`, `docs/decisions/2026-10-10-schema-pr-band-is-150k-and-cost-tracks-discovery.md`, `docs/test-plans/planner-handover-87.md`. No code, no schema, no configuration
- [x] Roles affected identified — none. No role reads any of these files in the app
- [x] Anything explicitly **out of scope** written down — **`.claude/skills/plan-day/SKILL.md` is deliberately not touched.** The decision file recommends two band changes and states in its own words that editing the skill is Lutan's call, not a session's

**It replaces rather than appends**, as the file says of itself. The copy it replaces was
written the previous day and was already wrong in every one of its leading figures:
`main` at `3696e59d`, dev at 173, `0175` free, 89 open items, release `0.23.0` — all
superseded by nine merged streams and a release cut.

**Risk if this is wrong is real but bounded:** a planner who trusts a stale handover plans
around the wrong picture, which is exactly how 2026-10-07 lost four streams. That is why
every figure below was re-read from a command at writing time, and why the file's header
tells the reader it is outranked by three other documents.

**Two risks this copy introduces, both named deliberately.** It tells the next planner to
use a quick-win band *and* a schema-PR band that **disagree with the skill file**. That is
a divergence between two documents a planner reads, which is normally a defect. It is
accepted because the alternative — a session editing the rules file on its own judgement —
is worse, and because the disagreement is stated in both the handover and the decision
file rather than left for someone to trip over. See *Defects found* #4.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a in form: the worktree was created from `origin/main` minutes before writing. **Base confirmed against the remote** — `git rev-parse --short HEAD` and `git rev-parse --short origin/main` both returned `4081637d`
- [ ] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` — n/a: no TypeScript, no build input, no lint surface in this diff. CI runs it regardless and is the check that matters
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `node scripts/check-test-plan.mjs` — run on this plan before pushing, exit code read from the script directly rather than through a pipe
- [x] **Every figure in the file was measured, not recalled** — `main` `4081637d` from `git rev-parse`; `176 applied, 0 pending` and `0 not applied here` from `apply-migrations.mjs --status`; the highest migration file `0176_receipt_issuer_server_side.sql` from `ls supabase/migrations/`, **plus** the knowledge that `0177` is owned by the live `receipt-content-server-side` stream, so the file says `0178`; 88 open items from an `awk` count above `## Completed`; `0` open PRs from `gh pr list`; release `0.24.0` / `2026-10-10` and the `unreleased` count of 3 from `src/lib/releases.ts`; the nine token actuals from `get_usage` at the moment each was readable
- [x] **A figure that could not be measured is marked as such, not estimated** — production's position says *"not read from this session"* and points at `docs/release-handover.md`, because the classifier refuses production reads and that refusal is correct

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [x] `apply-migrations.mjs --status` reviewed — not to apply anything, but because the file states dev's position: `176 applied, 0 pending`, `0 not applied here`, read at writing time rather than carried over
- [ ] `--dry-run` reviewed — n/a: this PR applies nothing
- [x] Applied to **dev** and recorded in `schema_migrations` — n/a for this PR; checked for the file's claim, which holds
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: this PR touches no schema and no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [x] Production apply plan stated — n/a as an action; the file deliberately states that production was **not** read here and defers to the release handover, rather than repeating a figure it could not verify. It also carries forward the production-facing hazard a reader must not lose: **`0173` archives the Staff role and an archived role's logins fail closed**, so it must not reach production before production's Staff holders are moved

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
| admin | nothing in the app | `docs/` is not served | n/a — no app surface |
| management | nothing in the app | `docs/` is not served | n/a — no app surface |
| staff | nothing in the app | `docs/` is not served | n/a — no app surface (and the role is retired by `0173`) |
| doctor | nothing in the app | `docs/` is not served | n/a — no app surface |
| volunteer | nothing in the app | `docs/` is not served | n/a — no app surface |
| signed out | nothing in the app | `docs/` is not served | n/a — no app surface |

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

- [x] The pages nearest the change still work — n/a in substance; checked in form: both files are Markdown that nothing imports, and the sections a planner navigates by are all present — *Where things stand*, *The loop*, *Five states that look like faults*, *The lesson that cost the most*, *Token estimates*, *Three constraints*, *What briefs should do*, *Items whose remaining condition is a person*, *Blocked, and on whom*, *Who does what*, *Three traps in the tooling*, *Writing the next one* (12 `##` headings)
- [x] Any shared file touched checked from a second, unrelated place — `docs/planner-handover.md` is read by the next planner and by nothing else, but **the skill reads it by name**: `.claude/skills/plan-day/SKILL.md` step 0 says *"In a fresh chat, read `docs/planner-handover.md` first"*, and step 8 says to rewrite it at nine. The filename is unchanged, so both still resolve. **Cross-references followed rather than assumed:** `docs/decisions/2026-10-06-director-draft-apply.md`, `docs/decisions/2026-10-09-quick-win-band-is-130-190k.md` and `C:\Users\Leidos\.claude\tools\render-pdf.ps1` all exist; PRs #481, #486, #490, #493, #495, #496, #498, #499, #501 and #512 were each checked with `gh pr view` and all ten are `MERGED`
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; the worktree was cut from `origin/main` directly and `HEAD` equals `origin/main`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: rewriting the handover is a planning step, not a backlog item, and nothing in the backlog describes an outcome this PR closes. **Checked, not assumed:** the items this file discusses at length (the mobile sweep, the facility-map plans, the Cat Zone, the acceptance-checklist agreements) are all outstanding and deliberately left open, for the reasons the handover gives
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-10-schema-pr-band-is-150k-and-cost-tracks-discovery.md`. **This is the finding the rewrite produced**, and it is in a decisions file rather than only in the handover precisely because the handover is short-lived by design — which is exactly how the schema-PR band came to point at an unreadable session since batch 73
- [x] `README.md` still accurate — untouched and unaffected
- [ ] **Release notes.** — n/a: nobody using the shelter app would notice a file in `docs/`. No line was added to `unreleased`, which already holds three lines from batches 85 and 86 and is untouched by this PR
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned** — see §2. Four claims are judgements rather than measurements and are each attributed as such in the file: that `HELD` releases in hours rather than minutes (three readings in one day, named); that the `UU docs/backlog.md` state is another session mid-sync (observed twice, with the holding session named both times); that estimate error tracks discovery rather than file count (nine measured streams, tabulated in the decision file); and that the schema-PR band is ~150k (two measured streams, named)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: this PR is not deployed
- [ ] Deployed SHA matches the tested SHA — n/a: nothing here is deployed

### On the deployed build

- [ ] Deployed to test — n/a: documents; `docs/` is not part of any build output
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test
- [ ] **Timezone-sensitive behaviour proved** — n/a: no runtime date derivation. The dates in both files are calendar dates of events, not derived values
- [ ] **Boundary or banding change** — n/a: the token bands are guidance a human planner reads, not a threshold any code evaluates, so nothing rounds, buckets or compares against them. Worth stating plainly because this PR *does* change two bands — but no code reads them
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the migration status lines, the SHAs, the open-item count, the `unreleased` count and the token figures are copied from the commands' output
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

- [x] Rollback position stated, including what it does not cover — `git revert` of these commits, which restores the batch-84 handover. **That is worse than having no handover**, since the restored file states `main` is at `3696e59d`, dev at 173, `0175` free, 89 items open and the last release `0.23.0`, all false, and it describes batch 84 as *"just started"* when all three of its streams merged and six more have merged since. If this file is wrong the fix is to correct it, not to revert it. Reverting the decision file would separately lose two measured bands that exist nowhere else, which is the failure it was written to prevent

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | The file this PR replaces was stale in every one of its leading figures within a day of being written | **inherent to the file's purpose, not fixable.** It is why the header tells the reader three documents outrank it, and why both copies lead with a dated state table rather than prose |
| 2 | low | Production's position cannot be stated, because production reads are refused from these sessions | **recorded as unknown rather than guessed.** The file says so in the table and points at `docs/release-handover.md`, written by a session that can read it |
| 3 | low | The *live worktrees* row names six merged leftovers that the next run will clear | **accepted.** The row is true at the commit, and the header tells the reader to trust `git` over this file. Naming them is more useful to the next planner than omitting them |
| 4 | **medium** | The handover tells the next planner to use a quick-win band **and** a schema-PR band that **contradict `.claude/skills/plan-day/SKILL.md`**, which still says 110–170k and `unmeasured` | **accepted deliberately, and documented in both places.** A session editing the rules file on its own judgement is the worse failure. The new decision file states the evidence, states that the skill is unchanged, and states that changing it is Lutan's call. **This is the top item in *Left for manual verification*** |
| 5 | low | The skill's schema-PR row instructs the reader to measure `zone-colour-schema` "while its session is live". That session is closed and the figure is unrecoverable | **superseded rather than fixed here.** Two later schema PRs were measured instead and the decision file records both. The stale instruction stays in the skill until Lutan changes it — defect 4 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether to change the skill's token bands** — quick win to 130–190k, schema PR to ~150k, and remove the dead "measure `zone-colour-schema`" instruction. Lutan's call: the skill is the rules. Until he decides, two documents a planner reads disagree in two places | `.claude/skills/plan-day/SKILL.md`, *Token estimates*, against `docs/decisions/2026-10-10-schema-pr-band-is-150k-and-cost-tracks-discovery.md` |
| 2 | That the handover reads usefully to a planner starting cold — it is written for a reader who has not seen this session | `docs/planner-handover.md`, start to finish |
| 3 | That the *Blocked, and on whom* list matches what Lutan believes he owes, now that the facility-map plans are loaded — particularly the visitor-count token, Anchalee's admin account, the production Staff holders and the product `.org` name | `docs/planner-handover.md`, *Blocked, and on whom* |
| 4 | That the Cat Zone plan was loaded as intended, and that every zone the map offers now has a `facility_maps` row. The handover records this as **in flight on Lutan's word**, not as verified — production cannot be read from these sessions | production, Settings → Facility map; or `select id, zone_id, image_path from facility_maps` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (daily planner session)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items, all Lutan's. One is a decision he has to make (the bands), two are reads of the document, and one is a production check no session here can perform

Manual verification by: pending: Lutan deciding whether the skill's token bands change, confirming the handover reads usefully cold and that the blocked list matches what he owes, and confirming the Cat Zone plan is loaded

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body summarises it
- [x] Handed to the next planner — that is what the file is

Result: pass with accepted defects
