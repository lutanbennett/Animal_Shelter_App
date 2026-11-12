# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover edition `741`, and raising the bands table's default row in `SKILL.md` |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping and closes no item |
| Branch / worktree | `claude/planner-handover-741` @ `C:\Development\Animal_Shelter_planner-handover-741` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3009` (not started; no runtime surface) |
| PR | #1518 |
| Tested by / date | Claude (planner) / 2026-11-12 |
| Carries a migration? | no |
| Tested at SHA | 40a9a254 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — replaces `docs/planner-handover.md` with edition `741` and raises one row of the bands table in `.claude/skills/plan-day/SKILL.md`; there is no backlog item, and `CLAUDE.md` makes the handover's own PR Claude's to merge on green
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — exactly two files: `docs/planner-handover.md` and `.claude/skills/plan-day/SKILL.md`. No route, no `worker/`, no migration, no shared lib
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — **no card is affected**: neither file is read at runtime by the app. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — out of scope: `reference.md`, `brief-blocks.md`, any other bands row, and `docs/release-handover.md`. The bands change is the single row *ordinary well-briefed stream*, 120–145k to 146–175k

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.** Run on `40a9a254`, output as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 268s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 436s
=== gates: test — npm test
=== gates: test exited 0 after 88s
=== gates: build — npm run build
=== gates: build exited 0 after 447s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration and no table is read by either file
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: two markdown documents, no runtime path to exercise
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: documents only, no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows and no screen
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: nothing takes input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input and no computation

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing changed by this PR | unaffected | unaffected, confirmed by the file list in section 1 |
| exactly `n/a` | n/a: no card reads either file | n/a | n/a |
| exactly `n/a` | n/a: no card reads either file | n/a | n/a |
| signed out | nothing changed by this PR | unaffected | unaffected, confirmed by the file list in section 1 |

- [ ] Every login above tested — n/a: neither file is read at runtime, so no login can reach a difference
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: this PR adds no URL and no server action

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` untouched; no nav entry added
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is for the planner chat, not for shelter users; the manual describes the app
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing string; both files are English planner documents
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no screen
- [ ] Browser console clean — no errors or React warnings — n/a: no page loaded; nothing in this PR runs in a browser
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no pages

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no pages are near the change; instead the two consumers of the changed files were checked: `node scripts/check-docs-only.mjs` behaviour is unaffected (the PR touches `.claude/` as well as `docs/`, so it is correctly **not** docs-only), and `SKILL.md` still parses as markdown with the bands table intact, verified by reading line 342
- [x] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — **by loading that page, not by reading the file** — n/a as written, and here is the honest substitute: no shared *runtime* file was touched, so there is no page to load. `SKILL.md` is shared between planner sessions rather than between pages, and the anchor it is read by (the bands table row) was changed by a script that exits non-zero if the anchor is missing
- [x] Nothing merged from `main` during `sync` was broken by this branch — the full gates ran **after** `sync`, on the merged tree, and all four exited 0

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: the handover closes no backlog item, and today's findings were filed on the `backlog` branch as the rules require
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a as a new file, and deliberately: the handover **is** the record of the day's reasoning, and `CLAUDE.md` says it outranks nothing and is replaced by its successor. Adding a decision file beside it would create a second home for the same prose. The one durable change, the bands row, carries its evidence in the handover's own *WHAT `740`'s OWED ITEMS DID* section
- [x] `README.md` still accurate — unchanged by this PR and checked: it does not quote the bands table or the handover
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a planner handover and an internal banding table; no shelter user can see either, and nothing in `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/` is touched
- [x] Commit messages say why, not just what — the commit explains why the bands row moved (twenty figures without a hit, lowest valid reading 146,479) rather than only that it moved
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in edition `741` was read from a merged PR's `stream-usage:` comment or from a CI log, not inferred. The four excluded readings each name the field that excludes them (`finished=blocked`, `rescoped=yes`, no comment). The UAT Drive numbers (347 folders, 916 files, 0 shared) are `drive-sharing.mjs`'s own summary output, and the `text/html` finding on `drive.google.com/thumbnail` was measured by content type and magic bytes rather than by status code

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: this PR contains no logic and derives no date; both files are static markdown
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: the "banding" here is a planner's prose estimate in a markdown table, not a threshold any code evaluates. Nothing reads 146–175k at runtime
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block in section 2 is the file `scripts/gates.mjs` wrote to the scratchpad, including its per-gate `after <S>s` timings, pasted unchanged
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page is affected by a planner document

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover** — reverting this PR's commit restores edition `740` and the 120–145k bands row, and that is the whole rollback: neither file is deployed, read by the Worker, or present in the build output, so no Pi rebuild or `wrangler rollback` is involved and there is nothing for a down-migration to cover. What a revert does **not** undo: the backlog items filed today on the `backlog` branch, which are separate commits and are meant to survive

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first attempt to write this edition used a quoted bash heredoc and failed to parse; an earlier backlog note written through `node -e` in double quotes had every backticked identifier blanked by command substitution and needed a repair commit | fixed — the note was repaired, and both traps are recorded in edition `741`'s *STANDING CHECKS* so the next planner meets them in writing rather than by accident |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Whether raising the bands row to 146–175k is the right call, or whether the planner should have asked first. It is evidence-based (twenty figures, lowest valid reading 146,479) and the skill's own text licenses revising bands from the actuals, so it was taken as a planner judgement rather than a decision of Lutan's — but he may disagree, and the revert is one commit | `.claude/skills/plan-day/SKILL.md` line 342, and the reasoning in `docs/planner-handover.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's view on the bands row change, row 1 above

Manual verification by: pending: Lutan's view on raising the bands table's default row

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — n/a as a separate act, and said plainly: this PR deploys nothing, so there is no production step to hand over. Section 8's `deferred: release manager` lines are the ordinary release-cut ones and will be satisfied by whichever release next ships

Result: pass

Release manager acknowledgement: n/a: nothing in this PR reaches production
