# Feature test plan

## Header

| | |
|---|---|
| Feature | Widen the deploy DNS-blackout retry window |
| Backlog item | `docs/backlog.md` → `#dnsgp` |
| Branch / worktree | `claude/dns-retry-window` @ `C:\Development\Animal_Shelter_dns-retry-window` |
| Dev server | n/a, a deploy-script change |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-28 |
| Carries a migration? | no |
| Tested at SHA | f08c03f8f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified — n/a: deploy tooling only; no card, no page, no signed-out surface
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Changed: `scripts/lib/dns-retry.mjs` (waits 5/10/20/30 s instead of 2 x 5 s), `scripts/deploy.mjs`
(uses the per-retry wait, prints a line every 5 s while waiting), `scripts/dns-retry.test.mjs`.
Out of scope: the cause (VPN), any network change, running a deploy, the runbook files.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — four gates, every `<N>` is `0`

```
=== gates: typecheck exited 0 after 85s
=== gates: lint exited 0 after 239s
=== gates: test exited 0 after 57s
=== gates: build exited 0 after 272s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] Status reviewed — n/a: no migration
- [ ] Dry-run reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [ ] Existing rows — n/a: no migration
- [ ] Constraints harness — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — n/a: no data; a deploy script
- [ ] Create / edit / delete — n/a: no data; a deploy script
- [ ] Empty state — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Happy path is the unit test walking the 23 s episode through the real exported schedule (it fails on the
old 2 x 5 s). Invalid input: empty or missing trace, `EAI_AGAIN`, non-`getaddrinfo` ENOTFOUND, success
status: none retries (existing tests, still passing). Boundary: the limit at `DNS_RETRY_MAX - 1` and
`DNS_RETRY_MAX`. `node --check scripts/deploy.mjs` passes. A real blackout cannot be summoned, so no
live deploy was run.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| n/a | no app surface | n/a | n/a |

- [ ] Every login above tested — n/a: no app surface
- [ ] Server-side block — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry — n/a: no UI
- [ ] Manual — n/a: no UI
- [ ] Translatable strings — n/a: no UI
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Shared file checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

Checked: all seven `dns-retry` tests and the full test gate.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a deploy-script retry; no shelter user, Admin or product administrator sees any change

`#dnsgp` is not fully closable: a note records what this closed and the two parts still open.

- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is tip of main — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone behaviour — n/a: no dates
- [x] **For a boundary or banding change, the assertions cover both edges of the band and both sides of the boundary — not only the case the bug report named.**
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.**
- [ ] Public pages — n/a: no public page touched

### Deploy safety

- [ ] Project ref line read — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover**

Revert the commit; nothing deployed reads it, so nothing on the Pi or Worker changes.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none: no screen to look at | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person.

Manual verification by: n/a: no screen; a deploy-script change proven by unit test

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR links this file
- [ ] Handed to the production release manager — pending: the next release's pre-deploy pass

Result: pass

Release manager acknowledgement: pending: next release
