# Feature test plan — deploy-site-origins-dupe

## Header

| | |
|---|---|
| Feature | Fix a syntax error in `scripts/deploy.mjs`: `SITE_ORIGINS` was both imported and re-declared, so no deploy could run at all |
| Backlog item | none — found while deploying `0.14.0` to test |
| Branch / worktree | `claude/deploy-site-origins-dupe` @ `C:\Development\Animal_Shelter_deploy-site-origins-dupe` |
| Dev server | not started — this changes a deploy script, not the app |
| PR | opened from this branch |
| Tested by / date | Claude (release manager session) / 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | `2895199` + this branch's commit |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what was asked for — remove the duplicate local `SITE_ORIGINS` declaration from `scripts/deploy.mjs`, keeping the import of the same name from `./lib/env.mjs`
- [x] Files/areas touched listed — `scripts/deploy.mjs` only: nine lines removed, replaced by a comment recording what happened and why the removal is safe
- [x] Roles affected identified — **none.** This is a developer script. No route, no database read, no user-visible behaviour
- [x] Anything explicitly **out of scope** written down — the CI gap this exposed (§6) is *not* fixed here; it is a change to `.github/workflows/ci.yml` and belongs in its own PR or on the backlog, Lutan's call

**What happened.** `node scripts/deploy.mjs --env test` failed immediately:

```
SyntaxError: Identifier 'SITE_ORIGINS' has already been declared
    at file:///C:/Development/Animal_Shelter_App/scripts/deploy.mjs:49
```

Line 29 imports `SITE_ORIGINS` from `./lib/env.mjs`; line 49 declared a local `const` of the same name. **`0.14.0` could not be deployed anywhere — test, UAT or production — and neither could anything else.**

**How it got there.** `7b4c1d6` (#290, `version-endpoint-from-origin`) moved `SITE_ORIGINS` into `scripts/lib/env.mjs` so `apply-migrations.mjs` could use it too, and added the import. A later merge in the same release brought the old local copy back. Neither side is wrong on its own; the merge produced a file that cannot parse.

**Why removing it is safe rather than a judgement call.** The two definitions are character-for-character the same three origins — `test: https://test.lannacare.org`, `uat` and `production: https://lannacare.org`. Compared directly before editing. So the import supplies exactly what the local copy did.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — not needed: branched from `origin/main` at `2895199`, 0 behind
- [x] `npm run typecheck` — clean: `typecheck=0`
- [x] `npm run lint` — clean: `lint=0`
- [x] `npm run build` — succeeds: `build=0`
- [ ] CI green on the PR — n/a: recorded at push time, before CI has reported
- [x] **`node --check scripts/deploy.mjs` passes** — the direct check for this class of fault, and the one that was missing. Before the fix it reproduced the error exactly; after it, the file parses
- [x] **Every other script was checked the same way** — `node --check` over `scripts/*.mjs`, `scripts/lib/*.mjs` and `scripts/pi/*.mjs`: **all 93 parse.** Worth doing once, because if one merge produced this, another could have produced a second

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: this PR reads no database
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [x] Production apply plan stated — none needed. **But note this PR is what unblocks applying `0126`–`0128`**: `apply-migrations.mjs` runs independently, so the migrations themselves were never blocked, but the deploy that must follow them was

## 4. Functional checks

- [x] Happy path works end to end — `node --check` passes and the script loads far enough to reach its own guards, which is the whole of what this change affects
- [ ] Data persists — n/a: a script fix
- [ ] Create / edit / delete all exercised — n/a: no CRUD
- [ ] Empty state renders sensibly — n/a: no UI
- [ ] Invalid input is rejected with a readable message — n/a: no input added. The script's existing argument handling is untouched
- [x] Boundary cases checked — the only behavioural question is whether `SITE_ORIGINS` still resolves to the same three values, and it does: the import and the deleted literal were identical, verified by reading both before editing
- [x] **The symbol is used in six places and all still resolve** — lines 126, 159, 216, 237, 324 and 327 (`lockedPublicSiteProblem`, the build env's `NEXT_PUBLIC_SITE_URL`, the live-version fetch, and the mail relay). All now read the imported binding

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing | a deploy script is not reachable from the app | unchanged |

- [x] Every role above tested — n/a: `scripts/deploy.mjs` is run from a developer's machine and is not part of the deployed bundle
- [x] A role that should not have access is blocked server-side — n/a for the same reason

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: the manual documents the app, not the deploy tooling
- [ ] Translatable strings go through the translation path — n/a: no user-facing string
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no browser involved
- [ ] Network clean — n/a: no new requests

## 6. Regression

- [x] The pages nearest the change still work — the build compiled every route; nothing in `src/` is touched
- [x] Any shared file touched checked from a second, unrelated page — `scripts/lib/env.mjs` is *read* but not changed. Its other consumers (`apply-migrations.mjs`, `backup.mjs`, the check scripts) are unaffected, and all 93 scripts parse
- [x] Nothing merged from `main` during `sync` was broken by this branch — 0 behind `2895199`

- [x] **CI was green on the broken file, and that is observed rather than inferred.** `0.14.0`'s cut branch `fe6f193` was taken from `8112e6a`, which already contained the duplicate; **all five checks passed on it** — `check`, `audit`, `migration-numbers`, `public-views`, `test-plan`. So a syntax error in the deploy script reaches `main` with CI green. The precise reason is **not established here**: `npm run typecheck` runs against the TypeScript project and `npm run build` against the Next app, neither of which parses `scripts/*.mjs`, and whether eslint's config covers `scripts/` was not pinned down. What is certain is that nothing in the pipeline parses these files. **`node --check scripts/**/*.mjs` would have caught it in under a second.** Not added here on purpose — it is a CI change and belongs in its own PR

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` — n/a: no backlog item; this was found in the course of a release
- [ ] **Release notes.** — n/a: nobody using the shelter app could notice this. It is a developer script that never reaches the bundle; the only people affected are whoever runs a deploy
- [ ] Non-obvious design choices recorded in `docs/decisions/` — n/a: no design choice. The comment left in place of the deleted block records the history, which is where a future reader will look
- [x] `README.md` still accurate — unaffected
- [x] Commit messages say why, not just what

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header — `2895199` plus this branch's commit
- [ ] Deployed SHA matches the tested SHA — deferred: release manager, with `0.14.0`

### On the deployed build

- [ ] Deployed to test — deferred: this session, immediately after merge. **This PR is the thing that makes that possible again**
- [ ] Smoke-tested on a deployed build — deferred: release manager. There is nothing in the app to smoke-test for this change; the meaningful test is that a deploy runs at all, which is §2
- [ ] Timezone-sensitive behaviour checked — n/a: no dates involved
- [ ] Public pages re-checked after a cache purge — n/a: nothing public changes
- [ ] `check-public-views.mjs --env production` — n/a: no migration, no view, no policy

### Deploy safety

- [x] Any new secret/env var exists in the Cloudflare environment — none added
- [x] Release mail — unaffected. This PR adds no note and changes no release data; `0.14.0`'s mail behaviour is `0.14.0`'s
- [x] **Rollback** — reverting this PR restores the syntax error and so makes deploying impossible again. In practice the rollback for this change is to fix it differently, not to revert it

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] For a destructive or rewriting migration only: a production backup exists — n/a: no migration
- [x] Apply plan stated — none needed

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | high | `SITE_ORIGINS` imported and re-declared in `scripts/deploy.mjs`; no deploy could run | **fixed** in this PR |
| 2 | medium | CI passes on a syntax error in `scripts/**/*.mjs` — observed on `fe6f193`, five checks green | **accepted, out of scope.** `node --check` over those files would close it; it is a CI change and wants its own PR or a backlog item |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | That a real deploy now runs — the proof this change exists for. `npm run deploy:test` reaching its build stage is enough | this session, after merge |
| 2 | Whether to add `node --check` to CI, or put defect 2 on the backlog | `.github/workflows/ci.yml` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (release manager session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — item 1 is this session's next step, item 2 is Lutan's decision

Manual verification by: pending: a real `deploy:test` run (item 1) and Lutan's call on the CI check (item 2)

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR

Result: pass
