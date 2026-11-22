# Feature test plan

## Header

| | |
|---|---|
| Feature | Register PLATFORM_SEARCH and guard unregistered environment reads |
| Backlog item | `docs/backlog.md` → #psreg |
| Branch / worktree | `claude/platform-search-register` @ `C:\Development\Animal_Shelter_platform-search-register` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | see the PR for this branch |
| Tested by / date | Claude, 2026-11-22 |
| Carries a migration? | no |
| Tested at SHA | 70bdcd6ab |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the product site's search switch is now registered (closed) so it can reach the Pi, and a lint check fails on any unregistered environment read
- [x] Files/areas touched listed: `wrangler.jsonc`, `scripts/lib/runtime-config.mjs`, `scripts/check-env-registered.mjs`, `docs/env-reads-allowlist.json`, `package.json` (lint)
- [x] Cards affected identified: none; no screen or access rule changes, admin and signed-out unaffected
- [x] Out of scope written down: setting the switch to open, any deploy, `#enqml`'s fix, `#cjseo`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` closing lines, as printed:

```
=== gates: typecheck — npm run typecheck
=== gates: typecheck exited 0 after 74s
=== gates: lint — npm run lint
=== gates: lint exited 0 after 258s
=== gates: test — npm test
=== gates: test exited 0 after 68s
=== gates: build — npm run build
=== gates: build exited 0 after 220s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints and defaults exercised against real rows — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: the value is in the Pi var list and the production vars; robots is closed unset and `closed`, open only on the word `open` (run as functions)
- [ ] Data persists — n/a: no data stored
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [x] Invalid input is rejected: the guard failed on a scratch unregistered name and passed once removed
- [x] Boundary cases checked: unset, `closed` and a typo all read as closed

- [ ] Every login above tested — n/a: no screen or access rule changes
- [ ] A login that should not have access is blocked server-side — n/a: no screen or access rule changes

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work: the build gate compiled robots, sitemap and /platform/about; the `platform-seo` tests ran in the test gate
- [x] Shared file touched (`wrangler.jsonc`, `runtime-config.mjs`) checked by `check-runtime-config.mjs`, which agrees (40 names)
- [x] Nothing merged from `main` during sync was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file added: `docs/decisions/2026-11-22-platform-search-register.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: the product site stays closed; nothing a shelter user sees changes
- [x] Commit messages say why, not just what
- [x] Claims in the commit and decision were measured: the robots and guard results were run, not reasoned

## 8. Pre-production gate

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager
- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change assertions — n/a: no banding change
- [ ] Evidence pasted is unedited tool output — n/a: only the gates output is pasted, unedited
- [ ] Public pages re-checked after a cache purge — deferred: release manager (confirm robots.txt on cooperjaidee.org still says Disallow)
- [ ] Deploy safety: project ref line — deferred: release manager
- [ ] Deploy safety: strip-baked-env line — deferred: release manager
- [ ] New secret/env var exists in production Cloudflare — n/a: a committed wrangler var, no secret
- [ ] Migration ordering — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — deferred: release manager (revert the commit; no migration involved)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| - | - | none | - |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-22

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no screen changes; opening the product site to search engines is Lutan's later decision and is not done here

Result: pass

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the plan file is in the PR
- [ ] Handed to the production release manager — pending: at release time

Release manager acknowledgement: pending: at release time
