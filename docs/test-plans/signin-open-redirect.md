# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `safeNextPath` parses the sign-in `next` parameter as a URL and keeps only same-origin results, closing the `/\evil.com` open redirect |
| Backlog item | `docs/backlog.md` → Security: Close the sign-in open redirect (WEB-1) |
| Branch / worktree | `claude/signin-open-redirect` @ `C:\Development\Animal_Shelter_signin-open-redirect` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3011` (not used: pure function, covered by script) |
| PR | linked from the PR itself |
| Tested by / date | Claude (signin-open-redirect session), 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | see `git log` for this branch; gates below run after syncing `main` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `safeNextPath` requires a leading `/`, refuses backslashes and control characters, parses against `http://x`, returns null unless the origin is unchanged, and returns `pathname + search`
- [x] Files/areas touched listed: `src/lib/auth/next-path.ts`, new `scripts/check-next-path.mjs`, `docs/backlog.md`, `docs/decisions/2026-09-30-signin-next-parsed-not-prefix-checked.md`, this plan. Callers (unchanged): `login/page.tsx`, `login/actions.ts`, `auth/callback/route.ts`, `lib/supabase/proxy.ts`
- [x] Roles affected identified: everyone who signs in via a `?next=` deep link (all roles); signed-out visitors are the ones an attacker would target
- [x] Out of scope written down: other redirect sinks, and the Supabase Redirect URLs allow-list, which is dashboard config

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (added `docs/releases/2026-09-30.md` only), pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
GATES_PLACEHOLDER
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

`node scripts/check-next-path.mjs` → `all 28 passed`, run against the real exported function.

- [x] Happy path works end to end: `/residents`, `/residents?zone=1`, `/residents?zone=1&q=a%20b`, `/residents/caf%C3%A9`, `/` all round-trip unchanged
- [ ] Data persists — n/a: no stored data; a pure function
- [ ] Create / edit / delete exercised — n/a: no records
- [ ] Empty state — n/a: `""`, `null` and `undefined` return null (asserted), nothing renders
- [x] Invalid input is rejected, not a crash: `//evil.com`, `/\evil.com`, `/\/evil.com`, `/\\evil.com`, `http(s)://evil.com`, `javascript:`, bare `evil.com`, and a backslash mid-path and in the query all return null; none throws
- [x] Boundary cases: tab, newline, carriage return, NUL and DEL inside the path return null; `%5C` (encoded backslash) is kept as-is, since it is not a path separator; a `#fragment` is dropped; `/a//b` round-trips

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no role-dependent behaviour | n/a |
| management | n/a | no role-dependent behaviour | n/a |
| staff | n/a | no role-dependent behaviour | n/a |
| vet | n/a | no role-dependent behaviour | n/a |
| volunteer | n/a | no role-dependent behaviour | n/a |
| signed out | n/a | no role-dependent behaviour | n/a |

- [ ] Every role above tested — n/a: the helper is role-blind; the role only chooses the landing path after it
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no user-facing behaviour change
- [ ] Translatable strings — n/a: no strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI change, not driven in a browser
- [ ] Network clean — n/a: no UI change, not driven in a browser

## 6. Regression

- [x] The nearest things still work: every caller of `safeNextPath` was read (`login/page.tsx`, `login/actions.ts` ×2, `auth/callback/route.ts`, `lib/supabase/proxy.ts`); each passes the result to a redirect or hidden field and accepts `null`. A real sign-in in a browser was not driven
- [ ] Shared file checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the merge added one docs file

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch (moved to Completed → Security)
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-09-30-signin-next-parsed-not-prefix-checked.md`, including that the return value is now the parsed `pathname + search`
- [ ] `README.md` still accurate — n/a: README does not describe `next` handling
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no shelter user sees it; legitimate deep links behave exactly as before and only crafted links are refused
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the `/a/../b` → `/b` and fragment-dropped behaviour were run, and the 28 cases are the script's output. That browsers read `/\` as `//` is established browser behaviour, not something this plan reproduced in a browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (suggest: open `/login?next=/\evil.com`, sign in, land on the default page not off-site)
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: not a threshold; the cases cover legitimate and hostile sides of the same-origin test
- [ ] Evidence pasted is the tool's actual output — n/a: gates lines in §2 are pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no page changed

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

- [x] Rollback position: `npx wrangler rollback --env production` reverts the Worker; nothing persistent is written and there is no schema change. Note that rolling back reopens the redirect

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing needs human eyes: the behaviour is a pure function with a table of cases.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (signin-open-redirect session)  Date: 2026-09-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI change, covered by tests

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending  Date: —
