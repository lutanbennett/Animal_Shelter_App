# Feature test plan

## Header

| | |
|---|---|
| Feature | Register the label drafter's three Worker values (LABEL_DRAFT_EMAIL, LABEL_DRAFT_PASSWORD, SUPABASE_ANON_KEY) as Worker secrets |
| Backlog item | `docs/backlog.md` → #aaqtl |
| Branch / worktree | `claude/label-draft-runtime-config` @ `C:\Development\Animal_Shelter_label-draft-runtime-config` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` |
| PR | pending: number assigned when opened |
| Tested by / date | Claude, 2026-11-21 |
| Carries a migration? | no |
| Tested at SHA | 720044fed |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: three entries added to `scripts/lib/runtime-config.mjs` (worker, secret, optional) and `.env.example`
- [x] Files/areas touched listed: `scripts/lib/runtime-config.mjs`, `.env.example`, `docs/decisions/2026-11-21-label-draft-runtime-config.md`
- [ ] Cards affected identified — n/a: no card's behaviour changes; the machine login's existing Propose a Thai label card is untouched, and Admin and the public are unaffected
- [x] Out of scope: the `.env.deploy.production` values, the production deploy, the release note, the machine login itself

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends with the four-gate line, all `0`:

```
=== gates: typecheck exited 0 after 124s
=== gates: lint exited 0 after 311s
=== gates: test exited 0 after 104s
=== gates: build exited 0 after 381s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no schema change
- [ ] Constraints and defaults exercised — n/a: no schema change
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path: `node scripts/check-runtime-config.mjs` printed "37 names, .env.example and consumers agree", and `WORKER_OPTIONAL_SECRETS` now lists the three names where it did not before. The registry's exported list was used, not `deploy.mjs --plan`
- [ ] Data persists — n/a: no data is stored
- [ ] Create / edit / delete — n/a: no UI or data
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input — n/a: no input
- [ ] Boundary cases — n/a: a name list; optional means an unset value is skipped, as for the other optional secrets

- [ ] Every login tested — n/a: no page or action changes
- [ ] A login without access is blocked — n/a: no page or action changes

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The nearest thing checked: `check-runtime-config.mjs` (consumers and `.env.example` agree) and the gates' test run
- [ ] Shared file loaded from a second page — n/a: the registry is read by deploy and Pi scripts only, covered by the gates
- [x] Nothing merged from `main` during `sync` was broken (nothing merged)

## 7. Documentation

- [ ] Backlog item ticked — n/a: #aaqtl closes only when Lutan deploys with the values; ticking now would say it works
- [x] Decision added: `docs/decisions/2026-11-21-label-draft-runtime-config.md`
- [x] `README.md` still accurate (no mention to change)
- [ ] **Release notes.** n/a: the note goes in the PR that closes the deploy step, by the truth rule; nothing works until the values are deployed
- [x] Commit messages say why
- [x] Claims were measured: the "not already under another name" finding comes from reading `worker/*.mjs`, where only `SUPABASE_URL` and the service key are bound, and from the registry, where the anon key exists only as the build-inlined `NEXT_PUBLIC_` name

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary or banding change — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: pasted gate output is unedited, nothing else is tabulated
- [ ] Public pages re-checked — n/a: no public page changes

### Deploy safety

- [ ] Production project ref read — deferred: Lutan's production deploy
- [ ] `strip-baked-env` line seen — deferred: Lutan's production deploy
- [ ] Any new secret exists in the production Cloudflare environment — deferred: Lutan; the three go in `.env.deploy.production` then `--secrets`

### Migration ordering

- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback: revert the commit; no Worker holds the values until a deploy pushes them, and nothing reads a migration. A later deploy's pushed secrets would stay in Cloudflare until deleted

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| | | none | n/a |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-21

### Manual verification

- [x] The manual list above is empty, so nothing is signed for here

Manual verification by: n/a: no screen or action for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan is committed on the branch
- [ ] Handed to the production release manager — pending: after merge

Result: pass

Release manager acknowledgement: pending: at release
