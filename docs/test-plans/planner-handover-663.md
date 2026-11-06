# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover `663`, and three durable rules promoted into the `plan-day` skill |
| Backlog item | `docs/backlog.md` → none. The handover is required by the `plan-day` skill (step 8), not by a backlog item |
| Branch / worktree | `claude/planner-handover-663` @ `C:\Development\Animal_Shelter_planner-handover-663` |
| Dev server | not started — no runtime surface in this change |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | ``7747f36e`` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — rewrites `docs/planner-handover.md` as edition `663` and adds three rules to `.claude/skills/plan-day/SKILL.md`; the skill's step 8 is what asks for it
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two files: `docs/planner-handover.md` and `.claude/skills/plan-day/SKILL.md`. No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **none.** Neither file is read by the app at runtime; no card's behaviour changes, and admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: the role-shaped check scripts (owed, fourth edition), applying `0318`–`0321` to production (his), and PR #1314 (the release manager's)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 66s
=== gates: lint exited 0 after 145s
=== gates: test exited 0 after 21s
=== gates: build exited 0 after 142s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration and no table is read by this change
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing to apply from this PR. **Separately, and recorded in the handover rather than owed by it:** `0318`–`0321` are pending on production, read 2026-11-06

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two markdown documents, no code path to exercise
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no create, edit or delete surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: nothing renders
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing — neither file is served | n/a | n/a: no surface |
| signed out | nothing — neither file is served | n/a | n/a: no surface |

- [ ] Every login above tested — n/a: neither file is served to any login; there is nothing to reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL serves either file

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no nav change; `NavLinks.tsx` is untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the manual is for shelter users; this is planner process documentation
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; nothing in `src/lib/i18n/` is touched
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no rendered surface
- [ ] Browser console clean — no errors or React warnings — n/a: no rendered surface
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no pages are near it, and the four gates ran clean over the whole tree, including a full `next build`
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — no shared file is touched: `git diff --numstat` shows exactly two markdown files
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` merged `origin/main` cleanly and the gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: no backlog item; this is the skill's own step 8. **Three items were filed and one ticked this round, all on the `backlog` branch, which is where they belong**
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: the design choices ARE the two documents. A decision file restating a handover would be a third copy of one list
- [x] `README.md` still accurate — unchanged by this PR and still correct; it does not describe the handover
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: nobody outside this planning loop reads either file, and no shipped behaviour changes
- [x] Commit messages say why, not just what — the commit explains that three rules were promoted *because* a handover is rewritten every nine streams and a rule in one is lost
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — every figure in the handover is from a `stream-usage:` PR comment or a command run this round. The floors are re-derived, not carried forward; `unmeasured` is written where a stream reported it; the production migration count was read with `apply-migrations.mjs --status --env production`; and the one reasoned claim (that two migration streams in one batch did not collide by luck) **is labelled as such in the text**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date or time logic in this change
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no code boundary. The token bands this PR edits are planning guidance, not a computed banding
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block in section 2 is pasted from `gates-663.out` exactly as the run wrote it
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this commit restores edition `654` and the previous skill text. **What it does not cover:** nothing, because nothing is deployed and no database is touched. A revert would, however, lose the three promoted rules, which is the point of promoting them — so a revert should re-file them rather than drop them

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The handover is **185 lines** against the skill's ~150 target | accepted. Content was cut twice, by **promotion** into the skill rather than rewording, which is the lever the skill prescribes; what is left is this round's required delta (each `654` warning's status, the lead, the PR-body findings, the owed list). The skill says never to trade accuracy for the number |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing. Neither file has a rendered surface, and both are read by Claude sessions rather than by a
person using the app.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — the list is empty: there is no rendered surface and nothing for a person to look at

Manual verification by: n/a: no rendered surface — two markdown documents read by Claude sessions, not by a user

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet handed over — this PR precedes the next release
