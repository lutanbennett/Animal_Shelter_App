# Test plan: card-repass-contacts-admin

## Header

| | |
|---|---|
| Feature | Card re-pass: `contacts` (7 steps), `assistant` (6) and `who_does_what` (4) driven in a browser after `0268`, `0269` and the #965 app half |
| Backlog item | `docs/backlog.md` → the re-pass item (this stream covers 3 of its 14 cards; the backlog branch strikes them) |
| Branch / worktree | `claude/card-repass-contacts-admin` @ `C:\Development\Animal_Shelter_card-repass-contacts-admin` |
| Dev server | `next dev` on port 3010, stopped before the gates ran. Each login made with `dev-signin.mjs --cards <card>` and read from its header ("Dev sign-in: <card>") |
| PR | pending: opened after this commit |
| Tested by / date | Claude, 2026-10-28 |
| Carries a migration? | no |
| Tested at SHA | 3fdeb503 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three cards driven as logins holding only that card, every walkthrough step, findings recorded and nothing fixed
- [x] Files/areas touched listed: `docs/card-access-faults.md` (one heading appended), `docs/decisions/2026-10-28-card-repass-contacts-assistant-who-does-what.md`, this plan. No code, no migration
- [x] Roles affected identified: none, documents only; the review is deliberately not about roles
- [x] Out of scope written down: no fixes, no new or proposed cards, `view_contacts` (driven 2026-10-27), the other cards of the item, the Doctor area

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in (already up to date)
- [x] `node scripts/gates.mjs` ends `typecheck=0 lint=0 test=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 114s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

The review itself is the functional check. Three card-only logins were driven on the dev project in the built-in browser, aal1; no page asked for the second step. Results are in `docs/card-access-faults.md` and `docs/decisions/2026-10-28-card-repass-contacts-assistant-who-does-what.md`.

- [x] Happy path works end to end: a contact added and edited; a doctor added, renamed, marked left and deleted on a disposable clinic; the assistant asked three questions; Who does what opened and read; every refused page redirected to `/no-access`
- [x] Data persists: the contact's phone number and the doctor's new name read back on a fresh fetch
- [ ] Create / edit / delete all exercised — n/a: this is a review of access, not a feature; contact Delete and Archive and doctor Merge were offered, not pressed, and the decision file says so
- [ ] Empty state renders sensibly — n/a: no UI changed
- [ ] Invalid input is rejected with a readable message — n/a: no input changed
- [ ] Boundary cases checked — n/a: no input changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | nothing new | no change | n/a: no code changed |
| management | nothing new | no change | n/a: no code changed |
| staff | nothing new | no change | n/a: no code changed |
| doctor | nothing new | no change | n/a: no code changed |
| volunteer | nothing new | no change | n/a: no code changed |
| signed out | nothing new | no change | n/a: no code changed |

- [ ] Every role above tested — n/a: no code changed, and the review is about three cards with no reference to roles
- [ ] A role that should not have access is blocked server-side — n/a: no code changed; each card's refused page (`/operations/medication-list`, `/stocktake`) was opened directly and redirected to `/no-access`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no strings added
- [ ] Mobile viewport (375px) — n/a: driven at the pane's width; no layout changed
- [ ] Browser console clean — n/a: no UI change (the console was not read)
- [ ] Network clean — n/a: no UI change

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page changed
- [ ] Any shared file touched checked from a second page — n/a: no shared code file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `main` had nothing new to merge

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: the item still has three cards (`add_photos`, `approve_photos`, `meme_library`); its list was updated on the `backlog` branch instead
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-10-28-card-repass-contacts-assistant-who-does-what.md`
- [x] `README.md` still accurate: nothing it describes changed
- [ ] **Release notes.** n/a: a verification pass; nothing changes for a user
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "Cat Enclosure is empty" answer was measured against a service-key read (5 residents); its cause is labelled "read from the code, not proven"

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — n/a: documents only, no build change
- [ ] Smoke-tested on `test.lannacare.org` — n/a: documents only
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no threshold changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the only evidence is the gates lines, pasted as printed
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy for this change
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy for this change
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: documents only; reverting the merge removes them, nothing else is affected

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | n/a | none in this change. The review's own findings are rows in `docs/card-access-faults.md`; none stops a walkthrough step | deferred to backlog: fixed as a set after Lutan reviews the log |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Why the assistant calls Cat Enclosure empty (read from code, not proven: no query run as that login) | `/assistant` as a login holding only `assistant`, "Who is in Cat Enclosure?" |
| 2 | Whether "What is due this week?" is still wrong (the 2026-10-25 counts were not repeated) | `/assistant` as above |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; two items are outstanding and are carried as `pending:` on the signature line below

Manual verification by: pending: the two items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: documents only, nothing to deploy

Result: pass with accepted defects

Release manager acknowledgement: n/a: documents only
