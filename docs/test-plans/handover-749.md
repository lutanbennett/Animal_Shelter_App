# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover `749` — a delta against `748`, correcting its floor claim and reporting `748`'s plan's complete set of six |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping. The four items this plan filed (`#8t3rk`, `#k7vnd`, `#w9xpq`) and the two it ticked (`#d6xhs`, `#n2bkc`) went on the `backlog` branch, where backlog edits belong |
| Branch / worktree | `claude/handover-749` @ `C:\Development\Animal_Shelter_handover-749` |
| Dev server | not started — no code and no page changes |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | `f2d909d06` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — edition `749` of `docs/planner-handover.md`, written at the setup of this plan's LAST batch, as `SKILL.md` requires
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/planner-handover.md` and this plan. **Two markdown files; no route, no worker, no migration, no shared lib, no code**
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **none.** The file is not served by the app; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `docs/release-handover.md` is untouched (the release side's edition is the release manager's, per `docs/release-procedure.md` rule 3). **No production apply is performed or attempted here**, although this edition's first owed item is that production is four migrations behind — that is `#w2knt` and it is the release manager's. `.plan-day.md` is gitignored and is not in this PR

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — **refused by design and the branch was already current.** `sync` printed *"worktree: run 'git pull' in the main checkout instead"*; the main checkout had been pulled earlier in this same session and this worktree was branched from `origin/main` afterwards. **Verified rather than assumed: `git rev-list --count HEAD..origin/main` is 0**, so there was nothing to merge in
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 6s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 119s
=== gates: test — npm test
=== gates: test exited 0 after 34s
=== gates: build — npm run build
=== gates: build exited 0 after 45s
gates: typecheck=0 lint=0 test=0 build=0
```

**Run on `f2d909d06`, which is the head this PR opens from.** Nothing changed in the tree between the run and the PR except this plan, which is committed after it — the same order edition `748` used.

**AND THE GATES WERE RUN TWICE, ON PURPOSE, WHICH IS WHY THIS PLAN QUOTES THE SECOND RUN.** The first run was clean on `21a9bd82a`, and the handover was then **trimmed from 207 lines to 197** (defect 1), so that run no longer described the tree. Edition `748` recorded `747` declaring exactly this situation rather than re-running it. **A second five-minute run costs machine time and nothing of Lutan's, so the record is true instead of annotated** — the block above is the second run's own output.

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR, and none was run against production in this session. The four pending files are named in `#w2knt`, measured by the plan of 2026-11-14 that filed it
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code reads any table differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: nothing in this PR to apply. The four files that DO need applying are named in `#w2knt`, and this edition adds one consequence to it: `0377` creates the report-photo bucket, so batch 2's retention job cannot run on production until it is applied

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a markdown document with no code path; its reader is the next planner chat
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the checkable content of this edition is its **figures**, and each was read from a `stream-usage:` comment on a merged PR with the floor computed as `tokens − messages` rather than estimated. **The lead's claim was verified by subtraction:** `card-boxes-triage` 218,409 − 131,678 = **86,731** and `report-animal-photo` 212,067 − 125,810 = **86,257**, both started `2026-11-14T00:32Z`, a difference of **474**. **Two of the six readings were excluded and marked rather than averaged in** — `report-animal-photo` is `rescoped=yes` and `wording-small-two` reported `unmeasured` — and the floor is still comparable across those, which is why the lead rests on them

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | the document is not served by the app | n/a: no route, no page, no API |
| exactly `run_merch_shop` | nothing new | as above | n/a: no card governs a repo document |
| exactly `manage_shop_page` | nothing new | as above | n/a: no card governs a repo document |
| signed out | nothing new | as above | n/a: no route, no page, no API |

- [ ] Every login above tested — n/a: the change adds no route, page or API, so there is nothing for any login to reach
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no URL exists to hit

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` untouched by this PR. **It is being changed by `admin-nav-reachability` on its own branch**, which is `#fc7te`'s work and not this one's
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: a planner process document, not shelter-facing help
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none exist; the only regression risk is at build time and `npm run build` exited 0 with the file in place
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; `git show --stat` is two markdown files
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing came in: the branch is 0 commits behind `origin/main`, verified with `git rev-list`, and the four gates ran after that check

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: no backlog item. This plan's filings and ticks went on the `backlog` branch in two commits (`f559e932c`, `2a35760c0`), as the rule requires
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: the handover records this plan's findings itself and is replaced by its successor; a decision file would duplicate it. **This plan's real decisions already have their own files**, written by the streams that made them — `2026-11-14-cooperjaidee-hostnames.md`, `2026-11-14-merch-photo-upload.md` and the probe fixture's
- [x] `README.md` still accurate — unchanged by this PR and it does not describe the handover
- [ ] **Release notes.** — n/a: a planner-to-planner process document; no shelter user can reach it or notice it
- [x] Commit messages say why, not just what — the commit names the floor correction and what survives it, `#x5tbv`'s answer, `#j4m8w` shipping as a recommendation, the four filed items, and the stale count the planner pasted into a brief
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The floor correction is arithmetic on two published figures, shown above. **`748`'s "streams started together share it" was narrowed because the later readings contradicted it, not repeated** — the same discipline `748` applied to `747`. The probe-count correction (392 boxes, 0 faults, 1,630 probes) is #1592's own before-and-after measurement, and the edition says plainly that the planner had pasted the stale figure into that stream's brief

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code, so nothing derives a date at runtime. The edition's own dates were read from the system clock and compared against its predecessor's, which is the date check `SKILL.md` requires
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary logic. The bands in this edition are prose read by a person, not a computed threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block is the run's own lines from its output file, each gate with its own timing
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var in this PR. **`#x5tbv` asks him for one and he answered it today** — `SUPABASE_ACCESS_TOKEN` as a repository secret, for a scheduled run against dev — but **adding it is his and nothing here depends on it**

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager. **It is the step `#w2knt` exists to make sure happens**, and `0375` is the reason: it re-owns 90 objects and a wrong re-own makes views read 0 rows
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager, per `#w2knt`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this one commit restores edition `748`, and it covers everything this PR changes, because the PR changes one document and no schema or deployed behaviour. **What it does NOT cover:** the two `backlog`-branch commits (`f559e932c`, `2a35760c0`) that ticked `#d6xhs`/`#n2bkc`, recorded `#x5tbv`'s answer and filed `#8t3rk`, `#k7vnd` and `#w9xpq` — separate commits on a separate branch. **And it would put back `748`'s claim that streams started together share the floor to the token**, which this edition's lead shows does not replicate; that is the one thing worth knowing before anybody reverts it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **197 lines against `SKILL.md`'s ~150-line target — over by a third, and a REGRESSION against `748`'s 166.** It was first written at 207 and trimmed to 197 in five passes (the `#j4m8w` bullets, the shipped list, the count section, the filed items, and the two-mitigations section folded into a paragraph); further cuts would have deleted evidence the next planner would then re-derive, which is the cost the length is buying. Accepted, **and named as something the next edition should attack rather than inherit**: the series reads 746 → 229, 747 → 200, 748 → 166, 749 → 197, so the target is reachable and this edition did not reach it | accepted |
| 2 | low | **The planner pasted a stale count into a brief this session** — `check-who-does-what`'s "9 probe faults out of 385 boxes", true of its first run and cleared by #1583 hours earlier. `receipt-probe-fixture` caught it at step zero and reported it. **Not a defect in this PR**; recorded here because the edition and `#k7vnd` both carry the correction, and because it is the second time in three days that step zero has caught the brief rather than the item | accepted |

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
