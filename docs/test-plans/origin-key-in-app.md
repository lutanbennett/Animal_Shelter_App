# Feature test plan — origin-key-in-app

## Header

| | |
|---|---|
| Feature | The Pi's app refuses requests without the right `x-origin-key`, beside the WAF rule (Pi only) |
| Backlog item | `docs/backlog.md` → **The Pi trusts the WAF rule alone** (ticked) |
| Branch / worktree | `claude/origin-key-in-app` @ `C:\Development\Animal_Shelter_origin-key-in-app` |
| Dev server | not started — `next dev` has neither variable, so the check is inert there |
| PR | TBD |
| Tested by / date | Claude / 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `src/proxy.ts` answers 403 on the Pi to any request whose `x-origin-key` is not the Pi's `ORIGIN_KEY`; `write-env.mjs` now writes the key
- [x] Files/areas touched listed — `src/proxy.ts`, `src/lib/origin-key.ts`, `scripts/lib/optional-secrets.mjs`, `scripts/pi/setup.sh`, `setup-test.sh`, `scripts/check-worker-origin.mjs`, `docs/pi-hosting.md`, backlog, decision
- [x] Roles affected identified — none: nothing a signed-in or signed-out user sees changes while the Worker fronts the Pi
- [x] Anything explicitly **out of scope** written down — the WAF rule and dashboard untouched; `run.ts` redaction list untouched; no restructuring of `optional-secrets.mjs`. Departure from the brief: check also requires `PHOTO_CACHE_DIR`, because the Worker has `ORIGIN_KEY` in `process.env` (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged, up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. First run caught a type error in `proxy.ts` (fixed); closing lines of the second run:

```
=== gates: build exited 0 after 52s

gates: typecheck=0 lint=0 build=0
```
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints exercised against real rows — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `node scripts/check-worker-origin.mjs` part 3: right key let through, wrong/absent/empty refused on the Pi, Worker and `next dev` shapes let through, `proxy.ts` calls it before `updateSession`
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no feature data
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected readably — n/a: a refused request gets a plain 403 by design
- [ ] Boundary cases — n/a: wrong, empty and absent header all covered in the script above

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a |
| management | n/a | unchanged | n/a |
| staff | n/a | unchanged | n/a |
| doctor | n/a | unchanged | n/a |
| volunteer | n/a | unchanged | n/a |
| signed out | n/a | unchanged | n/a |

- [ ] Every role above tested — n/a: not role-gated; the gate is on the request header, below the session layer
- [ ] A role that should not have access is blocked server-side — n/a: see above

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: nothing a shelter user sees
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: not run in a browser; `next dev` has no ORIGIN_KEY so the check is inert

## 6. Regression

- [ ] Pages nearest the change — n/a: `proxy.ts` is the only shared file; with neither variable set the new branch is skipped, covered by the `next dev` case in the script
- [ ] Shared file touched checked from a second page — n/a: no page reads `proxy.ts`'s new branch off the Pi; build compiles it
- [x] Nothing merged from `main` during `sync` was broken — nothing was merged (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision added — `docs/decisions/2026-10-12-pi-checks-origin-key.md`
- [x] `README.md` still accurate — it does not mention the origin key
- [ ] **Release notes.** n/a: nothing a shelter user would notice; also the Pi's `.env.deploy.production` needs `ORIGIN_KEY` added by hand before the check is live
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** The claim that the Worker has `ORIGIN_KEY` in `process.env` is read from `health.ts:252`'s fallback and the compat flags, not run on workerd; the design is safe either way because the Worker has no `PHOTO_CACHE_DIR`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager (after adding `ORIGIN_KEY` to the test Pi copy, `curl -sI https://test-pi.lannacare.org/` without the header → 403; via `test.lannacare.org` still loads)
- [ ] Timezone-sensitive behaviour — n/a: no dates
- [ ] Boundary or banding change — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: none pasted beyond the gates
- [ ] Public pages re-checked — deferred: release manager

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret exists in the production environment — deferred: Lutan (Pi's own `.env.deploy.production` needs `ORIGIN_KEY`, same value as the Worker's)

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager; `./scripts/pi/deploy-pi.sh --ref <sha>` reverts the check; no migrations to revert

## Defects found

None.

## Left for manual verification

| What | Who |
|---|---|
| After the Pi has the key: direct request to `pi.lannacare.org` without the header is 403 (from the Pi, not the WAF), and the site still loads through `lannacare.org` | Lutan / release manager |

## Sign-off

Automated checks by: Claude, 2026-10-12 (check script, gates)
Manual verification by: n/a: nothing to look at in a browser; the production check above is left to Lutan

Result: PASS
