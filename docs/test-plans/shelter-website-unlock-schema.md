# Feature test plan — shelter-website-unlock-schema

## Header

| | |
|---|---|
| Feature | Schema half of #wbopn: product_admin_set_shelter_site, the one write that sets shelters.public_site |
| Backlog item | `docs/backlog.md` → #wbopn (left open: console control follows) |
| Branch / worktree | `claude/shelter-website-unlock` @ `C:\Development\Animal_Shelter_shelter-website-unlock` |
| Dev server | not started — no UI surface in this PR |
| PR | pending: number assigned on open |
| Tested by / date | Claude / 2026-11-23 |
| Carries a migration? | yes — `0436_product_admin_set_shelter_site.sql` |
| Tested at SHA | `191c34e44` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — one security-definer function so the console can set a shelter's website state
- [x] Files/areas touched listed — `supabase/migrations/0436_*.sql`, `supabase/harness/product_admin_set_shelter_site.sql`, a decision file, this plan
- [x] Cards affected identified — none; the function is product-administrator + aal2, not card-governed; Admin and the public are unaffected, nothing calls it yet
- [x] Anything explicitly **out of scope** written down — the console control, runbook edit, end-to-end proof and release note are the follow-up on this branch

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in with git merge, clean
- [x] `node scripts/gates.mjs` ends with the closing lines below, from my run:

```
=== gates: typecheck exited 0 after 66s
=== gates: lint exited 0 after 267s
=== gates: test exited 0 after 65s
=== gates: build exited 0 after 297s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — no open PRs, highest 0435
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 437 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — ok
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace`, grants restated)
- [x] Existing rows still read correctly after the change — adds a function only, no table touched
- [x] **Constraints and defaults exercised** in a begin/rollback harness (`supabase/harness/product_admin_set_shelter_site.sql`): new shelter is locked; refused with no claims; refused at aal1; value 'bogus' rejected; open and locked round-trip
- [x] Down-migration not needed: purely additive, `drop function public.product_admin_set_shelter_site(uuid, text)` undoes it
- [x] Production apply plan: `0436_product_admin_set_shelter_site.sql` to `dbkodyyxxhtygxcxmfcu` at release, before any deploy that uses the control

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; the harness covers the function
- [ ] Data persists — n/a: no UI surface; harness read the value back
- [ ] Create / edit / delete all exercised — n/a: one update function
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: harness proved a bad value raises 22023 with a clear message
- [ ] Boundary cases checked — n/a: closed set of three values, all exercised in the harness

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | function | not a product admin unless in product_admins; refused otherwise | n/a: harness covers refusal |
| signed out | function | revoked from anon | n/a: grant revoked, not exercised |

- [ ] Every login above tested — n/a: nothing calls the function yet
- [ ] A login that should not have access is blocked server-side — n/a: harness proved the refusal with no claims and at aal1

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code reads the function yet
- [ ] Any shared file touched checked from a second page — n/a: no shared file touched
- [x] Nothing merged from `main` during sync was broken by this branch — gates green after the merge

## 7. Documentation

- [ ] Backlog item ticked — n/a: #wbopn and #shrun stay open until the follow-up
- [x] Non-obvious design choices added as a new file in `docs/decisions/`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: nobody would notice, a database function nothing calls yet
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — harness run

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager
- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates involved
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no thresholds
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added
- [ ] **Does this PR contain both a migration and code that reads it?** n/a: migration only, nothing reads it yet
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] Destructive migration backup — n/a: additive function only
- [ ] Apply plan stated — n/a: stated in section 3
- [ ] Rollback position stated — n/a: drop the function; no data changed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | nothing; no surface to look at | |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-23

- [x] The manual list above is empty, so nothing is being signed for

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none found
- [ ] Checklist pasted into the PR — n/a: the plan file is in the PR
- [ ] Handed to the production release manager — pending: at release

Result: pass

Release manager acknowledgement: pending: at release
