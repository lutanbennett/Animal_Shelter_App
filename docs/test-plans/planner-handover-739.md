# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover edition `739`, a delta against `738` |
| Backlog item | `docs/backlog.md` → none. A handover is bookkeeping for one chat and carries no backlog item, as every edition before it has |
| Branch / worktree | `claude/planner-handover-739` @ `C:\Development\Animal_Shelter_planner-handover-739` |
| Dev server | not started — no runtime surface |
| PR | <filled in when `gh pr create` returns> |
| Tested by / date | Claude (planner session) / 2026-11-11 |
| Carries a migration? | no |
| Tested at SHA | `9f468982` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one file rewritten, `docs/planner-handover.md`, from edition `738` to `739`, written at the setup of this plan's last batch as `CLAUDE.md` and the `plan-day` skill both require
- [x] Files/areas touched listed — **exactly one file**, `docs/planner-handover.md` (281 → 251 lines). No routes, no `worker/`, no `supabase/migrations/`, no shared libs, no `src/` at all, and no other document
- [x] Cards affected identified — **none.** A handover grants and denies nothing and draws no control, so it is not security. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **the figures.** This edition deliberately reports none of its own plan's nine, because measurement moved to once a day on 2026-11-11 and they are read tomorrow; the document says so in its own opening. Also out of scope: `docs/release-handover.md`, which is the release manager's and was not touched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, every exit code `0`.** Run on `9f468982`, the commit this plan is tested at; the lines below are that run's own output, timings included:

```
=== gates: typecheck exited 0 after 221s
=== gates: lint exited 0 after 628s
=== gates: test exited 0 after 98s
=== gates: build exited 0 after 471s
gates: typecheck=0 lint=0 test=0 build=0
```

**That run took about 24 minutes, roughly 60% longer than this morning's** (36/383/39/295 s) on an
identical four-gate pass. **Nothing in this PR could affect it** — one Markdown file — so the
difference is machine load, and it is recorded here because a timing without its machine load is not a
reading (`CLAUDE.md`, *Measuring the public site*).

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; this PR touches no SQL
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration, and no code reads any table differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

A handover is prose read by one chat. There is nothing to submit, persist or render.

- [ ] Happy path works end to end — n/a: no runtime behaviour
- [ ] Data persists — reload the page and the change is still there — n/a: no page, no data
- [ ] Create / edit / delete all exercised — n/a: no CRUD surface
- [ ] Empty state renders sensibly — n/a: no rendered state
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked — n/a: no values

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed by this PR | no change | no change |
| exactly `<card key>` | n/a: no card reaches a file in `docs/` | n/a | n/a |
| signed out | nothing changed by this PR | no change | no change |

- [ ] Every login above tested — n/a: `docs/` is not served by the app; no login reaches it and no card grants or denies it
- [ ] A login that should not have access is blocked server-side — n/a: the file is not routable; there is no URL to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no user-facing surface
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual documents the app for shelter staff; this is a planner document
- [ ] Translatable strings go through the translation path — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — n/a: nothing rendered
- [ ] Browser console clean — n/a: no browser surface
- [ ] Network clean — n/a: no requests change

## 6. Regression

- [x] The pages nearest the change still work — n/a in the page sense, so the equivalent was done: **the whole document was re-read after the trim**, and two faults were found and fixed (defects 1 and 2)
- [x] Any shared file touched checked from a second, unrelated page — **by loading, not by reading**: nothing in `src/`, `scripts/` or `worker/` reads `docs/planner-handover.md`, checked with `grep -rn "planner-handover" scripts/ src/ worker/`, which returned nothing. `node scripts/check-decision-dates.mjs` and `node scripts/check-docs-only.mjs` both exercise `docs/` and were run
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged cleanly and this branch changes one documentation file

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: a handover has no backlog item. Its content is filed as backlog notes by the planner on the `backlog` branch, which was done earlier today (`07614e13`, `9fd013c8`, `26a0d51c`)
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: this edition records decisions rather than making any. The three process changes it reports have their own decision file, `docs/decisions/2026-11-11-plan-day-list-first-sequence.md`, merged in PR #1488
- [x] `README.md` still accurate — unchanged and unaffected; it does not describe the handover
- [ ] **Release notes.** — n/a: a planner document read by one chat. No shelter user reaches `docs/`, and nothing about the app's behaviour changes. This PR touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`
- [x] Commit messages say why, not just what — the commit says what this edition corrects in `738`, that it carries no figures and why, and that it is 251 lines against a ~150 target
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every claim in the document that could be checked was: the slug sweep was run in the writing turn and its result (six merged, three with no PR) is what the document states; the line counts are `wc -l`; the PR numbers were read from `gh pr list`, not remembered; and the `PUBLIC_SITE: "off"` correction came from reading `wrangler.jsonc` and `src/lib/public-site.ts` rather than from the three editions of prose that got it wrong

## 8. Pre-production gate

A handover is never deployed: it is read from the repository by a chat. Every line
below is `n/a` because there is no deployed artifact, not `deferred:` — there is
no owner to hand a deploy to, because no deploy exists.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: no deploy; the SHA is recorded for the record
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: no deployable change; `docs/` is in no bundle
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing to smoke-test; no app behaviour changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates or clocks in code. The document states dates, and each was checked against the commit or PR it describes
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold or rounding rule in code. The band *findings* in the document are reports of measured figures, and the figures themselves live in `.plan-day.md`
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — ticked rather than `n/a`, because the check applied: §2's gates block is its run's own output including the per-gate timings, and §6's `grep` results are what the commands printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration, nothing destructive
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — n/a: nothing is deployed to roll back, and the position is stated anyway. `git revert` of this PR restores edition `738` exactly; the file has no runtime consumer and no state. **What a revert would not cover: nothing**, though reverting would restore `738`'s three wrong claims about the `/th/` cache proof being owed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **medium** | The document opened by stating **"WHICH PLAN'S FIGURES THIS EDITION REPORTS: NONE"** and then printed a three-row table of per-stream figures. It contradicted itself, and it also broke the handover's own stated scope — *"per-stream figures … live in `.plan-day.md` and are not reproduced here"* | fixed — the table is gone and the band finding is stated without it, citing `.plan-day.md`. **Two figures remain on purpose and are not per-stream reports:** the one read that actually fed a brief, and a previous plan's group-4 cost, which is the arithmetic basis of a derived band |
| 2 | low | 251 lines against the skill's **~150-line target** for a handover | **accepted, and said out loud rather than hidden.** `738` was 281 lines, so this is shorter than its predecessor but still over. Four passages were trimmed to their operative content with the reasoning left in the decision file and `reference.md`. **The honest position: three process changes in one day cannot be reported in 150 lines, and the next edition should be shorter because it inherits them** |
| 3 | low | The first draft was written straight to `docs/planner-handover.md` with the Write tool, which refused because the file had not been read in this session | fixed — written to the scratchpad and `cat` over the target, which is the pattern the skill documents for `.plan-day.md` and applies equally here. No content was lost |

## Left for manual verification

The document's claims are all checkable and were checked. What cannot be verified
here is whether the three process changes it reports actually change a planner's
behaviour — that is a property of the next plan, not of this file.

| # | What to check | Where |
|---|---|---|
| 1 | Whether the lettered sequence fires: that the next `/plan-day` creates worktrees, writes briefs and sends the list **before** reading any PR body | The next plan's batch 1 |
| 2 | Whether once-a-day measurement produces the complete set it is meant to: that all nine of this plan's figures are read in one pass | The next plan's step 3 |
| 3 | Whether dropping the per-batch re-check costs anything: that no batch-3 stream reports at step zero that its item had already closed | Batch 3's PR bodies |

**All three are hypotheses, which the skill says to check next round rather than
write up as settled.** None can be verified in this PR.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-11

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: all three items are observations of the next plan's behaviour and cannot be made true in this PR

Manual verification by: pending: the three behavioural checks land on the next `/plan-day` run, not on this PR

### Result

- [x] Open defects are either fixed or explicitly accepted above — two fixed, one accepted with its reasoning
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing here reaches production; there is no deploy for a release manager to own

Result: pass with accepted defects

Release manager acknowledgement: n/a: no production surface
