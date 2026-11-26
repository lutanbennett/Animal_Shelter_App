# Feature test plan

## Header

| | |
|---|---|
| Feature | wrangler-error-cause: print the real DNS failure behind wrangler's "Unable to resolve" message |
| Backlog item | `docs/backlog.md` → `#wgdns` |
| Branch / worktree | `claude/wrangler-error-cause` @ `C:\Development\Animal_Shelter_wrangler-error-cause` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not used: deploy tooling only) |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-26 |
| Carries a migration? | no |
| Tested at SHA | 6a2a648d8 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the wrangler child spawned by `deploy.mjs` now prints every failed DNS lookup (host, code, errno, elapsed, time), which wrangler's own handler discards
- [x] Files/areas touched listed: `scripts/deploy.mjs` (`wrangler()`), new `scripts/lib/wrangler-net-trace.cjs`, docs (decision, two release-record corrections, backlog tick)
- [ ] Cards affected identified — n/a: deploy tooling; no card, no admin, no public behaviour changes
- [x] Out of scope written down: no wrangler upgrade, no retry, no production deploy, no reproduction of the real fault (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends with every gate `0`:

```
=== gates: typecheck exited 0 after 135s
=== gates: lint exited 0 after 402s
=== gates: test exited 0 after 62s
=== gates: build exited 0 after 235s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end: forced failure via `CLOUDFLARE_API_BASE_URL=https://api.cloudflare.com.invalid/client/v4`, `wrangler whoami` with the preload printed `[deploy net-trace] DNS lookup FAILED: host=api.cloudflare.com.invalid code=ENOTFOUND errno=-3008 syscall=getaddrinfo family=any after=27ms …` immediately before wrangler's "Unable to resolve" error
- [ ] Data persists — n/a: no data; prints to stderr only
- [ ] Create / edit / delete — n/a: no data
- [ ] Empty state — n/a: no UI
- [ ] Invalid input — n/a: no input; a successful lookup prints nothing and is passed through untouched (successful lookups in the same run printed no trace line)
- [x] Boundary cases checked: exit 127 with the libuv assertion occurs identically with and without the preload, so it is wrangler's teardown, not the trace

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a: no page | — | — | — |

- [ ] Every login tested — n/a: no page or server surface
- [ ] Server-side block — n/a: no page or server surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual updated — n/a: no user-facing change
- [ ] Translatable strings — n/a: no UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] Nearest code still works: `node --check scripts/deploy.mjs` passes and the preload path resolves from `deploy.mjs` via `fileURLToPath`; the gates pass
- [ ] Shared file checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken (already up to date)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, with what it does not close
- [x] Decision file `docs/decisions/2026-11-26-wrangler-error-cause.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: deploy tooling run only by the release manager; no shelter user or Admin sees anything appear, move or disappear
- [x] Commit messages say why, not just what
- [x] Claims measured: the classifier was read in the installed source and upstream; the trace output and the 127-without-preload comparison were run

## 8. Pre-production gate

- [ ] Tested SHA is tip of main at deploy — deferred: production release manager
- [ ] Deployed SHA matches — deferred: production release manager
- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on test — deferred: production release manager
- [ ] Timezone-sensitive — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [x] Evidence pasted is the tool's actual output, unedited
- [ ] Public pages re-checked — n/a: no public page change
- [ ] Production ref line read — deferred: production release manager
- [ ] strip-baked-env seen — deferred: production release manager
- [ ] New secret/env var — n/a: none added
- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup fresh — n/a: no migration
- [ ] Apply plan — n/a: no migration
- [ ] Rollback position — n/a: reverting this commit removes only a stderr trace; nothing deployed changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The next production deploy that fails with "Unable to resolve" also prints a `[deploy net-trace]` line | the deploy terminal |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-26

### Manual verification

- [ ] The manual list above is checked by a person — pending: the next production deploy prints the underlying cause

Manual verification by: pending: the next production deploy prints the underlying cause

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: picked up at the next release

Result: pass

Release manager acknowledgement: pending: next release
