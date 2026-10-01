# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed),
or `n/a` / `deferred` with the reason.

---

## Header

| | |
|---|---|
| Feature | Page every login on Security, and make a first authenticator app need an admin to open it (WEB-3 code half, WEB-4) |
| Backlog item | `docs/backlog.md` → Bound sign-ups and make admin two-step non-optional (WEB-3, WEB-4). **Left unticked on purpose:** the Supabase sign-up / Google-domain settings are Lutan's and still owed |
| Branch / worktree | `claude/signup-bounds-and-mfa` @ `C:\Development\Animal_Shelter_signup-bounds-and-mfa` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | `9c8bdae` (gates); browser and GoTrue checks at `af98a14` plus the two follow-up edits to `UsersTable.tsx` and `verify/page.tsx` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: `listUsers` is now paged in full; a first authenticator app needs an admin-opened window and only a bound (or pre-rule) app opens Security; admins without one are flagged and prompted
- [x] Files/areas touched: `src/lib/auth/two-step.ts`, `src/lib/auth/access-requests.ts`, `src/app/admin/security/{page,actions,UsersTable}`, `src/app/admin/security/verify/{page,actions}`, `src/app/my/page.tsx`, i18n en/th, manual, releases, `scripts/bootstrap-admin.mjs`. No migration, no `worker/`
- [x] Roles affected: admin only (Security, My tasks banner). Other roles never reach any of it
- [x] Out of scope: the Supabase dashboard settings (Lutan's); **refusing the admin role until enrolled** (decided against, see the decision file); `confirm-dialogs-offline` (WEB-10) owns the archive/delete/reset confirms in `UsersTable.tsx`, which are untouched. I added one handler (`handleAllowTwoStepSetup`) after `handleResetTwoStep` and widened the 2-step cell only

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`9c8bdae`) and pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 29s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations --status` reviewed — n/a: no migration
- [ ] `apply-migrations --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change; the new state lives in `auth.users.app_metadata`
- [ ] Constraints exercised in a harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] **Paging with more rows than one page:** on dev, with 205 logins, `listUsers({perPage: 200})` returned 200 and `listAllUsers()` returned 205 (scratch script, since deleted; the throwaway logins were removed afterwards)
- [x] **A password-only session is refused:** with a throwaway admin and no window, `/admin/security` redirected to the verify page, which said set-up isn't open and showed no Start button. The `startTwoStepSetup` / `confirmTwoStep` refusal is the same `isSetupOpen` check the page uses
- [x] **Enrolling around the app gives nothing:** a password session (`aal1`) called `mfa.enroll` + `verify` straight against GoTrue and succeeded (GoTrue cannot stop it); `trustedTotpFactors` returned 0 for that app, and 1 once its id was bound in `app_metadata`
- [x] Window opened (script) → Start shown → real TOTP code typed → landed on Security, 2-step "On" for that login, window closed
- [x] My tasks banner showed for the admin with no app, and the 2-step column flags admins "Not set up" with a warning badge
- [x] Data persists — the binding is in `app_metadata`, read fresh from GoTrue on every request
- [x] Create / edit / delete — only the first-set-up path was driven in the browser; role grants to admin and Reset opening the window are code paths, and `allowTwoStepSetup` is new; the rest are listed under manual
- [x] Empty state — the throwaway admin, once enrolled, went to Security with no banner
- [x] Invalid input — a wrong or unbound factor id is refused before GoTrue (`noFactor`), unchanged
- [x] Boundary — a window exactly at expiry is closed (`Date.parse(until) > now`); a factor created before `RULE_STARTS_AT` is trusted by `created_at`

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security, verify page, My tasks banner | Banner and flag until an app is bound | as expected |
| management | none of it | Banner is gated on `role === "admin"` | not driven |
| staff | none of it | as above | not driven |
| vet | none of it | `/my` redirects vets before the banner | not driven |
| volunteer | none of it | as above | not driven |
| signed out | none of it | login redirect | unchanged code |

- [ ] Every role above tested — n/a: only admin has a surface; the other roles hit the existing role gates and the banner is `role === "admin"`
- [x] A role that should not have access is blocked server-side: `startTwoStepSetup` / `confirmTwoStep` still start with `hasAdminRole()`; the new `allowTwoStepSetup` goes through `refuseUnlessAdmin` (admin **and** `aal2`)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated — the 2-step topic in `src/lib/manual/en.ts` (allow set-up, reminder, only-admin route)
- [x] Translatable strings go through the dictionary — en and th both added; the Thai wording is mine and unreviewed (see manual list)
- [ ] Mobile viewport (375px) — n/a: not checked; the banner is a plain block and the column wraps like the existing buttons (a person's look is in the manual list)
- [x] Browser console clean — read after the flow; no errors
- [x] Network clean — no unexpected 4xx/5xx on the pages visited

## 6. Regression

- [x] Pages nearest the change still work: `/my`, `/admin/security`, `/admin/security/verify` all loaded; the users table rendered every login
- [x] Shared files touched (`manual/en.ts`, `releases.ts`, dictionaries) — `/my` loaded with the new dictionary keys; the manual and releases pages build (gates)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates run after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left unticked; the dashboard settings are still owed and ticking would make the item look done
- [x] Decision added: `docs/decisions/2026-10-01-first-authenticator-needs-an-admin-to-open-it.md`
- [ ] `README.md` still accurate — n/a: it does not describe 2-step set-up
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`, for admins
- [x] Commit messages say why
- [x] Claims were measured: the 200-vs-205 paging figure and the raw-enrolment-then-untrusted result are from real runs against dev GoTrue, not reasoned

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: the window is an absolute ISO instant compared with `Date.now()`; nothing derives a calendar day
- [ ] Boundary or banding change covers both sides — n/a: the only boundaries are the window expiry and the pre-rule cut-off, each a single comparison
- [x] Evidence is the tool's actual output (gates block above, unedited)
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager. Nothing here needs a down-migration; `wrangler rollback` reverts the code, and the `two_step_*` keys it writes to `app_metadata` are inert to the old code

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | The closed set-up page repeated its title in the card | fixed, same branch |
| 2 | Low | *Allow set-up* showed on staff and vet rows, who never open Security | fixed, same branch |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | In Supabase (dev and production), **turn off open sign-up**, or restrict Google sign-in to the shelter's domain. Not done in code; it is also in the assessment's "Supabase, Cloudflare and Google checklist" item, so do it once | Supabase dashboard → Authentication |
| 2 | **Before the production deploy**, decide who opens set-up for any real admin with no app yet: `node scripts/bootstrap-admin.mjs --env production --allow-2step-setup <email>` or another admin's Allow set-up. Apps from before today are grandfathered, so already-enrolled admins are unaffected | Production |
| 3 | Another admin presses **Allow set-up** on a row in the 2-step column and that person can then enrol; Reset opens it again | `/admin/security` |
| 4 | The Thai wording of the new strings reads naturally | `/admin/security`, `/my` in Thai |
| 5 | The banner and the closed set-up page look right on a phone | `/my`, `/admin/security/verify` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; see the pending line below

Manual verification by: pending: the five rows under Left for manual verification — the two Supabase dashboard settings and the production set-up decision matter most

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
