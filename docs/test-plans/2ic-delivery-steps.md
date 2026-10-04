# Feature test plan — 2ic-delivery-steps

## Header

| | |
|---|---|
| Feature | Record a delivery below `md` is one question per screen — what arrived, which one, how much, when, optional details, then a sentence saying what will be recorded — over the desk form's own server action; Deliveries is a menu entry beside Stocktake and Stocktake's link to it is a full-height button; Deliveries' help no longer names pages staff cannot open (F-15). From `md` up the form is unchanged |
| Backlog item | F-15 (ticked). `docs/backlog.md` → "Roles build, then one role at a time" is **not ticked**; a status line says the 2IC's three screens are now all built |
| Branch / worktree | `claude/2ic-delivery-steps` @ `C:\Development\Animal_Shelter_2ic-delivery-steps` |
| Dev server | `next dev` on `http://localhost:3011`, signed in as a disposable dev staff login |
| PR | pending |
| Tested by / date | Claude / 2026-10-04 |
| Carries a migration? | no |
| Tested at SHA | `fb680286` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for — §13's "her three tasks as one-task-per-screen steps", the third of three, plus F-15's reachability fix
- [x] Files/areas touched listed — new `src/app/deliveries/DeliverySteps.tsx`; `src/app/deliveries/page.tsx` (phone/desk split); `src/app/NavLinks.tsx`, `NavPane.tsx`, `src/components/hub-icons.ts` (menu entry); `src/lib/permissions/routes.ts` (`menu: true`); `src/app/stocktake/page.tsx` (link restyled); both dictionaries (`nav.deliveries`, `deliveries.steps`, one reworded intro); `src/lib/manual/en.ts`; `scripts/lib/acceptance-matrix-entries.mjs`; `src/lib/releases.ts`. `actions.ts`, `stock.ts`, `stock-receipts.ts` untouched; no migration, no `worker/`
- [x] Roles affected identified — admin, management and staff, who hold `stock.delivery` in the seed; unchanged. The 2IC gets it when `2ic-role` lands and needs that one cell
- [x] Anything explicitly **out of scope** written down — the 2IC role and home; the Foster or adopt page's "Management → Contacts" wording (a different page); editing or deleting a delivery from the phone steps (Recent deliveries below the steps keeps its Delete button)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — merged `origin/main` (one conflict, `releases.ts`: `main` had cut a release and emptied `unreleased`; resolved by keeping only this PR's line)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 163s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the page reads the same tables as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — driven in the browser pane at 375 px, English: Medicine → Amoxicillin 250mg tablet → 100 → Today → (no details) → "This will record that 100 tablet(s) of Amoxicillin 250mg tablet arrived today." → Record this delivery → "Recorded 100 tablet(s) of …", and the delivery is the first row under Recent deliveries with the recorder's name
- [x] Data persists — the row appears in Recent deliveries after the server action revalidates the page
- [ ] Create / edit / delete all exercised — n/a: only create is new; delete is the unchanged `DeleteDeliveryButton` and was not touched
- [x] Empty state renders sensibly — read from code: a kind with no items shows "There is no … on the list yet." (not driven: dev has items of both kinds)
- [x] Invalid input is rejected with a readable message, not a crash — the amount step disables Next until `parseDeliveryQuantity` accepts the text and says "Type a number above 0."; the cost box says why it is refused; the server action's own messages show on the confirm screen (not provoked: the client cannot reach them)
- [x] Boundary cases checked — an earlier day on which the item was counted (AMC 500, 3 Oct) shows the before/after question as two big buttons and keeps Next disabled until one is chosen; today and an uncounted day do not ask. `node scripts/check-stock-deliveries.mjs` (the unchanged `received_at` rules) was run

### Role access matrix

Signed in as a disposable **staff** login only. The guard is unchanged (`requirePermission("stock.delivery")`); the menu entry shows on the same `can(perms, "stock.delivery")`.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| staff | Deliveries, in the menu and as a Home tile | steps under 768 px | seen: menu has `/deliveries`; steps worked |
| admin | Deliveries | same | not signed in as this role |
| management | Deliveries | same | not signed in as this role |
| volunteer | refused, no menu entry | unchanged | not signed in as this role |
| vet | refused, no menu entry | unchanged | not signed in as this role |
| signed out | redirected to login | unchanged | seen: `/login?next=%2Fdeliveries` |

- [ ] Every role above tested — n/a: only staff and signed-out were driven; the others hold or lack the same seed cell, read by `node scripts/check-permission-catalogue.mjs` (`all ok`)
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not changed; the guard and the registry entry are as before

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — Deliveries follows Stocktake in the daily group; the sidebar links read `/stocktake | ตรวจนับสต็อก` and `/deliveries | การรับของ` in Thai
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the "Recording a delivery" topic now describes the menu entry and the steps; `npm run lint` passes its matrix check; not opened at `/manual`
- [x] Translatable strings go through the translation path — both dictionaries, `deliveries.steps` and `nav.deliveries`; Thai is a first draft (Left for manual verification 3)
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured `document.documentElement.scrollWidth` 375 on every step in Thai (kind, item, amount, packs, when, earlier-day, extras, confirm) and English (item, amount, when, extras, confirm, saved). Immediately after a step change it reads 388 while the 0.18 s slide-in is mid-flight (the same `card-in-next` the stocktake cards use); with `animation: none` it is 375 and `getAnimations()` is empty. The amount box has `inputMode="decimal"` and is focused on arrival
- [x] Browser console clean — no errors raised during the run (not exhaustively read)
- [ ] Network clean — n/a: not read

## 6. Regression

- [x] The pages nearest the change still work — the desk form is the same component inside a `hidden md:block` wrapper and the Recent deliveries list rendered under the steps in both languages; Stocktake's button not opened at phone width
- [x] Any shared file touched (`manual/en.ts`, both dictionaries, `releases.ts`, `routes.ts`, `NavLinks.tsx`) checked from a second, unrelated page — the sidebar rendered on `/deliveries`; the build compiled every route
- [x] Nothing merged from `main` during `sync` was broken by this branch — the only conflict was `releases.ts`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — F-15 ticked; the roles item stays open with a status line
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-04-2ic-delivery-steps.md`
- [x] `README.md` still accurate — nothing in it describes the Deliveries layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line, written for the person who records deliveries
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Widths and the before/after branch were measured in the browser; "Back loses nothing" was driven for the amount (typed 100, Next, Back, still 100); a refused save keeping its answers is read from the code (the error branch returns before any state is cleared), not provoked

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no new date logic; the day is `todayIso()` and the server action's `receivedAtFor` is unchanged
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

- [ ] Rollback position stated — deferred: release manager. Nothing is stored differently; a rollback returns the single form on phones and the menu without Deliveries

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The first draft capitalised the kind in "Which Medicine?" mid-sentence | fixed — the component lowercases it |
| 2 | Low | A synthetic `element.click()` straight after a navigation did nothing until the page had hydrated; real clicks were fine. A test-driving quirk, not a screen fault | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Watch the 2IC (or someone like her) record a real delivery from it**: can she find Deliveries, pick the item with the box in her hand (the label photo), type the amount, and tell from the last sentence what is about to be recorded, without help. "Tested by watching" is §13's done-when and cannot be signed by Claude | A real phone, at the shelter, Thai |
| 2 | The numeric keypad actually opens on the amount, and on packs and cost, on a real phone (the pane cannot show a keyboard) | A real phone |
| 3 | The Thai strings under `deliveries.steps` read naturally to a Thai speaker (a first draft), in particular the confirm sentence "จะบันทึกว่า … มาถึง…" and the before/after question | Thai |
| 4 | A medicine **with a label photo**: the photo shows beside the name in the list and larger on the amount step. The dev items driven had none | Dev data with a label uploaded |
| 5 | An item with a purchase unit (bags, boxes): the unit box defaults to it, the "= n unit" line is right, and the recent row shows what was typed | Dev data with a unit conversion |
| 6 | From 768 px up the single form is as before, with its own subtitle | A desktop |
| 7 | Stocktake's Record a delivery button at 375 px, in both languages | The browser pane, signed in as staff |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-04

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; item 1 is the screen's own done-when and waits for the 2IC

Manual verification by: pending: a person, for items 1 to 7 above; Claude drove a disposable dev staff login at 375 px and signs only the automated line

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet — the release manager reads this when the release is cut
