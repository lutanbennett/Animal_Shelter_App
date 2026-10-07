# Feature test plan — dependabot-264

## Header

| | |
|---|---|
| Feature | Carry Dependabot #264 (GitHub Actions bump) with a test plan |
| Backlog item | `docs/backlog.md` → Dependabot PR #264 is stale enough to fail CI for reasons that are not its own |
| Branch / worktree | `claude/dependabot-264` @ `C:\Development\Animal_Shelter_dependabot-264` |
| Dev server | n/a — no app code changed |
| PR | #444; supersedes #264 |
| Tested by / date | Claude, 2026-10-07 |
| Carries a migration? | no |
| Tested at SHA | c4640288 (the bump, cherry-picked from #264's 39b98b9f) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — `actions/checkout` v4 → v7.0.1 and `actions/setup-node` v4 → v7.0.0 in `ci.yml` and `advisories.yml`, still pinned by SHA; #264 closed as superseded with the reason recorded on the item
- [x] Files/areas touched listed — `.github/workflows/ci.yml`, `.github/workflows/advisories.yml` (16 `uses:` lines, all of them); docs only otherwise
- [ ] Roles affected identified: admin / staff / vet / volunteer / resident / signed-out public — n/a: CI configuration only, nothing a signed-in or signed-out user reaches
- [x] Anything explicitly **out of scope** written down — exempting bot PRs in `check-test-plan.mjs` is proposed on the PR and in `docs/decisions/2026-10-07-dependabot-prs-carried-on-a-branch.md`, not implemented (CLAUDE.md: do not reopen the exemption without asking)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 220s

gates: typecheck=0 lint=0 build=0
```

- [x] CI green on the PR (runs the same three) — #444, run 37630184105: all 7 jobs pass on checkout v7.0.1 / setup-node v7.0.0 (`check`, `audit`, `migration-numbers`, `new-policy-role-names`, `public-views`, `script-integrity`, `test-plan`)

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — both new SHAs resolve to the named tags upstream (`gh api repos/actions/checkout/git/ref/tags/v7.0.1` → `3d3c42e5…`, `repos/actions/setup-node/git/ref/tags/v7.0.0` → `82076278…`); #264's own CI run on these versions (run 37613585989) passed `check`, `audit`, `migration-numbers`, `new-policy-role-names`, `public-views`, `script-integrity`; this PR's run repeats it
- [ ] Data persists — reload the page and the change is still there — n/a: no data, no page
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: no data, no page
- [ ] Empty state renders sensibly (no rows yet) — n/a: no page
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input
- [x] Boundary cases checked — release notes for every major in between read (checkout v5/v6/v7, setup-node v5/v6/v7): Node 24 needs runner ≥ 2.327.1 (GitHub-hosted, fine); setup-node v5 auto-caching applies only with a `packageManager` field, which `package.json` has none of; checkout v7's fork restriction is for `pull_request_target`/`workflow_run`, which we do not use

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | CI only | n/a |
| management | n/a | CI only | n/a |
| staff | n/a | CI only | n/a |
| vet | n/a | CI only | n/a |
| volunteer | n/a | CI only | n/a |
| signed out | n/a | CI only | n/a |

- [ ] Every role above tested — n/a: no route, page or RPC changed
- [ ] A role that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no route, page or RPC changed

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: nothing a user sees
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work — the "pages" are the CI jobs; every job in `ci.yml` runs on this PR with the new versions, because a `pull_request` run uses the PR's workflow files
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — sync was a no-op and the gates pass

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-07-dependabot-prs-carried-on-a-branch.md`
- [x] `README.md` still accurate — it does not mention action versions or Dependabot
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: no user-visible change — two GitHub Action versions in CI
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — the "CI runs on the merge commit" claim is from #264's actual run passing `public-views` despite being 47 commits behind; the SHA claims are from `gh api` output

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — n/a: CI configuration is not deployed; nothing in the Worker or Pi build changes
- [ ] Deployed SHA matches the tested SHA — n/a: CI configuration is not deployed

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: CI configuration is not deployed
- [ ] Smoke-tested on `test.lannacare.org` — n/a: CI configuration is not deployed
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: no date logic
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary** — n/a: no threshold or banding logic
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: the only pasted output is the gates' closing lines, copied as printed
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: CI configuration is not deployed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production** — n/a: CI configuration is not deployed
- [ ] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output — n/a: CI configuration is not deployed
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover** — revert this PR's commit; CI then goes back to v4. Nothing deployed, nothing in the database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

Empty: nothing here has a screen for a person to look at.

| # | What to check | Where |
|---|---|---|
| — | — | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-07

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: CI configuration only — no page, data or wording for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing to deploy; CI configuration takes effect on merge

Result: pass

Release manager acknowledgement: n/a: nothing deployed
