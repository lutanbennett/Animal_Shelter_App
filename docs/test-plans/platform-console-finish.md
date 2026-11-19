# Feature test plan — platform-console-finish

## Header

| | |
|---|---|
| Feature | The platform console's receipts form, the underscore email fix, and the product-admin presses driven (with three scope defects fixed) |
| Backlog item | `docs/backlog.md` → #rcpfm, #adrus, #padpr |
| Branch / worktree | `claude/platform-console-finish` @ `C:\Development\Animal_Shelter_platform-console-finish` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude, 2026-11-19 |
| Carries a migration? | yes: 0418, 0419, 0420, 0421 |
| Tested at SHA | @@SHA@@ |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the console gets a Set receipt numbers form, the email lookup accepts an underscore, and every console press was driven at aal2; driving them found that Create shelter, Add starting content, Set receipts, Remove address, Give Admin role and Link login were all refused and the checklist read other shelters as empty (0419, 0420, 0421)
- [x] Files/areas touched listed — `src/app/platform/` (actions.ts, ProductAdminPanel.tsx), `src/lib/i18n/dictionaries/en.ts` and `th.ts`, `supabase/migrations/0418` to `0421`, three old test plans' aal2 lines, `docs/`
- [x] Cards affected identified — none: access is `is_product_admin()` plus aal2, the named exception (`docs/decisions/2026-11-18-product-admin-screen.md`); admin and the signed-out public are not affected
- [x] Anything explicitly out of scope written down — `#flogn`, `#shnms`, `#lkaud`, the apex deploy, `#pltfd`, `shelterError`'s 42501 mapping, `dev-signin.mjs` and two shelters keyed `admin` (all in the decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly ("Already up to date.")
- [x] `node scripts/gates.mjs` ends with the one-line shape, every exit code `0`:

```
@@GATES@@
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs` ok for 0418 to 0421
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — one pending each time
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — 0419 first failed on a dollar-quote error in the generated file, which was fixed before any apply
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — 0418, 0419, 0420, 0421 each printed `ok`
- [x] File is re-runnable — every file is `create or replace function` and a guarded `alter … owner`
- [x] Existing rows still read correctly after the change — the checklist reads Lanna's five steps as before and now reads every other shelter truthfully
- [x] Constraints and defaults exercised against real rows — driven through the console against real dev rows: series `LCA` refused (23505), `PCF` set, `has_receipts` flipped; a simulated call as a product administrator without a shelter header reproduced the refusal before 0419 (`shelter_scope_select` on `site_pages`)
- [x] Down-migration written, or the reason one is not needed is stated — each file's header says how to undo (re-apply the earlier body); all four are `create or replace`
- [ ] Production apply plan stated for the release manager — pending: the four apply together, in order, before the deploy; the console already ships live and without 0419 to 0421 its writes fail

## 4. Functional checks

- [x] Happy path works end to end — all presses driven at aal2 (decision file, table)
- [x] Data persists — checked by leaving to `/my` and returning to `/platform` after each press
- [x] Create / edit / delete all exercised — create shelter, add and remove address, add and remove product administrator, link login
- [x] Empty state renders sensibly — a shelter with no addresses reads "none" and offers Add address
- [x] Invalid input is rejected with a readable message — unknown email, taken receipt letters, a bad address all answered in words
- [x] Boundary cases checked — underscore in an email accepted, in a web address accepted (noted), taken series refused

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin (is also a product administrator, aal2) | `/platform` | writable | PASS: every press above |
| a product administrator at aal1 | `/platform` | read-only, one notice, no controls, link to `/admin/security/verify` | PASS: 5 shelters, 0 forms, 0 buttons, the link |
| signed out | `/platform` | not reachable | n/a: not changed by this PR, which edits no page gate |

- [x] Every login above tested — the signed-out row is `n/a` above for that reason
- [ ] A login that should not have access is blocked server-side — n/a: no gate changed; the functions' own product-administrator and aal2 checks are unchanged and were left in place before the scope line

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no navigation changed
- [ ] Manual updated — n/a: the console is not in the user manual; only a product administrator sees it
- [x] Translatable strings go through the translation path — en and th carry every new key; `check-thai-dictionary.mjs` runs in `gates.mjs`; the Thai was written without a reviewer
- [ ] Mobile viewport (375px) — pending: not driven at 375px; the form uses the same input sizes as the neighbouring forms
- [ ] Browser console clean — pending: console not read during the presses
- [ ] Network clean — pending: network not read during the presses

## 6. Regression

- [x] The pages nearest the change still work — `/platform` at aal1 and aal2, `/my`
- [x] Any shared file touched checked from a second page — the dictionaries and `actions.ts` are used only by `/platform`; loaded `/my` and returned
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch — #rcpfm, #adrus and #padpr
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-19-platform-console-finish.md`
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: only a product administrator sees this screen, and today that is one person
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured, not reasoned — the scope cause was reproduced by a simulated call before the fix and by the driven presses after it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only pasted evidence is the gates output above, unedited
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Does this PR contain both a migration and code that reads it? — deferred: release manager. Yes: the form calls the 0416 function and the migrations 0419 to 0421 must be applied before the deploy
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: all four files replace function bodies and touch no rows
- [ ] Apply plan stated — deferred: release manager. 0418 to 0421 in order, before the deploy

### Rollback

- [ ] Rollback position stated — deferred: release manager. Re-apply the earlier function bodies named in each file's header; nothing here changes data

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | High | Create shelter, Add starting content and Set receipts refused for a product administrator (shelter-scope policies) | fixed, 0419 |
| 2 | High | The setup checklist read every other shelter as empty and Drive as "not connected" | fixed, 0420 |
| 3 | High | Remove address, Give Admin role and Link login refused or "not found" | fixed, 0421 |
| 4 | Medium | The email lookup refused an underscore (#adrus) | fixed, 0418 |
| 5 | Medium | Every 42501 is shown as "second step expired", which hid 1 to 3 | deferred to backlog (for the planner to file) |
| 6 | Low | `dev-signin.mjs <role>` fails once two shelters each have a role keyed `admin` | deferred to backlog (`scripts/` is another stream's) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Type an authenticator code on the verify screen and confirm you come back to a writable console | `/admin/security/verify` then `/platform` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-19

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: the step-up return needs a person with an authenticator

Manual verification by: pending: the step-up return, 375px, console and network reads

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: after the PR is open
- [ ] Handed to the production release manager — pending: not yet released

Result: pass with accepted defects

Release manager acknowledgement: pending: not yet released
