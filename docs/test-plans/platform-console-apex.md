# Feature test plan

## Header

| | |
|---|---|
| Feature | Establish `#pltfd` as built; correct the console's Drive and Calendar lines |
| Backlog item | `docs/backlog.md` → `#pltfd` |
| Branch / worktree | `claude/platform-console-apex` @ `C:\Development\Animal_Shelter_platform-console-apex` |
| Dev server | `http://localhost:3005` |
| PR | this PR |
| Tested by / date | Claude, 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | f97661f53 (the code; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the move had shipped, so this ticks the item and fixes two strings that said Drive and Calendar are connected in Settings
- [x] Files/areas touched listed: `src/lib/i18n/dictionaries/en.ts` and `th.ts` (`driveNotStarted`, `calNotStarted`), `docs/backlog.md`, one decision file
- [x] Cards affected identified: none change; the console is gated by `is_product_admin()`, outside the card system; Admin and signed-out public unaffected
- [x] Out of scope written down: the live saving proof on the apex (`#plhbd`, Lutan's deploy), `AppHeader.tsx`, who-does-what, all auth and Google settings

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch started from current `origin/main`; the finishing sync is run before merge
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all zero:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 112s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 268s
=== gates: test — npm test
=== gates: test exited 0 after 74s
=== gates: build — npm run build
=== gates: build exited 0 after 285s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: a product administrator (the dev-signin admin login, on dev's product_admins list, aal2) gets the console at /platform, driven by HTTP with its cookies
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no write path changed
- [ ] Empty state — n/a: only two label strings changed
- [ ] Invalid input — n/a: no input changed
- [ ] Boundary cases — n/a: only two label strings changed

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin, on the product list, aal2 | /platform | console | console rendered |
| exactly `website_photos` (not on the list) | /platform | not-found | "This page could not be found", no console |
| signed out | /platform | to /login | 307 to /login?next=%2Fplatform |
| admin | /admin/product-admin | not found | 404 |

- [x] Every login above tested
- [x] A login that should not have access is blocked server-side (hit the URL directly)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: only two console label strings changed
- [x] Translatable strings go through the translation path: both en and th dictionary entries changed together
- [ ] Mobile viewport — n/a: text length only on a product-administrator screen
- [ ] Browser console clean — n/a: not driven in the browser pane, which refused the sign-in snippet; driven over HTTP
- [ ] Network clean — n/a: not driven in the browser pane

## 6. Regression

- [x] The pages nearest the change still work: /platform (loaded above) and the build compiles every route
- [x] Shared files touched checked from a second page: the dictionaries are read by every page, and the full build and 871 tests pass
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-20-platform-console-apex-closed.md`
- [ ] README still accurate — n/a: nothing it describes changed
- [ ] **Release notes.** n/a: the two strings are drawn only on the platform console, which only a product administrator can open, so no shelter user would notice
- [x] Commit messages say why, not just what
- [x] Claims were measured: the product-list membership of the login was read from the database, and the absence of a control was read from the two files

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding change — n/a: no thresholds involved
- [ ] Evidence is the tool's actual output — n/a: the gate lines above are pasted from the run
- [ ] Public pages re-checked — n/a: the public site is unchanged

### Deploy safety

- [ ] Deploy line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret or env var exists — n/a: none added

### Migration ordering

- [ ] Migration and reader in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: two label strings; revert the commit and redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | None found. | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | Nothing for a person to look at in this change. The live saving proof on cooperjaidee.org is `#plhbd`'s, after the production deploy. | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty — n/a: nothing for a person to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet
