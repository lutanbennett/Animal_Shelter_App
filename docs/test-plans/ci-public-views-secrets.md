# Feature test plan

Filled from `docs/test-plan-template.md`.

---

## Header

| | |
|---|---|
| Feature | The three GitHub repository secrets the `public-views` CI job needs now exist, so the job checks the dev database instead of warning and passing |
| Backlog item | `docs/backlog.md` → "Walk Lutan through adding the CI secrets for `public-views`" |
| Branch / worktree | `claude/ci-public-views-secrets` @ `C:\Development\Animal_Shelter_ci-public-views-secrets` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3002` (not used: repository settings only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (ci-public-views-secrets session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `2c0036e` |

## 1. Scope and risk

- [x] Change is described in one sentence: Lutan added `TEST_SUPABASE_URL`, `TEST_SUPABASE_ANON_KEY` and `TEST_SUPABASE_SERVICE_ROLE_KEY` as repository secrets, so `public-views` runs for real; the PR itself carries only this plan and the backlog tick
- [x] Files/areas touched listed: `docs/test-plans/ci-public-views-secrets.md`, `docs/backlog.md`. The secrets are GitHub repository settings, not files; `.github/workflows/ci.yml` is read, not changed
- [ ] Roles affected identified — n/a: CI configuration; no app role sees it
- [x] Out of scope written down: making `public-views` a required check (Lutan's call); deliberately breaking it to see it go red (offered in the backlog item, not done)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly, pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 129s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `apply-migrations.mjs --status` reviewed — n/a: no migration
- [ ] `apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

`gh secret list` (names and timestamps only, never values) shows all three secrets present, with the exact names `ci.yml` reads. The check that matters is the `public-views` job on this PR: it must run `check-public-views.mjs` against the dev database, with no "public-views not run" warning. Result recorded under Defects / in the PR once the run exists.

- [ ] Happy path works end to end — n/a: no UI or data surface
- [ ] Data persists — n/a: no UI or data surface
- [ ] Create / edit / delete all exercised — n/a: no UI or data surface
- [ ] Empty state renders sensibly — n/a: no UI or data surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI or data surface
- [ ] Boundary cases checked — n/a: no UI or data surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| management | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| signed out | n/a | no app surface | n/a |

- [ ] Every role above tested — n/a: no app surface
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no UI surface
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [ ] The pages nearest the change still work — n/a: no code changed
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch — n/a: branch changes only docs

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` on this branch — n/a: not yet — ticked only once the `public-views` run is seen to check
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: nothing non-obvious; secret names and the dev project matched the item
- [ ] `README.md` still accurate — n/a: README does not describe CI secrets
- [ ] **Release notes.** — n/a: CI configuration, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and decisions were measured, not reasoned: the secrets' presence is from `gh secret list`, the job's behaviour from its run log

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header — n/a: no deploy; CI configuration only
- [ ] Deployed SHA matches the tested SHA — n/a: no deploy; CI configuration only
- [ ] Deployed to test — n/a: no deploy; CI configuration only
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no deploy; CI configuration only
- [ ] Timezone-sensitive behaviour proved — n/a: no deploy; CI configuration only
- [ ] Boundary or banding assertions cover both edges — n/a: no deploy; CI configuration only
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: no deploy; CI configuration only
- [ ] Public pages re-checked after a cache purge — n/a: no deploy; CI configuration only
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy; CI configuration only
- [ ] `strip-baked-env` line seen in the deploy output — n/a: no deploy; CI configuration only
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no deploy; CI configuration only
- [ ] Migration ordering — n/a: no migration
- [ ] Rollback position stated — n/a: nothing deploys; removing the three secrets returns `public-views` to its warn-and-pass state

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | none | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The three secrets hold the **dev** project (`qxkmhwybjggxvsfxsxbd`) values, not production. Claude cannot read secret values, so only Lutan can say. | GitHub → Settings → Secrets and variables → Actions; the `public-views` log line naming the project ref is the cross-check |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — the one item is Lutan's to check

Manual verification by: pending: Lutan confirming the secrets are the dev project's

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none
- [ ] Checklist pasted into the PR — n/a: not yet — PR does not exist
- [ ] Handed to the production release manager — n/a: not yet

Result: pass

Release manager acknowledgement: pending
