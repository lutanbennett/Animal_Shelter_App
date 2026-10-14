# Feature test plan — cards-who-does-what

## Header

| | |
|---|---|
| Feature | Who does what as cards: a role's cards with tap-a-card detail, Add / Remove / Move, an Also allowed list for extras; the 56-row grid moved to a read-only Details page |
| Backlog item | `docs/backlog.md` → **Who does what, simplified into cards …** (left open; this is stream 2 of 4) |
| Branch / worktree | `claude/cards-who-does-what` @ `C:\Development\Animal_Shelter_cards-who-does-what` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | pending: opened after this plan |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | no |
| Tested at SHA | `c6f35af4` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `/admin/who-does-what` becomes a role's cards (tap one for what it gives, Add a card from a library that shows the same detail first, Remove, Move, Also allowed for extras) and the grid moves one tap away to `/admin/who-does-what/details`, read-only
- [x] Files/areas touched listed — `src/app/admin/who-does-what/` (`page.tsx` new, `details/page.tsx` the old grid, `actions.ts` rewritten, `CardControls.tsx`, `roles.ts`; `CellSelect.tsx` and `setCell` removed), both dictionaries (`admin.whoDoesWhat.cardsView`), `src/lib/manual/en.ts` (the topic), `src/lib/releases.ts`, `eslint.config.mjs` (service-role allow-list), `scripts/check-permission-catalogue.mjs` and `scripts/check-who-does-what-page.mjs` (the new route / the grid's new path)
- [x] Roles affected identified — Admin (gives and removes cards, at 2-step) and Management (looks, cannot change); nobody's access changes by this PR: `role_permissions` hashes per role are identical before and after (section 4)
- [x] Anything explicitly **out of scope** written down — the home screen as the role's cards (stream 3) and the left-menu removal (stream 4); no migration; `has_permission()`, every policy and `can()` untouched; no card added, renamed or merged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict, `unreleased` in `src/lib/releases.ts` (both sides added lines), resolved by keeping all of them
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Exit codes read from the script's own output:

```
gates: build exited 0 after 43s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; `0194` landed in stream 1
- [ ] `node scripts/apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the equivalent for this PR, `role_permissions` before and after, is in section 4
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; `scripts/check-cards-schema.mjs` (stream 1's harness, run through `scripts/test-support/register.mjs`) was re-run against the live dev state after the browser testing and ends `All checks passed.` — every role's cards plus extras equal its cells exactly (2IC: 5 cards + 14 extras = its 22 cells; management: 2 + 43 = 57)
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration; `0194` is already part of the next release's apply plan

## 4. Functional checks

- [x] Happy path works end to end — as Admin (a throwaway login stepped up to the authenticator-app level), at 375 px: opened the 2IC's cards, tapped **View residents** in the Add a card list (detail showed "A resident's details, housing and history: Read" and "This role does not have this card yet" before adding), pressed Add; then **Residents** (detail: "Includes: View residents", Edit on the record, the move/rehome/death/photo list), pressed Add; the 2IC's boxes went 22 → 30, edit and photo upload now in the list; Remove took them back
- [x] Data persists — the added card was still listed after a full reload; `role_permissions` re-read from the database by script after each step
- [x] Create / edit / delete all exercised — Add card, Remove card (both through the real buttons), and Allow one more thing (the microchip and photo boxes restored through the form, with a reason). Move up/down is exercised by `moveCard`'s code path through the same `set_role_cards` call as Add; not pressed in the browser
- [x] Empty state renders sensibly — a role with no cards shows "This role has no cards yet." (code path; every live role has at least one card, so not seen on screen); an empty Also allowed shows "Nothing. Everything this role can do comes from its cards."
- [x] Invalid input is rejected with a readable message, not a crash — Allow this with an empty reason is refused in words ("Say why: …") by `addExtra`; a non-card, non-activity or not-a-live-role key is refused by the server action. Admin without the authenticator step sees no buttons, only "verify with your authenticator app first", and the action refuses a hand-made call
- [x] Boundary cases checked — **a card removed while another still covers its activity**: View residents was added and removed while Do Maintenance still gave `resident.record` Read, the role's fingerprint did not move. **An extra a card also covers**: found that the first version deleted it when the card was added, so removing the card later took away a power granted singly (22 → 20 boxes: the 2IC lost microchip and photo boxes); fixed so the extra stays stored and is only hidden from the list, then re-proved (below)

**The recompute, proved by hashing `role_permissions` per role (sha256 of the sorted `activity=level` list), before any change and after all of it:**

```
admin                    0 e3b0c44298fc
doctor                   2 70fc143f89ab
head_of_maintenance      8 378548b19b7c
head_of_medical          9 5bb0745ff955
management              57 49da986b7acc
public_viewer            0 e3b0c44298fc
second_in_command       22 1f2b903e13f7
staff                   39 e24b41ad2bce
volunteer                5 7d17a60d2a40
```

`diff before after` is empty. Between them, with the fixed code: Residents added to the 2IC → `second_in_command 30 efef81837de0` (the 8 extra boxes Residents brings: edit on the record and adoption news, move, hospital, rehome, death, manage photos, publish photos); Residents removed → back to `22 1f2b903e13f7`. The 2IC still holds the View residents card (read only, covered by Do Maintenance), which changes no cell.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/who-does-what`, `/details` | sees the cards and, at 2-step, the Add / Remove / Move buttons | pass — driven at 375 px; Details has no select boxes |
| management | `/admin/who-does-what`, `/details` | sees the same page, no buttons, "Only an Admin can give or remove cards." | pass — driven at 375 px: 0 buttons, no horizontal overflow, 2 cards and 43 extras shown |
| staff | nothing | refused | n/a: retired role (`0173`), no login holds it |
| doctor | nothing | refused | pass — `check-who-does-what-page.mjs` covers the role guard through `volunteer` and `second_in_command` (same `opensWhoDoesWhat` check); no doctor login driven |
| volunteer | nothing | sent to /no-access | pass — `check-who-does-what-page.mjs`: sent to `/no-access`, sees none of the page |
| signed out | nothing | sent to /login | pass — same script |

- [x] Every role above tested — admin and management driven in the browser; volunteer, second_in_command and signed out by `check-who-does-what-page.mjs` (ends `OK`); staff and doctor see the same guard, not separately driven
- [x] A role that should not have access is blocked server-side — the script hits `/admin/who-does-what` directly as volunteer and 2IC and is sent to `/no-access`; the actions refuse anyone but an Admin at the authenticator step (`hasAdminRole()` and `hasTwoStep()`), and the database's own policies on `role_cards` / `role_permissions` refuse the rest (stream 1's harness)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added or moved; the page's address is unchanged, and `check-who-does-what-page.mjs` confirms the tile on `/admin` and `/management` is still offered to Admin and Management only
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly — the **Who does what** topic rewritten for cards, Also allowed and Details; not loaded at `/manual` on screen
- [x] Translatable strings go through the translation path — all new words are in both dictionaries under `admin.whoDoesWhat.cardsView`, including a one-sentence description per card keyed by `CardKey` (a new card fails the type check until it has one). The Thai is Claude's; it is in Left for manual verification
- [x] Mobile viewport (375px) — driven at 375×812: no horizontal overflow (`scrollWidth <= innerWidth` as Management), role buttons wrap, controls are at least 44 px high
- [x] Browser console clean — `read_console_messages` errors: none
- [x] Network clean — dev server log: every `GET`/`POST` 200, the server actions `addCard`, `removeCard` and `addExtra` each logged once per press

## 6. Regression

- [x] The pages nearest the change still work — the Details grid loads as Management (62 rows, no selects, link back to the cards) and `check-who-does-what-page.mjs` reads every box of it against the database (all `ok`, ends `OK`); `/admin` and `/management` landings still offer the tile
- [x] Any shared file touched checked from a second, unrelated page — the two dictionaries and `releases.ts` are shared; the Who does what page and the `/admin` and `/management` landings were loaded from them in the harness run, and the full build compiles every reader
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: deliberately left open, streams 3 and 4 remain; a STATUS note for stream 2 is added to the item. Searched the backlog for `who-does-what`, `jobs.ts`, `role_permissions` and `freeze`: the only other item, the frozen grid headings, is already ticked and still true (the Details grid keeps its sticky headings)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-14-who-does-what-cards-page.md`
- [x] `README.md` still accurate — it does not describe this page
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for Admin and Management: Who does what is now cards, the grid is under See every activity (Details) and is read-only, nobody's access changes on the day
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — "access did not change" is the per-role hash diff above; "removing a card takes away only what it gave" is the 22 → 20 → 22 result that found and fixed the extras-deletion defect

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for the deploy output; the hashes and gates output above are the scripts' own output
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR; it reads `role_cards`/`role_extras` from `0194`, so **`0194` must be applied to production before this deploys**, or the page errors on the missing tables
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only — n/a: no migration
- [ ] Apply plan stated — n/a: no migration of this PR's own; `0194` goes first (see above)

### Rollback

- [ ] Rollback position stated — n/a: code only; reverting restores the editable grid, and any cards given in the meantime stay in `role_cards` and `role_permissions`, which the grid reads, so nobody's access changes either way

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | First version of Add a card deleted any extra the new card also covers; removing the card later then silently took away a power the role had been given singly (2IC: 22 → 20 boxes) | fixed — extras are kept and only hidden from Also allowed while a card covers them; re-proved by hash |
| 2 | info | Management's 43 extras all show under Also allowed until it is given the cards that cover them; adding a card hides what it covers and changes no access | accepted — recorded in the decision file |
| 3 | info | The 2IC on dev now holds the View residents card from the testing; it changes no cell | accepted — dev data is disposable |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The Thai words on the page read naturally to a Thai speaker (the card descriptions and the buttons), `cardsView` in the Thai dictionary | `/admin/who-does-what` with the language set to ไทย |
| 2 | The Director, on her own phone, finds the page easier than the grid: tap a card, read what it gives, Add a card | `/admin/who-does-what` on a phone |
| 3 | The Who does what topic in the manual reads correctly | `/manual` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty, and only the person who looks may tick this; it is recorded as pending on the signature below

Manual verification by: pending: the Thai wording, the Director's phone and the manual topic need a person to look

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch and linked from the PR description
- [ ] Handed to the production release manager — n/a: handed over when the release is cut, after merge

Result: pass

Release manager acknowledgement: pending
