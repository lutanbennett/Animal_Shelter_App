# Feature test plan — stocktake-cards-phone

## Header

| | |
|---|---|
| Feature | Part 2 of the medication-label backlog item: on a phone (under 640 px) the Medications tab of `/stocktake` is one card at a time — label photo (name placeholder when none), name, last count and when, a numeric field with the keypad open, Save / Same as last time / Skip, "N of M", Previous, See the whole list, skipped cards offered again at the end — and the count in progress is kept on the phone and sent once at the end |
| Backlog item | `docs/backlog.md` → "Medication label photos, a card-by-card stocktake on phones, and Stocktake only for the people who do it". **Not ticked: part (3) remains.** A status line names this PR |
| Branch / worktree | `claude/stocktake-cards-phone` @ `C:\Development\Animal_Shelter_stocktake-cards-phone` |
| Dev server | `next dev` on `http://localhost:3001` (this worktree's `.port`), browser pane at the **mobile** preset 375×812, reloaded after each switch |
| PR | #331 |
| Tested by / date | Claude / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `38a5b099` (after `worktree.mjs sync` merged `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the card-by-card phone stocktake of part (2), with the save decision the item asked to be recorded
- [x] Files/areas touched listed — `src/app/stocktake/StocktakeSheet.tsx` (phone switch, draft, offline catch), new `src/app/stocktake/StocktakeCards.tsx`, `src/lib/management/stocktake.ts` (appended card helpers only), `src/app/globals.css` (slide keyframes), both i18n dictionaries (`stocktake.cards`), `src/lib/manual/en.ts`, `scripts/lib/acceptance-matrix-entries.mjs`, `src/lib/releases.ts`; no `page.tsx`, no `actions.ts`, no `worker/`, no migration
- [x] Roles affected identified — staff, volunteer, management and admin, who can reach Stocktake; vet and signed-out are refused as before, and who may reach it is `permissions-catalogue`'s and unchanged here
- [x] Anything explicitly **out of scope** written down — part (3) (Stocktake in the menu only for the people who do it), cupboard order (`cardSequence` is the one place it will slot in), swipe gestures, cards on the Food tab, strength/form on the card (the table has no such columns), and the permission checks

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (release record 0.16.0 docs only)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 198s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration (`0133` stays free)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the page reads the same columns as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the save is the unchanged `record_stocktake()`
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — at 375×812 on dev as a staff account: card 1 of 24 with the keypad focused, typed 40, Save moved to 2 of 24 with the field focused again; Same as last time and Skip both advanced; Review and save listed the 5 changes (AMC 500 50 → 40, four "same as last time"), "21 items not counted this time — left as they were", Save wrote them (`Saved 5 counts`)
- [x] Data persists — reload the page and the change is still there — the draft survived a reload ("Picked up where you left off: 1 counted", card 3 of 24); after Save the draft key was removed and the sheet showed the new counts (AMC 500 "last count 40")
- [x] Create / edit / delete all exercised (whichever the feature has) — counting is create and update only: typed 12 on card 1 and saved with the keypad's Enter, Previous came back to card 1 with 12 in the field, ready to change
- [ ] Empty state renders sensibly (no rows yet) — n/a: dev has 24 medications and none can be removed for a check; the cards are guarded by `items.medication.length > 0`, so an empty list falls through to the sheet's own unchanged message, but that was read, not run
- [x] Invalid input is rejected with a readable message, not a crash — typed "1,5" on a card (Thai): Save is disabled, the field is `aria-invalid` and "กรอกตัวเลข 0 ขึ้นไป…" shows. A save that cannot reach the server is caught and says so, but that was not driven (Left for manual verification 4)
- [x] Boundary cases checked — Previous disabled on card 1; the end screen with every card skipped ("24 skipped — count them now?", Thai too) and a second pass over just the skipped; Same as last time disabled with the reason on a never-counted medicine; a typed unit conversion uses the sheet's own `rowOutcome()` so the stamped factor path is the sheet's

### Role access matrix

Staff only was signed in (a throwaway account, `cards-staff-20261003@example.test`, left on dev). Who may reach `/stocktake` is not changed by this branch — `page.tsx` and `actions.ts` are untouched and the guard belongs to `permissions-catalogue`.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Stocktake | cards under 640 px, sheet above | not signed in as this role |
| management | Stocktake | same | not signed in as this role |
| staff | Stocktake | same | cards and sheet verified |
| vet | refused | unchanged | not signed in as this role |
| volunteer | Stocktake | same | not signed in as this role |
| signed out | redirected to login | unchanged | seen on first load (`/login?next=%2Fstocktake`) |

- [ ] Every role above tested — n/a: the cards are the same component for every role that can reach the page and the access check is not in this diff; only staff was driven
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no access rule changed in this PR; `permissions-catalogue` owns it

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — "Doing a stocktake" has two new steps (the cards; counts kept on the phone, skipped cards, Review and save); `npm run lint` passes its matrix check; not opened at `/manual`
- [x] Translatable strings go through the translation path — the new strings are in both dictionaries under `stocktake.cards`; there is no Thai manual. `/management/translations` not opened
- [x] Mobile viewport (375px) — no overflow, controls reachable — `scrollWidth <= clientWidth` (375/375) on: English card 1, English end screen, English list view, Thai card 1, Thai card 2, Thai end screen, Thai list view, Thai second pass (after fixing it — see Defects)
- [x] Browser console clean — no errors or warnings except Next's pre-existing image-aspect-ratio warning for the header logo and a card photo (`next/image` with `fill`: not from this change)
- [x] Network clean — `/api/photos/<id>?w=400` returned 200 for the card photo; no 4xx/5xx on the page

## 6. Regression

- [x] The pages nearest the change still work — desktop width (1024): the sheet shows its 24 rows with inputs and no cards, no "Count one at a time" button; the Food tab is untouched at phone width (cards are Medications only); the list view at phone width still works and shows a button back to the cards
- [x] Any shared file touched (`manual/en.ts`, both dictionaries, `globals.css`, `releases.ts`) checked from a second, unrelated page — `/stocktake` loaded in both languages after the dictionary edits (type-checked as one tree, so a missing Thai key would not compile); `globals.css` only gains `.card-in-*` classes
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought docs only

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: not ticked, part (3) remains; a status line for part (2) was added instead, as the brief says
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-03-stocktake-cards-phone.md` (counts kept on the phone, sent once at the end; why not per card)
- [x] `README.md` still accurate — nothing in it describes the stocktake's layout
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a line for it, written for the person counting
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The decision's claims about what the page does (draft key, two-day expiry, the save catch) were each driven or read from the code; its argument for B over A is reasoning about design, and says so. The offline catch itself was not driven (see Left for manual verification)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic; the card shows the existing "counted N days ago" and the draft's age is a plain millisecond difference
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the one threshold (a draft is stale after two days) was not exercised at its edge; nothing about it is a banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the only pasted evidence is the `gates:` lines, which are as printed
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

- [ ] Rollback position stated — deferred: release manager. Nothing is written to the database by the new code beyond what the sheet already writes; a rollback loses nothing but the cards view. A draft left in a phone's `localStorage` is ignored by the older build

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Thai, second pass over skipped cards: the "การ์ดที่ข้ามไว้" label and "1 จาก 24" shared the header row and made the page 388 px wide at 375 | fixed — the label has its own line; re-measured 375/375 |
| 2 | Info | In `next dev` the phone view hydrates many seconds after the first paint (several seconds more while the browser pane is hidden), and until then the desktop list is on screen. The server cannot know the width, so the first paint is always the list; a production build hydrates far faster. Not measured on a production build | accepted — watch on the real phone |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Watch the 2IC (or someone like her) do a real count with the cards**, not read them: can she find Save, Same as last time and Skip without help; does she understand "5 skipped — count them now?"; does she get back to a card she left; does she trust that nothing is saved until Review and save. This is the roles item's standard for her screens and cannot be done by Claude | A real phone, at the shelter, Thai |
| 2 | The numeric keypad opens on arrival at each card on a real touch phone (iOS and Android). The field is `inputmode="decimal"` and focused on mount — confirmed in the pane — but the pane clicks with a mouse, and iOS may require the tap that preceded the card to count as the gesture | A real phone |
| 3 | A medicine with a label photo: the photo is large and legible at the top of the card. The card photo's request (`?w=400`) returned 200 in the pane; nobody has looked at one | A real phone, a medicine with a photo |
| 4 | **Saving with no signal**: the offline catch ("Couldn't reach the server…", counts kept) was written but not driven — the pane cannot cut the network. Put the phone in airplane mode at the end of a short count, tap Save, expect that message and the counts still there; turn signal on and save | A real phone |
| 5 | Close the tab and reopen it mid-count on a real phone ("Picked up where you left off"), and a phone's own behaviour when its browser discards a background tab | A real phone |
| 6 | The slide between cards, and that it is switched off with the phone's reduce-motion setting | A real phone |
| 7 | Swipe was not built; buttons do everything. If the shelter wants swipe, that is a follow-up | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not ticked, the list is not empty and nobody has looked yet

Manual verification by: pending: the watched test with the 2IC and the real-phone checks 2–6 in the table above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending
