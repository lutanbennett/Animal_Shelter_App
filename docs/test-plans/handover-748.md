# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover `748` — a delta against `747`, carrying the 2026-11-14 plan's complete set |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping. The three findings this plan filed (`#w2knt`, `#x5tbv`, `#r9pzq`) went on the `backlog` branch, where backlog edits belong |
| Branch / worktree | `claude/handover-748` @ `C:\Development\Animal_Shelter_handover-748` |
| Dev server | not started — no code and no page changes |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | `70889426c` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — edition `748` of `docs/planner-handover.md`, written because Lutan asked for it in terms (*"can you write the handover and merge it"*) once all six streams of the 2026-11-14 plan had merged
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/planner-handover.md` and this plan. **Two markdown files; no route, no worker, no migration, no shared lib, no code**
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **none.** The file is not served by the app; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `docs/release-handover.md` is untouched (the release side's edition is the release manager's, per `docs/release-procedure.md` rule 3). **No production apply is performed or attempted here**, although this edition's first owed item is that production is four migrations behind — that is `#w2knt` and it is the release manager's. `.plan-day.md` is gitignored and is not in this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 46s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 157s
=== gates: test — npm test
=== gates: test exited 0 after 52s
=== gates: build — npm run build
=== gates: build exited 0 after 173s
gates: typecheck=0 lint=0 test=0 build=0
```

**Run on `70889426c`, which is the head this PR opens from** — unlike edition `747`, where edits landed while the run was in flight and had to be declared. Nothing changed in the tree between the run and the PR.

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR. (`--status --env production` *was* run today, as the measurement behind `#w2knt`: 376 applied, 4 pending. That is a read, not an apply, and nothing was sent to production)
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code reads any table differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing in this PR to apply. The four files that DO need applying are named in `#w2knt` with the strict-lint step that follows them

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a markdown document with no code path; its reader is the next planner chat
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the checkable content of this edition is its **figures**, and every one was read from a `stream-usage:` comment on a merged PR with the floor computed as `tokens − messages`: 86,037 / 86,731 / 87,050 / 89,505 (twice) / 89,659. **The claim that two streams matched to the token was verified by subtraction, not by eye**, and it is the evidence for narrowing `747`'s "constant" wording

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | the document is not served by the app | n/a: no route, no page, no API |
| exactly `<card key>` | nothing new | as above | n/a: no card governs a repo document |
| exactly `<card key>` | nothing new | as above | n/a: no card governs a repo document |
| signed out | nothing new | as above | n/a: no route, no page, no API |

- [ ] Every login above tested — n/a: the change adds no route, page or API, so there is nothing for any login to reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` untouched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a planner process document, not shelter-facing help
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none exist; the only regression risk is at build time and `npm run build` exited 0 with the file in place
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; `git show --stat` is two markdown files
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported "Already up to date", so nothing came in, and the four gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: no backlog item; this plan's three filed findings went on the `backlog` branch, as the rule requires
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: the handover records this plan's findings itself and is replaced by its successor; a decision file would duplicate it. **The day's two real decisions already have their own files** — `2026-11-14-product-name.md` (merged in #1587) and the six streams' own
- [x] `README.md` still accurate — unchanged by this PR and it does not describe the handover
- [ ] **Release notes.** — n/a: a planner-to-planner process document; no shelter user can reach it or notice it
- [x] Commit messages say why, not just what — the commit names the four-unders finding, the narrowing of `747`'s floor claim, and that production is four migrations behind
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The four under-band readings were each checked for `compacted`, `rescoped` and matching dials before being counted; the production figure came from `--status --env production` rather than from assumption; and `747`'s "constant of the harness" claim was **narrowed because the later readings contradicted it**, rather than repeated

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code, so nothing derives a date at runtime
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary logic. The bands in this edition are prose read by a person, not a computed threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block is the run's own lines from its output file, each gate with its own timing
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var. **Whether CI should hold `SUPABASE_ACCESS_TOKEN` is a question this edition raises and does not answer** — it is `#x5tbv`, and it is Lutan's

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager. **It is the step `#w2knt` exists to make sure happens**, and `0375` is the reason: production's schema has drifted from dev before
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing in this PR. `0375` is an ownership change rather than a rewrite, and its rollback SQL is in its own decision file
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, per `#w2knt`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this one commit restores edition `747`, and it covers everything this PR changes, because the PR changes one document and no schema or deployed behaviour. **What it does NOT cover:** the three `backlog`-branch commits that filed `#w2knt`, `#x5tbv` and `#r9pzq`, which are separate commits on a separate branch. Reverting would also put back `747`'s overstated claim that the floor is a constant of the harness, which is the one thing worth knowing before anybody does it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **166 lines against `SKILL.md`'s ~150-line target** — over, but closer than its two predecessors (`747` 200, `746` 229). Accepted: the four-unders finding needed its table, and narrowing the floor claim needed the six readings shown rather than asserted | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | the list is empty: there is no surface a person needs to look at, and the document's reader is the next planner chat |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-14

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a planner-to-planner process document with no page, route or user-facing string — there is nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: n/a: docs-only, nothing to deploy
