# Feature test plan

## Header

| | |
|---|---|
| Feature | A shelter Admin connects its own Google Drive and Calendar from Settings (build; first real consent is Lutan's) |
| Backlog item | `docs/backlog.md` → `#drvcl` (left open: the consent round trip is unproven without the connect client's secret) |
| Branch / worktree | `claude/shelter-drive-connect` @ `C:\Development\Animal_Shelter_shelter-drive-connect` |
| Dev server | `http://localhost:3001` |
| PR | opened with this plan |
| Tested by / date | Claude, 2026-11-22 |
| Carries a migration? | no (Admin-only with no card; writes go through a registered service-role file) |
| Tested at SHA | b09e56526 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: two Connect buttons on Settings, start and callback routes, an encrypted write through the existing connect libraries
- [x] Files/areas touched: `src/app/admin/google/{start,callback}/route.ts`, `src/app/admin/GoogleConnect.tsx`, `src/app/admin/page.tsx`, `src/lib/google/shelter-google-connect*.ts`, both dictionaries, `scripts/lib/runtime-config.mjs`, `.env.example`, `eslint.config.mjs`, `docs/hard-coded-security-registry.json`
- [x] Cards affected: none (Admin only through `perms.isAdmin`, decision file explains why no card); signed-out public unaffected
- [x] Out of scope: the real Google consent, the product-admin console, `docs/google-cloud-inventory.md`, any Google console change

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, all zero. Closing lines as printed:

```
=== gates: typecheck exited 0 after 50s
=== gates: lint exited 0 after 220s
=== gates: test exited 0 after 54s
=== gates: build exited 0 after 207s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — pending: needs the connect client's secret, which Lutan holds; the consent, code exchange, folder creation and writes are unproven
- [ ] Data persists — reload the page and the change is still there — pending: nothing is written until a real consent completes
- [ ] Create / edit / delete all exercised — n/a: the screen only connects; there is no edit or delete
- [x] Empty state renders sensibly: with no connect client set, Admin sees the section with "not switched on yet" and no buttons (driven with playwright, dev)
- [x] Invalid input is rejected with a readable message: a callback with a bad state redirects to `/admin?google=state` and the page shows the "did not match" sentence; `?google=drive-scopes` shows the unticked-box sentence
- [x] Boundary cases checked: state cookie missing, short or mismatched; unknown kind; missing or partial scopes (unit tests, 4 passing)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin`, `/admin/google/start?kind=drive` | section shown; with a client set, 2 buttons and a 307 to accounts.google.com with the narrow scope, offline, consent, state; with none set, 307 to `?google=drive-not_set_up` | as expected |
| exactly `view_residents` | `/admin`, `/admin/google/start` | no Settings access (sent to `/no-access`); start route 307s to `/admin` | as expected |
| signed out | n/a | the proxy sends signed-out requests to sign-in | not driven; the routes also call `loadPermissions` and refuse without Admin |

- [x] Every login above tested (signed out: see its row)
- [x] A login that should not have access is blocked server-side: the start route was called directly as the cards-only login and redirected away

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; the buttons sit on the existing Settings page
- [ ] Manual updated — n/a: pending the first working consent; the topic should describe a flow that has run once
- [x] Translatable strings go through the dictionaries: `admin.landing.googleConnect` in both `en.ts` and `th.ts` (the type forces both)
- [ ] Mobile viewport (375px) — pending: not looked at; plain stacked links, no fixed widths
- [x] Browser console clean — no errors during the driven runs (the dev log showed none)
- [ ] Network clean — n/a: the only external call is Google's consent redirect, which was not followed

## 6. Regression

- [x] The pages nearest the change still work: `/admin` loads for Admin with both status lines and the tiles beside the new section
- [x] Shared files touched (`en.ts`, `th.ts`, `page.tsx`, `runtime-config.mjs`) checked by loading `/admin` and by `check-runtime-config` ("39 names, agree") and `check-hard-coded-security` ("no coded security outside the Admin bypass")
- [x] Nothing merged from `main` during `sync` was broken (nothing was merged)

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: left open on purpose, the consent round trip is not yet proved
- [x] Non-obvious design choices recorded in `docs/decisions/2026-11-22-shelter-google-connect-screen.md` (the card answer and the three questions)
- [x] `README.md` still accurate (it does not describe Settings' Google lines)
- [ ] **Release notes.** n/a: the connect flow cannot be completed until Lutan's first consent with the connect client's secret; the note ships in the PR that closes that step
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and the decision file were measured: the redirect, the gating and the messages were driven; the untried parts are listed as unproven

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here derives a date
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [x] Evidence pasted into this plan is the tool's actual output, unedited (the gates block)
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — deferred: release manager; `GOOGLE_CONNECT_CLIENT_ID` and `GOOGLE_CONNECT_CLIENT_SECRET` are registered, and Lutan holds the secret; unset, the screen says it is not switched on

### Migration ordering — *skip if no migration*

- [ ] Migration and code ordering — n/a: no migration
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; the change is additive code with no schema, so a rebuild at the previous SHA reverts it, and nothing is stored until a consent completes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Lutan's first real consent: press Connect on Drive and on Calendar once, with the connect client's secret set, and read the result on Settings. This also proves the 19 registered redirect URIs include the one used | dev Settings |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-22

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: Lutan's first consent

Manual verification by: pending: Lutan's first real Google consent

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: it is committed with the PR
- [ ] Handed to the production release manager — pending: after merge

Result: pass
