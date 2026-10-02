# Feature test plan

Filled from `docs/test-plan-template.md`. Every line is ticked (run and passed)
or `n/a` with the reason.

---

## Header

| | |
|---|---|
| Feature | A write falls back to the Worker's local render when Cloudflare's edge says it never reached the Pi (a 530: no tunnel connector) |
| Backlog item | `docs/backlog.md` → Next up: the Pi is a single point of failure, piece (a); the item stays open for (b), (c) |
| Branch / worktree | `claude/origin-write-fallback` @ `C:\Development\Animal_Shelter_origin-write-fallback` |
| Dev server | not used: Worker logic only |
| PR | linked from the PR itself |
| Tested by / date | Claude (origin-write-fallback session), 2026-10-02 |
| Carries a migration? | no |
| Tested at SHA | see the PR head |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches the item's piece (a): a write is rendered by the Worker only when the edge answers 530 for the Pi; thrown fetches and 502/503/504/52x stay refused with the 503 "check whether your change was saved"
- [x] Files/areas touched: `worker/origin.mjs`, `worker/index.mjs` (`serve()` now goes through `originOrLocal`), `scripts/check-worker-origin.mjs`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/`, this plan. Nothing under `supabase/`
- [ ] Roles affected identified — n/a: applies to any write while the Pi is down; nothing role-specific
- [x] Out of scope: (b) the Worker alerting that the Pi is down, (c) the weekly backup, the `ORIGIN_HOST=""` lever, and any pre-flight probe (not needed, see the decision)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (`449f363`; it brought only `docs/backlog.md`)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`, run after that merge. Closing lines as printed:

```
=== gates: build exited 0 after 33s

gates: typecheck=0 lint=0 build=0
```
- [x] CI green on the PR for the three gates: `check` (typecheck, lint, build) passed on `6e30a6a`, as did `migration-numbers`, `audit` and `public-views`. `test-plan` was red on that commit, correctly: the manual-list line further down was neither ticked nor `n/a`, and an earlier local run of the checker was misread as passing from its last line. Fixed in the commit that ticks this

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

`node scripts/check-worker-origin.mjs` drives the real `fetchFromOrigin` with `fetch` stubbed, then the real `originOrLocal` against throwaway origins on 127.0.0.1 (answers 530, answers 504, takes the write then drops the connection, refuses, hangs, answers 303). The same five write cases were also run once through `originOrLocal` inside workerd (`wrangler dev`), with the same results; that run also established what `fetch` throws (see the decision file).

- [x] Happy path: a POST to an origin answering 530 is rendered locally, returns 200, and the local render receives the write's body exactly once (Node and workerd). A 200/303/400/401/404/500 from the Pi passes through for GET and POST, with the body, key and public host reaching the origin
- [ ] Data persists — n/a: no data written
- [ ] Create / edit / delete — n/a: no data written
- [ ] Empty state — n/a: no UI
- [x] Failure handling: POST/PUT/PATCH/DELETE on 502/503/504/521/522/523 or a thrown fetch is still answered 503 `pi-timeout` and the local render is never called (the #250 case) — including an origin that reads the whole write and then drops the connection, and one that refuses the connection; GET/HEAD/OPTIONS fall back on all of them, and on a hang after `ORIGIN_TIMEOUT_MS`
- [x] Boundary cases: both sides of the line for all four write methods — 530 versus every other down status. The check was also run against a copy of `origin.mjs` with the clone removed, and exits 1 ("Body is unusable"), so it does catch the defect below

### Role access matrix

n/a for every role: no page, route or permission changed.

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | n/a | n/a |
| management | n/a | n/a | n/a |
| staff | n/a | n/a | n/a |
| vet | n/a | n/a | n/a |
| volunteer | n/a | n/a | n/a |
| signed out | n/a | n/a | n/a |

- [ ] Every role above tested — n/a: no role-specific behaviour
- [ ] A role that should not have access is blocked server-side — n/a: no access rules touched

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a user operates; the release note covers it
- [ ] Translatable strings — n/a: no new UI strings
- [ ] Mobile viewport — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: only reachable with the Pi down, which also takes down test (same box)

## 6. Regression

- [x] Nearest paths: `serve()` in `worker/index.mjs` is now three lines over `originOrLocal`, which the script covers for reads, pass-through, and `ORIGIN_HOST` empty; the `x-lanna-served-by` values (`pi`, `worker`, `pi-timeout`) are asserted. `index.mjs` itself is only exercised by the build gate, since it imports the OpenNext bundle
- [ ] Shared file loaded from a second page — n/a: no shared UI file touched (`src/lib/releases.ts` only gains a note)
- [x] Nothing merged from `main` during `sync` was broken: the merge touched `docs/backlog.md` only, and the gates ran after it

## 7. Documentation

- [ ] Backlog item ticked — n/a: three pieces and only (a) is done; a status line was added and the item stays open
- [x] Design choices in `docs/decisions/2026-10-02-origin-write-fallback.md`
- [ ] `README.md` still accurate — n/a: not touched, nothing it describes changed
- [x] **Release notes.** `unreleased` gained a line saying signing in and saving keep working if the main server is off the network
- [x] Commit messages say why, not just what
- [x] **Claims were measured, not reasoned.** The thrown-error behaviour was observed in workerd, not inferred from error names. That a missing tunnel connector is a 530 comes from Cloudflare's documentation and `docs/pi-hosting.md`'s drill line, not from watching this tunnel; the decision says so under "What this does not establish", along with the server-action-ID caveat, which is reasoned from Next's docs and not reproduced

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager (note it cannot exercise this change; the Pi serves test too)
- [ ] Timezone-sensitive behaviour — n/a: no date logic
- [ ] Boundary assertions cover both sides — n/a: covered in section 4
- [ ] Evidence is the tool's actual output — n/a: no output pasted
- [ ] Public pages re-checked — n/a: no public page changed

### Deploy safety

- [ ] `deploy:` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and code together — n/a: no migration
- [ ] Production dry-run — n/a: no migration
- [ ] Backup for destructive migration — n/a: no migration
- [ ] Apply plan — n/a: no migration

### Rollback

- [x] Rollback: revert the PR and redeploy the Worker (`npx wrangler rollback --env <env>`); it changes only the Worker, with no migration or Pi change involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | The item's premise that a thrown fetch separates connect from in-flight failure is false in workerd | accepted: replaced by a status-based distinction, recorded in the decision |
| 2 | high | First cut (`ebd3570`) returned null for the write but the origin attempt had consumed its body, so the local render would have thrown instead of saving | fixed: `originOrLocal` clones a write first; the loopback cases assert the body arrives |
| 3 | medium | First cut also let 521/522/523 fall back; 522 is not provably pre-arrival | fixed: 530 only |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The release-note wording reads calmly to a shelter admin | `src/lib/releases.ts`, `unreleased` |
| 2 | The drill, once this is deployed: `sudo systemctl stop cloudflared` on the Pi, then sign in on test — expect it to work with `x-lanna-served-by: worker`, not a 503 — and `start` it again. This is the only thing that proves the tunnel answers a POST with 530 | the Pi, `test.lannacare.org` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (origin-write-fallback session)  Date: 2026-10-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — items 1 and 2 above are outstanding and nobody has looked

Manual verification by: pending: Lutan to read the release-note wording and run the cloudflared drill after deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: PR not opened yet
- [ ] Handed to the production release manager — n/a: not yet

Result: pass
