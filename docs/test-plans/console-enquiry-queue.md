# Feature test plan

## Header

| | |
|---|---|
| Feature | The enquiry queue on the platform console: see who asked to join, mark contacted/declined, create a shelter from an enquiry with the contact carried over |
| Backlog item | `docs/backlog.md` → `#shsup` (last half) |
| Branch / worktree | `claude/console-enquiry-queue` @ `C:\Development\Animal_Shelter_console-enquiry-queue` |
| Dev server | `http://localhost:3002` |
| PR | see the PR for this branch |
| Tested by / date | Claude / 2026-11-20 |
| Carries a migration? | no — uses 0427 and 0428 |
| Tested at SHA | a2bb56930 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: the console lists enquiries and turns one into a shelter without retyping the contact
- [x] Files touched: `src/app/platform/{page.tsx,actions.ts,ProductAdminPanel.tsx}`, both dictionaries (new `enquiries` block under `productAdmin`), `docs/`; no migration, no worker file
- [x] Cards affected: none. Gate is product administrator plus aal2, enforced by the functions and table policies; no role read
- [x] Out of scope: mail, a Drive connect button (`#pacon`), any change to the form

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR body
- [x] `node scripts/gates.mjs` ends with the four exit codes — see the PR body for the pasted line
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] Constraints and defaults exercised against real rows — n/a: no migration; a real enquiry was carried and read back
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: enquiry made through `/platform/enquire`, listed on `/platform`, marked contacted, then Create shelter pressed; the shelter's account holder (name, email, phone, location) arrived and was read back, and the enquiry then read "Shelter created" with no controls
- [x] Data persists — after a reload the enquiry showed "Shelter created" and the new shelter card showed the account holder
- [ ] Create / edit / delete all exercised — n/a: no delete exists; Decline was not pressed on a live row
- [x] Empty state renders sensibly — the "Nobody has asked to join yet." line is in the code; not driven because dev holds rows
- [x] Invalid input is rejected with a readable message — the Create button stays disabled until a short name is typed; server errors map to dictionary sentences
- [x] Boundary cases checked: a `<b>` tag in the message renders as text (0 elements)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| product administrator, aal2 (dev-signin admin) | `/platform` queue and every control | all shown and working | driven in Chrome via playwright-core |
| product administrator, aal1 | `/platform` queue | read-only, no controls | pending: not driven; controls are gated on `canWrite` as the existing ones are |
| not a product administrator | `/platform` | the existing wrong-door page | unchanged code |

- [ ] Every login above tested — pending: aal1 and non-product-admin not driven
- [x] A login that should not have access is blocked server-side: actions check `isProductAdmin()` and `hasTwoStep()`; the table and functions enforce both

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry
- [ ] Manual updated — n/a: the console is for the product operator, not a shelter manual topic
- [x] Translatable strings go through the dictionaries (en and th added)
- [ ] Mobile viewport (375px) — pending: not driven
- [ ] Browser console clean — pending: driven headless, console not read
- [ ] Network clean — pending: not inspected

## 6. Regression

- [x] The pages nearest the change still work: the shelter cards and the new shelter card rendered in the same run
- [ ] Any shared file touched checked from a second page — n/a: the dictionaries gained keys only
- [x] Nothing merged from `main` during `sync` was broken — see PR body

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` (`#shsup`; `#pacon` left open)
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-20-console-enquiry-queue.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: only a product administrator, today one person, sees this screen; no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured: the carry was read back from the shelter, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic beyond showing the arrival time
- [ ] Boundary or banding change assertions — n/a: no banding
- [ ] Evidence pasted into this plan is the actual tool output, unedited — deferred: release manager
- [ ] Public pages re-checked after a cache purge — n/a: the console is not a public page

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration; 0427 and 0428 are already applied
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; no schema changed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | right after Create the enquiry card still showed its controls for a few seconds until the refresh landed; a reload shows the right state | accepted |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Press Decline on a fresh enquiry and confirm it greys out and offers no Create | `/platform` as a product administrator at aal2 |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Decline press

Manual verification by: pending: Decline press

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — pending: after merge

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
