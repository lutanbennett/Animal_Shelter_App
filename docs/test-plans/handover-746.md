# Feature test plan

## Header

| | |
|---|---|
| Feature | Planner handover, edition `746` — a delta against `745` |
| Backlog item | `docs/backlog.md` → none; the handover is process bookkeeping, not a backlog item |
| Branch / worktree | `claude/handover-746` @ `C:\Development\Animal_Shelter_handover-746` |
| Dev server | not started — no code and no page changes |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner session) / 2026-11-14 |
| Carries a migration? | no |
| Tested at SHA | 2e2996bf8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one file, `docs/planner-handover.md`, replaced with edition `746`; written at setup of the plan's last batch, as `SKILL.md` requires
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `docs/planner-handover.md` and `docs/test-plans/handover-746.md`. No route, no worker, no migration, no shared lib
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — none. The file is read by one planner chat and is served to nobody; admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — `docs/release-handover.md` is untouched (the release side's own edition is written by the release manager, per `docs/release-procedure.md` rule 3). No `.plan-day.md` content is in this PR; that file is gitignored on purpose

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 58s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 168s
=== gates: test — npm test
=== gates: test exited 0 after 41s
=== gates: build — npm run build
=== gates: build exited 0 after 136s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration, and no code reads any table differently
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a markdown document with no code path; its reader is the next planner chat
- [ ] Data persists — reload the page and the change is still there — n/a: no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no feature surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no rows
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input. The one date claim in the document (that this plan spans 2026-11-13 and 2026-11-14) was read from the system, not inferred from a file

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
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is a process document for one Claude chat, not shelter-facing help
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no page
- [ ] Browser console clean — no errors or React warnings — n/a: no page
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — none exist; the regression risk here is a build-time one and `npm run build` exited 0 with the file in place
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; `git show --stat` is one file plus this plan
- [x] Nothing merged from `main` during `sync` was broken by this branch — `sync` reported "Already up to date", so nothing came in, and the four gates ran after it

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: no backlog item; the four findings this plan filed went on the `backlog` branch, as the rule requires
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`) — n/a: the handover records this plan's findings itself and is replaced by its successor; a decision file would duplicate it
- [x] `README.md` still accurate — unchanged by this PR and it does not describe the handover
- [ ] **Release notes.** — n/a: a planner-to-planner process document; no shelter user can reach it or notice it
- [x] Commit messages say why, not just what — the commit names the brief-length result, the area-band finding and the `create role` dispute, which are why the edition exists
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the edition was read from a `stream-usage:` comment on a merged PR, the floors computed as `tokens − messages`, and the brief character counts taken from the files; the `create role` dispute is two quoted measurements with their dates, presented as a dispute rather than resolved

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code, so nothing derives a date at runtime
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary logic. The usage bands in the document are prose read by a person, not a computed threshold
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block above is the run's own lines, copied from the output file, including each gate's own timing
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration and no code
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — `git revert` of this one commit restores edition `745`. It covers everything this PR changes, because the PR changes one document and no schema or deployed behaviour. What it does **not** cover: nothing — and the planner reading `745` again would simply be reading a superseded edition, which is the ordinary failure mode of this file and is corrected by its successor rather than by a rollback

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The edition is **229 lines against `SKILL.md`'s ~150-line target.** Accepted rather than trimmed: this plan spanned two dates, disproved the brief-length hypothesis with a control it inherited, and found an area-wide banding fault, and cutting any of the three would hand the next planner a question already answered | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing | the list is empty: there is no surface a person needs to look at, and the document's own reader is the next planner chat |

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
