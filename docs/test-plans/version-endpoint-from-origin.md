# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `GET /api/version` answered by the app (version + git sha, no sign-in); `apply-migrations.mjs` asks it instead of assuming |
| Backlog item | `docs/backlog.md` → "The app should answer what version am I? without a sign-in, from the origin rather than the Worker" |
| Branch / worktree | `claude/version-endpoint-from-origin` @ `C:\Development\Animal_Shelter_version-endpoint-from-origin` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3007` |
| PR | linked from the PR itself |
| Tested by / date | Claude (version-endpoint-from-origin session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | tip of the branch when the PR was opened |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: a public, uncached route returning only version and sha, outside `/api/releases/`, which `apply-migrations.mjs` reads
- [x] Files/areas touched listed: `src/app/api/version/route.ts` (new), `next.config.ts` (two build-time constants), `src/lib/public-paths.ts` (both lists), `scripts/lib/migration-consumers.mjs`, `scripts/apply-migrations.mjs`, `scripts/lib/env.mjs` + `scripts/deploy.mjs` (`SITE_ORIGINS` moved), `scripts/check-migration-consumers.mjs`, a comment in `worker/index.mjs`, backlog tick, a decision, this plan
- [ ] Roles affected identified — n/a: not a role-gated surface; it is public by design and returns nothing role-specific
- [x] Out of scope written down: `deploy.mjs`'s `liveVersion()` stays on `/api/releases/current` (a question about the Worker); `deploy-pi.sh` not changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see PR
- [x] `node scripts/gates.mjs` — see PR for the closing line
- [x] CI green on the PR — see PR

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration, no UI surface, no code reads these columns
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] **Answers while signed out.** `curl -i localhost:3007/api/version` with no cookie → `200`, `application/json`, `{"version":"0.13.0","sha":"5546c05…"}`
- [x] **Returns only version and sha.** The body above is the whole payload; no `BUILD_MIGRATIONS`, paths or env
- [x] **Not cached.** Response carries `cache-control: no-store`; the route is `force-dynamic`; the path is not in the Worker's `isPublicPage` list, so the edge never stores it
- [x] **Exact path only.** `/api/versionx` and `/api/residents` still `307` to sign-in; `POST /api/version` is `405`
- [ ] **Reaches the Pi (`x-lanna-served-by: pi`).** Deferred: needs a deployed Worker in front of the Pi, so it is checked after this reaches the Pi (see Left for manual verification)
- [x] `apply-migrations.mjs` uses an exact answer: `check-migration-consumers.mjs` covers origin answering, an unknown commit, an old build (404), a malformed sha, and that the report says "reports it runs" rather than "ASSUMED"
- [x] Fallback keeps working: an unreachable origin or one without the route falls back to the old assumption and says so
- [ ] Create / edit / delete — n/a: nothing is stored
- [ ] Empty state — n/a: no list
- [x] Invalid input: malformed sha, non-200, and thrown fetch all fall back, never crash
- [ ] Boundary cases — n/a: no numeric or date logic

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/api/version` | same public payload | n/a: identical to signed out |
| management | `/api/version` | same public payload | n/a: identical to signed out |
| staff | `/api/version` | same public payload | n/a: identical to signed out |
| vet | `/api/version` | same public payload | n/a: identical to signed out |
| volunteer | `/api/version` | same public payload | n/a: identical to signed out |
| signed out | `/api/version` | 200 with version and sha | pass (above) |

- [ ] Every role above tested — n/a: the route does not read a session; signed-out is the only distinct case
- [ ] A role that should not have access is blocked server-side — n/a: public by design; the payload is non-sensitive (see the decision)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: not a user feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: other `/api/*` routes still redirect signed out; `check-migration-consumers.mjs` all ok
- [ ] Shared file checked from a second page — n/a: the `public-paths.ts` change is an exact-path addition, covered by the `/api/versionx` check
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices recorded in `docs/decisions/2026-10-02-version-endpoint-from-origin.md`
- [x] `README.md` still accurate — it does not describe the Worker's routes or apply-migrations output
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: an unauthenticated version route, no shelter user would look for it
- [x] Commit messages say why, not just what
- [x] Claims were measured: the payload and status codes above are from the running dev server

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager; `/api/version` is now how to check it

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager; `curl -sI https://test.lannacare.org/api/version` must show `x-lanna-served-by: pi`
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: none
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence yet
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: deploy flow unchanged apart from where `SITE_ORIGINS` is imported from
- [ ] `strip-baked-env` seen — n/a: build path untouched; `BUILD_VERSION` and `BUILD_SHA` are non-secret and intended to be public
- [ ] New secret/env var in production — n/a: none; two build-time constants only

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; callers fall back to the assumption

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After this is deployed, `curl -sI <site>/api/version` shows `200` and `x-lanna-served-by: pi` | test.lannacare.org, then lannacare.org |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (version-endpoint-from-origin session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: post-deploy curl of /api/version for x-lanna-served-by: pi  Date: 2026-10-02

### Result

- [ ] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR
- [ ] Handed to the production release manager

Result:

Release manager acknowledgement:   Date:
