# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Planner handover, edition `745` — a delta against `744` |
| Backlog item | `docs/backlog.md` → none; the handover is a process document, written at the setup of a plan's last batch (`CLAUDE.md`, "Every PR merges on green") |
| Branch / worktree | `claude/handover-745` @ `C:\Development\Animal_Shelter_handover-745` |
| Dev server | not started — no code changed |
| PR | https://github.com/lutanbennett/Animal_Shelter_App/pull/1566 |
| Tested by / date | Claude (planner session) / 2026-11-13 |
| Carries a migration? | no |
| Tested at SHA | 53f0be2ed |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

One sentence: `docs/planner-handover.md` is replaced with edition `745`, a delta against `744`.
Files touched: `docs/planner-handover.md` and `docs/test-plans/handover-745.md`. **Nothing else** — no
route, no `worker/`, no migration, no shared library, no dictionary.
**Cards affected: none.** The file is not read by the app at all; it is read by one planning chat.
Admin and the signed-out public are unaffected for the same reason.
**Out of scope:** the two merged PR bodies (#1557, #1560) that cite decision filenames which do not
exist. The handover records that debt; it cannot pay it, because `gh pr comment` is refused in this
session and asking another session to post it would be permission laundering.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 173s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 386s
=== gates: test — npm test
=== gates: test exited 0 after 146s
=== gates: build — npm run build
=== gates: build exited 0 after 436s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no runtime surface; the file is read by a planning chat, never by the app
- [ ] Data persists — reload the page and the change is still there — n/a: no runtime surface
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no runtime surface
- [ ] Empty state renders sensibly (no rows yet) — n/a: no runtime surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | nothing: the file is not served | no card gates a document in `docs/` | n/a |

- [ ] Every login above tested — n/a: the change adds no reachable surface, so there is nothing a login could reach differently
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: the change adds no reachable surface

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched, no new page
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the handover is for a planning chat, not a shelter user; the manual documents the app
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — the four gates build every page; nothing else reads this file
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; the diff is two files under `docs/`
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the handover has no backlog item; it is written at the setup of a plan's last batch
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: the handover IS the record; a decision file about writing it would be a second copy of itself
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no shelter user can see a planner handover; it is read by one planning chat and replaced by its successor
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Every figure in the edition is copied from `.plan-day.md`, which took them from the `stream-usage:` comments on merged PRs; the two CI run ids (43394960705, 43393187587) and the `decision-dates` failure line are quoted from the runs themselves

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code, no clock
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** The gates block above is the run's own output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. The change is one documentation file; reverting the commit restores edition `744` in full and nothing else is affected. No migration, so nothing to undo in any database. What it does not cover: a planning chat that has already read `745` keeps what it read

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | PR bodies #1557 and #1560 cite `docs/decisions/2026-11-14-*.md`, which do not exist | accepted — recorded in the edition as owed; `gh pr comment` is refused in this session and asking another session to post it would be permission laundering |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The two PR body corrections above, if he wants them made | GitHub PRs #1557 and #1560 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner session)  Date: 2026-11-13

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the two PR body corrections on #1557 and #1560, which need Lutan or a permission rule

Manual verification by: pending: the two PR body corrections, which need Lutan or a permission rule

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass with accepted defects

Release manager acknowledgement: pending: read at the next release
