# Feature test plan

---

## Header

| | |
|---|---|
| Feature | Record the measured mirror-vs-Drive timings in the Pi file-cache decision file |
| Backlog item | `docs/backlog.md` → `#prr9h` (Pi local copy as a cache) |
| Branch / worktree | `claude/pi-mirror-timings` @ `C:\Development\Animal_Shelter_pi-mirror-timings` |
| Dev server | not started — docs-only change, no page to load |
| PR | [#1347](https://github.com/lutanbennett/Animal_Shelter_App/pull/1347) |
| Tested by / date | Claude, 2026-11-06 |
| Carries a migration? | no |
| Tested at SHA | 006e4070 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected

  One file, `docs/decisions/2026-10-29-pi-file-cache.md`: its `## Latency` section replaced with the
  measurements taken on 2026-11-06. **No card is affected, no code or schema changes, and admin and the
  signed-out public are unaffected** — nothing in this PR is reachable from the running app.
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

  Out of scope: the measuring script itself (run from `/tmp` on the Pi and deleted, deliberately not
  added to `scripts/`), any change to `src/lib/mirror-read.ts` or the photos route, and the stage-2
  decision on making the USB drive primary, which is Lutan's.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: typecheck exited 0 after 21s
=== gates: lint exited 0 after 211s
=== gates: test exited 0 after 30s
=== gates: build exited 0 after 58s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR

## 4. Functional checks

- [ ] Happy path works end to end — n/a: a decision record; there is no behaviour to exercise
- [ ] Data persists — reload the page and the change is still there — n/a: no page and no stored data
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: documentation only
- [ ] Empty state renders sensibly (no rows yet) — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: no input

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing in this PR | no change | n/a |
| signed out | nothing in this PR | no change | n/a |

- [ ] Every login above tested — n/a: the PR adds no reachable surface, so no login can see a difference
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route added or changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: `NavLinks.tsx` not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: an internal decision record, not shelter-facing documentation
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no user-facing strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI surface
- [ ] Browser console clean — no errors or React warnings — n/a: no page to open
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no page to open

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)

  Nothing renders this file, so there are no nearest pages. The gates' `build` covers the repository
  as a whole and passed.
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared file touched; the only file changed is a decision record
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: `#prr9h` was ticked on the `backlog` branch and is already on `main` (commit `fee4d38e`), so there is nothing left for this PR to tick
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)

  This PR *is* the decision-record change: it replaces the `pending:` latency section of
  `docs/decisions/2026-10-29-pi-file-cache.md` with what was measured. A second file would split one
  record across two.
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a decision record read by Claude sessions and the release manager; no shelter user can see a difference, and the speed improvement it documents already shipped under its own items
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

  Every figure in the new section is a printed run, not an estimate. The two caveats recorded with
  them — that the mirror side was served from the kernel's page cache, and that the first run's byte
  totals were wrong — are both stated rather than tidied away, and the superseded 1:18 / 1:18 pair is
  marked as measuring the old full-size grid.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no code in this PR, so nothing derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no boundary or banding logic in this PR
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no public page changes in this PR

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: production release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated, **including what it does not cover**

  Reverting this PR restores the previous text of one decision file. It covers nothing else, because
  nothing else changes: no code, no schema, no deployed artefact. The measurements it records remain
  true whether or not the file carries them.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first version of the measuring script counted bytes with a shared `+= await`, which loses updates across concurrent workers, so it reported byte totals that could not be right. The timings were unaffected, but the byte totals were the fairness check. | fixed before the figures in this PR were taken — re-run with per-worker totals, both sides then read exactly 49.8 MB |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing — the change is one documentation file, and its figures are the pasted output of runs recorded in the PR | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-06

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: a documentation-only change with no surface for a person to look at; the measurements it records were taken by Lutan (phone readings) and Claude (Pi-side run) before this PR

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager

Result: pass

Release manager acknowledgement: n/a: documentation only, nothing to deploy
