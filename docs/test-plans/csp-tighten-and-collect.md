# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | CSP violation reports collected at `/api/csp-report` in the Worker; enforcement deliberately not switched on |
| Backlog item | `docs/backlog.md` → Tighten and collect the CSP (WEB-2 follow-up) |
| Branch / worktree | `claude/csp-tighten-and-collect` @ `C:\Development\Animal_Shelter_csp-tighten-and-collect` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` (sends no security headers; the Worker does) |
| PR | linked from the PR itself |
| Tested by / date | Claude (csp-tighten-and-collect session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | the PR head; gates run after syncing `origin/main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the Worker answers `POST /api/csp-report`, logs a bounded summary, and the report-only policy now points at it; the tightening half of the item is deferred, with reasons, because there is no data yet
- [x] Files/areas touched listed: new `worker/csp-report.mjs`, `worker/index.mjs` (route before cache/Pi), `worker/security-headers.mjs` (`report-uri`, `report-to`, `Reporting-Endpoints`), new `scripts/check-csp-report.mjs`, docs. No `src/`, no `supabase/`
- [x] Roles affected identified: nobody signs in to use it; any browser, signed in or out, posts reports to it
- [x] Out of scope written down: enforcing `Content-Security-Policy`, dropping `'unsafe-inline'` / nonces, raising HSTS (all filed on the backlog branch), a stored/queryable report table

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 327s

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

- [x] Happy path works end to end: `node scripts/check-csp-report.mjs` (18 cases, "all cases ok") covers both wire formats and that fields are reduced to one log line. The real `worker/index.mjs` was also driven with a stubbed `.open-next/worker.js` and stubbed `fetch`: a POST returned 204 with `x-lanna-served-by: worker`, the Pi stub was hit 0 times, and the log line `csp-report: {"directive":"img-src",...}` was printed — once with the Pi stub answering 200 and once answering 530
- [ ] Data persists — n/a: nothing is stored beyond the Worker log line; `csp-report.mjs` makes no filesystem or database call
- [ ] Create / edit / delete all exercised — n/a: no records
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected without a crash: non-JSON, empty, `42`, `null`, a report with no directive → 204 and nothing logged; oversize body or declared length → 413; GET → 405 with `Allow: POST`
- [x] Boundary cases: body one byte over 8192 → 413; 3,000-character fields with 50 newlines truncated to one line under 700 characters; a flood of 500 reports logs exactly 30 and reports `470 more dropped` when the minute rolls

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin / management / staff / vet / volunteer | `POST /api/csp-report` | same as everyone: 204 | not separately run |
| signed out | `POST /api/csp-report` | 204 (browsers post reports without credentials) | 204 |

- [ ] Every role above tested — n/a: the endpoint reads no cookie or session; role cannot change the outcome
- [ ] A role that should not have access is blocked server-side — n/a: deliberately open to any browser; bounded by size, count and rate instead

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no user-facing feature
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: not driven in a browser; the headers only exist on the Worker, not `next dev`. In the manual table
- [ ] Network clean — n/a: as above

## 6. Regression

- [x] Nearest pages still work: through the real Worker entry with stubs, a normal `GET /adopt` was still answered by the Pi stub (200, `x-lanna-served-by: pi`). A deployed page was not loaded; see the manual table
- [x] Shared file touched: `worker/index.mjs` also holds the release route and cache; `node scripts/check-worker-origin.mjs` still prints `all cases ok`. The camera permission is asserted unchanged by `check-csp-report.mjs`
- [x] Nothing merged from `main` during `sync` was broken: gates run after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open. Collection is in; the tightening is waiting on a week of real reports. The item is reworded on the `backlog` branch and the follow-up filed there
- [x] Decision added: `docs/decisions/2026-10-01-csp-report-collection.md` (where reports go, what is stored, bounds, why enforcement waits, why no nonces)
- [x] `README.md` still accurate — it does not describe the security headers
- [ ] **Release notes.** n/a: headers and a report endpoint are invisible to a shelter user; enforcement, which could be, was not switched on
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: every number above is from running `check-csp-report.mjs` or the stubbed Worker. The claim that no data exists is from the history (no `report-uri` before this change), not from reading Cloudflare logs

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (send a report with the curl in the manual table, then find the line in Workers Logs)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic beyond a one-minute rate window using `Date.now()` differences
- [ ] Boundary or banding change covers both edges — n/a: the size cap was hit on both sides (8192 passes, 8193 refused) and the rate cap on both (30 logged, 31st dropped)
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates lines are pasted, verbatim
- [ ] Public pages re-checked after a cache purge — deferred: release manager (only the header set changed; load `/` and `/adopt` and confirm nothing new in the console)

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

- [x] Rollback position: revert the PR, or `npx wrangler rollback --env production`; nothing persistent was written, so there is nothing to undo

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The rate limiter is per Worker isolate, so the real ceiling is 30 lines a minute times the number of live isolates | accepted: the cost is log lines, not disk |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After the deploy, POST a sample report to `/api/csp-report` on test.lannacare.org (`curl -si -X POST` with `content-type: application/csp-report` and a small `csp-report` JSON body): expect 204 with `x-lanna-served-by: worker`, and the line in Workers Logs (search `csp-report`) | Terminal, Cloudflare dashboard |
| 2 | Same POST with the Pi stopped (or `ORIGIN_HOST` unset on test): still 204 | Terminal |
| 3 | Browse `/`, `/adopt`, `/our-work`, `/donate`, a Shelter Friend page and a resident photo page on the deployed site with the console open; confirm the response carries `Reporting-Endpoints` and `report-uri` in the report-only policy, and that any violation lands in the logs | Browser |
| 4 | Camera still opens for resident photos and QR/microchip scan on a phone | Phone |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (csp-tighten-and-collect session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items remain in the table above; not ticked on anyone's behalf

Manual verification by: pending: the four items under Left for manual verification (deployed POST, Pi-down POST, public pages with console, camera on a phone)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet; the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet; waits on the PR and the manual checks

Result: pass
