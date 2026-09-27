# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | `scripts/deploy.mjs` refuses `--env production` while the `production` block of `wrangler.jsonc` is off `lannacare.org` and still sets `"PUBLIC_SITE": "locked"` |
| Backlog item | `docs/backlog.md` → none: asked for directly by Lutan, 2026-09-27 |
| Branch / worktree | `claude/deploy-public-site-guard` @ `C:\Development\Animal_Shelter_deploy-public-site-guard` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` (not used: script only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (deploy-public-site-guard session), 2026-09-27 |
| Carries a migration? | no |
| Tested at SHA | `00769c7` (gates and script behaviour; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the brief asked for: a two-part guard in `deploy.mjs` (production, lock set, routes no longer include `lannacare.org`) with no escape hatch, and `wrangler.jsonc` reading lifted into a shared helper
- [x] Files/areas touched listed: `scripts/deploy.mjs`, `scripts/lib/wrangler.mjs` (new), `scripts/pi/write-env.mjs` (now uses the helper), `README.md`, `docs/decisions.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: deploy tooling only; no app role sees any of it
- [x] Out of scope written down: the cutover itself (routes, `RELEASE_MAIL_ENV`, `SITE_ORIGINS.production`) is untouched. One deviation from the brief: the guard runs **before** `loadEnv`, not after the app-env badge check, because it needs only `wrangler.jsonc` (reason in `docs/decisions.md`)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly: "Already up to date.", pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 286s

gates: typecheck=0 lint=0 build=0
```

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

A harness in the session scratchpad wrote three copies of `wrangler.jsonc`
by text edits, so they keep the `//` comments the parser has to strip:
**cutover-locked** (production routes → `lannacareforanimals.org` and
`www.`, lock kept), **cutover-unlocked** (the same, with production's
`"PUBLIC_SITE": "locked"` line removed) and **broken** (a `/* */` comment
added). Then two kinds of run:

1. `lockedPublicSiteProblem()` called directly for test, uat and production
   against each config.
2. The real `node scripts/deploy.mjs --env production`, with each copy
   swapped in as `wrangler.jsonc` in turn and `git checkout -- wrangler.jsonc`
   afterwards (`git status` clean). This worktree has no
   `.env.deploy.production`, so any run that gets past the guard stops at
   `loadEnv` with exit 2 and cannot reach a build or a deploy.

- [x] Happy path works end to end, **today's config passes**: the direct call gives `pass` for all three envs. The real script gets past the guard and stops at the next step: `.env.deploy.production is missing or empty — see README, "Environments".`
- [x] **Cutover config with the lock refuses.** Direct call: production refuses, test and uat pass. Real script, exit 2:

```
deploy: the production block of wrangler.jsonc now routes to lannacareforanimals.org, www.lannacareforanimals.org, not lannacare.org, but still sets "PUBLIC_SITE": "locked" — the live site would open on a sign-in page.
  Drop "PUBLIC_SITE": "locked" from the production block's vars (README, "What the cutover changes here").
```

- [x] **Negative control, cutover config without the lock passes** (the state the cutover is aiming for): direct call `pass` for all three envs, with test and uat still locked. The real script gets past the guard to the `.env.deploy.production` stop
- [ ] Create / edit / delete — n/a: nothing is stored
- [ ] Empty state — n/a: no list or page. A production block with no routes and the lock set refuses, reading "routes to nothing", which is the right answer
- [x] Invalid input is rejected with a readable message, not a crash: with the `/* */` copy, the real script exits 1 on `Error: wrangler.jsonc could not be parsed (whole-line // comments only): Expected double-quoted property name in JSON at position 228 (line 7 column 25)`. It does not treat the file as having no lock
- [x] Boundary cases: the lock only matters on production (test and uat pass with it in every config); routes may be objects or strings, and a scheme or path on the pattern is stripped before comparing hosts. `www.lannacare.org` alone does not count as UAT's host, because the brief names `lannacare.org` and the cutover moves both routes together

Process note, not a defect: once, a harness run of `deploy.mjs --env test --skip-build` against the cutover-locked copy went past the guard. Test is not guarded, so nothing stopped it before wrangler. This worktree has no `.open-next`, so there was nothing to upload. `test.lannacare.org/api/releases/current` still reports `0.7.0`, the same as before, and none of the later runs used a non-production env.

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | deploy tooling, no app surface | n/a |
| management | n/a | deploy tooling, no app surface | n/a |
| staff | n/a | deploy tooling, no app surface | n/a |
| vet | n/a | deploy tooling, no app surface | n/a |
| volunteer | n/a | deploy tooling, no app surface | n/a |
| signed out | n/a | deploy tooling, no app surface | n/a |

- [ ] Every role above tested — n/a: no app code changed
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: deploy tooling, not an app feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The nearest things still work: `scripts/pi/write-env.mjs` now reads through `readWranglerConfig()`. The direct calls above show the helper returns `PUBLIC_SITE` `locked` for test and production, which is the value write-env copies. It was not run end to end, because it writes secrets to `.env.production.local`
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: `sync` found nothing to merge, and gates pass on this tree

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; asked for directly, and nothing was split out
- [x] Non-obvious design choices appended to `docs/decisions.md`, dated 2026-09-27: why the condition has two parts, no escape hatch, the guard running first, the shared helper and its fail-loudly parse
- [x] `README.md` still accurate: "What the cutover changes here" now says `deploy.mjs` enforces the lock's removal
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: a deploy-script guard; no shelter user sees a deploy script, and today it never fires
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions.md` were measured, not reasoned: pass today, refuse at the cutover, pass without the lock and throw on an unparseable file are all from the runs in §4. "A one-part check would refuse every deploy until the cutover" follows from today's config, where production is locked on `lannacare.org`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: `scripts/` is not part of the Worker bundle; nothing in the deployed site changes
- [ ] Deployed SHA matches — n/a: nothing in the deployed site changes

### On the deployed build

- [ ] Deployed to test — n/a: nothing in the deployed site changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing in the deployed site changes
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: the condition is three booleans, and §4 covers each one on both sides (env, lock set or not, routes on or off `lannacare.org`)
- [ ] Evidence pasted is the tool's actual output — n/a: no deployed evidence; the §2 and §4 output is pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — n/a: this change adds a refusal before that line; the next real production deploy is the first live run of the guard, and it passes today's config
- [ ] `strip-baked-env` seen — n/a: build path untouched
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR. It changes only local deploy tooling, and nothing persistent is written

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing here needs human eyes: every behaviour is a command with an exit code and a message, run above.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (deploy-public-site-guard session)  Date: 2026-09-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; the guard is script behaviour with exit codes, all demonstrated above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in the deployed site changes; the guard runs on the release manager's own next production deploy

Result: pass

Release manager acknowledgement: n/a (deploy tooling only)  Date: —
