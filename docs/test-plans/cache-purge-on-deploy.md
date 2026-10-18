# Feature test plan — cache-purge-on-deploy

## Header

| | |
|---|---|
| Feature | `scripts/purge-cache.mjs`: purge Cloudflare's cache from the **deploy machine** after a Pi deploy, and prove the purge took. Replaces the manual dashboard step in the runbook |
| Backlog item | `docs/backlog.md` → "A Pi deploy can poison Cloudflare's cache with a broken stylesheet", option (a). **Not ticked here** — see §7 |
| Branch / worktree | `claude/cache-purge-on-deploy` @ `C:\Development\Animal_Shelter_cache-purge-on-deploy` |
| Dev server | not started — one script and two documents, nothing rendered |
| PR | read off `gh pr create`, not guessed |
| Tested by / date | Claude (production release manager session) / 2026-10-18 |
| Carries a migration? | no |
| Tested at SHA | the tip of this branch |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — automate the Cloudflare cache purge that Lutan has now done by hand twice in two days, which the runbook made a required step after every Pi deploy
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `scripts/purge-cache.mjs` (new), `docs/release-procedure.md` (the purge section rewritten), `docs/decisions/2026-10-18-purge-from-the-deploy-machine.md` (new), and this plan. **No route, no `worker/`, no migration, no shared lib, nothing in `src/`.** The script is run by a person during a release and by nothing else
- [x] Roles affected identified: admin / staff / doctor / volunteer / resident / signed-out public — **none directly.** Indirectly it protects every visitor, since the fault it addresses leaves the app unstyled for whoever reaches a poisoned edge node
- [x] Anything explicitly **out of scope** written down — three things. (a) **`deploy-pi.sh` does not call this**, deliberately: that would need the token on the Pi, which is the whole thing this design avoids. A Pi-side deploy therefore does not purge, and the decision file says so plainly. (b) **The token itself is Lutan's to create** — the script refuses without it and names the exact permission. (c) **The self-updating `deploy-pi.sh` problem** (`docs/releases/2026-10-18.md`, Defect 1) is a separate backlog item and is only cross-referenced here

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — created from `origin/main` at `e581c631`; nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 103s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — `n/a: not yet — the PR does not exist at this commit.` Ticked in a follow-up commit once a run is seen green at this branch's HEAD
- [x] `node scripts/check-test-plan.mjs` passes on this plan locally before pushing

## 3. Schema and data — *skip if no migration*

`n/a: no migration in this PR.` It adds one script and two documents.

- [ ] Migration number is one above the highest on `main` — `n/a: no migration`
- [ ] `--status` reviewed before applying — `n/a: no migration`
- [ ] `--dry-run` reviewed — `n/a: no migration`
- [ ] Applied to **dev** and recorded in `schema_migrations` — `n/a: no migration`
- [ ] File is re-runnable — `n/a: no migration`
- [ ] Existing rows still read correctly after the change — `n/a: no migration, and no table is read`
- [ ] **Constraints and defaults exercised against real rows** — `n/a: no migration`
- [ ] Down-migration written, or the reason one is not needed is stated — `n/a: no migration`
- [ ] Production apply plan stated for the release manager — `n/a: no migration`

## 4. Functional checks

The script has four paths, and **three of the four were exercised**. The fourth sends a real purge and is Lutan's, because it needs a token that does not exist yet.

- [x] Happy path works end to end — **`n/a: not exercisable here` and stated honestly.** The success path POSTs `purge_everything` to Cloudflare, which needs `CLOUDFLARE_PURGE_TOKEN`; that token does not exist yet and creating it is Lutan's. The path is small and linear — POST, parse, branch on `success` — and the two failure branches around it **were** exercised. **This is the first item on the manual list and the PR says so rather than implying the feature is proven**
- [x] Data persists — reload the page and the change is still there — `n/a: the script writes nothing.` It sends one API call and reads two public URLs
- [ ] Create / edit / delete all exercised — `n/a: no such surface`
- [x] Empty state renders sensibly (no rows yet) — the equivalent is **a page with no stylesheet to check** (the gated public page can return none). Handled explicitly: it prints `no stylesheet found … to check (gated page?)` and does not fail. Worth having, because `PUBLIC_SITE` is `locked` on both environments
- [x] Invalid input is rejected with a readable message, not a crash — **exercised, both ways.** A bad environment: `purge-cache: --env must be production, uat or test`, exit **2**. A missing token, run against the real `.env.deploy.production` from the main checkout:

```
purge-cache: CLOUDFLARE_PURGE_TOKEN missing from .env.deploy.production.
  Create an API token at Cloudflare -> My Profile -> API Tokens with
  Permissions: Zone -> Cache Purge -> Purge, and Zone Resources limited to
  the one zone serving lannacare.org. Put it in .env.deploy.production as
  CLOUDFLARE_PURGE_TOKEN, with CLOUDFLARE_ZONE_ID beside it.
  Until then, purge by hand: Cloudflare -> Caching -> Configuration -> Purge Everything.
```

  exit **2**. Note it names **only** the missing value — `CLOUDFLARE_ZONE_ID` is already set — which is the difference between "add one thing" and "work out what you need"

- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — the boundaries here are **which env file is read** and **what counts as a whole stylesheet**. The first was a real bug, found and fixed: the refusal message said `.env.deploy.test` for the test environment, but `envFile()` maps test to `.env.local`. It now calls `envFile()` instead of building the name, and the message was re-run to confirm: `missing from .env.local`. The second is a floor of 1,000 bytes plus `r.ok`, chosen so a truncated or error-page response fails rather than passing as "something came back" — the real stylesheets are 92–95 KB

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| every role | nothing | a script run from a terminal during a release, not routed | no route, middleware or policy is in the diff |
| signed out | nothing | same | same |

- [x] Every role above tested — tested at the level this operates at: nothing in `src/` or `worker/` changed, so no role's access is altered
- [x] A role that should not have access is blocked server-side — `n/a: there is no URL.` The token is read from a gitignored file on the deploy machine and **never printed**, which was checked by reading every `console.log`/`console.error` in the script

## 5. Cross-cutting

- [x] Nav entry correct (`src/app/NavLinks.tsx`) — `n/a: not touched`
- [x] Manual updated (`src/lib/manual/en.ts`) — `n/a: not touched.` This is a release-operations tool; no shelter user does it
- [x] Translatable strings go through the translation path — `n/a: no user-facing strings`
- [x] Mobile viewport (375px) — `n/a: no markup or styles`
- [x] Browser console clean — `n/a: nothing here runs in a browser`
- [x] Network clean — `n/a: no request path changed.` The script itself makes one POST to `api.cloudflare.com` and two GETs to the public host

## 6. Regression

- [x] The pages nearest the change still work — `n/a: no pages.` The gates ran in full and pass
- [x] Any shared file touched checked from a second, unrelated page — **`scripts/lib/env.mjs` is read, not changed.** `loadEnv` and `envFile` are imported and nothing in that file is modified, so no other consumer can be affected. Confirmed by the diff: `env.mjs` is not in it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing to merge; gates pass on the branch: `test=0`

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — `n/a: deliberately not ticked, and this is the honest call.` The item lists four options; this PR builds (a) and the item also asks for the purge to be *reliable*, which it is not until the token exists. **Ticking it would claim a working purge that cannot run.** The item should be ticked by whoever confirms the first real purge — or annotated then. The backlog is also edited on its own branch, never in a PR, except for the tick that closes an item
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-18-purge-from-the-deploy-machine.md`, which exists because this **diverges from a decision made the same day**: `2026-10-18-pi-deploy-safety.md` planned the token on the Pi. The new file says why that trade-off is avoidable rather than quietly doing something else
- [x] `README.md` still accurate — unchanged; it documents no deploy secret list that this would stale
- [ ] **Release notes.** `n/a: a release-operations script and two documents.` No shelter user would notice it, and it touches none of `src/app/`, `src/components/`, `src/lib/manual/`, `src/lib/i18n/` or `worker/`. What a user *would* have noticed is the unstyled app this prevents, and that was already noted as fixed when it happened
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The claim that this needs one new value and not two was checked by reading which names resolve from the real `.env.deploy.production` (`CLOUDFLARE_ZONE_ID` yes, `CLOUDFLARE_PURGE_TOKEN` no) **without printing either value**. The claim that `check-assets.mjs` cannot simply be imported was checked by reading it: it is a top-level script with no exports that reads `process.argv`, so importing it would run it with this script's arguments — which is why the weaker in-process check plus a printed command was chosen over pretending to call it

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — branch tip; this PR ships no build
- [x] Deployed SHA matches the tested SHA — `n/a: nothing here is deployed.` The script runs from a checkout, not from a build

### On the deployed build

- [ ] Deployed to test — `n/a: not deployed.` The script was *run* against the test environment's config, which is the equivalent and is recorded in §4
- [ ] Smoke-tested on `test.lannacare.org` — `n/a: nothing is served by this change`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** `n/a: nothing derives "today".` The one timestamp is a cache-buster
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary.** `n/a: no banding.` The one threshold — 1,000 bytes — is reasoned in §4 against the real 92–95 KB stylesheets
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — both blocks in §4 and the gates block in §2 are copied as printed
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — `n/a: PUBLIC_SITE is locked on both environments`, so there is no anonymous public page. **This is also why the script tolerates finding no stylesheet**

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — `n/a: this PR performs no deploy`
- [ ] `strip-baked-env: removed N env var(s)` seen in the deploy output — `n/a: no Worker build here`
- [ ] **Any new secret/env var exists in the production Cloudflare environment** — **`deferred: Lutan`.** `CLOUDFLARE_PURGE_TOKEN` must be created (Zone → Cache Purge, one zone) and put in `.env.deploy.production`. It is **not** a Cloudflare Worker secret and must not be pushed as one — it lives only on the deploy machine. Until it exists the script refuses with instructions and the manual dashboard purge continues to work

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No — neither
- [ ] `--env production --dry-run` run and clean — `n/a: no migration`
- [x] For a **destructive or rewriting** migration only: a production backup exists and is fresh — `n/a: no migration, and the script writes to no database`
- [x] Apply plan stated — `n/a: nothing to apply`

### Rollback

- [x] Rollback position stated, **including what it does not cover** — **`git revert` and nothing else.** The script is invoked by a person from the runbook; reverting removes it and the runbook step together, and the manual dashboard purge — which is what happens today — keeps working untouched. **It cannot leave anything half-done:** a purge either happens or does not, Cloudflare re-fetches from origin either way, and the worst outcome of a spurious purge is a few slow page loads. **What a revert does not undo:** the token, once Lutan creates it, would remain in `.env.deploy.production` unused and should be deleted at Cloudflare if this is abandoned

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The refusal message named `.env.deploy.test` for the test environment, but `envFile()` maps test to `.env.local`. A person following it would have edited a file that is not read | **fixed** — calls `envFile()` instead of building the name; re-run and confirmed |
| 2 | low | The first draft imported `scripts/pi/check-assets.mjs` to verify the purge. It has no exports and reads `process.argv`, so importing it would have **executed** it with this script's arguments | **fixed** — replaced with an in-process check this machine can actually do (the page's stylesheet returns 200 and is whole), plus the printed command for the stronger byte-for-byte check on the Pi |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **The success path has never run**, because it needs a token that does not exist. Create `CLOUDFLARE_PURGE_TOKEN` (Zone → Cache Purge, one zone), then run `node scripts/purge-cache.mjs --env production` after the next Pi deploy and confirm it reports a purge and a whole stylesheet | Main checkout, after a Pi deploy |
| 2 | That a wrong or under-scoped token produces the intended message rather than a stack trace. Cloudflare returns `10000` for this; the branch is written but unexercised | Same |
| 3 | Whether `deploy-pi.sh` should eventually call this itself for Pi-side deploys, which would reopen the token-on-the-Pi question the decision file closes | `docs/decisions/2026-10-18-purge-from-the-deploy-machine.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed — in particular **the success path is not ticked**, and §4 says so in place of a tick

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — `n/a: not empty and nobody has looked yet; see the pending signature below.` The first two items cannot be checked by anyone until the token exists

Manual verification by: pending: Lutan to create CLOUDFLARE_PURGE_TOKEN and run the script once after a Pi deploy — the success path has never executed

### Result

- [x] Open defects are either fixed or explicitly accepted above — both found defects are fixed
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the production release manager

Result: pass with accepted defects
