# Feature test plan — 2ic-purchasing-phone

## Header

| | |
|---|---|
| Feature | Purchasing below `md` is one screen — period, uncounted warning, then Medicines and Food as separate folds grouped by supplier, each item with its working — over the desk page's unchanged sums; the page is guarded by `stock.purchasing` and registered in the route registry; the table is unchanged from `md` up |
| Backlog item | `docs/backlog.md` → "Roles build, then one role at a time". **Not ticked**: one of the 2IC's three screens, her role does not exist, and the watched test has not happened. A status line names this PR |
| Branch / worktree | `claude/2ic-purchasing-phone` @ `C:\Development\Animal_Shelter_2ic-purchasing-phone` |
| Dev server | `next dev` on `http://localhost:3006` — started, **but not signed in to** (see Defects 1) |
| PR | pending |
| Tested by / date | Claude / 2026-10-04 (gates and scripts only; the screens were not driven) |
| Carries a migration? | no |
| Tested at SHA | `1cbc32e0` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — §13's "phone-first, rebuilt as steps: what is low, how much, from whom"
- [x] Files/areas touched listed — `src/app/management/purchasing/page.tsx` (guard, phone/desk split), new `PurchasingPhone.tsx`, `src/lib/permissions/routes.ts` (one entry), both dictionaries (`management.purchasing.steps`), `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`; `src/lib/management/purchasing.ts` (a never-counted item is assumed to have none on the shelf) and `scripts/check-purchasing.mjs`; `stock.ts` untouched; no migration, no `worker/`
- [x] Roles affected identified — admin and management, who hold `stock.purchasing` in the seed; everyone else is refused as before. The 2IC gets it when `2ic-role` lands
- [x] Anything explicitly **out of scope** written down — the 2IC role, login and home screen; `2ic-delivery-steps`; leaving an item out or editing a quantity; the lead-time toggle on the phone (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` was already merged in ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 157s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the page reads the same tables and functions as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the screens were not driven in a browser (Defects 1); only typecheck, lint and build ran. Left for manual verification 1
- [ ] Data persists — reload the page and the change is still there — n/a: the page writes nothing
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only page
- [ ] Empty state renders sensibly (no rows yet) — n/a: not driven; read from code, the screen has a "nothing to buy" sentence
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: nothing is typed on this page
- [x] Boundary cases checked — `node scripts/check-purchasing.mjs` passes ("all passed"), including new cases: never counted buys the whole need, rounds up to whole packs, and buys nothing when nothing is needed

### Role access matrix

Not signed in as any role. Who may open the page changed from `requireManagementUser()` (admin, management) to `requirePermission("stock.purchasing")`; the seed gives that cell to the same two roles, and `node scripts/check-permission-catalogue.mjs` reports `/management/purchasing` as registered and guarded by the same activity (`all ok`).

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Purchasing | one screen under 768 px, table above | not signed in as this role |
| management | Purchasing | same | not signed in as this role |
| staff | refused | unchanged | not signed in as this role |
| vet | refused | unchanged | not signed in as this role |
| volunteer | refused | unchanged | not signed in as this role |
| signed out | redirected to login | unchanged | seen: `/login?next=%2Fmanagement%2Fpurchasing` |

- [ ] Every role above tested — n/a: not driven; each role's cell is the seed's and is read by the catalogue check
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not driven; the guard is the same `requirePermission()` Stocktake uses

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change; the registry entry is `menu: false`
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — "Purchasing: what to buy" has a new first step describing the one screen; `npm run lint` passes its matrix check; not opened at `/manual`
- [x] Translatable strings go through the translation path — the new strings are in both dictionaries under `management.purchasing.steps` (Thai is a first draft to be read by a Thai speaker: Left for manual verification 3)
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: not measured (Defects 1); Left for manual verification 2
- [ ] Browser console clean — n/a: not run
- [ ] Network clean — n/a: not run

## 6. Regression

- [ ] The pages nearest the change still work — n/a: not driven; the desk table is the same markup inside a `hidden md:flex` wrapper (previously inside `LargerScreenNotice`)
- [x] Any shared file touched (`manual/en.ts`, both dictionaries, `releases.ts`, `routes.ts`) checked from a second, unrelated page — the build compiled every route after the edits; `node scripts/acceptance-matrix.mjs --check` passes
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: sync merged nothing

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not ticked, the 2IC's role and the watched test are outstanding; a status line was added instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-03-2ic-purchasing-phone.md`
- [x] `README.md` still accurate — nothing in it describes Purchasing's layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line, written for the person who orders
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The decision file's claims about what the code does were read from it; nothing about how it looks or feels is claimed, because it was not looked at

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no new date logic; the count date is formatted with the existing `formatDate(shelterDate(…))`
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold changed
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted evidence is the `gates:` lines, as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page is touched

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

- [ ] Rollback position stated — deferred: release manager. The page writes nothing; a rollback returns the old table and its "Best on a larger screen" notice

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | **Claude never opened the screens in a browser; Lutan did (see Sign-off).** Signing in needed the password of a disposable management account made by script (`dryrun-purchasing-20261004@example.test`, left on dev, password in this worktree's gitignored `.env.local`); reading it back was refused by the auto-mode classifier, so the pane stayed on the login page. Nothing about layout, 375 px widths, Thai wrapping or the working's wording has been seen | deferred — whoever signs in runs Left for manual verification 2 before merge |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Watch the 2IC (or someone like her) order from it**: can she pick how long it should last, find Medicines and Food, understand "3 bags" and the working, and tell which supplier to take each list to, without help. This is §12 R4's done-when and cannot be signed by Claude | A real phone, at the shelter, Thai |
| 2 | **375 px, both languages, with Medicines and Food each open**: `document.scrollingElement.scrollWidth <= clientWidth`, nothing clipped, the folds open and close, Print and Download CSV reachable at the bottom. Not measured | The browser pane at the mobile preset, reloaded after switching, signed in as Management or Admin |
| 3 | The Thai strings in `management.purchasing.steps` read naturally to a Thai speaker (a first draft) | Thai |
| 4 | From 768 px up the table is as before, with its period chips, lead toggle, CSV and Print; and Print from a phone prints the grouped list, not the phone view | A desktop, and a phone's print preview |
| 5 | The warning box with an item that was never counted: listed apart, with a Count them button that opens the stocktake only for a person who may count | Dev data, signed in |
| 6 | The two folds: Medicines and Food each list only their own items, grouped by supplier, and a kind with nothing to buy is absent | A phone, dev data |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — Lutan looked at the screen on his own phone-width view on 2026-10-04 (the compact one-line rows and the yellow never-counted rows) and, in chat, signed it off and asked for the merge. Rows 1 (watching the 2IC), 2 (375 px measurements), 3 (Thai read) and 4 to 6 were not separately done; he accepted that, so they stay open as follow-ups, not as verified

Manual verification by: Lutan Bennett  Date: 2026-10-04

Note: said in chat, having looked at the screen; Claude has not signed this line. Still open and accepted by him: the watched 2IC test, the 375 px measurements, the Thai read

### Result

- [x] Open defects are either fixed or explicitly accepted above — Defects 1 (Claude never opened the screen) was overtaken by Lutan looking at it himself and signing off in chat on 2026-10-04; the measurements it names remain unrecorded
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
