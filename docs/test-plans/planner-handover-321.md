# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `321`, and promoting the run-stream token rate into the plan-day skill |
| Backlog item | `docs/backlog.md` → none — the handover is part of the `/plan-day` loop (`docs/decisions/2026-10-08-planner-handover-counter.md`), not a backlog item |
| Branch / worktree | `claude/planner-handover-321` @ `C:\Development\Animal_Shelter_planner-handover-321` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3015` |
| PR | #876 |
| Tested by / date | Claude (planner session) / 2026-10-23 |
| Carries a migration? | no |
| Tested at SHA | `ee9bb1bb` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrite `docs/planner-handover.md` as edition `321` and promote the measured run-stream token rate into `.claude/skills/plan-day/SKILL.md`; no backlog item, as above
- [x] Files/areas touched listed — exactly two: `docs/planner-handover.md` (rewritten) and `.claude/skills/plan-day/SKILL.md` (one section inserted into *Token estimates*). No routes, no `worker/`, no `supabase/migrations/`, no shared libs
- [x] Roles affected identified: **none.** Neither file is read by the application at runtime; both are read by Claude sessions. No role sees any difference
- [x] Anything explicitly **out of scope** written down — the nine streams' own PRs (#867–#875) are all merged and unchanged by this; `.plan-day.md` is gitignored local state and is not in this PR; the `backlog` branch merge conflict was resolved and committed on `main` separately

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly. Branch was cut from `origin/main` after the round's nine PRs and the backlog resolution had landed, so there was nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines exactly as printed:

```
=== gates: build exited 0 after 139s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `--status` reviewed before applying — n/a: no migration in this PR
- [ ] `--dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no row in any table is read or written by either file
- [ ] Constraints and defaults exercised against real rows — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end — both files were read back after writing. `docs/planner-handover.md` is 158 lines and renders as Markdown with no stray conflict markers or broken tables; the skill's new section sits inside *Token estimates*, immediately before the live-interactions axis, and `grep` confirms its heading is present exactly once
- [x] Data persists — reload the page and the change is still there — committed at `ee9bb1bb` and pushed; `git show --stat` lists exactly the two intended files
- [ ] Create / edit / delete all exercised — n/a: two documents, no create/edit/delete surface
- [ ] Empty state renders sensibly — n/a: no data-driven view; neither document has an empty state
- [ ] Invalid input is rejected with a readable message — n/a: no input path; nothing parses these files at runtime
- [x] Boundary cases checked — the one real boundary here is the handover's **length target**: measured with `wc -l` at **158**, which the skill's step 8 puts in the explicit "a little over, up to about 160, is FINE — ship it" range, so no trimming pass was opened and no defect recorded. The CRLF/LF boundary was also handled: the skill file is **CRLF** and the handover is **LF**, and the amendment script normalised, matched, and wrote back as CRLF (it reported `crlf = true`)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | neither file | no change | no change — not served to any role |
| management | neither file | no change | no change — not served to any role |
| staff | n/a — retired role (`0173`) | n/a | n/a |
| doctor | neither file | no change | no change — not served to any role |
| volunteer | neither file | no change | no change — not served to any role |
| signed out | neither file | no change | no change — not served to any role |

- [x] Every role above tested — by inspection rather than by signing in, and the reason is the finding itself: **neither file is referenced from `src/`, `worker/` or any route**, so there is no page on which a role could observe a difference. `docs/` and `.claude/` are not served
- [x] A role that should not have access is blocked server-side — no role has or needs access; the repository is public and both files are already world-readable by design, which is their intended state

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry; this PR adds no page
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: no user-facing behaviour changed, so there is nothing for the shelter manual to describe. These are Claude's own working documents
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings; both files are English working notes read only by Claude sessions
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no rendered surface
- [ ] Network clean — n/a: no rendered surface

## 6. Regression

- [x] The pages nearest the change still work — the nearest thing to a "page" is the skill itself, and the regression risk is that a malformed edit breaks the next `/plan-day`. Checked by reading the inserted section in place with its surrounding headings, confirming it is inside *Token estimates* and has not split the live-interactions axis that follows it
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page, not by reading the file.** `.claude/skills/plan-day/SKILL.md` is the shared file. It was exercised by `node scripts/gates.mjs`, which passed with `test=0` — and more directly by `grep -c` confirming the new heading resolves exactly once, so no duplicate insertion. **Stated honestly: the strongest possible check is the next `/plan-day` reading it, and that happens after merge** — it is in *Left for manual verification* rather than ticked here
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged during sync; the branch was already at `origin/main`'s tip

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a by the template's own rule, and said plainly: the handover has no backlog item. **Deliberately no `docs/backlog.md` change in this PR**, because the round's backlog conflict was resolved on `main` and touching the file here would re-open it
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **none added, deliberately.** The durable decision of this round is the run-stream rate, and the skill's step 8 rule 2 says a durable fact goes in the skill, not into a second home. It is in the skill with its evidence table and the mistake that produced it
- [x] `README.md` still accurate — unaffected; it describes the application, and neither file changes it
- [ ] **Release notes.** — n/a: a planner-process document and the planner's own skill — no shelter user can reach either, and nothing a user sees changed. The three user-visible changes of this round already shipped their own notes in #871, #872 and #873
- [x] Commit messages say why, not just what — the commit explains that the rate is promoted *with its mistake attached*, because the estimator was right and the step count was wrong
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** This is the line that matters most in this PR, so the arithmetic is written out rather than asserted. Nine actuals were read from `get_usage` before any session was archived; the three run streams give `(205,025−88k)/12 = 9,752`, `(265,830−88k)/18 = 9,879` and `(388,315−88k)/31 = 9,687` per step. The claim that the rate predicts `cards-rerun-blocked` "within 1%" is `88,000 + 9.8k × 31 = 391,800` against **388,315** — **0.9% high**. The step counts were counted with the `awk` command the skill now carries, not taken from the items' prose; that distinction is the whole finding

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date, time or clock-derived logic in this PR; both files are prose
- [ ] Boundary or banding change covers both edges — n/a: no runtime boundary, threshold or band in the code. The token bands this PR documents are guidance for a planner, not a code path
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is copied verbatim from the run, and the per-step figures in section 7 are arithmetic on `get_usage` readings rather than a hand-maintained table
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched; this PR adds no route and changes no rendered output

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration in this PR
- [ ] `--env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup exists and is fresh — n/a: no migration, and nothing destructive or rewriting
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — both files are documentation, so rollback is `git revert` of `ee9bb1bb` and nothing else is required: no deploy, no migration, no Worker change, nothing to purge. **What that does not cover:** reverting would restore edition `312`, whose candidate list is now wrong on the card-walkthrough hold, and would remove the step-counting command from the skill — so a revert should be accompanied by re-reading the walkthrough item on `main`

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `list_sessions` reported PR #872, and later #875, as `OPEN` after both had merged; `gh pr view` said `MERGED`. Had the stale row been trusted, Lutan would have been told a batch was incomplete | accepted — not a repository defect. Recorded in `.plan-day.md` and in the handover as a case of trusting `gh` over the session row |
| 2 | low | `cards-rerun-blocked` ran 29% over its band because the planner banded it from the item's TODO count rather than its step count | fixed — the skill now carries the measured rate and the one command that counts steps correctly |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That the promoted section actually changes how the next round estimates — i.e. the next `/plan-day` counts steps with the `awk` command and bands a run stream at `88k + 9.8k × steps`. This cannot be verified before merge, because the skill is read at invocation | `.claude/skills/plan-day/SKILL.md`, *Token estimates*, at the next `/plan-day` |
| 2 | Whether the handover reads usefully to a fresh planner chat, which is its only real test | `docs/planner-handover.md` at the start of the next planning chat |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-10-23

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and only the person who looked may tick this; both items are only testable after merge, so the signature below is `pending:`

Manual verification by: pending: the next `/plan-day` exercising the promoted rate and the rewritten handover

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — nothing to deploy; the release manager is told in the handover that this round's nine PRs are merged and that `unreleased` must be re-read rather than counted from the document

Result: pass

Release manager acknowledgement: n/a: documentation only — no deploy, no migration, nothing to acknowledge before a release
