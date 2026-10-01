# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Cross-site refusal on the five upload routes, `getUser()` on `/manual/pdf`, wrangler bump, pinned Actions and a non-blocking audit job |
| Backlog item | `docs/backlog.md` → Defence in depth and hygiene (WEB-7, CODE-9, CODE-10) |
| Branch / worktree | `claude/defence-in-depth` @ `C:\Development\Animal_Shelter_defence-in-depth` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | linked from the PR itself |
| Tested by / date | Claude (defence-in-depth session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: uploads from another site are refused by one shared helper that never compares `Origin` with the server's own host, `/manual/pdf` checks the user itself, wrangler is bumped, Actions are SHA-pinned and `npm audit` runs as a non-blocking job
- [x] Files/areas touched listed: `src/lib/auth/same-origin.ts` (new), the five `src/app/api/**/route.ts` upload routes, `src/app/manual/pdf/route.ts`, `package.json`/lock (wrangler), `.github/workflows/ci.yml`, `.github/dependabot.yml`, docs
- [x] Roles affected identified: any signed-in role that uploads (admin, management, staff, vet, volunteer) is touched only if the request is cross-site; signed-out is affected on `/manual/pdf` only
- [x] Out of scope written down: CODE-8 (Lutan's Cloudflare rule), DB-11 (retention decision), the `next` RCE advisory (needs 16.3.8, own follow-up), a layout guard (judged and declined, see the decision)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date at start)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 325s

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

The helper was run directly (the real exported `refuseCrossSite`, type-stripped, against `Request` objects carrying each hop's headers).

- [x] Happy path works end to end: legitimate headers pass — Pi path (`Origin: https://lannacare.org`, `Host: lannacare.org`, `Sec-Fetch-Site: same-origin`), `www.` with `same-site`, `test.lannacare.org` with an unrelated Host, dev (`localhost:3003` both), and no Origin or Sec-Fetch-Site at all
- [ ] Data persists — n/a: nothing is stored by the change
- [ ] Create / edit / delete — n/a: nothing is stored by the change
- [ ] Empty state — n/a: no UI surface
- [x] Invalid input is rejected with a readable message: 403 `{"error":"Cross-site request refused."}` for `Sec-Fetch-Site: cross-site`, `evil.com`, `lannacare.org.evil.com`, `a.b.lannacare.org` and `Origin: null`
- [x] Boundary cases checked: lookalike suffix host, two-label subdomain, apex vs `*.`, `null` origin, absent headers

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | upload routes (same-site) | passes the helper, then its own role check as before | helper-level only |
| management | upload routes | as above | helper-level only |
| staff | upload routes | as above | helper-level only |
| vet | upload routes | as above | helper-level only |
| volunteer | upload routes | as above | helper-level only |
| signed out | `/manual/pdf` | refused (proxy redirects; the route now also answers 401) | not driven live |

- [x] Every role above tested — at the helper level only; the helper is role-independent and the roles' own checks are unchanged. Live checks are listed under Left for manual verification
- [ ] A role that should not have access is blocked server-side — n/a: this change adds no role rule; the signed-out `/manual/pdf` case is under Left for manual verification because the proxy answers before the route does

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: the 403 and 401 bodies are for a forged request, never shown in the UI
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface; a real upload is under Left for manual verification

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no page was changed; the upload routes are under Left for manual verification
- [ ] Any shared file touched checked from a second page — n/a: no shared UI file touched (`same-origin.ts` is new; the lockfile changed only for wrangler, miniflare and undici, which `next dev` and `build` do not load)
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-01-upload-cross-site-refusal-and-hardening.md`
- [x] `README.md` still accurate — nothing in it describes the changed areas
- [ ] **Release notes.** n/a: nobody at the shelter would notice an origin check on forged requests, an auth check on a route the proxy already guarded, a CI job or a dev dependency bump
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions` were measured, not reasoned.** The accept/refuse table is the output of running the real function; the audit result (undici cleared, `next` remaining) is `npm audit` output after the bump

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: Lutan (a real upload through the Pi is the check that matters; `test.` never touches cloudflared, so it cannot prove the Pi case alone)
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: the host match covers both sides (apex, one label, two labels, lookalike), recorded in section 4
- [ ] Evidence pasted is the tool's actual output — n/a: only the gates block is pasted, as printed
- [ ] Public pages re-checked — n/a: no public page or cache behaviour changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` reverts the Worker; the Pi is reverted by redeploying the previous commit. There is no schema to leave behind, and the wrangler bump is a dev dependency that does not ship in the bundle

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | `npm audit` still reports `next` 16.2.0–16.3.5 (critical, RCE in `next/og` ImageResponse); fix is 16.3.8 | deferred to backlog |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A legitimate photo upload still works from the real site through the Pi (the case a naive Origin check would break, and dev cannot reproduce) | `lannacare.org` after deploy, a resident's photos tab |
| 2 | Same upload works on `test.lannacare.org` and on `next dev` | test site and `localhost:3003` |
| 3 | `/manual/pdf` signed out is refused, signed in still downloads | a private window |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (defence-in-depth session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; only the person who looked may tick it

Manual verification by: pending: the three live checks above, by a person

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
