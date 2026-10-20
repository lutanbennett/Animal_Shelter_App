# Feature test plan

## Header

| | |
|---|---|
| Feature | The two handover documents become deltas with a ceiling, and the planner handover's PR merges without asking |
| Backlog item | `docs/backlog.md` → none. Asked directly by Lutan, 2026-10-20 and 2026-10-21, in chat |
| Branch / worktree | `claude/handover-delta` @ `C:\Development\Animal_Shelter_handover-delta` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3013` |
| PR | #788 |
| Tested by / date | Claude (Daily Planner session) / 2026-10-21 |
| Carries a migration? | no |
| Tested at SHA | `0b0650d2` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the planner handover becomes a delta with a ~100-line ceiling (mirroring `docs/release-procedure.md` rule 4), two durable facts are promoted out of it into the skill, and its PR joins the release PRs in merging without an approval round-trip. All three were asked for directly in chat
- [x] Files/areas touched listed — three files, no code: `.claude/skills/plan-day/SKILL.md` (the delta rule, the promoted bands, the promoted usage rule), `CLAUDE.md` (the merge rule), `docs/planner-handover.md` (rewritten in the new shape, 400 lines → 149). No `src/`, no `worker/`, no `scripts/`, no migration
- [x] Roles affected identified — **none.** Nothing here is served by the app. The audience is future Claude sessions running `/plan-day`, and Lutan
- [x] Anything explicitly **out of scope** written down — **three things were considered and deliberately not done**, each named in the PR: (1) **no no-PR lane for documents** — Lutan narrowed the ask to length, and the handover PR still goes through a branch, a test plan, CI and a PR, as this one does; (2) **no change to the test-plan requirement** — raised with him because dropping it would have reversed reasoning he endorsed the previous morning, and he did not ask for it; (3) **no third pre-commit guard on the `backlog` branch** — offered in chat and left for him to call, so the pre-existing route by which a rules file can reach `main` without review is **unchanged by this PR, neither widened nor closed**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with every gate at 0. Paste its closing `gates:` lines below exactly as printed — **the run reports four gates, not the template's three (`test=0` as well); the template's wording predates the test gate.** Pasted unedited

```
=== gates: build exited 0 after 127s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration. For the record, `main`'s highest is `0235_stock_receipts_cost_only_update.sql`, so the next free number is `0236` and this branch does not claim it
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration. The 236/236 zero-drift figure quoted in the handover was read with this command
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and this PR reads no rows
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration, so there are no constraints or defaults to exercise
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration. Reverting this PR reverts three documentation and rules files
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime behaviour. The "happy path" is a future session reading the rule and following it, which no check here can exercise; the nearest available check is that the rule is internally consistent, done in section 6
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input path
- [ ] Boundary cases checked — n/a: no input path. The one boundary this PR does have is the 150-line ceiling, and it is checked in section 6

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — not served | n/a | n/a: not served by the app |
| management | nothing — not served | n/a | n/a: not served by the app |
| staff | retired role (`0173`) | n/a | n/a: not served by the app |
| doctor | nothing — not served | n/a | n/a: not served by the app |
| volunteer | nothing — not served | n/a | n/a: not served by the app |
| signed out | nothing — not served | n/a | n/a: the repo is public, so all three files are readable on GitHub; checked in section 7 that they name no real people beyond Lutan |

- [ ] Every role above tested — n/a: none of the three files is served at any route, so no role can reach them and there is nothing to differentiate
- [ ] A role that should not have access is blocked server-side — n/a: no route exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; rules files get no nav entry
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. The manual is for shelter users; these files are for the planning loop
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: no rendered surface
- [ ] Browser console clean — n/a: nothing renders in a browser
- [ ] Network clean — n/a: no pages

## 6. Regression

**This PR changes rules that other documents quote, so the regression risk is contradiction rather than breakage. Each was checked by reading the other side, not by assuming.**

- [x] The pages nearest the change still work — no pages. The things nearest it are the documents that quote these rules, checked below
- [x] Any shared file touched checked from a second, unrelated place — `CLAUDE.md` and the skill are both read by every session, so:
  - **The merge rule does not contradict the merge train.** `CLAUDE.md`'s workstream step 4 says "once the user says so, merge it — except for a release's own two PRs". The section this PR edits is the one that step points at, and its closing line **"Everything else still needs his go: feature PRs are unchanged, and a red check is never merged past on any PR, release or not"** is intact at line 191 and still true. Verified by reading both
  - **The delta rule does not contradict "never diff against the previous edition".** That earlier finding was about the backlog-derived lists, and the new rule carves them out explicitly in a blockquote — repo facts re-read every time, prose only as a delta. **This was the one real contradiction risk in the change and it is the reason that blockquote exists**
  - **The promoted bands do not duplicate the handover.** The band table and the ~128k baseline now exist once, in the skill; the handover cites them and says "do not recopy them here". Checked by grepping the handover for the figures: `126,512`, `235,561` and the band rows appear **zero** times in it
  - **`docs/release-procedure.md` rule 4 is untouched** and this PR does not restate it — the skill cites it as the worked example
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and the gates ran green on the merged tree
- [x] **The ceiling is respected by the document that introduces it** — `wc -l docs/planner-handover.md` is **149**, under the 150 limit, and the figure stated inside the file matches the measured one. Caught and fixed twice while writing: the file first came in at 152, over its own limit, and then claimed 147 when it was 151

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: this PR closes no backlog item; it was asked for directly in chat. `docs/backlog.md` is deliberately untouched here
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — **deliberately not a separate file: the decision is the rule, and it is written where the rule lives.** The skill's step 8 carries his words and the reason, `CLAUDE.md` carries the merge rule with its reason, and both name the scope boundary. A decision file would be a third copy of the same text, which is the exact fault this PR fixes. The release side's half is already recorded in `docs/decisions/2026-10-20-release-paperwork-speedup.md`, which this PR cites rather than restates
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe either handover
- [ ] **Release notes.** — n/a: nobody outside the planning loop would notice. No page, component, manual topic, i18n string or Worker code changes; the files are not served and no shelter user is affected
- [x] Commit messages say why, not just what — the commit states what was asked, what was deliberately not done, and why the two promotions are what make the ceiling reachable rather than aspirational
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the "no auto-merge switch anywhere" claim was **checked, not assumed**: `grep` for auto-merge across `CLAUDE.md` and `docs/release-procedure.md` returns nothing, and `mcp__ccd_pr__get_status` reported `auto_merge: false`. The line counts are `wc -l`. The "27 consecutive streams at sonnet/low" figure is nine readings from this round added to the previous edition's eighteen. `docs/decisions.md` is untouched

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager. Nothing in this PR reaches a deployed build: none of the three files is bundled
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: no logic in this PR, so nothing derives a date at runtime
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the "bands" this PR changes are planning estimates in prose read by a human, not a threshold any code evaluates, so there is nothing to assert against. No rounding rule, retry window, pagination limit or permission cutoff is touched
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in section 2 is pasted from the run; the line counts in section 6 are `wc -l` output
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: neither
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR restores the 400-line handover, the previous skill and the previous `CLAUDE.md` merge rule. No schema, no deployed artefact, no configuration. **What it does not cover:** nothing, because nothing outside these three files changed — in particular this PR did **not** touch the `backlog` branch's pre-commit guards, so the route by which a rules file can reach `main` without review is exactly as it was before

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover first came in at **152 lines — two over the 150 limit the same PR introduces** — and then stated 147 when it was 151. A document announcing a ceiling is the one place that ceiling must hold | **fixed** — trimmed to 149 by dropping the twenty-one-edition PR list, which is the first thing the new shape says to drop, and the stated figure now matches `wc -l` |
| 2 | low | The `backlog` branch can still carry any file, and the daily `git merge backlog` pushes straight to an unprotected `main` — the route by which a `CLAUDE.md` rule reached `main` with no PR on 2026-10-07, and a misfiled backlog line on 2026-10-19. The pre-commit hook guards migration numbering and backlog sections but not which paths that branch may touch | **deferred to backlog** — out of scope here, offered to Lutan in chat as a ~10-line third guard, and left for him to call. **Not caused or widened by this PR** |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the new handover is actually enough to plan from.** Only the next `/plan-day` chat can show this: it is 149 lines where its predecessor was 400, and the judgement that nothing load-bearing was dropped is mine. If the next planner has to re-derive something this file should have told it, the ceiling is too low or the wrong things were promoted | The next `/plan-day` in a fresh chat, reading `docs/planner-handover.md` |

That one row is a genuine unknown rather than a deploy step: a person (or the
next session) has to use the document before anyone can say the cut was right.
It is not a section 8 check and nothing at deploy time closes it.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Daily Planner session)  Date: 2026-10-21

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, so only the person who looked may tick it; the outstanding item is on the signature line below

Manual verification by: pending: the next /plan-day chat has not run yet against the new shape

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: rules and documentation only — nothing in this PR reaches a deployed build
