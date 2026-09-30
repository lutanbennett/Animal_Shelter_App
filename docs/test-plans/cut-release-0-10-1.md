# Feature test plan — cut-release-0-10-1

## Header

| | |
|---|---|
| Feature | Cut release `0.10.1`, **not major**: move the seven `unreleased` notes into a new register entry and bump `package.json` to match |
| Backlog item | none — the release-cut step described in `src/lib/releases.ts`'s own header |
| Branch / worktree | `claude/cut-release-0-10-1` @ `C:\Development\Animal_Shelter_cut-release-0-10-1` |
| Dev server | not started — this PR changes register data, not the app |
| PR | opened from this branch |
| Tested by / date | Claude / 2026-09-30 |
| Carries a migration? | no |
| Tested at SHA | the tip of `main` at branch creation + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence: a `0.10.1` entry holding the seven notes written by the Website-tabs, Residents-list and microchip PRs, and `package.json`'s version field
- [x] Files touched: `src/lib/releases.ts` (data only) and `package.json` (version field). No `src/app/`, no `worker/`, no migrations
- [x] Roles affected: what `/releases` lists, each filtered to the reader's own role. `major: false`, so **no admin is mailed**
- [x] Out of scope: the release record after the deploy, and the Pi switch itself. This cut is needed because `deploy.mjs` refuses to ship production while `unreleased` has lines, and the Pi PR (`ORIGIN_HOST`) is waiting on a production deploy. The release ships with it

**Decision confirmed in chat by Lutan, 2026-09-30:** cut a release now to unblock the Pi deploy ("lets do 1"). The version and `major` were chosen by Claude and stated in chat: `0.10.1`, not major, because none of the seven notes asks anyone to act, and a major release mails every admin. Lutan can flip `major` before merge.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the branch was created from `origin/main` minutes earlier; nothing to merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 126s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit
- [x] Newest release version matches `package.json` — both `0.10.1`
- [x] `unreleased` is empty — it held exactly 7 entries and all 7 moved. Loaded the way `deploy.mjs` loads it: `unreleased` length 0, `releases[0]` is `0.10.1` / `2026-09-30` / `major: false` / 7 notes, and `releases[1]` is still `0.10.0`
- [x] **`majorReleasesSince("0.10.0")` returns no releases** — so deploying this mails nobody, which is the intended outcome of `major: false`. `majorReleasesSince("0.9.1")` still returns `0.10.0`, so a deploy from further back would still mail for that one
- [x] **The date was read from the Thailand clock**, not UTC: `TZ=Asia/Bangkok date +%Y-%m-%d` gave `2026-09-30`, the date on the entry, and this project's dates follow Thailand's clock

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

- [x] Happy path: `/releases` reads the register, and the register parses (above). The page itself was not loaded in a browser
- [ ] Data persists — n/a: static data compiled into the build
- [ ] Create / edit / delete all exercised — n/a: static data
- [ ] Empty state renders sensibly — n/a: `unreleased` is now empty, which is its normal state after a cut
- [ ] Invalid input is rejected — n/a: no input
- [ ] Boundary cases — n/a: the only version boundary (double-digit minor) was verified in the `0.10.0` cut; `0.10.1` compares numerically the same way

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface changed | n/a |
| management | n/a | no app surface changed | n/a |
| staff | n/a | no app surface changed | n/a |
| vet | n/a | no app surface changed | n/a |
| volunteer | n/a | no app surface changed | n/a |
| signed out | n/a | no app surface changed | n/a |

- [ ] Every role above tested — n/a: register data only; role tags on notes are moved unchanged
- [ ] A role that should not have access is blocked server-side — n/a: no access rule touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [ ] The pages nearest the change still work — n/a: the check is the register parse and the gates above
- [ ] Shared file checked from a second page — n/a: `releases.ts` is data; the build compiles every reader of it
- [x] Nothing merged from `main` during `sync` was broken by this branch: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: `major: false` and the version are recorded in this plan
- [ ] `README.md` still accurate — n/a: it does not mention the version
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: this PR *is* the release notes; it adds no note of its own, it moves seven that were written by their own PRs
- [x] Commit messages say why, not just what
- [x] Claims were measured: the parse results are from loading the file under Node's type stripping

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: release manager, at `npm run deploy:prod`
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, at `npm run deploy:prod`

### On the deployed build

- [ ] Deployed to test — n/a: this release goes to production for the Pi cut-over
- [ ] Smoke-tested on `test.lannacare.org` — n/a: register data only
- [ ] Timezone-sensitive behaviour — n/a: no date logic; the release date was read from Thailand's clock
- [ ] Boundary assertions — n/a: no threshold
- [ ] Evidence pasted is unedited tool output — n/a: only the gates lines, as printed
- [ ] Public pages re-checked after a cache purge — deferred: release manager, after deploy

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager, at `npm run deploy:prod`
- [ ] `strip-baked-env` seen — deferred: release manager, at deploy
- [ ] New secret/env var in production — n/a: none added by this PR (the `ORIGIN_KEY` secret ships with the same deploy, recorded in `pi-origin-host.md`)

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: `npx wrangler rollback --env production` reverts the Worker in seconds. Nothing here touches data

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: the register parses, and the gates pass.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-09-30

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — the PR does not exist at this commit

Result: pass

Release manager acknowledgement: pending
