# Feature test plan

## Header

| | |
|---|---|
| Feature | Pi failover: the public desexing sign-up carries the request id as its row id (0297), so `/services/desexing` can go on `WRAPPED_WRITE_PATHS` |
| Backlog item | `docs/backlog.md` → **DONE 2026-11-01 (`0297`, `claude/desexing-anon-id`)** (Security) |
| Branch / worktree | `claude/desexing-anon-id` @ `C:\Development\Animal_Shelter_desexing-anon-id` |
| Dev server | `node scripts/worktree.mjs dev` (not started: change proved over the API) |
| PR | see the PR this plan is committed on |
| Tested by / date | Claude (automated), 2026-11-01 |
| Carries a migration? | yes |
| Tested at SHA | SHA_PLACEHOLDER |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — anon may supply the sign-up's `id`, the form sends a request id as it, a replay is answered as done, and the address is listed
- [x] Files/areas touched listed — `supabase/migrations/0297_desexing_signup_request_id.sql`; `src/app/services/desexing/{actions.ts,SignupForm.tsx}`; `src/lib/write-requests.ts` (one list entry); `scripts/check-wrapped-write-paths.mjs` (new `row-keyed` declaration, outside the brief's named files, needed by deliverable 3); backlog; decision file; this plan
- [x] Roles affected identified — by card: none; the only principal touched is the public (anon), which holds no cards
- [x] Anything explicitly **out of scope** written down — `admin/security` and `admin/security/verify` stay unwrapped on purpose

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in before the PR
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`. Output pasted under **Evidence** below
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — 0297 after 0296
- [x] `--status` reviewed — 297 applied, 1 pending before apply
- [x] `--dry-run` reviewed — `0297 … ok`
- [x] Applied to **dev** — applied
- [x] File is re-runnable — the grant is idempotent and the function is `create or replace`
- [x] Existing rows still read correctly — no column or row changed; only a grant and a function body
- [x] Constraints and defaults exercised against real rows — a fresh id wrote a row; the omitted-id default is unchanged
- [ ] Down-migration written — n/a: additive; code can be reverted alone and the grant and function are harmless left in place
- [ ] Production apply plan stated — n/a: applied by the release manager with the release; see section 8

## 4. Functional checks

Driven as **anon** over REST on dev with the real anon key (the form's own credential). The browser form was not driven.

- [x] Happy path works end to end — a fresh request id inserted a row (201)
- [x] Data persists — read back as service role: exactly two rows for three posts
- [ ] Create / edit / delete all exercised — n/a: only create exists on this path
- [ ] Empty state renders sensibly — n/a: no rendering change
- [x] Invalid input is rejected with a readable message — a non-uuid id is refused in the action before the insert; field checks are unchanged
- [x] Boundary cases checked — same id twice: both 201, ONE row; fresh id: a second row. Replay-after-full is by construction (the new step sits above the capacity test) and was not exercised

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | unchanged | n/a: no gate changed |
| management | n/a | unchanged | n/a: no gate changed |
| staff | n/a | retired role | n/a |
| doctor | n/a | unchanged | n/a: no gate changed |
| volunteer | n/a | unchanged | n/a: no gate changed |
| signed out | the sign-up | can sign up; a replay quietly succeeds | proved over REST as anon |

- [x] Every role above tested — only anon is touched; a signed-in person using the form still goes through the same anon client by design
- [x] A role that should not have access is blocked server-side — anon still cannot select, update or delete sign-ups; the grant adds INSERT on `id` only and status stays forced to `new`

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: nothing a reader sees changed
- [ ] Translatable strings — n/a: no new string
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: form not driven in a browser
- [x] Network clean — three posts answered 201, no error bodies

## 6. Regression

- [x] The pages nearest the change still work — the page type-checks and builds; the sign-up path was proved over REST
- [x] Any shared file touched checked from a second, unrelated page — `check-wrapped-write-paths.mjs` reports every other module as before (only the two security addresses unwrapped)
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates re-run after the merge

## 7. Documentation

- [x] Backlog item ticked — retitled DONE; the Pi-failover sweep item's mention updated
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-11-01-desexing-anon-id.md`
- [x] `README.md` still accurate — it does not describe write paths
- [ ] **Release notes.** — n/a: production is behind on 0292 and 0297, so a note would promise something not live
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decision files were measured, not reasoned.** Row counts were read back from the database; check numbers are the script's own output; the one thing reasoned (replay after full) is labelled as such

## 8. Pre-production gate

**Runtime behaviour on the Worker changes for `/services/desexing`**, but nothing is live until 0292 and 0297 are applied on production. Deploy-time lines are `deferred:`.

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager. Sign a pet up to an open drive; re-send the same POST
- [ ] Timezone-sensitive behaviour proved — deferred: release manager. Nothing derives a date
- [ ] Boundary or banding change covers both edges — deferred: release manager. No threshold changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — see **Evidence**
- [ ] Public pages re-checked after a cache purge — deferred: release manager. Page markup unchanged

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in production — deferred: release manager. None added

### Migration ordering — *skip if no migration*

- [x] Does this PR contain both a migration and code that reads it? — yes, deliberately one PR; the grant and the app half are useless apart
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Backup for a destructive migration — n/a: not destructive
- [ ] Apply plan stated — deferred: release manager. Apply 0297 before the code ships: the new code sends `id`, which anon without the grant would be refused

### Rollback

- [x] Rollback position stated — revert the PR (list entry, form and action); the grant and function are harmless left in place

## Left for manual verification

| What | Where | Who |
|---|---|---|
| Sign a pet up through the real form on an open drive; confirm one row. With the Pi stopped, press Sign up twice | test.lannacare.org | Lutan |

Automated checks by: Claude  Date: 2026-11-01

Manual verification by: pending: the real form was not driven in a browser

## Result

Result: pass

## Evidence

`check-wrapped-write-paths.mjs --all`: before 3 unwrapped / 146 of 149 complete; after 2 unwrapped (the security pair) / 147 listed / 147 of 149 complete, measured on this branch. `check-hard-coded-security.mjs`: `no coded security outside the Admin bypass` before and after.

GATES_PLACEHOLDER
