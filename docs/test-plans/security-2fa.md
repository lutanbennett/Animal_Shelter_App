# Feature test plan

## Header

| | |
|---|---|
| Feature | Settings → Security requires 2-step verification — the feature half (the `aal2` policies on `user_roles` shipped in #164 as `0100`) |
| Backlog item | `docs/backlog.md` → **Settings → Security requires 2-step verification** (ticked in this PR) |
| Branch / worktree | `claude/security-2fa` @ `C:\Development\Animal_Shelter_security-2fa` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | this PR — see the GitHub PR for the number |
| Tested by / date | Claude (scripted, and browser-driven with throwaway admin logins on dev) / 2026-09-27 |
| Carries a migration? | no — it relies on `0100_user_roles_require_aal2.sql` from #164, applied to dev |
| Tested at SHA | `2c5601b` (the feature commit); gates re-run after `sync` at `bef0aba` (`main` @ `3edd96d` merged in) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — opening Security with an `aal1` session goes to `/admin/security/verify`, which sets up an authenticator app the first time and asks for its 6-digit code after that; every Security action checks `aal2` itself; recovery is another admin's Reset or `bootstrap-admin.mjs --reset-2step`; the Settings tile says it needs the app
- [x] Files/areas touched listed — `src/app/admin/security/` (`page.tsx`, `actions.ts`, `UsersTable.tsx`, new `verify/` page, form and actions), `src/lib/auth/two-step.ts` (new), `scripts/bootstrap-admin.mjs` (`--reset-2step`), `scripts/check-two-step-session.mjs` (new), i18n en/th, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `README.md`, `docs/`. No `worker/`, no migration, no change to `src/proxy.ts`
- [x] Roles affected identified — admin only: Security was already admin-only, and now also needs `aal2`. Management, staff, vet, volunteer and public viewers are untouched: nothing outside `/admin/security` asks for a code
- [x] Anything explicitly **out of scope** written down — 2-step for management pages or for sign-in generally (the item rules it out); recovery codes (auth-js has them only behind an experimental flag — see `docs/decisions.md`); the `#441` part-2 sweep over the rest of `src/app/admin/**` (held to batch 3)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`3edd96d`, PR #169), pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 156s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR; 0100 merged in #164
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration in this PR
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to dev — n/a: no migration in this PR; 0100 was applied to dev with #164
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly — n/a: no migration in this PR; every existing login showed on Security with its role, and "Not set up" in the new 2-step column
- [x] Constraints and defaults exercised in a rollback harness — not a migration of this PR, but 0100 was re-proved with **real GoTrue tokens** rather than hand-built claims: `scripts/check-two-step-session.mjs` made a throwaway admin, and that admin's own JWT updated 0 `user_roles` rows at `aal1` and 1 row at `aal2` (output in section 4)
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR, and this code does not read 0100

## 4. Functional checks

On `http://localhost:3005` against dev, in the built-in browser, with throwaway admin logins created by the service role and deleted afterwards. TOTP codes were computed from the setup key shown on the page, as an authenticator app does.

- [x] Happy path works end to end — a fresh admin signed in with a password and went to `/login?next=/admin/security`; it landed on `/admin/security/verify` titled "Set up 2-step verification". Start showed a QR code and setup key; the current code, entered, returned to `/admin/security` with the users table, and that admin's row read `2-step: On · Reset`
- [x] Data persists — signed out and in again: Security sent the session to "Enter your code" (no setup this time); the code returned to Security
- [x] Create / edit / delete all exercised — setup (create a factor), confirm (verify), Reset of a colleague from the table (factor deleted; row became "Not set up", "2-step verification reset." shown), Reset of your own (through the action; see Left for manual 2), and `bootstrap-admin.mjs --reset-2step` on an enrolled login (`removed 1 authenticator app(s)`, exit 0; again → `has no authenticator app; nothing to reset`, exit 0)
- [x] Empty state renders sensibly — every login without an app shows "Not set up" and no Reset button; a login with no factor sees the setup page, not the code page
- [x] Invalid input is rejected with a readable message — a wrong code (`123456`) on setup: "That code didn't match. Codes change every 30 seconds — enter the one showing now. If it keeps failing, check the phone's clock is set automatically." The harness also got `mfa_verification_failed` from GoTrue for a wrong code, the code the action maps to that message
- [x] Boundary cases checked — an abandoned setup (Start, then reload without confirming) still shows the setup page, and Start again made a **new** key with no error; the login then had exactly one factor (`totp/unverified`), so the abandoned one was cleared. A new sign-in of an enrolled account is `aal1` with `nextLevel` `aal2`

### Refused paths

Each tried directly, not through the UI, so the refusal is the server's.

| Path | How | Result |
|---|---|---|
| Open Security at `aal1` | GET `/admin/security` after a password sign-in | redirected to `/admin/security/verify` |
| All 8 Security actions at `aal1` | each action id POSTed straight at `/admin/security` from an `aal1` admin session (`updateUserRole`, `approveAccessRequest`, `createUser`, `issueTemporaryPassword`, `archiveUser`, `restoreUser`, `deleteUser`, `resetTwoStep`), targeting another throwaway admin | all 8 returned `{"ok":false,"error":"This needs your authenticator app. Reload the page, enter the code from the app, then try again."}`; the target was afterwards still there, not archived, not on a temporary password |
| The same action at `aal2` | `updateUserRole(B, "staff")` after the step-up | `{"ok":true}`; B read back `role: staff` |
| Hand-edited cookie claiming `aal2` | the session cookie's access-token payload edited to `aal: "aal2"` (signature untouched), then `updateUserRole` POSTed | never reached the action: the proxy's `getUser()` rejected the token and redirected to `/login?next=%2Fadmin%2Fsecurity` |
| Wrong code | `123456` on setup | refused with the message above; still on the setup page |
| Session after its factor is reset | self-reset, then the cookie's `expires_at` pushed into the past and Security reloaded | the refresh returned `aal: aal1`, `amr: ["password"]`, and Security sent it to "Set up 2-step verification" |
| `--reset-2step` for an unknown email | `node scripts/bootstrap-admin.mjs --reset-2step nobody-here@example.invalid` | `no login for … on test (qxkmhwybjggxvsfxsxbd)`, exit 1 |
| Plain bootstrap once roles exist | `node scripts/bootstrap-admin.mjs someone@example.invalid` | `already has 5 role(s); use /admin/security.`, exit 1 (unchanged behaviour, now via `exitCode`) |

### What sessions report — the item's "test on dev first"

`node scripts/check-two-step-session.mjs`, output as printed:

```
1 password sign-in:      aal=aal1 amr=password lifetime=3600s session_id=c7f00729
  ok   a password session is aal1
  ok   aal1 admin still reads user_roles (6 rows)
  ok   aal1 admin's own-JWT update of user_roles touches 0 rows
  enrolled factor a0d4de2d, uri otpauth://totp/Lanna%20Animal%20Care%20%28harness%29:harness-two-step-22b73849@example.invalid?algorithm=SHA1&digits=6&issuer=Lanna%20Animal%20Care%20%28harness%29&period=30&secret=…
  ok   a wrong code is refused (mfa_verification_failed)
2 after TOTP verify:     aal=aal2 amr=totp+password lifetime=3600s session_id=c7f00729
  ok   after the TOTP step the token is aal2
  ok   the step-up keeps the same session (not a new login)
  getAuthenticatorAssuranceLevel: current=aal2 next=aal2
  ok   aal2 admin's own-JWT update of user_roles touches 1 row
3 after refresh:         aal=aal2 amr=totp+password lifetime=3600s session_id=c7f00729
  ok   a refreshed token is still aal2
  ok   refresh keeps the session
  new sign-in once enrolled: aal=aal1 amr=password lifetime=3600s session_id=be76194b next=aal2
  ok   a new sign-in of an enrolled account is aal1, next aal2
  admin listFactors: totp/verified
  getUserById factors: totp/verified
5 refresh after reset:   aal=aal1 amr=password lifetime=3600s session_id=c7f00729
6 sessions on dev by sign-in method:
    oauth      aal1  2 session(s), latest 2026-09-27 01:05:51.249201+00
    password   aal1  10 session(s), latest 2026-09-27 02:11:23.196185+00
  ok   every Google (oauth) session on dev is aal1
cleaned up harness-two-step-22b73849@example.invalid

All expectations held.
```

The step-up surviving **the proxy's** refresh was checked in the browser as well: with the cookie's `expires_at` pushed into the past, reloading Security gave a new token (`iat` 1790475766 → 1790475852) on the same `session_id` `bee02e1d…`, still `aal2`, and the page stayed open. Dev's auth config (Management API): `mfa_totp_enroll_enabled true`, `mfa_totp_verify_enabled true`, `jwt_exp 3600`, `sessions_timebox 0`, `sessions_inactivity_timeout 0` — so `aal2` lasts until sign-out.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/security` | only at `aal2`; `aal1` goes to the step-up page | as expected, password sign-in (above) |
| management | `/admin/security`, `/admin/security/verify` | redirected away, as before — `requireAdminUser()` runs before the 2-step check on both pages | n/a: not re-driven — the admin gate is unchanged and runs first; the verify actions refuse a non-admin with `adminAccessRequired` before anything else (read in `verify/actions.ts`) |
| staff | as management | as management | n/a: as management |
| vet | as management | as management | n/a: as management |
| volunteer | as management | as management | n/a: as management |
| signed out | `/admin/security` | to `/login?next=…` by the proxy, as before | n/a: proxy unchanged, not re-driven; signing in at `/login?next=/admin/security` did land on the step-up |

- [ ] Every role above tested — n/a: only admin was driven; the non-admin roles meet the unchanged `requireAdminUser()` gate before any new code runs, and 0100's harness (`check-user-roles-aal2.mjs`, #164) already showed staff at `aal2` still cannot write `user_roles`
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails) — the `aal1` admin is the case this feature adds, and all eight actions refused it when posted directly (table above)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change; the sidebar's Security link now lands on the step-up page for an `aal1` session, which was seen
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — new topic "2-step verification for Security" under Settings (setting it up, every time after, Reset, lost phone, a tip to keep two admins enrolled), read at `/manual#two-step`
- [ ] Translatable strings go through the translation path — n/a: these are UI strings in both dictionaries (en and th added together), not database text that the translations page manages
- [x] Mobile viewport (375px) — `/admin/security/verify` in Thai at 375×812, before and after Start: `scrollWidth` 385 = `innerWidth` 385, the QR code, key and code field stack in one column. (The header's sign-out label is clipped at that width on every page; not this change)
- [x] Browser console clean — no errors on the verify page after Start
- [x] Network clean — every action POST returned 200 with a result; the only redirects were the intended ones

## 6. Regression

- [x] The pages nearest the change still work — `/admin/security` (access requests, create form, users table, role select via `updateUserRole` at `aal2`), `/admin` (Settings tiles; Security's reads "Needs your authenticator app (2-step verification)"), `/manual`
- [x] Shared file touched checked from a second, unrelated page — `src/lib/manual/en.ts` and both dictionaries: loaded `/manual` and `/admin` (Settings), and switched the app to Thai on `/manual` before loading the verify page
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after the merge; the merge brought only `docs/` and test-plan files

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — "2026-09-27 — Settings → Security requires 2-step verification (the feature)": what was measured, page redirects vs actions enforce, verified-token decode, no recovery codes and the two recovery routes, `listUsers()` without factors, setup as a button, production's TOTP setting
- [x] `README.md` still accurate — new paragraph under the roles: what needs 2-step, and both recovery routes with the `--reset-2step` command
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line for admins: Security asks for a code from an authenticator app once per sign-in, the rest of the app is unchanged, and a lost phone is reset by another admin
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned — every behavioural claim (aal after TOTP, Google `aal1`, refresh keeps `aal2`, reset drops to `aal1` at next refresh, `listUsers()` without factors, the proxy rejecting a forged claim) comes from the harness output or a browser check above. The one unmeasured statement, production's TOTP setting, is written as unmeasured

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic; TOTP runs on the phone's and GoTrue's clocks, not the Worker's "today"
- [ ] Boundary or banding change covered on both edges — n/a: no threshold, band or cutoff changed
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the gates block and the harness block are pasted as printed; the rest is values quoted inline from the browser and from the scripts
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var. But **production's Auth → MFA → TOTP must be enabled** (it was on dev; production was not read from this session) — deferred to the release manager below

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** No. It contains no migration and reads none: 0100 is defence in depth on `user_roles` and nothing here depends on it being present. Production does need **TOTP enabled in its Auth settings** before this deploys, or every admin is refused at Start
- [ ] `apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] Production backup fresh — n/a: no migration in this PR
- [x] Apply plan stated: no migration to apply. Before the deploy: confirm `mfa_totp_enroll_enabled` and `mfa_totp_verify_enabled` are `true` on production (`dbkodyyxxhtygxcxmfcu`) — the Supabase default — and that at least one admin will enrol on the day, with a second soon after so Reset is available

### Rollback

- [x] Rollback position stated: `npx wrangler rollback --env production` restores Security without the step-up at once. Factors that admins enrolled stay in `auth.mfa_factors` and are harmless to the old code (a new sign-in is `aal1` either way, and the old code never asks); 0100's policies are unaffected because the old code writes with the service role

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Medium | The 2-step column showed "Not set up" for an admin who had just enrolled: `listUsers()` does not return factors | fixed — per-login `auth.admin.mfa.listFactors`; recorded in `docs/decisions.md` |
| 2 | Low | While a second code was being checked, the previous "didn't match" message stayed on screen | fixed — the error is hidden while checking |
| 3 | Low | A reset takes effect on the person's open session only at its next token refresh (up to an hour) | accepted — measured and written in `docs/decisions.md`; a new sign-in is `aal1` at once |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Enrol a real authenticator app (Google Authenticator or similar) by scanning the QR code, then sign out and back in and pass Security with the app's code. Codes here were computed from the key, not scanned from the QR image, and nobody has pointed a phone at it | `test.lannacare.org/admin/security` as an admin |
| 2 | Reset your own 2-step from the table and read the confirm dialog ("Reset your own 2-step verification? …"). The self-reset ran through the action, but the browser pane could not click that row's button, so the dialog wording was not seen | `test.lannacare.org/admin/security`, your own row |
| 3 | The same step-up after a **Google** sign-in: set up (or enter the code) and reach Security. Dev's Google sessions were read as `aal1`, but a script cannot sign in with Google, so the step-up itself was only driven after a password sign-in | `test.lannacare.org` → Continue with Google → Security |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: three items are outstanding; see the pending line below

Manual verification by: pending: enrolling a real authenticator app by QR, the self-reset confirm dialog, and the step-up after a Google sign-in (Left for manual verification 1–3)

### Result

- [x] Open defects are either fixed or explicitly accepted above — two fixed, one accepted
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass with accepted defects

Release manager acknowledgement: pending
