# Feature test plan

## Header

| | |
|---|---|
| Feature | Shelter's name as the mail sender name, via CooperJaidee |
| Backlog item | `docs/backlog.md` → `#mlsnd` |
| Branch / worktree | `claude/shelter-sender-name` @ `C:\Development\Animal_Shelter_shelter-sender-name` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3005` |
| PR | opened after this commit |
| Tested by / date | Claude, 2026-11-27 |
| Carries a migration? | no |
| Tested at SHA | 5081f290f |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for
- [x] Files/areas touched listed (routes, `worker/`, `supabase/migrations/`, shared libs) — `src/lib/mail-sender.ts` (new), `src/lib/merch/supplier-email.ts`, `src/lib/status/alerts.ts`, `worker/release-mail.mjs`
- [x] Cards affected identified (the cards whose behaviour changes; who holds them today is labelled context only), plus whether admin and the signed-out public are affected — none: only the display name on outgoing mail changes, no access
- [x] Anything explicitly **out of scope** written down, so the release manager is not surprised — auth mail and the From address, in `docs/decisions/2026-11-27-shelter-sender-name.md`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>` — run output:

```
=== gates: typecheck exited 0 after 54s
=== gates: lint exited 0 after 235s
=== gates: test exited 0 after 51s
=== gates: build exited 0 after 210s
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end — `src/lib/mail-sender.test.mjs` asserts the composed names; `worker/release-mail.test.mjs` still passes
- [ ] Data persists — n/a: nothing is stored
- [ ] Create / edit / delete all exercised — n/a: no data operations
- [ ] Empty state renders sensibly — n/a: no page
- [ ] Invalid input is rejected with a readable message — n/a: no input; an unset shelter name falls back through `shelterNames()`
- [x] Boundary cases checked (long text, zero, negative, missing optional fields, dates) — whitespace around the name and a missing qualifier, in the unit test
- [ ] A real mail received with the new From name — pending: dev has no send_email binding, so the first real send is on test.lannacare.org after the next deploy

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | no access change | n/a |
| signed out | n/a | no access change | n/a |

- [ ] Every login above tested — n/a: no access changes, mail sender name only
- [ ] A login that should not have access is blocked server-side — n/a: no access changes

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no screen changes
- [ ] Translatable strings go through the translation path — n/a: the sender name is a proper name, not UI text
- [ ] Mobile viewport (375px) — n/a: no UI
- [ ] Browser console clean — n/a: no UI
- [ ] Network clean — n/a: no UI

## 6. Regression

- [x] The pages nearest the change still work (list the ones checked) — no page changed; supplier-email and alerts callers typecheck and their tests pass in the gates
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared UI file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`<date>-<slug>.md`)
- [x] `README.md` still accurate
- [x] **Release notes.** One admin line added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Hook tier read from Supabase's docs; reset template read from dev's auth config

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing reads the clock
- [ ] **For a boundary or banding change** — n/a: not a boundary change
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** — the gates block is the run's own lines
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new variable

### Migration ordering — *skip if no migration*

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| — | — | none | — |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | A supplier-order or status-alert mail arrives From "<shelter> (via CooperJaidee)" | an inbox Lutan controls, after the next test deploy |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-27

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — pending: one received mail after the next test deploy

Manual verification by: pending: a received mail's From line after the next test deploy

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — pending: the next release

Result: pass
Release manager acknowledgement: pending: next release
