# Feature test plan

## Header

| | |
|---|---|
| Feature | The schema-before-code check moves from the Pi (which cannot ask) to the deploy machine, where it refuses |
| Backlog item | `docs/backlog.md` → `#g4rd1` (ticked here) |
| Branch / worktree | `claude/guard-release-asserts` @ `C:\Development\Animal_Shelter_guard-release-asserts` |
| Dev server | n/a: release tooling only, no page; `.port` is 3006 |
| PR | pending: the PR does not exist at this commit |
| Tested by / date | Claude / 2026-11-08 |
| Carries a migration? | no |
| Tested at SHA | ed13d8d4 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: a deploy that would land code ahead of its schema is stopped on the deploy machine by `scripts/assert-schema.mjs`, and the Pi's guard no longer pretends to check the schema (option b)
- [x] Files/areas touched: `scripts/assert-schema.mjs` (new), `scripts/lib/release-guards.mjs`, `scripts/pi/guard-release.mjs`, `scripts/pi/deploy-pi.sh` (comment only), `scripts/check-release-guards.mjs`, `docs/release-procedure.md`, `docs/decisions/2026-11-08-guard-release-asserts.md`, `docs/backlog.md`. No `src/`, no `worker/`, no migration
- [x] Cards affected: none. No card, page, role or the signed-out public is touched; Admin unaffected
- [x] Out of scope: `deploy.mjs` (unchanged, still warns on a Supabase blip, by design); any mechanical proof that the assertion was run before the `ssh` (considered, left out, see the decision file); any real deploy

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with the four-gate line, every code `0`:

```
=== gates: typecheck exited 0 after 126s
=== gates: lint exited 0 after 312s
=== gates: test exited 0 after 48s
=== gates: build exited 0 after 338s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: `assertSchema` against the real repo's git with every migration applied returns ok (run by hand, output in the PR body); `check-release-guards.mjs` all `ok`
- [ ] Data persists — reload the page and the change is still there — n/a: no UI and no stored data
- [ ] Create / edit / delete all exercised — n/a: no data is created, edited or deleted
- [ ] Empty state renders sensibly — n/a: no UI surface
- [x] Invalid input is rejected with a readable message: pending migration refused naming `0334_waiting_event_titles.sql <- read by src/lib/photos/approval.ts, src/app/photos/approve/EventPhotoQueue.tsx`; "could not ask" refused with the cause and the by-hand command; `--force` without a reason still refused
- [x] Boundary cases checked: header `none`, header absent, header listing several files, schema ahead of code (passes), test environment (not asked)

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a: no page | n/a | n/a |
| signed out | n/a: no page | n/a | n/a |

- [ ] Every login above tested — n/a: command-line tooling, no login involved
- [ ] A login that should not have access is blocked server-side — n/a: no page or action

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: tooling, not a shelter-facing feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `scripts/pi/guard-release.mjs --env test` (still prints `test is not guarded`, exit 0), `--env production` (runs with no token and no env file, refuses on the 10 unreleased notes as it should), `--force` with no reason (exit 2)
- [x] Shared files touched (`release-guards.mjs`) checked from a second, unrelated consumer: `scripts/deploy.mjs` still imports `releaseProblems` and `schemaVerdict`, both unchanged and exercised by `check-release-guards.mjs`
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item `#g4rd1` ticked in `docs/backlog.md` on this branch
- [x] Decision added: `docs/decisions/2026-11-08-guard-release-asserts.md`
- [x] `README.md` still accurate (it does not describe the Pi guard)
- [ ] **Release notes.** n/a: release tooling only, no user-visible surface
- [x] Commit messages say why, not just what
- [x] Claims were measured, not reasoned: the refusal output was produced by running the code against the repo's real git history, not described

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager (tooling only; nothing here deploys to a Worker)
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no user-facing change
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary/banding assertions cover both sides — n/a: no threshold or band
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: gates block above is pasted from the run
- [ ] Public pages re-checked — n/a: no public page change

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none added (the point is that the Pi gets none)

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? — n/a: no migration
- [ ] `--dry-run` against production — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: revert the PR; no deploy, no schema. The Pi's `guard-release.mjs` keeps working on its own at any commit

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Nothing mechanical forces `assert-schema.mjs` to be run before the `ssh` that starts the Pi build; it is a named procedure step | accepted: recorded in the decision file; an attestation flag was considered and rejected as decoration |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Run `node scripts/assert-schema.mjs --env production` once with the real token on the deploy machine and read `holds every migration` (a worktree cannot reach production) | deploy machine, next release |

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: item 1, one real run with the production token

Manual verification by: pending: item 1 in the manual list

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the file is committed on the branch and the PR body links to it
- [ ] Handed to the production release manager — n/a: nothing ships on this PR alone

Result: pass with accepted defects

Release manager acknowledgement: pending: release manager
