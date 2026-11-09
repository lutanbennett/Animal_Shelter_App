# Test plan: test-purge

---

## Header

| | |
|---|---|
| Feature | test-purge |
| Backlog item | `docs/backlog.md` → #pz3tk (ticked here) |
| Branch / worktree | `claude/test-purge` @ `C:\Development\Animal_Shelter_test-purge` |
| Dev server | n/a: nothing served changed |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-09 |
| Carries a migration? | no |
| Tested at SHA | recorded on the PR |

## 1. Scope and risk

- [x] Change is described in one sentence: `purge-cache.mjs --env test` now purges the `lannacare.org` zone using the zone's credentials in `.env.deploy.uat`, and every test or UAT purge re-checks both sites; the release procedure's purge step names it
- [x] Files/areas touched listed: `scripts/purge-cache.mjs`, `docs/release-procedure.md`, `docs/backlog.md` (one tick), `docs/decisions/2026-11-09-test-purge-uses-the-zone-file.md`
- [x] Cards affected identified: none. No page, action or permission in the app changed
- [x] Anything explicitly **out of scope** written down: production's purge (unchanged, dry-run proves its zone is the same); no token was created or moved

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in: already up to date, no conflicts
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`, every `<N>` `0`:

```
=== gates: typecheck exited 0 after 234s
=== gates: lint exited 0 after 373s
=== gates: test exited 0 after 38s
=== gates: build exited 0 after 161s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: from the main checkout, the changed script's `--env test` reported *purged everything for test.lannacare.org and uat.lannacare.org (zone c596f1fe…)*, then both stylesheets `HTTP 200, 99839 bytes (CF MISS)`; on the Pi, `check-assets.mjs` on the test and UAT clones: *identical to the build*
- [ ] Data persists — n/a: a purge stores nothing
- [ ] Create / edit / delete all exercised — n/a: a purge stores nothing
- [x] Empty state renders sensibly: main's script on the same machine refused with *CLOUDFLARE_ZONE_ID and CLOUDFLARE_PURGE_TOKEN missing from .env.local*; without `.env.deploy.uat`, `loadEnv` stops and names that file
- [x] Invalid input is rejected with a readable message, not a crash: an unknown `--env` still refuses (code path unchanged)
- [x] Boundary cases checked: `--env production --dry-run` still names zone `323637bc…` (lannacareforanimals.org), so production is untouched by the change

### Role access matrix

Nothing here is reachable by a login.

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| any | nothing changed | unchanged | n/a: no access rule touched |

- [ ] Every login above tested — n/a: no access rule or page was added or changed
- [ ] A login that should not have access is blocked server-side — n/a: no access rule or page was added or changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry added
- [ ] Manual updated — n/a: no user-facing behaviour changed
- [ ] Translatable strings — n/a: no UI strings added
- [ ] Mobile viewport (375px) — n/a: no UI added
- [ ] Browser console clean — n/a: no page changed
- [ ] Network clean — n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: after the real purge, test and UAT each served their stylesheet whole and identical to the build
- [ ] Any shared file touched checked from a second page — n/a: no shared source file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch: the gates above ran after it

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch: `#pz3tk`, with what closed it
- [x] Non-obvious design choices added as a new file in `docs/decisions/`: `2026-11-09-test-purge-uses-the-zone-file.md`
- [x] `README.md` still accurate: it does not describe the purge
- [ ] **Release notes.** n/a: no shelter user sees a release-machine script
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned**: every result above is the script's or the Pi check's own output

## 8. Pre-production gate

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager at the release this lands in
- [ ] Deployed SHA matches the tested SHA — deferred: release manager at the release this lands in
- [ ] Deployed to test: `npm run deploy:test` — n/a: nothing that ships
- [ ] Smoke-tested on `test.lannacare.org` — n/a: nothing deployed changed
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change covers both edges — n/a: no banding
- [ ] Evidence pasted into this plan is the tool's actual output, unedited — n/a: the quoted lines are the script's own output, abridged to the line that matters
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed; the purge itself was checked on both sites
- [ ] `deploy: production → Supabase project <ref>` line read — n/a: no deploy
- [ ] `strip-baked-env` seen in the deploy output — n/a: no deploy
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable
- [ ] Does this PR contain both a migration and code that reads it — n/a: no migration
- [ ] `apply-migrations --env production --dry-run` — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration
- [ ] Rollback position stated — n/a: nothing deployed; reverting restores the refusal

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | Release procedure still said UAT's purge refuses, after `#prg4z` | fixed here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

(Empty on purpose: the purge and both asset checks were run from this session.)

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-11-09

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no user-facing surface changed and the manual list is empty

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — pending: done when the PR is opened
- [ ] Handed to the production release manager — n/a: a release-machine script only

Result: pass

Release manager acknowledgement: pending: at the release this lands in
