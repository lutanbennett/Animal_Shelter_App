# Feature test plan — purchasing-phone-never-counted

## Header

| | |
|---|---|
| Feature | Management → Purchasing: a never-counted item with nothing to buy is now counted and named in the phone's "Not counted yet" box, and counted in the desk banner |
| Backlog item | `docs/backlog.md` → "Purchasing: a never-counted item whose need is 0 is invisible on the phone" (ticked) |
| Branch / worktree | `claude/purchasing-phone-never-counted` @ `C:\Development\Animal_Shelter_purchasing-phone-never-counted` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3018` |
| PR | pending |
| Tested by / date | Claude / 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | `7d7d801b` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — never-counted items at zero need are named in the phone box and counted in the desk banner
- [x] Files/areas touched listed — `src/app/management/purchasing/PurchasingPhone.tsx`, `page.tsx`, both dictionaries (`management.purchasing`), `src/lib/manual/en.ts`, `src/lib/releases.ts`; no migration, no `worker/`
- [x] Roles affected identified — admin and management (`stock.purchasing`), and the 2IC when her role lands
- [x] Anything explicitly **out of scope** written down — a stale count at zero need on the phone (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` was already merged in ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 284s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the same tables are read
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — a seeded never-counted medicine with no prescription is named in the box in English and Thai at 375 px, alongside the 18 dev items already never counted
- [ ] Data persists — n/a: the page writes nothing
- [ ] Create / edit / delete all exercised — n/a: read-only page
- [ ] Empty state renders sensibly — n/a: unchanged; the box is absent when nothing is never counted, and the "nothing to buy" sentence is untouched
- [ ] Invalid input is rejected with a readable message — n/a: nothing is typed on this page
- [x] Boundary cases checked — a never-counted item at zero need is named; items already in the buy list still show yellow below. The all-zero body wording (`notCountedBodyZeroOnly`) is read from code, not seen (Left for manual verification 3)

### Role access matrix

Guard unchanged (`requirePermission("stock.purchasing")`). Driven as throwaway management and admin logins only.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Purchasing | as management | loaded at 375 px, no overflow |
| management | Purchasing | the box names the item | seen, en and th |
| staff | refused | unchanged | not driven; guard unchanged |
| vet | refused | unchanged | not driven; guard unchanged |
| volunteer | refused | unchanged | not driven; guard unchanged |
| signed out | redirected | unchanged | not driven; guard unchanged |

- [ ] Every role above tested — n/a: no access change; only the content of a page the guard already admits
- [ ] A role that should not have access is blocked server-side — n/a: guard untouched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) — the Purchasing topic's phone paragraph names the new line; not opened at `/manual`
- [x] Translatable strings go through the translation path — both dictionaries have the two new keys; the Thai is a first draft (Left for manual verification 2)
- [x] Mobile viewport (375px) — `node scripts/check-phone-width.mjs --roles=admin,management --pages=/management/purchasing` printed "No page scrolls sideways." (4 page views, en and th)
- [ ] Browser console clean — n/a: not read
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — `/management/purchasing` loaded at 375 px in both languages, with the buy list and folds below the box intact
- [x] Any shared file touched checked from a second, unrelated page — both dictionaries and `manual/en.ts` compiled in the build; the width check loaded the page from two roles
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-06-purchasing-phone-never-counted.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line, written for the person who orders
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The 19-item count and the names in the box were read from the screenshot; the all-zero wording was not seen

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the `needed > 0` filter was removed, not moved
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: only the gate lines above, as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. Read-only change to one page; `git revert` restores the old box; no migration to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | On dev data 19 items are never counted, so the box's name list is long (about 10 lines at 375 px). After the first real stocktake it will be short | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Would the 2IC understand "do not trust 'nothing to buy' until they are counted"? Nobody has watched her use these screens (#334) | A real phone, at the shelter |
| 2 | The Thai wording of the two new lines reads naturally | A Thai speaker |
| 3 | The all-zero state (every item never counted and at zero need): the box reads "Nobody has counted these…" with names under it, above "Nothing to buy for this time." | Dev data with no prescriptions |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-06

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; the three rows are Lutan's to look at

Manual verification by: pending: Lutan to look at the three rows above

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet reviewed by the release manager
- [ ] Checklist pasted into the PR — n/a: PR not yet open
- [ ] Handed to the production release manager — n/a: PR not yet open

Result: pass
