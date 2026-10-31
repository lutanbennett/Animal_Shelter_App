# Feature test plan — assistant-reads-narrow-view

## Header

| | |
|---|---|
| Feature | The assistant's resident reads go through `resident_who_and_where`, so a card narrowed to who-and-where can name an animal |
| Backlog item | `docs/backlog.md` → **THE ASSISTANT CANNOT NAME AN ANIMAL FOR ANY CARD NARROWED TO WHO-AND-WHERE** (ticked) |
| Branch / worktree | `claude/assistant-reads-narrow-view` @ `C:\Development\Animal_Shelter_assistant-reads-narrow-view` |
| Dev server | `http://localhost:3009` |
| PR | pending: the number is known once the PR is open |
| Tested by / date | Claude / 2026-11-01 |
| Carries a migration? | no — `0296` stays free; the narrow view already carries every column the lookups read |
| Tested at SHA | `d656a9a9` (after sync with `origin/main`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — six assistant resident reads move from `resident_list_view` / `residents` (which ask `resident.record`) to `resident_who_and_where` (which asks a card that carries who-and-where)
- [x] Files/areas touched listed — `src/lib/assistant/data.ts`, `src/app/assistant/lookups.ts`, `src/lib/enclosures/options.ts` (shared headcount loader, declared in the decision file), `scripts/prove-assistant-reads-narrow-view.mjs`, `src/lib/releases.ts`, `docs/` (decision, faults row, backlog)
- [x] Roles affected identified — by card: `assistant` and every card holding `resident.who_and_where` but not `resident.record` gain a working lookup and a correct enclosure headcount; a login holding `resident.record` sees the same rows as before (proof 6)
- [x] Anything explicitly **out of scope** written down — `0295`; the per-tool activity each write asks (`medical.weight` etc.); the assistant's wording and tools; `could-not-help.ts:130` (admin review screen, found not fixed); the manual

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (the 0.41.0 record)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Exit code read directly, output redirected to a file:

```
=== gates: build exited 0 after 175s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration; the app half reads the same rows through a different view, proved equal in `prove-assistant-reads-narrow-view.mjs` assertions 1 and 6
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness on dev (`scripts/prove-assistant-reads-narrow-view.mjs`). Asserted: a login holding exactly the `assistant` card reads all residents through the view and zero rows of `resident_list_view`, `residents`, `placement_history`, `weight`, `prescriptions`, `clinic_visits`; the view's columns are only the fixed who-and-where list; a no-card login reads nothing; `view_residents` counts the same placed residents in both views; no assistant source file reads the old relations. Made to fail once by inverting assertion 2, which failed with "reads 0 rows of resident_list_view"
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration; the change is `src/` only and needs no apply

## 4. Functional checks

Driven on dev at port 3009 as card-only logins (`dev-signin.mjs --cards …`, aal1), through the assistant panel opened from the header.

- [x] Happy path works end to end — `assistant, record_weight`: "Walkassistant weighs 12.6 kg on 2026-10-20" answered "Done — Walkassistant (R-8383) recorded at 12.6 kg on 20 Oct 2026", with no `view_residents`
- [x] Data persists — the weight row and its `confirmed` `assistant_actions` row are written by the assistant's own action (the first request that day was refused as a duplicate, which also shows the weight read works)
- [ ] Create / edit / delete all exercised — n/a: the change is to reads; the one write exercised is above
- [ ] Empty state renders sensibly — n/a: the empty picker is the fault being removed; "Walkassistant isn't in an enclosure at the moment" renders for an unplaced resident
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: no boundary logic changed

### Role access matrix

By card, not by role. Each row is a login holding exactly the cards named.

| Card(s) held | Can reach | Expected | Result |
|---|---|---|---|
| `assistant, record_weight` | assistant: where, who, space, weight write | names a resident, completes the write | pass (driven) |
| `assistant` alone | assistant: where, who, space; weight write | names residents; the weight is refused by `weight`'s own policy (`medical.weight` missing, by design) | pass (driven); the database message is shown raw, found not fixed |
| no card | the view | reads nothing | pass (proof 5) |
| Admin | everything, outside the card system | unchanged | n/a: no Admin path touched |
| signed out | the view | no grant | n/a: no grant changed |

- [x] Every card that matters tested — the two above driven, the no-card case by the harness
- [x] A login that should not have access is blocked server-side — the harness reads as `authenticated` with the real policies and finds `residents` and the other record tables empty for the `assistant` card

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no manual line describes the lookup needing the whole record; named in the PR
- [ ] Translatable strings — n/a: no string changed
- [ ] Mobile viewport — n/a: no layout change
- [x] Browser console clean — no error was raised by the panel during the drive (the dev server logged none for the requests)
- [x] Network clean — every assistant request answered; the only refusal was the by-design `weight` policy

## 6. Regression

- [x] The pages nearest the change still work — the assistant's "Who is in Cat Enclosure?" listed all five residents; "Which enclosure has space?" answered with counts
- [ ] Any shared file touched checked from a second page — n/a for `NavLinks.tsx` and `manual/en.ts` (not touched). `src/lib/enclosures/options.ts` is shared by eleven call sites; the assistant's space lookup was loaded from it, and proof 6 shows a resident-record login counts exactly what it did
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates below

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-01-assistant-reads-narrow-view.md`
- [x] `README.md` still accurate — it does not describe these reads
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line, tagged to the `assistant` card. No manual step is outstanding before it is true: any login holding the card gets it on deploy
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The six reads are from reading the files; the empty-picker and zero-row claims are from the harness's own queries and the driven logins

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic changed
- [ ] **Boundary or banding change** — n/a: no threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block is verbatim
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR? — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — `./scripts/pi/deploy-pi.sh --ref <previous sha>` reverts the three `src/` files; there is no schema to revert

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The assistant offers a weight to a login holding `assistant` alone and the refusal shows the raw database message ("new row violates row-level security policy") | accepted: the per-tool gate is the design; the wording is outside this item |
| 2 | low | `src/lib/assistant/could-not-help.ts:130` reads `residents` for names on the admin review screen, which asks `resident.record` | deferred: found, not fixed (a different surface and card) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Give the `assistant` card to a role in Settings → Who does what and sign in as someone holding it with nothing wider: confirm the assistant finds an animal by name | Settings → Who does what, then the assistant panel |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the item above

Manual verification by: pending: Lutan assigning the assistant card in Who does what and looking once

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: the PR is not open yet
- [ ] Handed to the production release manager — pending: after the merge

Result: pass

Release manager acknowledgement: pending
