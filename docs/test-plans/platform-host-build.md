# Feature test plan

---

## Header

| | |
|---|---|
| Feature | `#plhbd` — carry every address into both builds, so Server Actions on `cooperjaidee.org` stop being refused |
| Backlog item | `#plhbd` (Deployment) — **filed on the `backlog` branch minutes before this branch was cut, so it is not on `main` yet and cannot be ticked here** |
| Branch / worktree | `claude/platform-host-build` @ `C:\Development\Animal_Shelter_platform-host-build`, port `3007` |
| Dev server | n/a: the change is to build plumbing; `next dev` reads `.env.local`, not wrangler.jsonc, so it cannot exercise it |
| PR | opened after this commit |
| Tested by / date | Claude Opus 5 (production release manager session) / 2026-11-20 |
| Carries a migration? | no |
| Tested at SHA | the branch head |

## 1. Scope and risk

- [x] Change is described in one sentence — `SITE_HOST_VARS` becomes the one list of address variables, `deploy.mjs` pins all of them into the Worker build instead of two by name, and `runtime-config.mjs` gains the `PLATFORM_HOST` entry that lets the Pi receive it
- [x] Files/areas touched — `src/lib/site-hosts.ts`, `scripts/deploy.mjs`, `scripts/lib/runtime-config.mjs`, `src/lib/site-hosts.test.mjs`, a decision file, and this plan. **No `src/app/`, no `worker/`, no migration**
- [x] Cards affected identified, plus whether admin and the signed-out public are affected — **no card changes and no card is involved.** `serverActions.allowedOrigins` is Next's own CSRF-style guard on which address may submit a Server Action; it is not the card system and grants nothing. The signed-out public is unaffected. **Admin is affected only in that the operator console becomes usable**
- [x] Out of scope — the console's own behaviour, the `shelterError` mapping that disguised a different refusal, and `docs/release-procedure.md`'s UTF-16 note (`#utf16`), all left alone

### What was actually wrong, measured three ways

**Symptom:** `https://cooperjaidee.org/login` renders perfectly; pressing **Continue with Google** returns *"This page couldn't load. A server error occurred."* The button is a form `submit` to a Server Action, and the action is refused because the origin is not allowed. **This is the failure `docs/domain-checklist.md` section F predicts in writing** — *"a missing allowed origin refuses every button while every page renders"* — and it is why that section says to prove the address by **saving**, not by loading.

1. **Reproduced in a clean browser** (the built-in pane, no session, no Google account, different network path): the page renders, the button fails. So it was never Lutan's account.
2. **Read in the source.** `next.config.ts` sets `serverActions.allowedOrigins` from `siteAllowedOrigins()`, which reads `APP_HOST`, `PUBLIC_HOST` **and** `PLATFORM_HOST` from `process.env` — **at build time**. `PLATFORM_HOST` was declared only in `wrangler.jsonc` `vars`, which are **runtime** values. Two places carry hosts into a build and **neither knew about the third**: `deploy.mjs` assigned exactly two by name, under a comment that still read *"The two addresses from wrangler.jsonc"*; and `runtime-config.mjs` had no `PLATFORM_HOST` entry, so `PI_WRANGLER_VARS` excluded it and `scripts/pi/write-env.mjs` never copied it.
3. **Confirmed on the live Pi.** `~/Animal_Shelter_App/.env.production.local` holds `APP_HOST` and `PUBLIC_HOST` and **not** `PLATFORM_HOST` — so the build serving production baked an allow-list without `cooperjaidee.org`.

### Why the fix is a list rather than a third line

A line per host is what failed: adding a host to `site-hosts.ts` and `wrangler.jsonc` left two other places silently behind. `SITE_HOST_VARS` is now the single source, `deploy.mjs` loops over it, and the registry entry makes the Pi half automatic. **A fourth address needs one edit, and the tests below fail if the other two are forgotten.**

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — n/a as a merge: branched from current `origin/main` by `worktree.mjs new`, nothing merged in
- [x] `node scripts/gates.mjs` ends with four gates each at exit code `0` — **all four numbers read, not three**

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 103s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 187s
=== gates: test — npm test
=== gates: test exited 0 after 34s
=== gates: build — npm run build
=== gates: build exited 0 after 154s

gates: typecheck=0 lint=0 test=0 build=0
```

- [x] `node scripts/check-test-plan.mjs --base origin/main` run the way CI runs it — exit **0**
- [ ] CI green on the PR — n/a: not yet, the PR does not exist at this commit. **Before merging, the run for the current HEAD is read with `gh run view <id> --json status,conclusion,headSha` and its `headSha` confirmed to be the commit pushed last**

## 3. Schema and data

- [ ] Every line in this section — n/a: no migration, no column, no stored value. Nothing in any database changes

## 4. Functional checks

- [x] **Happy path, as a unit test** — `node --test src/lib/site-hosts.test.mjs`: **12 pass, 0 fail**, including the two new ones
- [x] **BOTH NEW GUARDS WERE SHOWN TO FAIL ON THEIR OWN PLANTED REGRESSION**, which is the only thing that proves a guard works:

```
plant: delete the PLATFORM_HOST entry from runtime-config.mjs
  -> ✖ every address variable is copied to the Pi …          pass 11  fail 1
plant: put deploy.mjs back to a line per host
  -> ✖ every address variable is pinned into the Worker build  pass 11  fail 1
```

  Both plants were reverted and the file contents re-checked afterwards.
- [x] **The pre-existing tests are the point of the story and were left alone.** `site-hosts.test.mjs` already asserted that `siteAllowedOrigins` includes a platform host with its `www.`, and **it passed throughout, while production was broken** — because it hands the env straight to the function and never asks whether the value reaches it. **That gap, not the function, is what shipped the fault**
- [ ] **The real proof — a Server Action SAVING on `cooperjaidee.org`** — pending: it cannot be true until this is merged, the Pi rebuilt and the production Worker redeployed, and the Worker deploy is Lutan's. Recorded under *Left for manual verification*, and it is the same proof section F asks for
- [x] Invalid input / boundary — `wranglerVars[key]` is `undefined` for an environment with no `PLATFORM_HOST` (test and UAT have none), exactly as the two named assignments were for a missing var. `clean()` in `site-hosts.ts` already maps an unset value to `null`, and `siteHosts()` filters it out, so those environments' allow-lists are unchanged. **Asserted by the existing tests, which cover an env with no platform host**

### Role access matrix

- [ ] Every login tested / a login that should not have access is blocked server-side — n/a: **no card, no role and no route changes.** `allowedOrigins` is Next's own origin check, not an access decision; the console's own product-administrator and `aal2` checks are untouched

## 5. Cross-cutting

- [ ] Nav entry / manual / translatable strings / mobile viewport / console / network — n/a: build plumbing. No page, string or nav entry changes

## 6. Regression

- [x] **The two addresses that already worked must keep working** — `APP_HOST` and `PUBLIC_HOST` are still pinned, now through the loop rather than by name, and the test asserts the loop exists. The values come from the same `wranglerVars` object as before
- [x] **Environments with no platform host are unchanged** — test and UAT declare no `PLATFORM_HOST`, so the loop assigns `undefined` where the named lines assigned `undefined`. Identical behaviour
- [x] Shared file touched, checked from a second unrelated page — `src/lib/site-hosts.ts` is read by `src/proxy.ts`, `src/lib/auth/same-origin.ts`, `next.config.ts` and `scripts/check-site-hosts.mjs`. **Only an export was added**; no existing function's behaviour changed, which the 10 pre-existing tests passing unchanged demonstrates
- [ ] Nothing merged from `main` was broken by this branch — n/a: nothing was merged

## 7. Documentation

- [ ] Backlog item ticked on this branch — n/a: **`#plhbd` was filed on the `backlog` branch about twenty minutes before this branch was cut from `origin/main`, so the item does not exist on this branch and there is nothing here to tick.** It is ticked at the next daily sync, once `git merge backlog` has carried it onto `main`. Saying so is the rule for a fault filed on the backlog branch that a PR then closes
- [x] Non-obvious design choices as a new file in `docs/decisions/` — `2026-11-20-addresses-reach-the-build.md`: why a runtime var cannot feed a build-time config, why the fix is a list, and why the existing unit tests could not have caught it
- [x] `README.md` still accurate
- [ ] **Release notes.** Would a shelter user notice this change? — n/a: **nobody at the shelter can reach `cooperjaidee.org`.** It is the platform front door, used today by one person, and no shelter-facing behaviour changes. `0.47.5`'s note about the console moving is already published and remains true
- [x] Commit messages say why, not just what
- [x] **Claims here were measured, not reasoned** — the symptom from reproducing it in a clean browser; the cause from reading `next.config.ts`, `site-hosts.ts`, `deploy.mjs` and `runtime-config.mjs`; the confirmation from reading the live Pi's `.env.production.local`; the guards from two planted regressions, each run and each reverted

## 8. Pre-production gate

- [x] **This fix does nothing until it is deployed, and that is the whole character of it.** The value is baked at build time, so no dashboard, setting or restart can apply it: it needs a merge, a Pi rebuild and a production Worker deploy
- [x] Deploy safety — **the blast radius is one address.** `lannacareforanimals.org`'s allow-list is byte-identical before and after, because its host was pinned before and is pinned now
- [ ] Deployed SHA / smoke test / UAT project line — n/a: nothing is deployed by this commit, so there is no deployed SHA to record yet. The Pi rebuild and the production Worker deploy follow the merge, and the result is recorded with the saving proof below

### Rollback

- [x] Rollback position stated — reverting this PR restores the two named assignments and removes the registry entry, which returns `cooperjaidee.org` to refusing every button. **Nothing else regresses**, since the other two addresses are pinned either way. There is no data to undo

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high (shipped) | **Every Server Action on `cooperjaidee.org` was refused while every page rendered**, from the moment the address went live in `0.47.5` | **fixed here.** Confined to the platform address; `lannacareforanimals.org` was never affected |
| 2 | medium (test design) | **A passing unit test gave false assurance.** `siteAllowedOrigins` was tested with a platform host and passed throughout, because the test supplies the env directly and the plumbing that fills it was never covered | **fixed here** by two tests that cover the carrying, each proven against a planted regression |
| 3 | low (comment) | **The comment on the pin block said "The two addresses"** and was the thing that made the omission invisible to a reader adding a third | **fixed here**; the comment now says why it is a loop |

## Left for manual verification

| # | What to check | Where | State |
|---|---|---|---|
| 1 | **Sign in at `https://cooperjaidee.org`, do the authenticator step, then SAVE a web address on a test shelter.** The saving proof section F asks for — a page that loads proves nothing | Lutan | open, and it is the real test of this fix |
| 2 | That `lannacareforanimals.org` still signs in and saves normally after the redeploy | Lutan | open — the regression check on the address that already worked |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude Opus 5 (production release manager session)  Date: 2026-11-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: both items need the deploy first, and then a person pressing a button; only that person may tick this

Manual verification by: pending: Lutan, after the Pi rebuild and his production Worker deploy — the saving proof on `cooperjaidee.org`, and that the main address is unchanged

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [x] Handed to the production release manager — this session is the release manager; the rebuild and deploy follow this PR's merge

Result: pass with accepted defects
