# Test plan — public-viewer-login

## Header

| | |
|---|---|
| Feature | The app half of the Public viewer login: a `public_viewer` option in admin user management; sign-in lands on `/`; app pages send a public viewer to `/`; the public header treats it as a visitor; archived and role-less accounts refused at password sign-in. The UAT lock (`PUBLIC_SITE: "locked"`) lets a public viewer through to the public pages |
| Backlog item | `docs/backlog.md` → A "Public viewer" login: signs in past the UAT lock, sees only the public website |
| Branch / worktree | `claude/public-viewer-login` @ `C:\Development\Animal_Shelter_public-viewer-login` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (run with `PUBLIC_SITE=locked` for the checks below) |
| PR | #135 |
| Tested by / date | Claude, 2026-09-26 |
| Carries a migration? | no — uses `0085`/`0086`, merged in #128 and applied to dev |
| Tested at SHA | `a40384a` (browser checks, gates); `147d589` after the second sync (gates, plus viewer `/admin` → `/` and `/adopt` with Sign out rechecked) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a `public_viewer` login signs in past the UAT lock and sees only the public website, and archived/role-less logins are refused at password sign-in — every bullet of the brief
- [x] Files/areas touched listed: `src/lib/auth/app-access.ts` (new: the allow-list, landing path), `src/lib/supabase/proxy.ts` (app-path role check), `src/app/login/actions.ts` (refusal, landing), `src/app/auth/callback/route.ts` (landing), `src/app/adopt/PublicHeader.tsx` (Sign out for a viewer), `src/app/r/[code]/page.tsx` and `src/app/e/[id]/page.tsx` (card, not redirect, for a viewer), `src/app/NavPane.tsx` (no menu without app access), `src/app/admin/security/*` (picker + server validation), `src/lib/i18n/dictionaries/{en,th}.ts`, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `README.md`, `docs/decisions.md`, `docs/backlog.md`. No `worker/`, no `supabase/migrations/`
- [x] Roles affected identified: admin (new picker option); every staff role (one role lookup added per app request, behaviour unchanged); `public_viewer` (new behaviour); archived and role-less logins (now refused at password sign-in, and a live session is ended at the next app page); signed out (unchanged)
- [x] Anything explicitly **out of scope** written down: a stale archived session is not ended on the *public* pages (they skip the role lookup — decisions.md 2026-09-26); the wider `PublicHeader` rework is batch 2's `public-site-shell`; manual screenshots are not re-taken (one full rerun is planned when the batch is done)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: `Already up to date.` at 3fffb91 for the first run; after the PR opened, `main` had moved (the Drive upload-errors PR), and the second sync conflicted only in `docs/backlog.md` (both items ticked, both kept) and `src/lib/releases.ts` (both PRs' `unreleased` lines, all four kept). Merge `147d589`. A third sync brought #134 (migrations `0087`–`0089`, scripts, docs; no app code) and merged cleanly: `9b200d5`
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. At `a40384a`:

```
=== gates: typecheck exited 0 after 12s
=== gates: lint exited 0 after 105s
=== gates: build exited 0 after 162s
gates: typecheck=0 lint=0 build=0
```

At the merge `147d589`:

```
=== gates: typecheck exited 0 after 25s
=== gates: lint exited 0 after 56s
=== gates: build exited 0 after 136s
gates: typecheck=0 lint=0 build=0
```

At the merge `9b200d5`:

```
=== gates: typecheck exited 0 after 9s
=== gates: lint exited 0 after 62s
=== gates: build exited 0 after 70s
gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration in this PR; `0085`/`0086` merged in #128
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration in this PR; the checks below ran against dev with `0085`/`0086` already applied
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration in this PR
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration in this PR
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration in this PR
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration in this PR; `0085`/`0086` must be on production before this deploys there (the picker would offer a value the enum lacks), which is #128's apply plan

## 4. Functional checks

All in the built-in browser against `next dev` on :3002 started with `PUBLIC_SITE=locked`, dev database, throwaway logins made for this (a `public_viewer`, an archived `staff`, one with no `user_roles` row) plus the dev admin test user.

- [x] Happy path works end to end: signed out, `/` shows the Staff testing site landing and `/adopt` goes to `/login?next=%2Fadopt`. Public viewer signs in from `/login?next=%2Fresidents` and lands on `/` — the full home page, not the locked landing — with Sign out in the header where staff have "Open the app"
- [x] Data persists — reload the page and the change is still there: role changed to Volunteer and back to Public viewer from the Users table; `user_roles` on dev read back `public_viewer`, `archived_at` null, and the row shows Public viewer after reload
- [x] Create / edit / delete all exercised (whichever the feature has): the create form lists `public_viewer=Public viewer`; change exercised both ways (above); the access-request picker uses the same server validation (`VALID_ROLES`), not driven separately. Delete is unchanged
- [ ] Empty state renders sensibly (no rows yet) — n/a: no list or empty state added
- [x] Invalid input is rejected with a readable message, not a crash: correct password for an archived login and for a role-less login each stay on `/login` with "This account doesn't have access. Ask an administrator to assign you a role, then try again." and no `auth-token` cookie left behind
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): public viewer with a *public* `?next=` (`/login?next=%2Fadopt`) lands on `/adopt`; with an app `?next=` (`/login?next=%2Fmaintenance`, already signed in) goes to `/`; archived *mid-session* (role row archived on dev while signed in), the next `/residents` is signed out to `/login?error=no_role` with the auth cookie cleared, and `/adopt` is locked again; `/account/password` stays reachable to a viewer, without the app menu

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/login?next=%2Fmaintenance` → `/maintenance`; `/r/R-0003` → resident hub; `/adopt` header "Open the app"; `/admin/security`; `/manual` | unchanged | pass |
| management | `/residents` with the test login's role switched to management | app opens | pass: `/residents` renders with the app menu |
| staff | `/residents` with the role switched to staff | app opens | pass: `/residents` renders with the app menu |
| vet | `/residents` with the role switched to vet | app opens | pass: `/residents` renders with the app menu |
| volunteer | `/residents` with the role switched to volunteer | app opens | pass: `/residents` renders with the app menu |
| public_viewer | `/`, `/adopt`, `/r/R-0003`, `/e/<enclosure>`, `/account/password`; `/residents`, `/admin/security`, `/login?next=%2Fmaintenance` | public pages as a visitor (cards, not hub redirects); app paths → `/` | pass |
| archived / no role | password sign-in; a live session on `/residents` | refused with the no-access message; session ended | pass |
| signed out | `/`, `/adopt`, `/residents` | locked landing; `/login?next=…` | pass |

- [x] Every role above tested. Management, staff, vet and volunteer: one signed-in throwaway login had its `user_roles.role` switched on dev between requests (the proxy reads the role per request, so no re-sign-in), and `/residents` loaded with the app menu for each; switched back to `public_viewer`, the next `/residents` went to `/`
- [x] A role that should not have access is blocked server-side (hitting the URL directly fails): `/residents` and `/admin/security` typed directly as the public viewer redirect to `/` in the proxy, before any page renders. What a viewer's session can *read* was #128's harness

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav entry added; `NavPane` now renders nothing for a session without app access, checked on `/account/password` as the viewer (`nav a[href="/residents"]` absent)
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual`: the sign-in callouts and Settings → Accounts and roles; all three new sentences found on `/manual`
- [ ] Translatable strings go through the translation path — n/a: the new strings are UI dictionary entries (EN + TH in `dictionaries/`), not translatable database content
- [x] Mobile viewport (375px) — no overflow, controls reachable: `/adopt` as the viewer, `scrollWidth > innerWidth` false, Sign out visible in the header
- [x] Browser console clean — no errors or React warnings: `read_console_messages` with errors only, none
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: not inspected request by request; every page above rendered and every redirect landed where listed

## 6. Regression

- [x] The pages nearest the change still work: `/login` (staff sign-in with `?next=`), `/maintenance`, `/r/R-0003` (staff → hub), `/adopt` (staff header), `/admin/security`, `/manual`, `/`
- [x] Any shared file touched checked from a second, unrelated page: `manual/en.ts` loaded at `/manual`; the proxy and `PublicHeader` exercised from `/adopt`, `/r/`, `/e/`, `/maintenance`
- [x] Nothing merged from `main` during `sync` was broken by this branch: the second sync brought the Drive upload-errors change (`src/app/admin/page.tsx` among others). Gates pass on the merge, and as the viewer `/admin` still goes to `/`

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated: 2026-09-26, "The public viewer, app side: one allow-list, checked in the proxy"
- [x] `README.md` still accurate: Roles section now lists six values with `public_viewer`, and says archived/role-less logins are refused at sign-in
- [x] **Release notes.** Two lines added to `unreleased`: the Public viewer account type, and archived/role-less accounts refused at password sign-in
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The redirects, refusals, landing paths, cookie clearing and mid-session sign-out were each driven in the browser (§4). The one reasoned claim — that public pages skip the role lookup — is read off the proxy's condition (`!isPublicPathname(…)`), and is stated as a design choice, not a measurement

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager (a public viewer signs in on the locked site and sees `/adopt`; `/residents` sends it to `/`)
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or band; the role allow-list was checked from both sides (staff roles in, viewer/archived/no-role out)
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — deferred: release manager, for the deploy output
- [ ] Public pages re-checked after a cache purge or a 10-minute wait — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — deferred: release manager
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var; `PUBLIC_SITE` already exists (#123)

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration here; this code needs `0085` (#128) on production first, which is #128's apply
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration in this PR
- [ ] Apply plan stated — n/a: no migration in this PR; `0085`/`0086` before this deploys, per #128

### Rollback

- [ ] Rollback position stated, **including what it does not cover** — deferred: release manager. Code-only: `npx wrangler rollback` fully reverts it; any `public_viewer` logins made meanwhile stay in `user_roles` and, under the old code, would open app pages (reading nothing, per `0086`) — archive them before rolling back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Google sign-in as a public viewer lands on `/` and gets past the lock (the OAuth leg was not driven — it needs a real Google account) | `test.lannacare.org` once deployed, or localhost |
| 2 | The public header's Sign out for a viewer looks right beside the language switch (it is the app header's text-style button, not the bordered "Open the app" link) | `/adopt` as a public viewer |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-26

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the list is not empty; for Lutan to tick after looking

Manual verification by: pending: Google sign-in as a public viewer; the header's Sign out styling

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — handed over at release time

Result: pass

Release manager acknowledgement: pending: at release time
