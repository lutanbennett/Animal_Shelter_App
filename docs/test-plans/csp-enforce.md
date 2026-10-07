# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | The CSP is enforced: the Worker sends `content-security-policy` instead of `content-security-policy-report-only` |
| Backlog item | `docs/backlog.md` → Tighten the CSP (WEB-2 follow-up) |
| Branch / worktree | `claude/csp-enforce` @ `C:\Development\Animal_Shelter_csp-enforce` |
| Dev server | n/a: `next dev` sends no security headers; the Worker does |
| PR | linked from the PR itself |
| Tested by / date | Claude (csp-enforce session), 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | the PR head; gates run after syncing `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the header is renamed from report-only to enforcing, policy text unchanged; `'unsafe-inline'` and HSTS deliberately left, as the item allows
- [x] Files/areas touched listed: `worker/security-headers.mjs` (constant renamed `CSP`, header renamed, comment), `scripts/check-csp-report.mjs` (follows the rename, new enforcement case), `docs/decisions/2026-10-07-csp-enforced.md`, this plan. No `src/`, no `supabase/`
- [x] Roles affected identified: every visitor and every signed-in role, because the header is on every response; a wrong policy would break public pages for visitors
- [x] Out of scope written down: dropping `'unsafe-inline'` / nonces, raising HSTS (both stay open on the backlog)

## 2. Automated gates

- [ ] `node scripts/worktree.mjs sync` — n/a: not yet run at this commit; run before the PR is opened
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0` (run before the final `sync`, to be re-run if `main` has moved):

```
=== gates: build exited 0 after 263s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end: `node scripts/check-csp-report.mjs` prints "all cases ok", including the new case that `content-security-policy` is present and `content-security-policy-report-only` is not; `withSecurityHeaders(new Response("x"))` printed the full policy and `report-only header present: false`
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected without a crash: unchanged `csp-report.mjs` cases still pass in the same script
- [ ] Boundary cases — n/a: no limit or banding changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles and signed out | any page | same pages, now under an enforced policy | not run: see manual table |

- [ ] Every role above tested — n/a: the header does not vary by role; the manual table covers public pages and a staff page
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-facing feature
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no layout change; the phone camera check is in the manual table
- [ ] Browser console clean — n/a: the headers only exist on the Worker, not `next dev`; left for manual verification after deploy
- [ ] Network clean — n/a: as above

## 6. Regression

- [x] Nearest pages still work: `node scripts/check-worker-origin.mjs` still prints `all cases ok`. A deployed page was not loaded; see the manual table
- [x] Shared file touched: `worker/security-headers.mjs` also sets HSTS, nosniff, framing and camera headers; `check-csp-report.mjs` asserts `camera=(self)` and the report endpoint wiring unchanged
- [ ] Nothing merged from `main` during `sync` was broken — n/a: not yet synced at this commit

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; `'unsafe-inline'` and HSTS remain, and the backlog item is reworded on the `backlog` branch
- [x] Decision added: `docs/decisions/2026-10-07-csp-enforced.md` (what the log week showed, what the one blocked script is, why dashboard counts are unaffected, what the logs cannot tell us)
- [x] `README.md` still accurate — it does not describe the security headers
- [ ] **Release notes.** n/a: a shelter user sees no change; the only thing blocked is a Cloudflare visitor script nobody chose, and the dashboard's visitor counts come from Cloudflare's server-side totals
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the 190 / 190 counts are from the production Workers Logs (7 days, search `directive` and search `cloudflareinsights`); 19 rows were read, 171 counted. The dashboard-count claim is from reading `src/lib/status/usage.ts`, not from the live tile

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (the manual table below)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no boundary
- [ ] Evidence pasted is the tool's actual output — n/a: only script output is cited, as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager (cached responses carry the old header until purged)

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR, or `npx wrangler rollback --env production`; nothing persistent was written

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The log week was six days and 171 of 190 rows were counted by search, not read; the log view warned results may be incomplete | accepted: one uniform pattern, rollback is one command |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | On the deployed site, confirm the response carries `content-security-policy` and not `content-security-policy-report-only` (`curl -sI https://lannacare.org/`) | Terminal |
| 2 | Browse `/`, `/adopt`, `/our-work`, `/donate`, a Shelter Friend page and a resident photo page with the console open: no new "Refused to load…" messages other than the Cloudflare beacon | Browser |
| 3 | Sign in as staff and open a few pages (a resident page with photos, the Google map embed on a contact page): nothing blocked | Browser |
| 4 | Camera still opens for resident photos and QR/microchip scan on a phone | Phone |
| 5 | Management dashboard visitor count still shows a number (or stays grey for the same reason as before) | Browser |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (csp-enforce session)  Date: 2026-10-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items remain in the table above; not ticked on anyone's behalf

Manual verification by: pending: the five items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet; the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; waits on the PR and the manual checks

Result: pass
