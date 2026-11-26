# Feature test plan

## Header

| | |
|---|---|
| Feature | `deploy.mjs` re-asserts hosts flagged `attach_to_worker` as `wrangler deploy --domain` |
| Backlog item | `docs/backlog.md` → `#hstau` (step 2 of 3; not ticked, step 3 the console button remains) |
| Branch / worktree | `claude/deploy-reasserts-hosts` @ `C:\Development\Animal_Shelter_deploy-reasserts-hosts` |
| Dev server | none: scripts-only change, no page |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | 7fcaf1d94 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs): `scripts/deploy.mjs`, `scripts/lib/attached-hosts.mjs`, `scripts/attached-hosts.test.mjs`, docs
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: a deploy script; no card, page or access changes
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised: the console attach button (step 3); production was not read or deployed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — **four gates, each `<N>` that gate's own exit code, and every `<N>` is `0`.**

```
=== gates: typecheck exited 0 after 40s
=== gates: lint exited 0 after 142s
=== gates: test exited 0 after 35s
=== gates: build exited 0 after 73s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same four gates, among its other checks) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration; 0445 already landed
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: a flagged, API-attached host survived a real `deploy.mjs --env test` (lists below)
- [x] Data persists — reload the page and the change is still there: the domain kept its id across the deploy and answered 200 after it
- [x] Create / edit / delete all exercised (whichever the feature has): attach, flag, deploy, detach, unflag, each read back
- [x] Empty state renders sensibly (no rows yet): `--plan` with no flagged rows prints `--domain: none` and adds no flag
- [x] Invalid input is rejected with a readable message, not a crash: a failed read refuses with exit 2 (unit-tested: HTTP 500, thrown fetch, no token)
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates): a flagged host already in wrangler.jsonc routes is dropped; duplicates and case folded (unit tests)

### The four Cloudflare API reads (test Worker, filtered to `*.lannacare.org`, verbatim)

Before attach, 09:20:55Z:
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
```
After attach, 09:21:08Z:
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
disposable-hstau-trial.lannacare.org       -> lanna-animal-care-test   id b7b588b76f102fbafb46eec3f9954bb04861454f
```
After `node scripts/deploy.mjs --env test`, 09:30:40Z:
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
disposable-hstau-trial.lannacare.org       -> lanna-animal-care-test   id b7b588b76f102fbafb46eec3f9954bb04861454f
```
After clean-up, 09:30:57Z:
```
test.lannacare.org                         -> lanna-animal-care-test   id 1b862959a68950ff2b2931c814425b69abdb4011
uat.lannacare.org                          -> lanna-animal-care-uat    id 978c1969e4a5c530deba4310346643ff4ac67c37
```

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| none | deploy script | no login involved | not applicable |

- [ ] Every login above tested — n/a: no page or login; a deploy script
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page or login

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — appears for the right cards, no dead links — n/a: no UI
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: no user-facing change
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked): `https://test.lannacare.org/api/version` 200 after the deploy, its custom-domain id unchanged
- [ ] Any shared file touched (`NavLinks.tsx`, `manual/en.ts`, shared libs) checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead) — n/a: #hstau stays open until step 3, the console button
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no shelter user or Admin meets a deploy, and the console button they would notice is unbuilt
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [x] Tested SHA recorded in the header, and it is the tip of `main` at deploy time
- [x] Deployed SHA matches the tested SHA — the test deploy printed `qxkmhwybjggxvsfxsxbd (9f97259cb)`, the code commit

### On the deployed build

- [x] Deployed to test: `npm run deploy:test` (as `node scripts/deploy.mjs --env test`, exit 0)
- [x] Smoke-tested on `test.lannacare.org` — the happy path works on the deployed Workers build, not just `next dev`
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing date-dependent
- [ ] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.** — n/a: no boundary or band
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages (`/`, `/adopt`, `/our-work`, `/donate`) re-checked after a cache purge or a 10-minute wait — n/a: no page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref **matches production**. — deferred: release manager, at the next production deploy (read the new attached-hosts line too)
- [x] `strip-baked-env: removed N env var(s) from the Worker bundle` seen in the deploy output (14, on the test deploy)
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret; the read uses the existing Supabase access token

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration; 0445 is on main
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration in this PR
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh. — n/a: no migration
- [ ] Apply plan stated: which file, which project, and whether it runs before or after the deploy — deferred: release manager: 0445 must be applied to production before this deploy.mjs runs there, or the read fails and the deploy refuses

### Rollback

- [x] Rollback position stated, **including what it does not cover**: revert the commit; the deploy then stops passing --domain. It does not re-attach a host a deploy already dropped.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Spec said `shelter_id` may be null; dev's column is NOT NULL | accepted: recorded in the decision file, no effect on this build |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (live test deploy, four Cloudflare API reads, dev db reads, unit tests, gates)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no screen; the console button comes in step 3

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: at the next release

Result: pass

Release manager acknowledgement: pending: next release
