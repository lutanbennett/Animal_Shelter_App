# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | Clear GHSA-68fv-2mgg-jv7q: `source-map-js` 1.2.1 → 1.2.2 (lockfile only) |
| Backlog item | `docs/backlog.md` → Completed → Security: "A high-severity advisory has been red in CI all day and nothing said so." Part (a) only |
| Branch / worktree | `claude/advisory-bump` @ `C:\Development\Animal_Shelter_advisory-bump` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3026` |
| PR | linked from the PR itself |
| Tested by / date | Claude (advisory-bump session), 2026-10-06 |
| Carries a migration? | no |
| Tested at SHA | `39a0f810` (the bump); gates ran there, docs-only commits follow |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `package-lock.json` moves the transitive `source-map-js` from 1.2.1 to 1.2.2, which clears the one high in the production tree. Part (b) of the item (CI reporting) was deliberately not done, per the correction the item now carries
- [x] Files/areas touched listed: `package-lock.json` (three lines, one package), `docs/backlog.md`, this plan. No `package.json`, no `src/`, no `worker/`, no workflow
- [ ] Roles affected identified — n/a: a transitive build-time dependency; no role sees it
- [x] Out of scope written down: bumping Next (pinned at 16.3.8 on purpose), any `overrides` entry (not needed), and every CI workflow (`ci.yml` and `advisories.yml` disagree on purpose; the daily run caught this advisory)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date at the bump; the `backlog` branch was merged in afterwards for the corrected item)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Honest record: the run at `39a0f810` printed `gates: typecheck=0 lint=1 build=0`. The one lint failure was `check-backlog-sections` rejecting the advisory item for sitting below `## Completed`, a stray already on `main`; it was fixed by the backlog merge plus ticking the item into Completed → Security, after which that check prints `ok — 101 open items, all above ## Completed`. Build exited 0 after 329s. Re-run the full gates after the final sync before merge
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

The one real test is that the app still builds and renders.

- [x] Happy path works end to end: audit before, `npm update source-map-js`, audit after, build, then `next dev` on 3026 served `/` with styles. Before: `npm run audit:prod` → `source-map-js 1.0.0 - 1.2.1 … high … 1 high severity vulnerability`. After: `found 0 vulnerabilities`. Full `npm audit` (with dev) is `5 high severity vulnerabilities` after; the before run was captured only as its tail (fix hints), so "no worse" is argued from the diff, which touches only `source-map-js`, not measured
- [x] Data persists — the lockfile diff is exactly one package entry (version, resolved URL, integrity), checked with `git diff`; `npm ls` shows `postcss` under both `next` and `@tailwindcss/postcss` deduped onto it
- [ ] Create / edit / delete — n/a: no feature, no data
- [ ] Empty state — n/a: no UI change
- [ ] Invalid input rejected — n/a: no input surface
- [ ] Boundary cases — n/a: no logic changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no app surface | n/a |
| staff | n/a | no app surface | n/a |
| vet | n/a | no app surface | n/a |
| volunteer | n/a | no app surface | n/a |
| resident | n/a | no app surface | n/a |
| signed out | home page `/` | renders with styles | pass (screenshot: hero, nav, buttons styled; no console errors) |

- [ ] Every role above tested — n/a: no app code changed; only the signed-out home page was loaded, to prove the PostCSS chain still emits styles
- [ ] A role that should not have access is blocked server-side — n/a: no app code changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI
- [ ] Manual updated — n/a: no feature
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI change
- [x] Browser console clean — no errors on the home page of the dev server
- [ ] Network clean — n/a: no network behaviour changed

## 6. Regression

- [x] Nearest things still work: the production build (`next build` under `gates.mjs`, exit 0) and the dev server's CSS pipeline, which are the two consumers of `postcss` → `source-map-js`. The OpenNext/Cloudflare bundling step (`npm run deploy`) was not run; it is not part of `gates.mjs`
- [x] Shared files touched: `package-lock.json` only, narrowed by hand so npm's incidental `version` header rewrite (0.12.0 → 0.19.3) is not in the diff
- [x] Nothing merged from `main` during `sync` was broken: nothing new came in

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with a status note that says part (b) was deliberately not done and why
- [ ] Non-obvious design choices in `docs/decisions/` — n/a: a plain lockfile bump; no `overrides`, no narrower-than-suggested bump. Said in the PR instead
- [ ] `README.md` still accurate — n/a: nothing it describes changed
- [x] Commit messages say why, not just what
- [ ] Release-notes line — n/a: no shelter user sees a transitive dependency; `src/lib/releases.ts` unchanged

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour checked on test — n/a: no date logic
- [ ] Public pages re-checked after cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var in production — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code in one PR? — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position: revert the PR; the lockfile returns to 1.2.1 and the advisory with it

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | `lint` failed on `check-backlog-sections`: the advisory item sat below `## Completed` on `main` | fixed: corrected item merged from `backlog` and ticked into Completed → Security |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

Nothing needs human eyes beyond the release smoke test. The main checkout's `node_modules` is still on `next` 16.3.5 and wants an `npm ci`; that is Lutan's tree, not changed here.

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (advisory-bump session)  Date: 2026-10-06

### Manual verification

- [x] Every item in the manual list was checked by a person, or the list is empty

Manual verification by: n/a: no UI change; the home page was driven and screenshotted by Claude in the browser pane  Date: 2026-10-06

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: not yet; the PR is not merged

Result: pass

Release manager acknowledgement: n/a (not yet released)  Date: 2026-10-06
