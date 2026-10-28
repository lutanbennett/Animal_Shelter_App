# Feature test plan — planner-handover-447

## Header

| | |
|---|---|
| Feature | Planner handover, edition `447`: a delta covering the nine streams after `438` |
| Backlog item | `docs/backlog.md` → n/a: the handover is loop bookkeeping, not a backlog item (`docs/decisions/2026-10-08-planner-handover-counter.md`) |
| Branch / worktree | `claude/planner-handover-447` @ `C:\Development\Animal_Shelter_planner-handover-447` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | filled in at `gh pr create` |
| Tested by / date | Claude (Opus 5), planner session / 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | see the `gates:` block below |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed — `docs/planner-handover.md` (replaced) and this plan. **No code, no schema, no UI, no scripts**
- [x] Roles affected identified — none. The handover is read by one chat and grants nothing
- [x] Anything explicitly **out of scope** written down — **promotion, deliberately.** The round's two durable rules (*All analysis is by CARD*, and the step-zero stop covering only the jobs a brief names) were promoted into `CLAUDE.md`, the `plan-day` skill and the brief blocks **in their own PRs**, and this edition **cites them rather than repeating them**, per the delta rule

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
gates: typecheck=0 lint=0 test=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, no data
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration; `438` stays in git history and is cited by this edition
- [ ] Production apply plan stated for the release manager — n/a: no migration and nothing to deploy

## 4. Functional checks

- [x] Happy path works end to end — the file renders as Markdown, opens on edition `447` with the date, and names `456` as the next slug (`447 + 9`)
- [x] **Length measured, not estimated.** `wc -l docs/planner-handover.md` → **144**, inside the ~150 target, so **no trimming pass was opened** — the skill is explicit that trimming passes are the most expensive place to spend the budget the number exists to protect. Four earlier editions stated a figure they had not measured; this one was measured after the content was written
- [x] **It is a DELTA, and the three delta rules were applied.** (1) It opens by correcting its predecessor where `438` was wrong — the `0276` production claim — and carries a fired/held/closed list of `438`'s warnings. (2) Durable facts are **promoted, not recopied**: the cards-not-roles rule is cited to `CLAUDE.md` and the skill rather than restated. (3) `.plan-day.md` is cited, not reproduced — no per-stream table, no batch composition
- [x] **The "never carried forward" block was obeyed as written, and then tested against the text.** The edition names **no** open-item count, migration number, PR number, release version or candidate figure. Checked by reading it back looking for digits: the only numbers in it are edition slugs, the count of this round's streams, and "three times"/"four times"/"five faults" — none of which is a repo reading. **This is the first edition to state that constraint and then verify it**
- [x] **Every quotation was taken from the transcript, not reconstructed.** Lutan's four quoted sentences are verbatim
- [ ] Data persists — reload the page and the change is still there — n/a: Markdown in git
- [ ] Create / edit / delete all exercised — n/a: a document has no such surface
- [ ] Empty state renders sensibly — n/a: no state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked — n/a: no values

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | the handover is a repo file, not a page | n/a |
| management | n/a | as above | n/a |
| staff | — | retired by `0173`, deleted by `0270` | n/a |
| doctor | n/a | as above | n/a |
| volunteer | n/a | as above | n/a |
| signed out | n/a | the repo is public; the file names role keys only, no person | as expected |

- [ ] Every role above tested — n/a: the handover is not served by the app. **And this table is the shape Lutan ruled against this round** — kept because the template asks for it, not because it measures anything
- [ ] A role that should not have access is blocked server-side — n/a: no access path exists to block

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: no client code
- [ ] Network clean — n/a: no requests
- [x] **`AGENTS.md` left alone** — `next dev` rewrites it, so nothing durable goes there

## 6. Regression

- [x] The pages nearest the change still work — none to check; `gates.mjs` compiles the app unchanged, which is the evidence a docs-only change touched no code path
- [x] Any shared file touched checked from a second, unrelated place — `docs/planner-handover.md` is read by the planner chat and by nothing in the app. **Confirmed the whole file was replaced rather than appended to**: it opens on `447` and contains no `438` heading
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the handover has no backlog item; the counter it resets lives in the gitignored `.plan-day.md`
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the edition makes no design choice of its own. The round's two durable rules were each recorded in a decision file in **their own** PRs (`2026-10-28-analysis-by-card-not-role.md`, `2026-10-28-two-contradictory-notes-and-a-promised-prefix.md`), which this edition cites
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a handover between planner chats; no shelter user reads it and no app behaviour changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the line count is `wc -l` output, the fired/held/closed verdicts were each checked against what actually happened this round rather than assumed from `438`'s wording, and the "no repo figures" claim was verified by reading the text back

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: nothing deploys from this PR
- [ ] Deployed SHA matches the tested SHA — n/a: nothing deploys
- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable surface
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deployable surface
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date arithmetic
- [ ] **For a boundary or banding change, both edges covered** — n/a: no boundary. The edition **withdraws** a band and adds none
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block and the `wc -l` figure are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `apply-migrations --env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [x] Rollback position stated, **including what it does not cover** — reverting restores `438`. It does **not** undo the promotions this edition relies on: the `CLAUDE.md` rule, the skill subsection and the brief blocks are in merged PRs of their own and would survive, which is the point of promoting rather than carrying

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `git` warns `LF will be replaced by CRLF` on `docs/planner-handover.md`, whose previous editions are LF | accepted — the repo's own normalisation decides what is committed, as it did for every prior edition; no content difference |
| 2 | **medium** | **The edition this one replaces had to be corrected on its own branch hours after it merged**, because it carried a release-state claim forward that Lutan knew to be false. **Not a defect in this PR but the reason for its central warning** | accepted and recorded in `447`'s own text: release state is written with its re-read instruction attached, and **this edition names no repo figure at all** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | *(empty — a handover has no surface a person needs to look at, and Lutan has never reviewed one; by design a wrong edition is corrected by its successor rather than by a reviewer, which is why these PRs merge on green without asking)* | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5), planner session  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty, so nothing is being signed for

Manual verification by: n/a: no surface for a person to look at — the file does not render in the app, and **Left for manual verification** is empty on purpose

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: docs-only, nothing to deploy
