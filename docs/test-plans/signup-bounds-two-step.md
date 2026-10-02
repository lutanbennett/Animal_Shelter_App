# Feature test plan — signup-bounds-two-step

## Header

| | |
|---|---|
| Feature | Deny on an access request only deletes a login that has no role (checked on the server), confirms in plain words that it is permanent, and requests are listed newest first |
| Backlog item | `docs/backlog.md` → "Bound sign-ups and make admin two-step non-optional (WEB-3, WEB-4)" |
| Branch / worktree | `claude/signup-bounds-two-step` @ `C:\Development\Animal_Shelter_signup-bounds-two-step` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | pending |
| Tested by / date | Claude / 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | pending |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — most of the item shipped in `af98a14` (paging, banner, highlight, admin-opened set-up); this PR adds the missing "dismiss deletes the orphan row" guard and newest-first ordering
- [x] Files/areas touched listed — `src/app/admin/security/actions.ts` (new `dismissAccessRequest`), `AccessRequests.tsx`, `page.tsx`; both dictionaries; `src/lib/releases.ts`; `docs/`. No `worker/`, no migration
- [x] Roles affected identified — admin only (Security is admin-only and behind 2-step)
- [x] Anything explicitly **out of scope** written down — refusing the admin role until enrolled (lockout risk, Lutan's call); the Supabase console settings (Lutan's); both in `docs/decisions/2026-10-02-signup-bounds-deny-guard.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in; already up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 266s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration; reads `user_roles` as before
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: not driven; a browser session would need an aal2 admin, which means typing a password and a code into Supabase. Left for manual verification
- [ ] Data persists — reload the page and the change is still there — n/a: not driven, same reason; the action deletes and calls `revalidateSecurity()` as `deleteUser` does
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: not driven; delete is the only write, row 1 below
- [ ] Empty state renders sensibly (no rows yet) — n/a: component unchanged
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: not driven; the stale-page refusal is the new message, row 2 below
- [ ] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — n/a: the one boundary is "has a `user_roles` row", by code review; row 2 below

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | Security → Access requests, Deny | guarded delete | not driven |
| management | none | `refuseUnlessAdmin` | by code, unchanged helper |
| staff | none | as management | by code |
| vet | none | as management | by code |
| volunteer | none | as management | by code |
| signed out | none | sent to sign in | unchanged |

- [ ] Every role above tested — n/a: not driven; non-admins are refused by `refuseUnlessAdmin`, the same first line as every other action in the file
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: not driven; as above

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: none added
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: the existing passage says Deny removes the account, which is still true
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: UI strings are in both dictionaries (`en.ts`, `th.ts`); not record text
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: layout untouched; only the confirm and error wording changed
- [ ] Browser console clean — no errors or React warnings — n/a: not driven
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not driven

## 6. Regression

- [ ] The pages nearest the change still work (list the ones checked) — n/a: not driven; `/admin/security` compiled in the production build
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched except the dictionaries, which every page loads and the build compiled
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** Would a shelter user notice this change? — `unreleased` has an admin-only line
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the "already shipped" claims were read from the code: `listAllUsers` loops, `usage.ts` loops, `startTwoStepSetup` refuses unless `isSetupOpen`, `my/page.tsx` has the banner, `UsersTable` flags admins

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic changed; the sort is on ISO strings
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**. — redeploy the previous ref (`./scripts/pi/deploy-pi.sh --ref <sha>`); no schema to revert. A login already dismissed stays deleted, as with Deny today

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | None found, but no browser check was driven | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Deny on a no-role login (make one with a throwaway Google sign-in): the confirm says the sign-in is deleted for good, and after confirming the row goes | Settings → Security → Access requests, as an admin |
| 2 | The stale-page case: open Security in two tabs, approve the request in one, Deny it in the other. It should say "given access since this page loaded" and the person must still exist | same page, two tabs |
| 3 | Requests are listed newest first (first seen), in English and Thai | same page |
| 4 | **Supabase console, dev then production:** turn off open sign-up or restrict Google sign-in to the shelter's domain (WEB-3). Do it in one sitting with the Supabase, Cloudflare and Google checklist item and WEB-11's inactivity timeout, which sit in the same console | Supabase → Authentication |
| 5 | Decide whether to refuse the admin role until the person has enrolled (WEB-4's optional clause); the lockout question is in the decisions file | `docs/decisions/2026-10-02-signup-bounds-deny-guard.md` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; this is Lutan's to tick after looking

Manual verification by: pending: the five items under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after manual verification

Result: pass
