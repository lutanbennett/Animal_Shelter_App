# Feature test plan

| | |
|---|---|
| Feature | Planner handover edition `636`, a delta over `627` |
| Backlog item | `docs/backlog.md` → none. The handover is step 8 of the `/plan-day` skill, not a backlog item |
| Branch / worktree | `claude/planner-handover-636` @ `C:\Development\Animal_Shelter_planner-handover-636` |
| Dev server | `n/a: no runtime surface — one Markdown file` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude (Daily Planner session) / 2026-11-04 |
| Carries a migration? | no |
| Tested at SHA | `8c797b09` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `636`, a delta over `627`, covering batches 1 (#1264–#1267) and 2 (#1268–#1270) of the current plan and the **setup** of batch 3. No backlog item: `/plan-day` step 8 requires it when a plan's last batch is set up, and batch 3 was set up on 2026-11-04
- [x] Files/areas touched listed — exactly two: `docs/planner-handover.md` (rewritten, 178 lines) and this plan. No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no skill change
- [ ] Cards affected identified — `n/a: no card grants or withholds access to this file. It is not served by the app, so no card, and not Admin either, can or cannot reach it`
- [x] Anything explicitly **out of scope** written down — the edition does **not** carry open item counts, migration numbers, PR numbers or release state; the skill re-reads those from the repo every run and the edition restates that rule. It does not reproduce `.plan-day.md`'s measurement table. **And batch 3's own figures are deliberately absent**, because the handover is written at that batch's setup rather than after it merges — the edition says so in its own opening block rather than implying coverage it does not have

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran before gates; `origin/main` merged in (`Already up to date`) and the branch pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0` — **four gates, each its own exit code, every one `0`.** Run in the background with output to the scratchpad and read back with `cat`, per the skill's finishing sequence. Pasted below exactly as printed:

```
=== gates: typecheck exited 0 after 286s
=== gates: lint exited 0 after 359s
=== gates: test exited 0 after 22s
=== gates: build exited 0 after 270s

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

- [x] Happy path works end to end — the happy path for a handover is that a fresh planning chat can read it and act on it. Read back from disk after writing: it opens by correcting `627`'s lead with the evidence, carries each of `627`'s mechanisms as fired or held with a running tally, names the next slug (`645`), and carries the never-carried-forward block verbatim
- [x] Data persists — reload the page and the change is still there — read back from disk; `wc -l` reports **178 lines**, and `git diff --stat` against the previous edition shows **160 insertions(+), 147 deletions(-)** rather than a whole-file rewrite
- [ ] Create / edit / delete all exercised — `n/a: no CRUD surface — one Markdown file`
- [ ] Empty state renders sensibly — `n/a: no rendered surface`
- [ ] Invalid input is rejected with a readable message, not a crash — `n/a: no input surface`
- [x] Boundary cases checked — the only boundary this change has is the skill's **length target**: about 100 lines, 150 a target rather than a hard gate, up to about 160 fine, **200 or more a signal to cut content rather than reword.** **Measured with `wc -l` after the content was written rather than claimed first: 178.** That is over the "ship it" range and under the "cut content" one, and it is recorded as Defect 2 rather than hidden or trimmed away

### Role access matrix

Per `CLAUDE.md`'s *all analysis is by CARD, never by role*, this matrix is stated by card. **There is
nothing to matrix:** the file is not served by the app and no URL reaches it, so no card grants or
withholds anything, and Admin — which sits outside the card system — is in exactly the same position.
Recorded as a table rather than deleted so the shape is comparable with its neighbours.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | the file, only as a file on disk | n/a — not served by the app | n/a |
| exactly any single card | the file, only as a file on disk | n/a — no card is consulted for it | n/a |
| signed out | the file, only as a file on disk | n/a — no route exists | n/a |

- [ ] Every login above tested — `n/a: the file is not served by the app, so no login can reach it`
- [ ] A login that should not have access is blocked server-side — `n/a: no route exists to hit directly`

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched, and this file has no nav entry`
- [ ] Manual updated (`src/lib/manual/en.ts`) — `n/a: the manual is for shelter staff; this file is read by Claude sessions`
- [ ] Translatable strings go through the translation path — `n/a: no user-facing strings added`
- [ ] Mobile viewport (375px) — `n/a: no rendered surface`
- [ ] Browser console clean — `n/a: no page loads`
- [ ] Network clean — `n/a: no page loads`

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is the file's own structure, which a fresh planning chat parses. Checked after writing: **7 `##` headings**, all at the same level as their neighbours, and **4 blockquote blocks** that each open and close
- [x] Any shared file touched checked from a second, unrelated page — `docs/planner-handover.md` is shared with every future planning session. **The real risk is line endings, not reading:** git has `core.autocrlf=true`, so the stored blob is LF. `git ls-files --eol` reports `i/lf w/lf`, and `git diff --stat` shows **160 insertions and 147 deletions rather than every line changed** — which is the proof the endings are right. A CRLF/LF mistake shows every line as changed, and on 2026-11-02 exactly that produced a one-hunk whole-file merge conflict on another tracked file
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` ran before gates (`Already up to date`), and gates ran on the merged tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: the handover has no backlog item; it is step 8 of the plan-day skill. This round's filed items and corrections went on the backlog BRANCH, which is where they belong, not in this PR`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — `n/a: the reasoning for the round IS this handover. A decision file would be a second copy of it`
- [x] `README.md` still accurate — unchanged by this PR and checked: it does not describe the handover documents
- [ ] **Release notes.** — `n/a: a planner handover is internal process documentation read by one chat, and no shelter user ever sees it, so nobody could notice this change`
- [x] Commit messages say why, not just what — the commit names the edition's lead (that `627`'s lead item was already closed 36 minutes before `627` itself merged) and the band finding (an under-run from a stream that finished without doing the deliverable the band was built on)
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the edition is a measurement, each taken rather than reasoned: the **178 lines** (`wc -l`, after writing); the **six actuals**, each read from its own PR's `stream-usage` comment with `gh pr view --json comments` rather than from `get_usage`, so none can be the planner's own window; the **floor spread of 424** (105,435 · 105,095 · 105,011, each computed as that comment's `tokens − messages`); the **merge times proving `627`'s lead was stale** (#1264 at 07:50:55Z against #1263 at 08:26:15Z, from `gh pr list --json mergedAt`); and the **production count that closed `#pdg6b`** (0 and 0 over 300 residents, from `check-production.mjs` against `dbkodyyxxhtygxcxmfcu`, with the database named beside the figure). **Two claims are explicitly NOT measurements and the edition labels them:** that the three briefs' mechanisms are "mechanism" rather than hypothesis rests on counted firings and says so, and the `#k7v2p` card question is written as NOT ESTABLISHED rather than concluded

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `deferred: production release manager`
- [ ] Deployed SHA matches the tested SHA — `deferred: production release manager`

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — `deferred: production release manager`
- [ ] Smoke-tested on `test.lannacare.org` — `deferred: production release manager`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — `n/a: no date or time logic in this file`
- [ ] **For a boundary or banding change, the assertions cover both edges of the band** — `n/a: no runtime boundary. The one boundary here is a prose length target, measured in section 4`
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — `n/a: the only pasted evidence is the gates output in section 2, which is unedited and was read back from the scratchpad file with cat`
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

- [x] Rollback position stated, **including what it does not cover** — one plain Markdown file read only by Claude sessions, so rollback is `git revert` of this commit and nothing else: no deploy, no Pi rebuild, no migration, nothing at runtime. **What it does not cover:** a planning session that has already read `636` and acted on it — reverting the file does not unmake the batch it planned. **Nor would it restore `627`'s accuracy:** `627` is now known to be wrong about its own lead item, so reverting would hand the next planner a sheet that says a stream is waiting on Lutan when it merged this morning. That is the exact fault the never-carried-forward rule exists to prevent, and it is why each edition corrects the one before it rather than relying on revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | **`627`'s entire lead section was already false when `627` merged.** It said the `planner-turns-not-tokens` stream was *"STILL UNSTARTED, `free`, 0 ahead, three days on"* and waiting on Lutan; PR #1264 had merged it at 07:50:55Z, **36 minutes before #1263 (the handover saying so) merged at 08:26:15Z**. | **accepted as a recorded process defect and made the lead of this edition.** It cannot be fixed in `627`, which is superseded. The cause is named — a `free` worktree with 0 commits was carried forward as evidence of *unstarted*, when it is equally the signature of a merged-and-tidied stream — and the rule drawn is *write the lead LAST, from a fresh read*. **It had a real cost:** a planning session repeated the claim to Lutan before checking |
| 2 | low | The handover runs to **178 lines** against the skill's target of about 150. | **accepted, and deliberately not trimmed.** The skill's rule since 2026-10-21: a little over is fine and must not open a trimming pass, because same-line-count rewording costs a round-trip and saves nothing, while **200 or more is the signal to cut content.** 178 sits between the two. It is over the comfortable range and is recorded rather than hidden, per that rule's instruction to measure with `wc -l` and state the figure. **The content earns it:** this edition is a delta over two merged batches *and* a setup, where a usual edition covers one plan's worth |
| 3 | low | The first attempt to write `docs/planner-handover.md` was refused because the tool required the file to be read first, and the content had to be routed through a scratchpad file and `cat`. | **fixed at the time, and it is the method the skill already prescribes** for overwriting a file this session has not read. Recorded only because it cost a round-trip that reading the skill's own note would have saved |

## Left for manual verification

**Empty, and deliberately so.** The template's test is *would a person have to go and look at it,
separately from deploying?* The only outstanding question about this PR is whether `636` reads usefully
to the next fresh planning chat — and **that is checked by the next `/plan-day`, which is a Claude
session, not by a person.** The file is not served by the app and nobody at the shelter reads it, so
there is no screen, wording or device for anyone to look at. Recorded here rather than parked as a
`pending:` signature, because a `pending:` naming a check no person will ever perform is a row nothing
closes.

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
