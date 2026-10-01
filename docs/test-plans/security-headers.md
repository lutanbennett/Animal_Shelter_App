# Feature test plan — security-headers

## Header

| | |
|---|---|
| Feature | Security headers set in the Worker, Secure auth cookie in production, `nosniff` + `Content-Disposition` on the photo proxy |
| Backlog item | `docs/backlog.md` → HTTP security headers and Secure cookies (WEB-2) |
| Branch / worktree | `claude/security-headers` @ `C:\Development\Animal_Shelter_security-headers` |
| Dev server | not started — headers live in the Worker, which `next dev` does not run |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | this branch's tip |

## 1. Scope and risk

- [x] Change is described in one sentence: the Worker adds X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy, HSTS and a report-only CSP to every response, the three Supabase clients set `secure` in production, and the photo proxy adds `nosniff` and `Content-Disposition`
- [x] Files touched: `worker/index.mjs`, `worker/security-headers.mjs`, `src/lib/supabase/{client,server,proxy,cookie-options}.ts`, `src/app/api/photos/[fileId]/route.ts`, docs
- [x] Roles affected: everyone, including signed-out visitors (headers on every response)
- [x] Out of scope: enforcing the CSP, collecting reports, HSTS `includeSubDomains`/`preload`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` run before the gates
- [x] `node scripts/gates.mjs` ended `gates: typecheck=0 lint=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] `withSecurityHeaders` run under Node on a 200, a 307 redirect and a 404: all three carry the headers, `Permissions-Policy: camera=(self), geolocation=()`, and the redirect keeps its `Location`

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path: header logic exercised under Node (above). Not yet seen on a deployed Worker
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete all exercised — n/a: no CRUD
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases — n/a: the photo proxy chooses inline or attachment by content type: image/* except SVG, and PDF, inline; the rest attachment

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no access rule touched | n/a |
| management | n/a | no access rule touched | n/a |
| staff | n/a | no access rule touched | n/a |
| vet | n/a | no access rule touched | n/a |
| volunteer | n/a | no access rule touched | n/a |
| signed out | n/a | no access rule touched | n/a |

- [ ] Every role above tested — n/a: the photo proxy's who-may-fetch logic is unchanged, only response headers were added
- [ ] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not checkable before deploy; left for Lutan under manual verification, and CSP report-only violations there are the input to tightening
- [ ] Network clean — n/a: needs a deployed Worker; the curl checks are row 2 under Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work — n/a: needs a deployed Worker; sign-in and the map iframes are rows 3 and 4 under Left for manual verification
- [ ] Shared file checked from a second page — n/a: the three Supabase factories share one options object; sign-in exercises all of them
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green after sync

## 7. Documentation

- [x] Backlog item ticked, with the report-only note
- [x] Non-obvious design choices in `docs/decisions/2026-09-30-security-headers-in-the-worker.md`
- [ ] `README.md` still accurate — n/a: it does not describe response headers
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: headers and cookie flags are invisible to a shelter user
- [x] Commit messages say why, not just what
- [x] Claims were measured: the zone sent no HSTS (`curl -sI` on lannacare.org and test.lannacare.org, 2026-09-30)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — deferred: Claude or Lutan, after merge
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan, `curl -sI` shows all six headers with `x-lanna-served-by: worker`, and on the Pi path `x-lanna-served-by: pi`
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions — n/a: no threshold
- [ ] Evidence pasted is unedited tool output — deferred: whoever runs the curl checks
- [ ] Public pages re-checked after a cache purge — deferred: release manager, after deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager, at `npm run deploy:prod`
- [ ] `strip-baked-env` seen — deferred: release manager, at deploy
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` removes the headers in seconds. A user signed in under the old cookie stays signed in; the new attribute applies at the next refresh

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | Nothing collects CSP reports, so "a quiet week" can only be judged from browser consoles | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Camera still works on a phone**: take a resident photo and scan a microchip/QR code | phone, signed in, after deploy to test |
| 2 | `curl -sI https://test.lannacare.org/` shows the six headers on the `worker` path and, with the tunnel up, the `pi` path | terminal, after deploy |
| 3 | The Google map iframe on a contact and a Shelter Friend still loads | test site, after deploy |
| 4 | Sign in and out still works (cookie now `Secure`) | test site, after deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-30

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: four items are listed and none has been checked yet; a person signs below

Manual verification by: pending: Lutan — camera on a phone, deployed-header curl checks, map iframes, sign-in

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
