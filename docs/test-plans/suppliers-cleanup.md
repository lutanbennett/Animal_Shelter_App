# Feature test plan

## Header

| | |
|---|---|
| Feature | `suppliers-cleanup`, the final clean-up of suppliers leaving Contacts: `0348` |
| Backlog item | `docs/backlog.md` → `#xkfsv` (ticked: this is the last of its three halves) |
| Branch / worktree | `claude/suppliers-cleanup` @ `C:\Development\Animal_Shelter_suppliers-cleanup` |
| Dev server | not started: no UI surface changes |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude / 2026-11-09 |
| Carries a migration? | yes, `0348` |
| Tested at SHA | e9e4852f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: drops `supplier_contact_id` (two tables), `suppliers.source_contact_id` and `stock_vendors`, archives the Vendor contacts, and retires the check that read the dropped column
- [x] Files/areas touched listed: `supabase/migrations/0348_suppliers_cleanup.sql`, `scripts/lib/readonly-checks.mjs`, `scripts/check-production.test.mjs`, `scripts/check-contact-type-partner.mjs`, `docs/backlog.md`, one decision file. No `src/`, no `worker/`
- [x] Cards affected identified: none. No activity or card changes; Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down: the production apply (Lutan's step); no production data read or written

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: refused by design in a worktree; branch cut from `origin/main` today at cebea722
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — output as printed:

```
=== gates: typecheck exited 0 after 153s
=== gates: lint exited 0 after 291s
=== gates: test exited 0 after 40s
=== gates: build exited 0 after 303s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` (0347), and no other in-flight branch carries one (this batch's only slot)
- [x] `--status` reviewed before applying: 349 applied, 0 pending
- [x] `--dry-run` reviewed: `0348_suppliers_cleanup.sql … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`: `applying 0348 … ok`
- [x] File is re-runnable (`create or replace`, `drop … if exists`, and the guard skips once the column is gone)
- [x] Existing rows still read correctly after the change: dev has 0 Vendor contacts before and after, 1 supplier row; nothing to move on dev, so the archive update is a no-op there
- [x] Constraints and defaults exercised in a rollback harness: `check-bills-delivery-lines.mjs` HARNESS-OK exercises the rewritten stamp triggers; `check-stock-receipts.mjs` HARNESS-OK; `check-contact-type-partner.mjs` HARNESS-OK without its stock_vendors assertion
- [x] Down-migration: not needed; the drop is not reversible, so the migration refuses to run if any receipt or delivery still names a contact with no `supplier_id`
- [ ] Production apply plan stated for the release manager — pending: Lutan runs the production apply; it archives the Vendor contacts there (13 twins counted 2026-11-09, #k3mqp); nothing in the app reads the old columns, so order against the deploy does not matter

## 4. Functional checks

- [x] Happy path works end to end: a delivery and its lines save through the rewritten stamp triggers (harnesses above)
- [x] Data persists: the harnesses read back what the triggers stamped
- [ ] Create / edit / delete all exercised — n/a: no screen changed
- [ ] Empty state renders sensibly — n/a: no screen changed
- [ ] Invalid input is rejected with a readable message — n/a: no input surface; the guard's refusal message is in the migration
- [ ] Boundary cases checked — n/a: no thresholds; the one boundary is the guard, which passed on dev (no orphans)

### Role access matrix

n/a: no route, card or policy changes.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: no surface |
| exactly `suppliers` | n/a | n/a | n/a: no surface |
| signed out | n/a | n/a | n/a: no surface |

- [ ] Every login above tested — n/a: nothing to sign in to
- [ ] A login that should not have access is blocked server-side — n/a: no access changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a shelter user sees changed
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work: grep of `src/` and `worker/` finds no reader of the dropped names; the delivery and bill triggers pass their harnesses
- [x] Any shared file touched checked: `scripts/lib/readonly-checks.mjs` is re-loaded by `node --test scripts/check-production.test.mjs` (7 of 7 pass)
- [x] Nothing merged from `main` during `sync` was broken by this branch: the branch is at the tip of `main` (cebea722)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (`#xkfsv`, title rewritten to say nothing is open)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-09-suppliers-cleanup.md`
- [x] `README.md` still accurate: it names none of the dropped objects
- [ ] **Release notes.** n/a: nobody at the shelter would notice; Contacts has hidden Vendor rows since 0338, and the production apply is still outstanding
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the hidden readers (the two stamp functions) were found by reading 0337 and proved by the bills harness; dev counts came from a query

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no boundary or banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it in one PR? — n/a: no code reads the dropped objects; the only readers were scripts, changed here
- [ ] `--env production --dry-run` run and clean — deferred: Lutan, with the production apply
- [ ] Backup fresh for a destructive migration — deferred: Lutan, before the production apply (this drop is destructive)
- [ ] Apply plan stated — deferred: Lutan (see section 3)

### Rollback

- [x] Rollback position: `git revert` restores the check scripts but NOT the dropped columns or the archived contacts; the columns held nothing `supplier_id` does not, and un-archiving is clearing `archived_at` on the Vendor rows

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | 0337's two stamp functions named the dropped columns; a dry-run would not have caught it | fixed: rewritten at the top of 0348 |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: Lutan applies 0348 to production

Result: pass
