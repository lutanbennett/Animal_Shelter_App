# Feature test plan — password-change-current

## Header

| | |
|---|---|
| Feature | Changing your password now asks for the current one and verifies it on the server; other sessions are signed out; button label matches the heading (F-22) |
| Backlog item | `docs/backlog.md` → F-22 "Change password does not ask for the current one" (ticked). **Re-graded: this is a security finding, not polish** — an unlocked, signed-in phone could take over the account, and staff are ~100% on phones with sessions that never expire by design |
| Branch / worktree | `claude/password-change-current` @ `C:\Development\Animal_Shelter_password-change-current` |
| Dev server | `next dev` → `http://localhost:3002` |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-10-03 |
| Carries a migration? | no |
| Tested at SHA | `e8450ad2` (after `worktree.mjs sync`, which found `origin/main` already merged) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `changeOwnPassword` re-authenticates with the current password inside the action, fails closed, signs out other sessions, and the button says "Change password"
- [x] Files/areas touched listed — `src/app/account/password/{actions.ts,page.tsx,ChangePasswordForm.tsx}`, `src/lib/auth/password-change.ts`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-03-password-change-requires-current.md`
- [x] Roles affected identified — every signed-in role (the page is open to all); signed-out users are redirected to `/login` as before
- [x] Anything explicitly **out of scope** written down — Settings → Security and the 2-step rules (roles paper, 3001); F-12 (sign-in page wording and emptied boxes); no migration

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 131s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration (0132 is kept free for the role paper)
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

Driven in the in-app browser at 375×812 against a disposable dev staff account (created by script, left in dev per the disposable-test-data rule).

- [x] Happy path works end to end — **case 1**: correct current password plus a new password gave "Password changed. Your other devices have been signed out."; a second session signed in by script beforehand was refused its next refresh ("Refresh Token Not Found") while this browser session stayed signed in
- [x] Data persists — reload the page and the change is still there — the reload after the change stayed signed in; signing in again with the new password was not re-driven (the success message comes from `updateUser` returning no error)
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: single "set" action, no create/edit/delete
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list
- [x] Invalid input is rejected with a readable message, not a crash — **case 2**: wrong current password gave "That isn't your current password. Check it and try again, or sign out and use "Forgot password?"." and **all three boxes kept their text** (F-10 not reintroduced); same in Thai
- [x] Boundary cases checked — **case 3, the security test**: with the current-password field disabled so the browser posts only `password` and `confirm` (FormData keys confirmed `["password","confirm"]`), the action returned "Enter your current password." and changed nothing. Also unit-checked `openedByRecoveryLink` and `requiresCurrentPassword` against real-shaped tokens: fresh `otp` exempt; `otp` 31 min old, `otp` followed by a later `password`, `password` only, `oauth`, garbage and no token all not exempt; forced-change flag exempt (9 of 9 as expected)

### Case 4 — forgotten-password path

- [x] A recovery session carries what the exemption keys on — minted a real recovery token on dev (`generateLink` then `verifyOtp`) and decoded it: `amr: [{"method":"otp","timestamp":<now>}]`, which `openedByRecoveryLink` accepts
- [ ] The reset link is followed end to end in a browser and the page shows no current-password box — n/a: not driven; the app's reset uses a PKCE code exchange that cannot be forged from a script. Left for manual verification 1 (matrix activity R002)

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/account/password` | asked for current password; other sessions signed out | not driven separately — same code path as staff |
| management | same | same | not driven separately |
| staff | same | same | **driven** (disposable `staff` account) — cases 1–3 above |
| vet | same | same | not driven separately |
| volunteer | same | same | not driven separately |
| signed out | `/account/password` | redirected to `/login` | unchanged code (`if (!user) redirect("/login")` in page and action) |

- [ ] Every role above tested — n/a: the action and page do not branch on role; one role was driven, the rest share the path
- [x] A role that should not have access is blocked server-side — the current-password check runs in the server action (case 3), not in the form

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — the Signing in step now says the current password is asked for and other devices are signed out; the manual page was not loaded in a browser
- [x] Translatable strings go through the translation path — five new strings plus two changed, in both `en.ts` and `th.ts` (the type checker enforces the pair); `/management/translations` was not opened
- [x] Mobile viewport (375px) — no overflow, controls reachable — measured `scrollWidth 375` against `clientWidth 375` in Thai with the error showing; screenshot read
- [ ] Browser console clean — no errors or React warnings — n/a: a hydration error sits in the console buffer from a deliberate DOM-removal experiment on an earlier build and could not be cleared from the buffer; none was attributable to the final code (the form hydrated and every case ran). Left for manual verification 2
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not inspected; the only POSTs were the page's own server action

## 6. Regression

- [x] The pages nearest the change still work — `/my` (landing after sign-in) and `/login`
- [x] Any shared file touched checked from a second, unrelated page — `dictionaries/en.ts` and `th.ts` are shared; the sign-in page and header rendered correctly in both languages after the change
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged ("Already up to date")

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — F-22; the parent review item stays open
- [x] Non-obvious design choices recorded as a new file, dated — `docs/decisions/2026-10-03-password-change-requires-current.md` (server-side re-authentication, exemptions and how the server knows, the other-sessions decision, the labels, the global-signOut trap)
- [x] `README.md` still accurate — n/a: README does not describe password changes
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line saying changing your password now asks for your current one, and why
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned** — the `amr` shape of a recovery session, the death of other sessions after a change, and the global-scope `signOut` revoking the caller's own session were each observed on dev, not assumed

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager (worth doing here: the Workers runtime builds the verifier client, so confirm a real change on the deployed build)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: only a 30-minute window measured against token timestamps in epoch seconds; no calendar date involved
- [x] **For a boundary or banding change, both edges of the band and both sides of the boundary covered** — the 30-minute recovery window was checked at 60 s (accepted) and 31 min (refused); the "newest `amr` entry wins" boundary at otp-then-password (refused)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates line is the script's own
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: none added; the verifier uses the existing `NEXT_PUBLIC_SUPABASE_URL` and anon key

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, including what it does not cover — redeploy the previous ref (`./scripts/pi/deploy-pi.sh --ref <sha>`); code only, no schema or data. It does not restore sessions: anyone who changed their password while this was live had their other devices signed out

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | high | First cut ended the verifier session with the default (global) `signOut()`, which revoked the caller's own session too; `updateUser` then failed with "Auth session missing!" | fixed — `scope: "local"` |
| 2 | medium | A refused change emptied all three boxes (React resets `<form action>` fields) — the F-10 pattern | fixed — controlled fields, `onSubmit` |
| 3 | medium | Before hydration, the `onSubmit` form fell back to a native GET and put the passwords in the URL | fixed — `method="post"` |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Follow a real **Forgot password?** email link on a phone: the Change password page must show **no** Current password box and must accept a new password (matrix R002). Then a normal sign-in: the box must be there | `test.lannacare.org` → `/login/forgot` |
| 2 | Console and network tabs clean on `/account/password` during a refused and an accepted change; phone-width pass with the real device keyboard, in both languages | same |
| 3 | Someone with a phone and a laptop both signed in: change the password on one and confirm the other is sent to sign-in | same |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-03

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–3 wait for a person

Manual verification by: pending: a person's pass on items 1–3 (reset link, console/network, two devices)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: all three defects found are fixed
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass

Release manager acknowledgement: pending  Date: —
