# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Daily scheduled `npm audit` that fails on purpose, so an advisory reaches a person without a PR |
| Backlog item | `docs/backlog.md` → Next 16.3.5 carries a Critical RCE advisory (reporting-gap half; item left unticked, see §7) |
| Branch / worktree | `claude/audit-job-on-schedule` @ `C:\Development\Animal_Shelter_audit-job-on-schedule` |
| Dev server | n/a: not started, no app code changed |
| PR | linked from the PR itself |
| Tested by / date | Claude, 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | see PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item: a new `advisories.yml` runs the audit daily and is allowed to fail (GitHub emails), while the PR `audit` job stays `continue-on-error`
- [x] Files touched: `.github/workflows/advisories.yml` (new), `.github/workflows/ci.yml` (step now `npm run audit:prod`, comment), `package.json` (`audit:prod` script), backlog, one decision, this plan. Nothing in `src/`, `worker/`, `supabase/`
- [ ] Roles affected identified — n/a: CI configuration, no role sees it
- [x] Out of scope: `push: main` trigger (decided against, see the decision file); opening an issue per finding; the Pi/cloudflared sign-in check still open on the backlog item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, pushed
- [x] `node scripts/gates.mjs` closing line, as printed: `gates: typecheck=0 lint=0 build=0`
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

- [x] Happy path: `npm run audit:prod` runs the same command as before and reports `found 0 vulnerabilities`, exit 0 locally
- [ ] Data persists — n/a: no data
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input rejected — n/a: no input
- [ ] Boundary cases — n/a: the `--audit-level=high` threshold is unchanged and now defined once in `package.json`, used by both paths

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no UI surface | n/a |
| management | n/a | no UI surface | n/a |
| staff | n/a | no UI surface | n/a |
| vet | n/a | no UI surface | n/a |
| volunteer | n/a | no UI surface | n/a |
| signed out | n/a | no UI surface | n/a |

- [ ] Every role above tested — n/a: no UI surface
- [ ] A role that should not have access is blocked server-side — n/a: no UI surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no shelter-facing change
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The nearest thing still works: `ci.yml`'s `audit` job now calls `npm run audit:prod`; verified the script resolves and exits 0 locally. The PR's own `audit` run is the live check
- [ ] Shared file touched checked from a second page — n/a: `ci.yml` and `package.json` are not loaded by any page
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates above ran after the sync

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; the bump landed (#268) and the reporting gap is closed, but sign-in on the Pi behind cloudflared on 16.3.8 was never confirmed (#268 was not deployed). A status note was added to the item instead
- [x] Decision added: `docs/decisions/2026-10-02-scheduled-audit-fails-on-purpose.md`
- [x] `README.md` still accurate (does not describe CI jobs at this level)
- [ ] **Release notes.** n/a: CI configuration, no shelter user sees it
- [x] Commit messages say why
- [x] Claims were measured, not reasoned: the claim that a scheduled failure emails someone is GitHub's documented behaviour and is NOT proved here; it is listed under Left for manual verification

## 8. Pre-production gate

- [ ] Tested SHA recorded — n/a: not a deployed artefact; nothing ships to a Worker or the Pi
- [ ] Deployed SHA matches — n/a: not deployed
- [ ] Deployed to test — n/a: not deployed
- [ ] Smoke-tested on test — n/a: not deployed
- [ ] Timezone-sensitive behaviour proved — n/a: cron is UTC and nothing derives a date
- [ ] Boundary or banding assertions — n/a: no threshold changed
- [ ] Evidence pasted is unedited tool output — n/a: only the gates line, pasted as printed
- [ ] Public pages re-checked — n/a: not deployed
- [ ] `deploy:` line read — n/a: no deploy
- [ ] `strip-baked-env` seen — n/a: no deploy
- [ ] New secret/env var exists in production — n/a: none added
- [ ] Migration and reading code in one PR — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: revert the PR; nothing deployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After merge, run **Advisories → Run workflow** once and confirm it goes green. A real scheduled failure email was NOT forced: it needs a production advisory, and `workflow_dispatch` is only offered once the file is on `main`. Delivery rests on GitHub's documented failure email, not on anything proved here | GitHub → Actions → Advisories |
| 2 | Confirm the repo's Actions notification settings email Lutan on failed workflows | GitHub → Settings → Notifications |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: items outstanding, see pending below

Manual verification by: pending: dispatch the Advisories workflow after merge and confirm failure emails are enabled

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open
- [ ] Checklist pasted into the PR — n/a: not yet opened
- [ ] Handed to the production release manager — n/a: nothing deploys

Result: pass
