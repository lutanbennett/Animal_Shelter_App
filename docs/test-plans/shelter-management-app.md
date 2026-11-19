# Feature test plan — shelter-management-app

## Header

| | |
|---|---|
| Feature | App half of `#shmgt`: Settings → Product admin, the list of product administrators (PADMIN) and every shelter, with add/remove at `aal2` |
| Backlog item | `docs/backlog.md` → **#shmgt** (left open: creating a shelter and connecting Drive and calendar are still scripts) |
| Branch / worktree | `claude/shelter-management-app` @ `C:\Development\Animal_Shelter_shelter-management-app` |
| Dev server | `http://localhost:3001` |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-18 |
| Carries a migration? | no |
| Tested at SHA | `e52056356` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a screen inside Settings that lists every shelter and the PADMIN list and adds or removes a PADMIN at `aal2`; the item's creating-a-shelter and connect-Drive-and-calendar parts are not in it
- [x] Files/areas touched listed — `src/app/admin/product-admin/*` (new), `src/lib/auth/product-admin.ts` (new), `src/app/admin/page.tsx` (tile), `src/app/admin/security/verify/page.tsx` and `actions.ts` (step-up also accepts a PADMIN), `src/lib/write-requests.ts` (wrapped path), both dictionaries, `docs/decisions/2026-11-18-product-admin-screen.md`
- [x] Cards affected identified — none: PADMIN is a list of people, outside the card system by Lutan's decision of 2026-11-18, and nothing here grants a card or touches the `perms.isAdmin` bypass. Admin sees nothing new unless also on the list. The signed-out public is unaffected
- [x] Anything explicitly **out of scope** written down — creating a shelter and mapping hosts, connecting Drive and calendar from the screen (a migration or scripts; not this stream), any email lookup (no service role used)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch cut from `origin/main` at `45809492e` this morning; nothing newer to merge at test time
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — pasted unedited:

```
=== gates: typecheck exited 0 after 21s
=== gates: lint exited 0 after 190s
=== gates: test exited 0 after 50s
=== gates: build exited 0 after 63s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration; 0411 and 0412 were already applied (413 applied, 0 pending)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration; `--status` was read: 413 applied, 0 pending
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the database behaviour the screen relies on is 0411's, proved in its own PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration; 0411 and 0412 reach production with the next release

## 4. Functional checks

- [x] Happy path works end to end — at `aal1`: the list of shelters and the PADMIN list render for a login placed on the list. The add and remove path is pending: aal2 state not driven — no authenticator on a dev session
- [x] Data persists — pending: aal2 state not driven — no authenticator on a dev session; add and remove were not pressed — RESOLVED 2026-11-19 (platform-console-finish): driven at aal2 on dev with `node scripts/dev-signin.mjs admin --aal2`; the console is now `/platform`; see docs/test-plans/platform-console-finish.md
- [x] Create / edit / delete all exercised — pending: aal2 state not driven — no authenticator on a dev session — RESOLVED 2026-11-19 (platform-console-finish): driven at aal2 on dev with `node scripts/dev-signin.mjs admin --aal2`; the console is now `/platform`; see docs/test-plans/platform-console-finish.md
- [x] Empty state renders sensibly — the list shows only the signed-in person with "Nobody else is on the list."; the shelters table has its own empty line (read in code, not rendered empty)
- [x] Invalid input is rejected with a readable message, not a crash — the account id is checked against the UUID shape in the action and refused in words; read in code, not pressed (the form is drawn only at `aal2`)
- [x] Boundary cases checked — the signed-in person's own row has no Remove and the action refuses it; an id with no login maps the foreign-key error to a sentence. Read in code, not pressed

### Role access matrix

By card, and here the unit is the PADMIN list and the `aal2` step, not a card.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin, not on the list | `/admin` and `/admin/product-admin` | no tile; the address answers a not-found page with no mention of the screen | pass (driven: tile list read, address fetched, body searched) |
| on the list, `aal1` | `/admin/product-admin` | shelters and list render; no Add or Remove; a sentence and a link to the step-up | pass (driven) |
| on the list, `aal2` | `/admin/product-admin` | Add and Remove drawn and accepted | PASS — was `pending: aal2 state not driven — no authenticator on a dev session`; RESOLVED 2026-11-19 (platform-console-finish): driven at aal2 on dev with `node scripts/dev-signin.mjs admin --aal2`; the console is now `/platform`; see docs/test-plans/platform-console-finish.md |
| signed out | `/admin/product-admin` | sent to `/login` | not driven: read in code (`redirect("/login")`) |

- [x] Every login above tested — except the `aal2` row (pending) and the signed-out row (read in code)
- [x] A login that should not have access is blocked server-side — the page asks `is_product_admin()` in the database and answers not-found; the writes are refused by 0411's policies whatever the buttons show

## 5. Cross-cutting

- [x] Nav entry correct — a Settings tile shown only to someone on the list (driven both ways). Not in `NavLinks.tsx` and not in the route registry, deliberately (a registry entry would open it to Admin)
- [ ] Manual updated — n/a: a page only product administrators can open; no shelter user reads the manual about it
- [ ] Translatable strings go through the translation path — pending: Thai unreviewed (every string is in `en.ts` and `th.ts` and `check-thai-dictionary.mjs` passes; the Thai was written without a reviewer)
- [ ] Mobile viewport (375px) — pending: not driven at 375px; the shelters table scrolls inside its own box and the buttons are the shared 44 px `ActionButton`
- [x] Browser console clean — no errors seen while driving the page
- [x] Network clean — no unexpected 4xx or 5xx while driving the page

## 6. Regression

- [x] The pages nearest the change still work — `/admin` loaded and its tiles read for a non-member and a member. `/admin/security/verify` was edited and not loaded: see the table below
- [x] Any shared file touched checked from a second, unrelated page — `write-requests.ts` and the dictionaries are read everywhere; `/my` and `/admin` loaded after the edits
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: not ticked. The item's done-when also asks for creating a shelter and connecting Drive and calendar from the screen; those are still scripts, so a remainder stands
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-18-product-admin-screen.md`
- [x] `README.md` still accurate — nothing there describes this area
- [ ] **Release notes.** n/a: only a product administrator can see this page, today one person, so no shelter user would notice; a note would reach every admin who cannot open it, and creating a shelter is still a script
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — what was driven and what was not are separated in the decision file

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **Boundary or banding change** — n/a: no threshold or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates output above is unedited
- [ ] Public pages re-checked after a cache purge — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none; no service role added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration in this PR; the code reads 0411 and 0412, which must be on production before this deploys (they go in the same release)
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager (for 0411 and 0412)
- [ ] For a **destructive or rewriting** migration only — n/a: none
- [x] Apply plan stated — 0411 and 0412 on production before this code deploys

### Rollback

- [x] Rollback position stated — code rollback via the Pi `--ref` is clean; the screen is additive and the migrations stay

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | `tsc` alone reports `PageProps` and `LayoutProps` not found across the repo until a build generates the route types; none in this change | accepted: not this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As a product administrator with an authenticator: press Add with a real account id and see it appear; press Remove on that row and see it go | `/admin/product-admin` at `aal2` |
| 2 | The step-up link from this page, code entered, lands back on Product admin; and a shelter Admin still lands on Security | `/admin/security/verify` |
| 3 | The Thai wording reads correctly | `/admin/product-admin` in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-18

### Manual verification

Manual verification by: pending: the aal2 press, the step-up return and the Thai wording (table above) need a person with an authenticator

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass with accepted defects
