# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A Request access link on `/login` leading to an explainer, and honest no-role wording per sign-in path |
| Backlog item | `docs/backlog.md` → A visible "Request access" on the sign-in page |
| Branch / worktree | `claude/request-access-link` @ `C:\Development\Animal_Shelter_request-access-link` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | linked from the PR itself |
| Tested by / date | Claude (request-access-link session), 2026-09-29 |
| Carries a migration? | no |
| Tested at SHA | the PR's head commit; the page checks in §4 ran at `7254cf5` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `/login/request` explains how to ask (Continue with Google, an admin approves, no Google account → the shelter's email); the Google no-role message now says the shelter has been told; password sign-in keeps its own "ask an administrator" message. Items (1)–(3) done; (4) answered in `docs/decisions.md`
- [x] Files/areas touched listed: `src/app/login/` (`LoginForm.tsx`, `actions.ts`, new `request/page.tsx`), `src/lib/public-paths.ts`, `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, docs. `src/app/auth/callback/route.ts` is untouched
- [x] Roles affected identified: signed-out visitors, the only people who see `/login`; a signed-in user opening `/login/request` is not redirected, as `/login/forgot` is not
- [x] Out of scope written down: the `?intent=request` flag (not needed, see decisions), the name-and-note field, and an email to admins on a new request (System status and My tasks already surface it, #200)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; one conflict, in `unreleased` in `src/lib/releases.ts` (both sides added lines), resolved by keeping both
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 319s

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

- [x] Happy path works end to end: `GET /login/request` on the dev server returns 200 and renders the Request access title, the Google button and the shelter's email as a `mailto:` link (from Settings → Website); `GET /login` links to it
- [ ] Data persists — n/a: nothing is written; the request itself is the existing `auth.users` row made by Google sign-in
- [ ] Create / edit / delete all exercised — n/a: this change creates, edits and deletes no data
- [ ] Empty state renders sensibly — n/a: the only empty case is no shelter email set, where the sentence ends in a full stop; the dev database has one set, so that branch was read in code, not rendered
- [ ] Invalid input is rejected with a readable message — n/a: no input on the new page
- [ ] Boundary cases checked — n/a: no fields or dates
- [x] The refusal is unchanged: `git diff origin/main -- src/app/auth/callback/route.ts` is empty (0 lines), so a request is the ordinary Google sign-in. It still exchanges the code, finds no role, signs out and redirects to `/login?error=no_role`; there is no flag that could change that. The password path changed only in which message it returns, and still signs out first

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | page is for signed-out visitors; nothing role-specific | n/a |
| management | n/a | as above | n/a |
| staff | n/a | as above | n/a |
| vet | n/a | as above | n/a |
| volunteer | n/a | as above | n/a |
| signed out | `/login/request` | 200, explainer and Google button | 200 via curl with no cookies |

- [x] Every role above tested: the page shows nothing role-dependent; the signed-out case was requested with no cookies, the others are n/a as above
- [ ] A role that should not have access is blocked server-side — n/a: the page is public by design (added to `PUBLIC_PATHS` and `LOCKED_PUBLIC_PATHS`, as `/login/forgot` is) and grants nothing

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; reached from the sign-in page
- [x] Manual updated (`src/lib/manual/en.ts`, Signing in: a step and a note); the manual is English-only, `th.ts` does not exist there
- [x] Translatable strings go through the dictionaries: `login.requestAccess`, `login.request.*` and `login.errors.noRolePassword` in both `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: not checked by Claude, listed under manual verification
- [ ] Browser console clean — n/a: no browser session was driven (the browser pane refused localhost); the dev server served both pages with no error
- [ ] Network clean — n/a: the only requests were two curl GETs, both 200

## 6. Regression

- [x] The pages nearest the change still work: `/login` renders with the new link under Continue with Google (curl, 200)
- [x] Shared files touched (`public-paths.ts`, i18n dictionaries, `manual/en.ts`, `releases.ts`) checked from a second page: `/login` still loads, and `public-paths.ts` only gained an entry
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the merged tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-29
- [ ] `README.md` still accurate — n/a: README does not describe the sign-in page
- [x] **Release notes.** A shelter user would notice this: `unreleased` in `src/lib/releases.ts` gained a line in this PR
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: the empty callback diff and the 200s are from the runs above. That an archived Google account also reaches `no_role` is read from the callback, not reproduced

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold or banding
- [ ] Evidence pasted is the tool's actual output — n/a: the gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager (`/login/request` is a new public path)

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

- [x] Rollback position: revert the PR, or `wrangler rollback`; no schema or data changed, so nothing is left behind

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | An archived Google account is refused at the same point as a new one, so it also reads "an administrator has been told", which is not true for it. The wording is hedged with "if you're new" | accepted: the callback cannot tell them apart without another query, and the sentence is not false for someone who is new |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Real Google sign-in with an account that has no role: it lands on `/login` with the new message, and appears under Access requests on Settings → Security | dev, `/login/request` |
| 2 | Password sign-in as a role-less or archived email login shows the "ask an administrator" message, not the request-sent one | dev, `/login` |
| 3 | The wording of the page and both messages reads well in English and Thai; layout at phone width | dev, `/login/request` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (request-access-link session)  Date: 2026-09-29

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty and nobody has looked yet; see the pending signature below

Manual verification by: pending: a person to run the three rows above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — not merged

Result: pass with accepted defects

Release manager acknowledgement: pending
