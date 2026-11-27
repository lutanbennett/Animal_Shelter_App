# Feature test plan

## Header

| | |
|---|---|
| Feature | The platform front door signs in instead of refusing as an unset site |
| Backlog item | `docs/backlog.md` → `#fdsgn` |
| Branch / worktree | `claude/platform-front-door-signin` @ `C:\Development\Animal_Shelter_platform-front-door-signin` |
| Dev server | `http://localhost:3008` |
| PR | this PR |
| Tested by / date | Claude, 2026-11-28 |
| Carries a migration? | no |
| Tested at SHA | 09d0c1b5a (the code; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: on the platform front door a role-less login is sent to the console or the shelter chooser, or told truthfully it has nothing there, instead of "site not set up"
- [x] Files/areas touched listed: `src/lib/auth/front-door.ts`, `src/lib/auth/front-door-paths.ts` (new), `src/app/auth/callback/route.ts`, `src/app/login/actions.ts`, `src/app/login/page.tsx`, `src/lib/supabase/proxy.ts`, both dictionaries, `docs/backlog.md`, one decision file
- [x] Cards affected identified: none; the console is gated by `is_product_admin()` and the chooser by `my_shelters()`, both outside the card system and unchanged; Admin unaffected
- [x] Out of scope written down: production's two `cooperjaidee.org` rows, any deploy, any product-admin list, Supabase auth settings

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch started from current `origin/main`; the finishing sync is run before merge
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all zero:

```
=== gates: typecheck exited 0 after 145s
=== gates: lint exited 0 after 289s
=== gates: test exited 0 after 48s
=== gates: build exited 0 after 134s
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

- [x] Happy path: a login holding a role only at the dev shelter, password sign-in on a front door (`PLATFORM_HOST=localhost`, `DEV_SHELTER_ID` empty), landed on /platform/shelters with a session, driven in headless Chrome
- [ ] Data persists — n/a: no write path changed
- [ ] Create / edit / delete — n/a: no write path changed
- [x] Empty state: a login with no role anywhere and not a product admin got the new no_platform message and no session cookie
- [ ] Invalid input — n/a: bad credentials path unchanged
- [x] Boundary cases: the same no-role login on a host that is not the front door (server without PLATFORM_HOST) still got "This site isn't set up yet"

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| no role, not a product admin, front door | /login submit | no_platform message, signed out | "You signed in, but this account has nothing here yet...", 0 session cookies |
| exactly `website_photos` at the dev shelter, front door | /login submit | chooser | /platform/shelters, "Lanna Care for Animals", 1 session cookie |
| no role, not the front door | /login submit | siteNotSetUp, unchanged | "This site isn't set up yet...", 0 session cookies |
| product admin, front door | /login submit | /platform | pending: not driven; needs a login on dev's product-admin list, which this stream may not add |

- [x] Every login above tested, except the product-admin row, which is recorded as pending
- [x] A login that should not have access is blocked server-side: the no-role login is signed out by the action itself

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the product console's sign-in is not in the shelter manual
- [x] Translatable strings go through the translation path: `nothingOnPlatform` added to en and th together
- [ ] Mobile viewport — n/a: one message line on the existing login page
- [ ] Browser console clean — n/a: driven in headless Chrome by playwright, console not captured
- [ ] Network clean — n/a: driven in headless Chrome by playwright, network not captured

## 6. Regression

- [x] The pages nearest the change still work: the control run shows the non-front-door sign-in refusal unchanged
- [x] Shared files touched checked from a second page: the proxy change is guarded by the platform host and three paths; the full test suite and build pass
- [x] Nothing merged from main during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-11-28-platform-front-door-signin.md`
- [ ] README still accurate — n/a: nothing it describes changed
- [x] **Release notes.** an Admin-only line in `unreleased`: product administrators can sign in on the product address
- [x] Commit messages say why, not just what
- [x] Claims were measured: the three call sites and the absence of any shelter_host_kind caller were read in the code

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

- [ ] Rollback position stated — n/a: no migration; revert the commit and redeploy

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | None found. | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After deploy to test, Lutan signs in on cooperjaidee-test.lannacare.org/platform (G7), once a real product admin exists there | test |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-28

### Manual verification

- [ ] The manual list above is empty — pending: G7 sign-in on test after deploy

Manual verification by: pending: Lutan, G7 on test after deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: n/a: not yet
