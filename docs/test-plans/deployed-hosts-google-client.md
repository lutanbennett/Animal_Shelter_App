# Feature test plan

## Header

| | |
|---|---|
| Feature | `check-deployed-hosts.mjs` prints each environment's Google sign-in client and names its project |
| Backlog item | `docs/backlog.md` → `#gidty` (not ticked: this makes production readable, it does not move it) |
| Branch / worktree | `claude/deployed-hosts-google-client` @ `C:\Development\Animal_Shelter_deployed-hosts-google-client` |
| Dev server | n/a: operator script, no page |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | 07b2e0685 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — n/a: an operator script; no card, page or login changes behaviour
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `scripts/check-deployed-hosts.mjs` (one print line), `scripts/lib/deployed-hosts.mjs` (`googleClientProject()`), `scripts/deployed-hosts.test.mjs` (one test). Out of scope: running it on production (the planner's, after merge), any Supabase or Google setting. No new exit path; the client secret is never read out.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every one `0`:

```
=== gates: typecheck exited 0 after 59s
=== gates: lint exited 0 after 186s
=== gates: test exited 0 after 60s
=== gates: build exited 0 after 208s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

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

- [x] Happy path works end to end
- [ ] Data persists — reload the page and the change is still there — n/a: read-only script, nothing is saved
- [ ] Create / edit / delete all exercised (whichever the feature has) — n/a: read-only script
- [x] Empty state renders sensibly (no rows yet)
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Run on test (dev) and UAT, real output:

```
Google sign-in in test: enabled, client 559913308840-topvkto4ac6uneto6flv9vfqqt0ohpsg.apps.googleusercontent.com (CooperJaidee's Google project)
Google sign-in in uat: enabled, client 559913308840-topvkto4ac6uneto6flv9vfqqt0ohpsg.apps.googleusercontent.com (CooperJaidee's Google project)
```

Both exited 0. Empty/missing id, a malformed id and an unknown project number are covered by the unit test (reported, never thrown).

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a: no login | operator script | n/a | n/a |

- [ ] Every login above tested — n/a: no page or login involved
- [ ] A login that should not have access is blocked server-side (hitting the URL directly fails) — n/a: no page or login involved

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — n/a: operator script, not in the manual
- [ ] Translatable strings go through the translation path, checked at `/management/translations` — n/a: no UI strings
- [ ] Mobile viewport (375px) — no overflow, controls reachable — n/a: no UI
- [ ] Browser console clean — no errors or React warnings — n/a: no UI
- [ ] Network clean — no unexpected 4xx/5xx on the feature's pages — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

The script's existing host and callback checks still print and pass on test and UAT (same run as above); the existing nine unit tests still pass.

## 7. Documentation

- [ ] Backlog item ticked in `docs/backlog.md` **on this branch** — n/a: the brief says tick nothing; the note for `#gidty` is in the PR body for the planner to file
- [ ] Non-obvious design choices added as a new file in `docs/decisions/` — n/a: no decision file, the change is self-describing
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: an operator script run at release time; no shelter user or Admin screen changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — n/a: script only, nothing in the deployed build changes
- [ ] Smoke-tested on `test.lannacare.org` — n/a: script only, nothing in the deployed build changes
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic
- [ ] **Boundary or banding change** — n/a: no threshold logic
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages re-checked after a cache purge — n/a: no public page changes

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it? — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Revert the commit; the script reads only and changes no setting, so nothing else to undo.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none: the production run is the planner's, after merge | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Sonnet 5.5)  Date: 2026-11-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: pending: the planner runs it with --env production after merge

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the next release's pre-deploy pass

Result: pass

Release manager acknowledgement: pending: next release
