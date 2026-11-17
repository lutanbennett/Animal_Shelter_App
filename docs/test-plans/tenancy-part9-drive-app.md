# Feature test plan

## Header

| | |
|---|---|
| Feature | Per-shelter Drive credentials: app half (reader, encryption, fallback, status RPC, dead-token alerting) |
| Backlog item | `docs/backlog.md` → `#o2iyh` |
| Branch / worktree | `claude/tenancy-part9-drive-app` @ `C:\Development\Animal_Shelter_tenancy-part9-drive-app` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: number known once opened |
| Tested by / date | Claude, 2026-11-18 |
| Carries a migration? | yes (0405, 0406) |
| Tested at SHA | 36b39e659 |

## 1. Scope and risk

- [x] Change is described in one sentence: every Drive call takes its Google credentials from the serving shelter's own encrypted row, a shelter with none (other than Lanna) is refused, Admin reads status through an RPC, and each shelter's token is checked by the alert cron
- [x] Files touched: `src/lib/google/*` (reader, crypto, tokens, status), `drive.ts`, `shelter-settings.ts`, `api/status/alerts/route.ts`, `DriveStatus.tsx`, migrations 0405 and 0406, registry and eslint allow-list, decision, release note
- [x] Cards affected: none gate anything here; Admin (outside the card system) is the only reader of the status RPC; the signed-out public is unaffected
- [x] Out of scope: the consent flow that mints a shelter's token (onboarding #omt6u); calendar sync's own use of `GOOGLE_OAUTH_*`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs`:

```
=== gates: typecheck exited 0 after 19s
=== gates: lint exited 0 after 139s
=== gates: test exited 0 after 37s
=== gates: build exited 0 after 84s
gates: typecheck=0 lint=0 test=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration numbers 0405 and 0406 follow 0404 on `main`; check-migration-numbers clean
- [x] `--status` reviewed before applying
- [x] `--dry-run` reviewed (0405 ok)
- [x] Applied to **dev** and recorded in `schema_migrations`
- [x] Files are re-runnable (`create or replace`, guarded `alter function`)
- [ ] Existing rows still read correctly — n/a: the table is empty; Lanna has no row and falls back to environment variables
- [ ] Constraints exercised in a rolled-back harness — n/a: no new constraint; the strict tenancy lint (0 flagged, 0 stale) is the check on the function's owner
- [ ] Down-migration — n/a: `drop function public.shelter_drive_status()`, in the 0405 header
- [x] Production apply plan: 0405 then 0406 to `dbkodyyxxhtygxcxmfcu` with the release; set `DRIVE_CREDENTIALS_KEY` before connecting any shelter but Lanna

## 4. Functional checks

- [ ] Happy path end to end — pending: two real Google accounts do not exist; the encrypt/decrypt path is unit-tested, the live token probe is not run against Google
- [ ] Data persists — n/a: nothing writes a row yet except the alert cron's status columns
- [ ] Create / edit / delete — n/a: no UI for it yet (onboarding #omt6u)
- [ ] Empty state — n/a: no row means Lanna's environment fallback, unchanged
- [x] Invalid input rejected readably: missing, short or wrong `DRIVE_CREDENTIALS_KEY` fails loudly (unit tests)
- [ ] Boundary cases — n/a: see above

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| Admin | status columns of own shelter via `shelter_drive_status()` | rows; no secret | pending: not driven; no row exists to show |
| a login with any card, no Admin | the RPC | no rows | pending: not driven |

- [ ] Every login above tested — pending: the table is empty so every answer is no rows; left for onboarding's first row
- [ ] A login without access is blocked server-side — n/a: no grant on the table (0404); the RPC returns nothing unless `is_admin()`

## 5. Cross-cutting

- [ ] Nav entry — n/a: none
- [ ] Manual updated — n/a: nothing to do until a shelter can connect
- [ ] Translatable strings — n/a: none added (the status line adds only the account email)
- [ ] Mobile viewport — n/a: one inline span
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] Nearest checks: tenancy lint strict 0 flagged 0 stale; check-hard-coded-security "no coded security outside the Admin bypass"; check-card-grants all passed; check-shelter-settings clean
- [x] Shared file `drive.ts` touched: token cache is now per account; Lanna's path (no row, env fallback) is the same call sequence as before
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item `#o2iyh` ticked on this branch
- [x] Design choices in `docs/decisions/2026-11-18-per-shelter-drive-app-half.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no release line; no shelter can connect its own Google account until onboarding builds the connect step (decision file, "NOT built")
- [x] Commit messages say why
- [x] Claims were measured: lint and check output are from live dev runs

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: none
- [ ] Banding assertions — n/a: none
- [ ] Evidence is the tool's actual output — n/a: gates block pasted from the run
- [ ] Public pages re-checked — deferred: release manager
- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret exists in production — deferred: `DRIVE_CREDENTIALS_KEY` is Lutan's deploy step, needed only before a non-Lanna shelter is connected
- [ ] Migration and code ordering — deferred: release manager; 0405 and 0406 are additive and read by code that tolerates their absence
- [ ] `--env production --dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: additive
- [ ] Apply plan stated: 0405 then 0406 — deferred: release manager
- [ ] Rollback position — n/a: drop the function; the code falls back to environment variables for Lanna

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | low | 0405 needed a follow-up 0406 because the lint wanted the definer owner | fixed in 0406 |

## Left for manual verification

Nothing a person needs to look at yet; the first connected shelter (onboarding) should be proved against a real Google account.

Automated checks by: Claude  Date: 2026-11-18
Manual verification by: n/a: no UI a person could look at until a shelter has a credentials row

Result: pass
