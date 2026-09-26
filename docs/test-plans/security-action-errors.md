# Feature test plan — security-action-errors

## Header

| | |
|---|---|
| Feature | Settings → Security says what went wrong instead of "Minified React error #441": every action returns a result, not a throw |
| Backlog item | `docs/backlog.md` → "Bug: Settings → Security shows "Minified React error #441" instead of saying what went wrong" (part 1; part 2 split out as its own item on `backlog`, 3d0095f) |
| Branch / worktree | `claude/security-action-errors` @ `C:\Development\Animal_Shelter_security-action-errors` |
| Dev server | **production build**, `next build` + `next start --port 3001` (a gitignored `prod` entry in `.claude/launch.json`). #441 exists only in production, so `next dev` would prove nothing |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-26 |
| Carries a migration? | no |
| Tested at SHA | `6ea0af5` (the fix); synced to `d306147` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — all seven actions in `src/app/admin/security/actions.ts` (create, approve, change role, temporary password, archive, restore, delete) return `{ ok: true } | { ok: false, error }`; `UsersTable.tsx`, `AccessRequests.tsx` and `CreateUserForm.tsx` show `error`; known failures have en and th wording; the raw error is logged server-side
- [x] Files/areas touched listed — `src/app/admin/security/*` (actions + three components), new `src/lib/action-result.ts` (`ActionResult`, `runAction`, `unexpectedFailure`), `src/lib/auth/require-admin.ts` (adds `hasAdminRole()`; `assertAdminRole()` now calls it, same behaviour), `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions.md`
- [x] Roles affected identified — admin only; `/admin/security` is admin-only and every action still checks the role first
- [x] Anything explicitly **out of scope** written down — (a) the other `"use server"` files, which still throw and still show #441: the item's part 2, now its own backlog item; (b) the foreign keys to `auth.users`, deliberately left without a delete rule (decisions.md); (c) hiding Delete up front for logins with records, which needs a migration — the answer after the click is readable instead; (d) **what** any action allows: guards, their order and outcomes are unchanged

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly at `d306147` (brought only a release-date correction and two docs files)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Run on the synced tree:

```
=== gates: typecheck exited 0 after 12s
=== gates: lint exited 0 after 80s
=== gates: build exited 0 after 160s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the page reads the same rows as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration; the one constraint that matters here (the FKs refusing the delete) was exercised for real in §4
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: nothing to apply

## 4. Functional checks

All driven in the in-app browser against the **production build** on :3001 (dev database), signed in as Lutan's admin account (Lutan signed in; Claude drove), 590px pane, `window.confirm` stubbed to accept.

- [x] **The reported failure, reproduced:** Delete on the archived `manager@gmail.com` → the row shows *"This person has records in the system, so they can't be deleted. Archive them instead."* The login is still there afterwards. The server log carries the raw cause: `[security.deleteUser] refused by the database: Error [AuthRetryableFetchError]: Database error deleting user … status: 500, code: undefined` — which is the GoTrue shape the mapping matches on, measured rather than assumed
- [x] Same in Thai (`locale=th`): *"ผู้ใช้นี้มีข้อมูลที่บันทึกไว้ในระบบ จึงลบไม่ได้ ให้เก็บถาวรแทน"*; the confirm was the Thai one too
- [x] Happy path works end to end — on a throwaway login `claude-441-test@lutan.com`: Create user → *"Created claude-441-test@lutan.com as staff."* with the temporary-password notice; Issue temporary password → notice shown; Archive → row gains *archived*; Restore → *archived* gone; change role Staff → Volunteer → *"Role updated."*; Delete → row gone, no error (no history, so the database allows it)
- [x] Data persists — the page was reloaded between Create and the row actions and the new login was listed with its *temporary password* badge; each later action's row state came from the server re-render
- [x] Create / edit / delete all exercised — see happy path above
- [ ] Empty state renders sensibly — n/a: no list or empty state changed; "No one is waiting for access." rendered as before
- [x] Invalid input is rejected with a readable message, not a crash — Create user with an existing email (`manager@gmail.com`) → *"There is already a login with that email."* (previously GoTrue's English text, returned raw)
- [x] Boundary cases checked — the unexpected-failure path, which the UI cannot trigger on demand, exercised by calling the real `runAction()` from `src/lib/action-result.ts` under Node: a success passes through (`{"ok":true,"n":1}`), a refusal passes through (`{"ok":false,"error":"readable"}`), a throw becomes `{"ok":false,"error":"Something went wrong (reference 6da35c3d)"}` with the log line `[check] ref 6da35c3d: Error: boom` — same reference in both — and a `redirect()` is re-thrown (`NEXT_REDIRECT;replace;/login;3`), not swallowed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/security` and its actions | every action works; refusals readable | as expected (above) |
| management | nothing here | redirected by `requireAdminUser()`; an action call refused by `hasAdminRole()` | unchanged code path — not signed in as this role |
| staff | nothing here | same | unchanged code path — not signed in as this role |
| vet | nothing here | same | unchanged code path — not signed in as this role |
| volunteer | nothing here | same | unchanged code path — not signed in as this role |
| signed out | nothing here | redirected to `/login` | `/admin/security` → `/login?next=%2Fadmin%2Fsecurity`, seen before signing in |

- [ ] Every role above tested — n/a: the page guard is untouched and the action guard is the same `current_user_role() === "admin"` test moved into `hasAdminRole()`; signing in as each role needs passwords Claude does not have, and would exercise no line this PR changed
- [x] A role that should not have access is blocked server-side — signed out, the direct URL redirected to `/login`; for the actions, the admin check is still the first statement in every one, before any read or write (read in the diff)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the item says the manual needs no change; the page's controls are the same, only the error text is
- [ ] Translatable strings go through the translation path — n/a: these are dictionary strings (`src/lib/i18n/dictionaries`), not DB-backed translations; en and th were both added and the th ones were seen rendered
- [ ] Mobile viewport (375px) — n/a: no layout change; messages render in the existing message row, seen at the 590px pane
- [x] Browser console clean — `read_console_messages` (errors only) returned nothing after all the actions above
- [x] Network clean — every action returned normally; the only server-side error lines were the deliberate `refused by the database` log

## 6. Regression

- [x] The pages nearest the change still work — the whole Security page: Access requests section, Create user, and every row action, above
- [x] Any shared file touched checked from a second, unrelated page — `require-admin.ts`'s `assertAdminRole()` is used by the other `/admin` actions; its behaviour is identical (throws the same message when not admin), and the build compiled every consumer. The dictionaries: the home page, the header and the Thai Settings nav all rendered from them during the run
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge brought a release date and docs only; gates re-run after it (above)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**; part 2 added as a new item on `backlog` (3d0095f)
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated — "2026-09-26 — Server Actions return a result, not a throw"
- [ ] `README.md` still accurate — n/a: README does not describe the Security page's errors or the action convention
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` gained a line written for an admin: Security now says what went wrong, and deleting someone with records says to archive them
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the GoTrue error shape ("Database error deleting user", no code) was read from the server log of the real refusal; #441 being a production-only stand-in is from the backlog item and React's production client, and is why the check ran on `next start`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, both edges covered** — n/a: no threshold or boundary; the four `runAction` outcomes were each asserted (§4)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the quoted messages, log line and `gates:` lines are copied from the runs
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated — `npx wrangler rollback --env production` restores the throwing version (and #441) in seconds; no schema or data is involved, so nothing else needs undoing

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | Rest of the app still shows #441 for ordinary refusals (the item's part 2) | deferred to backlog (3d0095f) |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Delete on the archived `manager@gmail.com` shows the "has records … Archive them instead" message, in your own eyes, on a production build | `test.lannacare.org` → Settings → Security after the next test deploy (or `next start` on this worktree) |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 is waiting for Lutan

Manual verification by: pending: Lutan to see the Delete refusal on manager@gmail.com on a production build (item 1)

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: not yet — defect 1 is deferred to the backlog, awaiting Lutan's acceptance at review
- [ ] Checklist pasted into the PR — n/a: not yet — the PR is opened after this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
