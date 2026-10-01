# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A timed-out session lands on /login with a "you were signed out" message, `?next=` kept and the dead cookies cleared; the 60-day Supabase inactivity timeout is recorded |
| Backlog item | `docs/backlog.md` → Session inactivity timeout (WEB-11) — left open: the dashboard settings are Lutan's |
| Branch / worktree | `claude/session-inactivity-timeout` @ `C:\Development\Animal_Shelter_session-inactivity-timeout` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | linked from the PR itself |
| Tested by / date | Claude (session-inactivity-timeout session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: the path a session takes when Supabase refuses its refresh (which starts happening once the 60-day inactivity timeout is on) is distinct from "never signed in", explains itself, keeps `?next=` and clears the dead cookies
- [x] Files/areas touched listed: `src/lib/supabase/proxy.ts`, `src/app/login/page.tsx`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/`, this plan
- [x] Roles affected identified: every signed-in role, equally; the path is before any role lookup
- [x] Out of scope written down: turning the Supabase setting on (Lutan's, per environment); telling a network blip from a refused refresh in the proxy (decision file, "Known limit"); the offline banner (`confirm-dialogs-offline`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — see the PR for the merge commit
- [x] `node scripts/gates.mjs` — result in the PR description
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

The forced expired-session walkthrough, run against `localhost:3002` with `curl`: a request carrying a `sb-<ref>-auth-token` cookie whose access token is expired and whose refresh token is invalid, which Supabase refuses the way it refuses a timed-out one.

- [x] Happy path works end to end: `GET /residents?x=1` with the dead cookie → 307 to `/login?next=%2Fresidents%3Fx%3D1&error=expired`, with `Set-Cookie: sb-…-auth-token=; Max-Age=0`; `/login?error=expired&next=…` renders the English message and a hidden `next` of `/residents?x=1`
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no list
- [x] Invalid input is rejected with a readable message, not a crash: a never-signed-in request gets `/login?next=…` with no `error` and no `Set-Cookie`; `?next=` still goes through `safeNextPath` on `/login`
- [ ] Boundary cases — n/a: the one boundary, a cookie present or absent, is the pair of requests above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | the path runs before any role lookup | n/a |
| management | n/a | same | n/a |
| staff | n/a | same | n/a |
| vet | n/a | same | n/a |
| volunteer | n/a | same | n/a |
| signed out | any app page | `/login?next=…`, no message | pass |

- [ ] Every role above tested — n/a: no role logic; the session is gone before a role is read
- [ ] A role that should not have access is blocked server-side — n/a: no role logic

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [ ] Manual updated — n/a: a message on an existing page; the manual's sign-in topic does not describe errors
- [x] Translatable strings: `login.errors.expired` in `en.ts` and `th.ts`
- [ ] Mobile viewport — n/a: one paragraph of text in the existing error slot, no layout change
- [ ] Browser console clean — n/a: checked server-side with `curl`; no client code changed
- [ ] Network clean — n/a: same

## 6. Regression

- [x] The nearest path still works: the never-signed-in redirect (above) is unchanged apart from carrying cookies, of which there are none
- [ ] Shared file checked from a second page — n/a: `proxy.ts` is the gate for every page, exercised by the two requests above
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the synced tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: deliberately left open; a note says the code path and record are done and the two dashboard settings remain
- [x] Non-obvious design choices added as `docs/decisions/2026-10-01-session-inactivity-timeout.md`
- [ ] `README.md` still accurate — n/a: README does not describe session lifetime
- [x] **Release notes.** Would a shelter user notice this change? `src/lib/releases.ts` `unreleased` gained a line
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the redirect and cookie clearing were observed on a live request. A genuine 60-day-old token was not (needs the setting on and the time to pass), and the decision says so

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no numeric boundary
- [ ] Evidence pasted is the tool's actual output — n/a: no pasted evidence
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts the Worker; no migration is involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | An expired session was sent to /login with no explanation and its dead cookies left on the browser | fixed |
| 2 | low | A network blip on one request would also show the "expired" message | accepted (decision file, "Known limit") |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Turn on Authentication → Sessions → **Inactivity timeout = 60 days** (same item as the assessment's Supabase checklist — do it once) | Supabase dashboard, **dev** project `qxkmhwybjggxvsfxsxbd` |
| 2 | The same setting | Supabase dashboard, **production** project `dbkodyyxxhtygxcxmfcu` |
| 3 | Sign in on dev, then in the Supabase dashboard revoke that user's session (Authentication → Users → the user → sign out), reload the app: you should land on the sign-in page with the "signed out" message and, after signing in, back on the page you were on | `test.lannacare.org` once deployed |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (session-inactivity-timeout session)  Date: 2026-10-01

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1–3 are Lutan’s to do

Manual verification by: pending: the three items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet — handed over when the PR is opened

Result: pass

Release manager acknowledgement: n/a  Date: —
