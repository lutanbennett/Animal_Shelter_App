# Feature test plan — stocktaking-switches-app

## Header

| | |
|---|---|
| Feature | The app half of the two Stocktaking ON/OFF switches (food; medicines and vaccines): Purchasing, Diet stock, Medication stock and vaccines, Stocktake, and Settings → Stocktaking |
| Backlog item | `docs/backlog.md` → **TWO Stocktaking ON/OFF switches in Settings** (ticked) |
| Branch / worktree | `claude/stocktaking-switches-app` @ `C:\Development\Animal_Shelter_stocktaking-switches-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no (reads the columns `0254` added) |
| Tested at SHA | `f305157d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — while a switch is OFF its area's forecasts assume nothing in stock, add no safety stock and show no *Not counted*; ON is today's behaviour
- [x] Files/areas touched listed — `src/lib/management/{purchasing,stocktaking-switches}.ts`, Purchasing page and phone view, Diet stock, Medication stock and vaccine section, Stocktake page and sheet, `StockCells.tsx`, Settings → Immunization types, new `src/app/admin/stocktaking/`, both dictionaries, manual, releases; plus one line each in `scripts/check-permission-catalogue.mjs` and `scripts/lib/acceptance-matrix-entries.mjs`, which refuse a new page or manual topic that is not registered
- [x] Roles affected identified — Admin (the only role that sees or changes the switch); Management, the 2IC and staff see the effect on Purchasing, the stock pages and Stocktake
- [x] Anything explicitly **out of scope** written down — no migration; `src/app/admin/diets/` untouched; the Do Stocktaking tile is left on Home when both are off (its page says there is nothing to count); Recent changes still has no label for these audit rows

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them

```
=== gates: build exited 0 after 47s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; `0254` landed in #899
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: nothing to apply; `--status` read at the start: 255 applied, 0 pending, 0254 among them
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no schema change; the real dev rows were read through every changed page instead (section 4)
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration; the guard and audit trigger were proved by the schema PR's `check-diets-forecast-functions.mjs`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; `0254` must already be applied to production before this deploys, because the pages read its columns (a missing column reads as both ON, so a late apply costs nothing but the switch)

## 4. Functional checks

Driven on dev against real rows. The switch was set with the service role (the database guard lets a caller with no login through), because the dev sign-in is aal1 and the Settings page needs aal2.

- [x] Happy path works end to end — food OFF / medical ON, medical OFF / food ON, both OFF and both ON each driven on Purchasing (desktop and 375 px), Diet stock, Medication stock with vaccines, Stocktake and Settings → Immunization types. The Settings button itself was not driven (see Left for manual verification)
- [x] Data persists — reload the page and the change is still there — every page reads the switch on each load; after both OFF → both ON, Purchasing again showed 24 never-counted items and Hepato at 111 tablet, exactly as before any change
- [x] Create / edit / delete all exercised (whichever the feature has) — the switch is an edit: set four ways through the real column and read back; the audit row and the aal2 guard belong to `0254` and are not re-proved here
- [x] Empty state renders sensibly (no rows yet) — both OFF: Stocktake lists nothing and says *Stocktaking is switched off, so there is nothing to count.*
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: the only control is an On/Off button; the action refuses an unknown area, a non-Admin and a session without 2-step with words (`t.admin.stocktaking.errors`), written but not drivable at aal1
- [x] Boundary cases checked — counted 50, safety stock 10, use 14: ON needs 24 and buys 0, OFF needs 14 and buys 14; with a pack of 5, OFF buys 3 packs (15); the same row is identical with `stocktaking` omitted or true

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/stocktaking`, the tile on Settings | aal1: sent to the 2-step page; aal2: the two switches | tile present; sent to `/admin/security/verify` at aal1, as Security is |
| management | `/admin/stocktaking` typed directly | refused | `/no-access` |
| staff | — | retired role | n/a |
| doctor | — | refused by the same `requireAdminUser()` | not driven |
| volunteer | — | refused by the same `requireAdminUser()` | not driven |
| signed out | — | sent to sign in by the proxy | not driven |

- [ ] Every role above tested — n/a: Admin and Management driven; doctor, volunteer and signed-out go through the same `requireAdminUser()` guard as Security, which `check-permission-catalogue.mjs` now asserts for this page
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — Management typed `/admin/stocktaking` and landed on `/no-access`

## 5. Cross-cutting

- [x] Nav entry correct — a Settings tile for Admin only, filtered like Security; `NavLinks.tsx` is not touched
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — *Stock: what the Stocktaking switches do*, loaded at `/manual?view=all` as Admin
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: the new words are static dictionary strings in `en.ts` and `th.ts` (both added, typecheck proves the shapes match), not database content that the translation queue holds
- [x] Mobile viewport (375px) — Purchasing phone view, Diet stock and Stocktake at 375 px: no sideways scroll (`scrollWidth` 375), the switched-off note and *Stocktaking is off* lines wrap. Settings → Stocktaking was not seen at 375 (aal2)
- [x] Browser console clean — no app errors on the changed pages; the only React hydration warning came from a script of mine forcing `<details>` open, not from the code
- [x] Network clean — the only 4xx was my own request to a wrong URL (`/release-notes`; the page is `/releases`)

## 6. Regression

- [x] The pages nearest the change still work — Purchasing, Diet stock, Medication stock, vaccine section, Stocktake, Settings → Immunization types, Settings landing, `/manual`, `/releases`, all loaded
- [x] Any shared file touched checked from a second, unrelated page by loading it — `StockCells.tsx` (Diet stock and Medication stock), both dictionaries and the manual (`/manual`, `/releases`, Settings landing)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-stocktaking-switches-app.md`, including why safety stock is left out while OFF
- [ ] `README.md` still accurate — n/a: the README does not mention stocktaking or Purchasing
- [ ] **Release notes.** — n/a: this was correctly **ticked** when the plan was written (#903, `0589201`): `unreleased` then held a line for admins and management, nothing was outstanding, no deploy or hand edit stood between it and a user, and both switches default ON so the app behaved as before until an Admin turned one off. **That note shipped in `0.40.1` and now lives in `releases`, not `unreleased`**, so no later diff can ever satisfy the tick again — and this PR adds a signature only. Untick-with-reason is therefore the honest state, exactly as it is on a cut PR, and the original tick stands in git history
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The OFF figures were read from the running pages and from the real `purchaseRow()`, not argued

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives a date; the forecast windows are the existing ones
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no threshold, band or rounding rule changed; the pack rounding is moved into a helper unchanged and the ON row compared identical
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` lines above are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; the code reads `0254`, which landed first in #899
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR; production's `0254` status is the release manager's to read with `--status --env production`
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration in this PR

### Rollback

- [x] Rollback position stated — redeploy the previous ref as usual. Switching both areas ON (Settings → Stocktaking, or the two columns) returns every page to today's behaviour without a deploy; no migration is involved, so there is nothing to revert in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Settings → Recent changes has no label for the switch's audit rows (known from the schema PR) | accepted: not built here; the manual does not claim it |
| 2 | low | An open Stocktake tab can still save a count for an area switched OFF after it loaded | accepted: harmless, counts are kept and unused while OFF |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **DONE 2026-10-24 by Lutan** — signed in with the authenticator app, switch food off and on from the Settings button; the figure on Purchasing moves, and the button says what happened | Settings → Stocktaking (aal2; the dev sign-in cannot reach it) |
| 2 | **DONE 2026-10-24 by Lutan** — the Thai wording of the new lines reads naturally | Purchasing, Diet stock, Stocktake, Settings → Stocktaking with ไทย selected |
| 3 | **STILL OPEN** — Settings → Stocktaking on a real phone | Settings → Stocktaking |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items 1 and 2 were checked by Lutan on 2026-10-24; **item 3 (a real phone) was not**, so this line stays unticked rather than being ticked on a partial pass

**Lutan looked at this screen on 2026-10-24 and said so in chat, and he explicitly asked for
the plan to be signed in his name.** `CLAUDE.md` permits that only on both of those conditions,
and requires the line to say so — which is what the signature below does. **The scope was
confirmed with him before anything was ticked**, because "working" could have meant the button
alone: asked directly whether the Thai lines read correctly too, he answered that they do. That
question is the same one `0.40.0` recorded needing, when "sign ins done" could have meant two of
ten lines.

Manual verification by: Lutan Bennett — items 1 and 2 only, confirmed in chat 2026-10-24 (the switch works from the Settings button and the Thai reads naturally); item 3, Settings → Stocktaking on a real phone, remains unchecked and is NOT signed for  Date: 2026-10-24

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: not yet released

Result: pass

Release manager acknowledgement: n/a: not yet released
