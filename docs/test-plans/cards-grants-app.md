# Feature test plan — cards-grants-app

## Header

| | |
|---|---|
| Feature | App half of "a card gives the access it needs": Who does what reads `card_grants`/`card_includes`, the save sends cards only, Also allowed goes, both tables audited, the two production checks read `card_grants`, a card-access faults log |
| Backlog item | `docs/backlog.md` → **URGENT, LIVE ON PRODUCTION: a card given to a role does not reliably give that role the access the card needs** (left open: production still needs `0257` applied, Lutan's release step) |
| Branch / worktree | `claude/cards-grants-app` @ `C:\Development\Animal_Shelter_cards-grants-app` |
| Dev server | `http://localhost:3005` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude / 2026-10-24 |
| Carries a migration? | no |
| Tested at SHA | `SHA_PLACEHOLDER` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the app reads what a card gives from the database and sends only cards on save; Also allowed is removed
- [x] Files/areas touched listed — `src/lib/permissions/card-grants.ts` (new), `src/app/admin/who-does-what/` (page, actions, CardControls, CardBoard), `src/lib/home/tiles.ts` (`tileBlock`, `cardTile`), `src/lib/audit/` and `src/app/admin/recent-changes/`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `scripts/lib/readonly-checks.mjs`, `scripts/check-production.test.mjs`, deleted `scripts/lib/card-bundles.mjs` and `scripts/check-cards-schema.mjs`, `docs/card-access-faults.md`, a decision file
- [x] Roles affected identified — Admin (and Management read-only) see the Who does what change; every other role is untouched at runtime; the home tile for a held card no longer re-checks the code bundle
- [x] Anything explicitly **out of scope** written down — no migration; `role_extras` table not dropped; none of the three held faults fixed; the remaining hard-coded rules (`routes.ts`, `OUTSIDE_REGISTRY`, `roles.scope_*`, `opens_app`) not touched. **Production is not fixed until `0257` is applied there**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in before the PR was opened
- [x] `node scripts/gates.mjs` ends with all gates 0. Exit codes read directly from the script's own output:

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration (`0257` is already applied to dev by #912)
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration; the page reads the real dev `card_grants` rows (checked in section 4)
- [ ] Constraints and defaults exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration; `0257` on production is the release's step, already stated in #912's plan

## 4. Functional checks

- [x] Happy path works end to end — Who does what (`/admin/who-does-what?role=volunteer&card=residents`) rendered 200 on dev from the live `card_grants` rows; "What it gives" lists the Residents card's own activities as the database holds them
- [ ] Data persists — n/a: nothing new is written by the page; the card save still goes through `set_role_cards`
- [ ] Create / edit / delete all exercised — n/a: giving and taking a card needs the authenticator-app step (the dev sign-in is aal1); the call is the same `set_role_cards` RPC with one argument fewer, and `check-card-grants.mjs` proves the database ignores `p_bundle`
- [x] Empty state renders sensibly — the Management role, with no card chosen, renders the full board
- [ ] Invalid input is rejected — n/a: the removed Also allowed form was the only free-text input
- [x] Boundary cases checked — a failed `card_grants` read throws rather than falling back to the code list (by design); a unit test covers unknown cards and activities being left out and includes followed transitively

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Who does what, Recent changes | page renders, no Also allowed, the filter lists "What a card gives" and "Card included in another" | dev sign-in `admin`: both pages 200; Also allowed absent; new filter options present. Giving/taking a card needs 2-step, not reachable at aal1 |
| management | Who does what (read only) | same page, no editing | `?role=management` rendered 200 (signed in as admin, not as management) |
| staff | retired | n/a | n/a: retired role |
| doctor | n/a | no change | n/a: the page is Admin and Management only |
| volunteer | n/a | no change | n/a: the page is Admin and Management only |
| signed out | nothing | refused | n/a: the guard `opensWhoDoesWhat` is untouched |

- [x] Every role above tested — the roles that can open the page were rendered; the rest are n/a as above
- [x] A role that should not have access is blocked server-side — unchanged: the page guard and the actions' `guard()` are untouched; the actions only lost two exports

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated — the Who does what topic no longer describes Also allowed
- [x] Translatable strings go through the translation path — new strings are in both dictionaries (the two audit labels and the warning); removed strings are removed from both
- [ ] Mobile viewport (375px) — n/a: a section was removed, no new layout
- [ ] Browser console clean — n/a: the browser pane was hidden for this session, so pages were fetched server-side with the dev session cookie and the console was not read
- [x] Network clean — the dev server answered 200 for Who does what and Recent changes; no 4xx/5xx

## 6. Regression

- [x] The pages nearest the change still work — Who does what (two roles), Recent changes with the new filter
- [x] Any shared file touched checked from a second, unrelated page — `tiles.ts` is read by the home screen; its tests (landing-tiles, ruled-cards, add-photos-card, approve-photos-card, role-groups) pass in the full test run
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item note updated in `docs/backlog.md` on this branch; the item itself stays open until production applies `0257`
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-24-cards-grants-app.md`
- [x] `README.md` still accurate — it does not describe Also allowed
- [x] **Release notes.** `unreleased` gained a line about Also allowed leaving Who does what (tagged admin). The line promising that a role does exactly what its cards say is deliberately NOT written: it becomes true only when `0257` is applied to production
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — page contents, test counts and gate results are from runs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [ ] **Evidence pasted is the tool's actual output, unedited** — n/a: the gates output above is unedited
- [ ] Public pages re-checked — n/a: public pages read none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration in this PR. The code reads `card_grants`, which production lacks until `0257` is applied: **apply `0257` before deploying this**, or Who does what errors on production
- [ ] `--env production --dry-run` — n/a: no migration here
- [ ] Destructive migration backup — n/a: no migration here
- [ ] Apply plan stated — n/a: no migration here; see the line above for the ordering

### Rollback

- [x] Rollback position stated — revert the PR; Who does what returns to the code list and the bundle call, which the database still accepts (it ignores `p_bundle`)

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | medium | Who does what needs `card_grants`, so it errors on production until `0257` is applied there | accepted: the release applies `0257` first (stated above) |
| 2 | low | Giving/taking a card in the browser was not exercised: the dev sign-in is aal1 and the edit needs the authenticator step | accepted: same RPC as before with one argument fewer, proven by `check-card-grants.mjs` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Give and take one card on a spare role as Admin with the authenticator app; confirm the role's access changes and Recent changes shows the cell changes | `/admin/who-does-what` on dev |
| 2 | Open a held card whose page the role cannot open, and read the warning: it names the page and the fixed rule | `/admin/who-does-what?card=<card>` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-24

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are for a person with the authenticator app

Manual verification by: pending: Lutan, with the authenticator app

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects

Release manager acknowledgement: n/a: not yet released
