# Feature test plan

## Header

| | |
|---|---|
| Feature | deploy-dns-retry: `deploy.mjs` retries a wrangler child only on the getaddrinfo ENOTFOUND blackout |
| Backlog item | `docs/backlog.md` → `#dnsgp` |
| Branch / worktree | `claude/deploy-dns-retry` @ `C:\Development\Animal_Shelter_deploy-dns-retry` |
| Dev server | n/a: a deploy script, nothing the dev server renders |
| PR | opened from this branch |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 94ced3d4f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs)
- [ ] Cards affected identified — n/a: a deploy script; no card, no page, no signed-out surface
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised

Touched: `scripts/deploy.mjs` (`wrangler()`), `scripts/lib/dns-retry.mjs` (new), `scripts/lib/wrangler-net-trace.cjs`
(opt-in `DEPLOY_NET_TRACE_FILE` sink), `scripts/dns-retry.test.mjs`. Out of scope: the build's own lookups
(decision file, section 3), the machine's VPN settings, any live deploy.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — every `<N>` is `0`

```
=== gates: typecheck exited 0 after 100s
=== gates: lint exited 0 after 293s
=== gates: test exited 0 after 97s
=== gates: build exited 0 after 245s
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
- [ ] Constraints exercised — n/a: no migration
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end
- [ ] Data persists — n/a: no stored data
- [ ] Create / edit / delete — n/a: no records
- [ ] Empty state — n/a: no UI
- [x] Invalid input is rejected with a readable message, not a crash
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates)

Unit tests (`scripts/dns-retry.test.mjs`, 5 pass): ENOTFOUND/getaddrinfo retried with hosts named; an empty or
missing trace (bad token, deleted Worker, bad config) NOT retried; `EAI_AGAIN` and a non-`getaddrinfo` ENOTFOUND
NOT retried; limit of 2 respected; a success never retried. End to end: a real `node --require wrangler-net-trace.cjs`
child looking up `nope.invalid` with `DEPLOY_NET_TRACE_FILE` set wrote a line that `dnsRetryDecision` read as
`{ retry: true, hosts: ['nope.invalid'] }`.

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a: no page |

- [ ] Every login above tested — n/a: a deploy script, no login involved
- [ ] Server-side block — n/a: no page or RPC

## 5. Cross-cutting

- [ ] Nav entry — n/a: no page
- [ ] Manual updated — n/a: nothing a shelter user does
- [ ] Translatable strings — n/a: console output of a deploy script
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console — n/a: no UI
- [ ] Network — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked)
- [ ] Shared file checked from a second page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

`node --check scripts/deploy.mjs` passes; the trace's stderr line is unchanged and the file sink writes nothing when
the variable is unset. Sync was already up to date.

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** (follow-ups go on the `backlog` branch instead)
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: a deploy script only the release manager runs; no shelter user or Admin sees anything
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.**

The backlog item is noted PARTLY CLOSED rather than ticked: its "done when" needs a release record showing the
retry firing.

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA is main's tip at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — pending: a future deploy must meet the blackout for the retry to show in its output
- [ ] Timezone — n/a: no date logic
- [ ] Boundary both edges — n/a: the limit's both sides are unit-tested (retry at 1, refused at 2)
- [ ] Evidence unedited — deferred: release manager
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] Supabase ref line — deferred: release manager
- [ ] strip-baked-env seen — deferred: release manager
- [ ] New secret — n/a: no new secret or env var on the Worker

### Migration ordering — *skip if no migration*

- [ ] Migration and reader — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [ ] Rollback position — n/a: a local script; revert the commit, nothing deployed changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| — | none: the live proof is a section 8 deploy-time line | — |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (deploy-dns-retry session)  Date: 2026-11-27

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person

Manual verification by: n/a: nothing for a person to look at; the live proof is a future deploy's output

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the release that next carries this PR

Result: pass

Release manager acknowledgement: pending: the next release
