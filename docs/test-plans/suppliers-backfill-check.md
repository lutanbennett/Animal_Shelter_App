# Feature test plan

## Header

| | |
|---|---|
| Feature | `suppliers-backfill`, a read-only production check for `0338`'s catch-up back-fill |
| Backlog item | `docs/backlog.md` → `#k3mqp` (the instrument it needs; the item itself stays open) |
| Branch / worktree | `claude/suppliers-backfill-check` @ `C:\Development\Animal_Shelter_suppliers-backfill-check` |
| Dev server | not started — no runtime surface; the check is a script |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (planner) / 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | the branch tip at the time the gates below were run |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — **one read-only check added to `scripts/lib/readonly-checks.mjs`, plus two tests, so that `#k3mqp`'s "count before, apply, count again" can actually be done**
- [x] Files/areas touched listed — `scripts/lib/readonly-checks.mjs`, `scripts/check-production.test.mjs`, and two new docs (`docs/decisions/2026-11-09-suppliers-backfill-check.md`, this plan). **No `src/`, no `worker/`, no `supabase/migrations/`, no shared app libs**
- [x] Cards affected identified — **none.** The check grants nothing and is not reachable from the app: it is a script run from a developer's machine with the Management API token. Admin and the signed-out public are unaffected
- [x] Anything explicitly **out of scope** written down — **the apply itself.** This PR applies no migration and changes no data. `0338` cannot be applied alone in any case (four files are pending on production), which is Lutan's decision and is recorded on `#k3mqp`. **Also out of scope:** `#xkfsv`'s clean-up, which will drop `supplier_contact_id` and so retire two of this check's figures

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — `n/a: refused by design in a worktree` (*"worktree: run 'git pull' in the main checkout instead"*). The worktree was cut from `origin/main` minutes earlier and `git fetch && git merge origin/main` reported `Already up to date`
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run in this worktree, output pasted below exactly as it printed:

```
=== gates: typecheck exited 0 after 7s
=== gates: lint exited 0 after 111s
=== gates: test exited 0 after 20s
=== gates: build exited 0 after 51s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — `n/a: not yet — the PR does not exist at this commit`

## 3. Schema and data — *skip if no migration*

Skipped: this PR carries no migration. **It reads a migration's effect; it does not add one.**

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `--status` reviewed before applying — **`n/a: nothing to apply in this PR`** — though the command was run as research, and it is what established that production is four files behind (`0338`, `0339`, `0340`, `0341`)
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [x] Existing rows still read correctly after the change (checked against real dev data) — **the check was run against dev (`qxkmhwybjggxvsfxsxbd`) and answered from live rows**: `0 Vendor contact(s); 1 supplier row(s), 0 twinned to a contact`, all four orphan counts zero, `0338` applied → *"the back-fill is complete"*. **It changes no row**: `buildQuery` wraps it in `begin read only; … rollback;` and `assertSelectOnly` refuses anything that could write
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — `n/a: no migration. The check's own read-only transaction is asserted by the existing "every production check is one SELECT and runs in a read-only transaction" test, which now covers this check too`
- [ ] Down-migration written — `n/a: no migration`
- [ ] Production apply plan stated — `n/a: this PR applies nothing. The apply plan for the four pending files is Lutan's decision, recorded on #k3mqp`

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-production.mjs suppliers-backfill --env test` printed the three lines and the correct verdict against dev
- [x] Data persists — **`n/a` in the usual sense (no write), and the stronger statement is the point: nothing persists, by design.** Re-running gives the same answer
- [ ] Create / edit / delete all exercised — `n/a: a read-only check creates, edits and deletes nothing`
- [x] Empty state renders sensibly (no rows yet) — **this is dev's actual state and it is the empty case**: zero Vendor contacts, and the render reads correctly rather than printing a bare `0`
- [x] Invalid input is rejected with a readable message, not a crash — **an unknown check name is refused** by `buildQuery` (`no such check: …`), which the existing test *"a caller cannot supply SQL"* pins; `--env` other than `production`/`test` is refused with `--env must be production or test.`
- [x] Boundary cases checked — **the three verdict boundaries are the whole contract and are driven by a new test**: `0338` not applied (orphans are the size of the job, passes), applied and clean (passes), applied with orphans (fails). **Each of the four orphan counts alone is asserted to be enough to fail**, so no single figure can be forgotten

### Role access matrix

`n/a`: a script, not a page. It is run from a developer's machine with the Management API token and has no route, no card and no session.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a — not served by the app | n/a | n/a: no route |
| exactly `<card key>` | n/a — not served by the app | n/a | n/a: no route |
| signed out | n/a — not served by the app | n/a | n/a: no route |

- [ ] Every login above tested — `n/a: no route and no card; there is nothing to sign in to`
- [ ] A login that should not have access is blocked server-side — **`n/a: no route`** — and the access that *does* matter is the Management API token, which is not changed by this PR

## 5. Cross-cutting

- [ ] Nav entry correct — `n/a: no nav entry; NavLinks.tsx untouched`
- [ ] Manual updated — `n/a: the manual is for shelter users; this is a developer's check`
- [ ] Translatable strings go through the translation path — `n/a: the check's output is developer-facing English in a terminal, like every other check in that file`
- [ ] Mobile viewport (375px) — `n/a: no UI`
- [ ] Browser console clean — `n/a: no UI`
- [ ] Network clean — `n/a: no UI. The check makes one POST to the Supabase Management API, which is its purpose`

## 6. Regression

- [x] The pages nearest the change still work — **`n/a: no pages`.** The nearest *code* is the other 29 checks in the same file, and `node --test scripts/check-production.test.mjs` passes **8 of 8**, including the file's existing assertions that **every** check is one SELECT in a read-only transaction and that the write-lint still refuses the six dangerous shapes
- [x] Any shared file touched — **`scripts/lib/readonly-checks.mjs` is shared, and it was checked by loading it rather than by reading it**: `node scripts/check-production.mjs suppliers-backfill --env test` ran the real module end to end, and the test file imports it and exercises the other checks through `buildQuery`. **An insertion into that object could have broken a neighbour's entry; running them is what proves it did not**
- [x] Nothing merged from `main` during `sync` was broken by this branch — `origin/main` was already at the branch point (`Already up to date`), and the gates ran on that tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — **`n/a: #k3mqp is NOT closed by this and must not be ticked.`** It needs the production apply and both counts; this PR is only the instrument it was missing. Ticking it would be the false-assurance shape the testing rules warn about
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-09-suppliers-backfill-check.md`, which records why the check guards on `schema_migrations` instead of simply failing on any orphan, and why `vendor_contacts`/`suppliers_twinned` are printed as well as the orphans
- [x] `README.md` still accurate — unchanged and unaffected; it does not enumerate the individual checks
- [ ] **Release notes.** `n/a: nobody at the shelter would notice. This is a developer's read-only check run from a terminal; no page, no behaviour and no data changes`
- [x] Commit messages say why, not just what — the commit says that the count `#k3mqp` requires had no instrument, which is why the apply did not proceed
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The four invariants were read out of `0338_suppliers_card.sql` (its `insert … on conflict`, the two `update … where s.source_contact_id = …` statements, the Shelter Friends re-point, and its two closing `raise exception` blocks) rather than inferred from the item's prose; the dev figures are the check's own output; and the "four files pending" statement is `--status --env production`'s output. **Where production is concerned the plan says "not read" rather than guessing**

## 8. Pre-production gate

Nothing here is deployed by this PR: a check is not bundled into the app and is not served. Each gate below is
`n/a` with its reason rather than `deferred:`, because there is no deploy-time moment at which it becomes true.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — `n/a: nothing is deployed by this PR`
- [ ] Deployed SHA matches the tested SHA — `n/a: nothing is deployed by this PR`

### On the deployed build

- [ ] Deployed to test — `n/a: nothing is deployed by this PR`
- [ ] Smoke-tested on `test.lannacare.org` — **`n/a: no runtime surface`** — the equivalent evidence is that the check was run against the dev project, which is the database `test.lannacare.org` uses
- [ ] Timezone-sensitive behaviour proved — `n/a: no date logic. The check counts rows; it reads no clock`
- [x] **For a boundary or banding change, the assertions cover both edges** — **this check IS a boundary**, and the boundary is `0338` applied or not. Both sides are asserted, and the four orphan counts are each asserted individually rather than only in combination, which is the discriminating case rather than the noticed one
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block in section 2, and the dev figures quoted in sections 3 and 4, are the commands' own output
- [ ] Public pages re-checked after a cache purge — `n/a: no public page changes`

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — `n/a: no deploy`
- [ ] `strip-baked-env` line seen — `n/a: no deploy`
- [ ] Any new secret/env var exists in the production Cloudflare environment — `n/a: none added. The check uses SUPABASE_ACCESS_TOKEN, which check-production.mjs already requires`

### Migration ordering — *skip if no migration*

Skipped: no migration in this PR.

- [ ] Does this PR contain both a migration and code that reads it? — **`n/a: no migration here.`** The inverse is worth stating: this PR is code that reads a migration **already on `main` and not yet on production**, which is exactly why it is useful before the apply rather than after
- [ ] `--env production --dry-run` run and clean — `n/a: no migration in this PR`
- [ ] Backup fresh for a destructive migration — `n/a: no migration in this PR`
- [ ] Apply plan stated — `n/a: no migration in this PR`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` of this one commit removes the check and its tests, and that is all it needs to cover**: nothing is deployed, no schema changes, and the check has written nothing to any database (its transaction is `begin read only; … rollback;`). **What a revert would NOT undo is that the research behind it stands**: production is four migrations behind, and `#k3mqp` still has no production count

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The first version of the new test used `/values \(/` and reached the file as `/values (/`, an unterminated group, so the whole test file failed to parse — a syntax error, not a failing assertion. Rewritten as the character class `/values [(]/` | fixed — and it is why the test file was run before the gates rather than after |
| 2 | low | Two of this check's figures (`receipts_unlinked`, `deliveries_unlinked`) read `supplier_contact_id`, which `#xkfsv`'s final clean-up will drop. The check will then need those two lines removed | accepted — recorded in the decision file under *"What this does NOT do"* so the dependency is found before the clean-up breaks it, rather than guessed at |

## Left for manual verification

One item, and it is the whole point of the check: **running it against production.** A worktree cannot read
production, and `check-production.mjs` defaults to production but needs `.env.deploy.production`, which a worktree
does not get — so this has to be done from the main checkout by the planner or the release manager.

| # | What to check | Where |
|---|---|---|
| 1 | `node scripts/check-production.mjs suppliers-backfill` — the before-count. Expect about **20** Vendor contacts (Lutan, 2026-11-09) and `0338 is NOT applied here`. **If it reports `0338` applied, stop and read the figures: that would mean the apply happened without this count being taken** | main checkout, `C:\Development\Animal_Shelter_App` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (planner)  Date: 2026-11-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `pending: the production before-count, which a worktree cannot take; the planner or release manager runs it from the main checkout`

Manual verification by: pending: the production run of `suppliers-backfill` from the main checkout

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — **the handover is the one row above**, and it is a read rather than a deploy: no migration, no env var, nothing to sequence

Result: pass with accepted defects
