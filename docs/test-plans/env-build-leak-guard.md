# Feature test plan

Filled from `docs/test-plan-template.md`.

---

## Header

| | |
|---|---|
| Feature | `deploy.mjs` pins `NEXT_PUBLIC_SITE_URL` for the target, refuses a stray env file naming another environment, and `write-env.mjs` refuses off Linux |
| Backlog item | `docs/backlog.md` → "A `.env.*.local` for the wrong environment silently bakes that environment's host into the build" |
| Branch / worktree | `claude/env-build-leak-guard` @ `C:\Development\Animal_Shelter_env-build-leak-guard` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3012` (not used: scripts only) |
| PR | linked from the PR itself |
| Tested by / date | Claude (env-build-leak-guard session), 2026-10-01 |
| Carries a migration? | no |
| Tested at SHA | `bf86087` (code and gates; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the brief: the deploy sets the site URL itself, refuses a wrong-environment env file (test included), and the Pi env writer refuses to run off the Pi
- [x] Files/areas touched listed: `scripts/deploy.mjs`, `scripts/lib/env-leak.mjs` (new), `scripts/check-env-leak.mjs` (new), `scripts/pi/write-env.mjs`, `README.md`, `docs/decisions/2026-10-01-deploy-pins-site-url.md`, `docs/backlog.md`, this plan. Nothing under `src/`, `worker/` or `supabase/`
- [ ] Roles affected identified — n/a: deploy tooling only; no app role sees any of it
- [x] Out of scope written down: the Pi's own build is unchanged (it still reads its generated file); `.env.development.local` and `.env.test.local` are not checked because a production build never reads them

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (brought in the schema-placement-lifecycle work), pushed
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing lines as printed:

```
=== gates: build exited 0 after 55s

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

Cases, all run from this worktree:

1. `node scripts/check-env-leak.mjs` — 10 cases against the pure function with a stubbed reader.
2. A fake `.env.production.local` (production header, `NEXT_PUBLIC_SITE_URL=https://lannacare.org`) dropped in the checkout, then the real `node scripts/deploy.mjs --env test`.
3. `node scripts/pi/write-env.mjs --env test` on this Windows machine.
4. With that same fake file still present, a real `next build` (via `npm run opennext:build`) with `NEXT_PUBLIC_SITE_URL=https://test.lannacare.org` in the shell, then grep of `.next/`.

- [x] Happy path works end to end — **no file present → still correct**: the check script's "no files present passes" case, and the pin in `deploy.mjs` is unconditional
- [x] **Wrong-environment file present → refused with the filename.** Real run, exit 2:

```
deploy: test would build with an env file that names another environment:
  - .env.production.local: written for the production environment; NEXT_PUBLIC_SITE_URL=https://lannacare.org, not https://test.lannacare.org
Move it out of the checkout (mv .env.production.local ..) and deploy again.
```

- [x] **Built output contains the right host for the target.** With the stray file present and the shell pin, outside source maps: `https://lannacare.org` in **0** files, `https://test.lannacare.org` in 18. (The source maps matched 8 times, all a code comment quoting the host in `src/lib/tags/origin.ts`.) Caveat: the OpenNext bundling step after `next build` was cut off by my timeout, so this is the `.next` output; the inlining happens in `next build`
- [x] `write-env.mjs` refuses off the Pi: `write-env: this writes .env.production.local for the Pi and refuses to run on win32.`, exit 2. Not run on Linux; the Linux path is unchanged code
- [ ] Create / edit / delete — n/a: nothing is stored
- [ ] Empty state — n/a: no list or page; the no-file case is covered above
- [x] Invalid input is handled without a crash: lines without `=` and comments are skipped, and a file with no relevant variables passes (check script case "unrelated vars pass")
- [x] Boundary cases: a matching file passes (production and test), a trailing slash on the right host is not a mismatch, an unmarked file with only the wrong host is caught, and uat/production share an origin so neither is refused for the other's host

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

- [x] The nearest things still work: `deploy.mjs` still runs its earlier guards (the `--env test` run got past the public-site lock, `loadEnv` and the Supabase check before the new one fired). `write-env.mjs` on Linux is unchanged apart from the guard at the top
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates pass on the synced tree

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Design choices recorded in `docs/decisions/2026-10-01-deploy-pins-site-url.md`: the pin and where the Worker/Pi distinction now lives, test being guarded, the files checked, Pi-only with no flag
- [x] `README.md` still accurate: one sentence added to the `NEXT_PUBLIC_SITE_URL` paragraph
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: deploy tooling, no shelter user sees it
- [x] Commit messages say why, not just what
- [x] Claims in commit messages and `docs/decisions` were measured, not reasoned: the 0-versus-18 file counts and both refusals are from the runs in §4. The claim that the Worker now canonicalises `www` to the apex for OAuth and absolute links is reasoned from `getSiteOrigin()`, not measured on a deployed Worker

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — n/a: scripts are not part of the Worker bundle
- [ ] Deployed SHA matches — n/a: scripts are not part of the Worker bundle

### On the deployed build

- [ ] Deployed to test — n/a: nothing in the deployed site changes until the next deploy
- [ ] Smoke-tested on `test.lannacare.org` — n/a: no feature to smoke-test; sign-in redirect is the deploy-time check below
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary assertions cover both edges — n/a: no threshold; the match/mismatch cases are covered both ways in §4
- [ ] Evidence pasted is the tool's actual output — n/a: the §2 and §4 output is pasted as printed
- [ ] Public pages re-checked after cache purge — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager, at the next production deploy (the first run of the pin; it should print no new refusal)
- [ ] `strip-baked-env` seen — n/a: build path untouched
- [ ] New secret/env var in production — n/a: none added; `NEXT_PUBLIC_SITE_URL` is set by the script at build time

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; it changes only local scripts and writes nothing persistent. A Worker already deployed keeps its host until redeployed

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing needs human eyes: every behaviour is a command with an exit code, run above. Whether Google sign-in on a freshly deployed `test.lannacare.org` returns to test is the deploy-time check in §8, not a separate look.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (env-build-leak-guard session)  Date: 2026-10-01

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: no UI or visual surface; script behaviour with exit codes, all shown above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: nothing in the deployed site changes

Result: pass

Release manager acknowledgement: n/a (deploy tooling only)  Date: —
