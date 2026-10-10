# Feature test plan

## Header

| | |
|---|---|
| Feature | Parity layer 3: pin every page outside the route registry |
| Backlog item | `docs/backlog.md` → *Parity layer 3: the pages outside the route registry (scripts only)* |
| Branch / worktree | `claude/parity-layer-3` @ `C:\Development\Animal_Shelter_parity-layer-3` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not used: no UI surface) |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-10-10 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the PR's first push |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: section F of `check-permission-catalogue.mjs` puts every `page.tsx` in exactly one of the registry, a pinned list (guard + body `can()` keys) or an exempt list with reasons, and a page in none fails `npm run lint`
- [x] Files/areas touched listed: `scripts/check-permission-catalogue.mjs`, `docs/decisions/2026-10-10-parity-layer-3-pages-outside-the-registry.md`, `docs/backlog.md` (tick), this plan. No app, worker or migration file
- [x] Roles affected identified: none at runtime; the check reads source only. The findings it reports (four edit pages at Read, `/residents/[id]` unguarded) concern volunteers and configured roles and went to the `backlog` branch, not fixed here
- [x] Out of scope written down: fixing any app guard; the thirteen deliberately red harnesses from #509; what an in-body `can()` gates (decision file, "What remains unchecked")

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines:

```
=== gates: typecheck exited 0 after 164s
=== gates: lint exited 0 after 107s
=== gates: build exited 0 after 312s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `node scripts/check-permission-catalogue.mjs` prints `F 108 pages: 37 in the registry, 44 pinned, 27 exempt`, four `KNOWN` lines, `all ok`, exit 0
- [ ] Data persists — n/a: no data, a source-reading script
- [x] Create / edit / delete all exercised, as the check's failure modes, each run and then reverted (tree clean afterwards):
  1. a throwaway `src/app/zz-throwaway/page.tsx` → **`npm run lint` exit 1**, `FAIL F /zz-throwaway is in exactly one bucket … A new page: add it to PINNED … or to EXEMPT`
  2. `/outreach/[id]/edit` guard moved to `"read"` → `FAIL F /outreach/[id]/edit guards with requirePermission("community.outings")`
  3. `/weight/[id]/edit` fixed to Edit → `FAIL F /weight/[id]/edit STALE: fixed, remove its known entry`
  4. `/residents/[id]/move` body `can()` changed to `resident.record` → `FAIL … body decides with can(placement.move)`
  5. a `requirePermission` added to exempt `/manual` → `FAIL F /manual is exempt with no guard of its own`
  6. `SECTION_READS` weight → `medical.diet` → `FAIL … SECTION_READS maps each tab to its activity`
- [ ] Empty state — n/a: there is no empty state; `src/app` always has pages
- [x] Invalid input rejected with a readable message: each failure above names the page, what it found and what it wants
- [ ] Boundary cases — n/a: no numeric or date input; route groups `(x)` are stripped from paths but none exist today

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no runtime change | n/a |
| management | n/a | no runtime change | n/a |
| staff | n/a | retired (0173) | n/a |
| doctor | n/a | no runtime change | n/a |
| volunteer | n/a | no runtime change | n/a |
| signed out | n/a | no runtime change | n/a |

- [ ] Every role above tested — n/a: no page or guard changed; the script reads source files
- [ ] Blocked server-side — n/a: no guard changed (the four found at Read are a backlog item)

## 5. Cross-cutting

- [ ] Nav entry — n/a: no nav change
- [ ] Manual updated — n/a: developer tooling, nothing a shelter user reads about
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: sections A–E of the same script still all `ok` in the same run (E's 37 registry checks unchanged)
- [ ] Shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates above ran after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the two findings went on the `backlog` branch as their own items (*Four medical edit pages open at Read*, *`/residents/[id]` has no permission guard of its own*). Sweep of the backlog for `routes.ts`, `check-permission-catalogue`, `requirePermission`, `requireFullResident`: no other open item is closed by this (the Stocktake item mentions `requirePermission` for an unrelated, still-open part)
- [x] Non-obvious design choices added: `docs/decisions/2026-10-10-parity-layer-3-pages-outside-the-registry.md`
- [x] `README.md` still accurate: it does not describe the catalogue check's sections
- [ ] **Release notes.** — n/a: developer tooling only, a lint script; no shelter user sees a change
- [x] Commit messages say why, not just what
- [x] Claims measured, not reasoned: page counts, findings and every failure message above are from runs; the four findings were read in the page source and the server actions (no `can()` in either), and the cells from `0132`/`0140`

## 8. Pre-production gate

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches — deferred: production release manager
- [ ] Deployed to test — n/a: a lint script, nothing in the deployed build changes
- [ ] Smoke-tested on test — n/a: nothing in the deployed build changes
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence is unedited tool output — n/a: no deploy evidence; section 2 and 4's lines are pasted from the runs
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] Production Supabase ref read — n/a: no deploy-relevant change
- [ ] `strip-baked-env` seen — n/a: no deploy-relevant change
- [ ] New secret/env var — n/a: none
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: scripts only; reverting the commit removes section F, nothing at runtime

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | minor | `/weight/[id]/edit`, `/prescriptions/[id]/edit`, `/diets/[id]/edit`, `/clinic-visits/[id]/edit` open at Read and render the edit form; the database refuses the save | deferred to backlog (*Four medical edit pages open at Read*); pinned at Edit with `known` entries |
| 2 | minor | `/residents/[id]` has no permission guard of its own; RLS and a role-name redirect decide | deferred to backlog |

## Left for manual verification

None: no UI surface, developer tooling only.

| # | What to check | Where |
|---|---|---|
| — | nothing | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (claude-opus-5-5)  Date: 2026-10-10

### Manual verification

- [x] The manual list above is empty

Manual verification by: n/a: no UI surface, developer tooling only

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: n/a: scripts only, nothing deployed
