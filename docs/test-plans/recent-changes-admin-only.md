# Feature test plan — recent-changes-admin-only

## Header

| | |
|---|---|
| Feature | `/admin/recent-changes` gated by `requireAdminUser()`; `audit.view`/`audit.undo` retired; new `activities-grantable` check |
| Backlog item | `docs/backlog.md` → **MAKE RECENT CHANGES ADMIN-ONLY HONESTLY, AND ADD THE CHECK FOR AN ACTIVITY NO CARD GRANTS** |
| Branch / worktree | `claude/recent-changes-admin-only` @ `C:\Development\Animal_Shelter_recent-changes-admin-only` |
| Dev server | not driven in the browser (see section 4) |
| PR | see the PR |
| Tested by / date | Claude / 2026-11-02 |
| Carries a migration? | yes — `0301_retire_audit_activities.sql` |
| Tested at SHA | 62922be0 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — Recent changes is Admin-only honestly, two ungrantable activities retired, and a check for any activity no card grants
- [x] Files/areas touched listed — recent-changes page and actions, `/admin` landing, catalogue, routes, both dictionaries, manual topic, `0301`, `permission-probes.mjs`, `check-permission-catalogue.mjs`, `readonly-checks.mjs`, docs
- [x] Roles affected identified — Admin unchanged; no card ever granted either activity, so no other login could open the page
- [x] Anything explicitly **out of scope** written down — the ten other ungranted activities the new check reports are left for Lutan; `cards.ts` and `recent-changes.ts` untouched

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — ran; `origin/main` merged cleanly
- [x] `node scripts/gates.mjs`, four gates, unedited:

```
=== gates: build exited 0 after 120s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main` — `0301`, assigned by the planner (the sibling stream owns `0301`)
- [x] `--status` reviewed before applying — dev had only 0301 pending
- [x] `--dry-run` reviewed — `ok`
- [x] Applied to **dev** and recorded in `schema_migrations` — `applying 0301_retire_audit_activities.sql … ok`
- [x] File is re-runnable — guard then `delete … where key in`, a no-op on a second run
- [x] Existing rows still read correctly after the change — only two `permission_activities` rows deleted; the guard proved no `card_grants` or `role_permissions` row named either
- [ ] Constraints and defaults exercised in a `begin; … rollback;` harness — n/a: the migration adds no constraint or default; its own guard and post-check raise on any holder or any policy or view naming the keys, and passed on dev
- [x] Down-migration — not needed: nothing granted these activities, and nothing asked them
- [x] Production apply plan — `0301` on `dbkodyyxxhtygxcxmfcu` with the next release; code and migration are order-independent (check A is a lint, not runtime)

## 4. Functional checks

- [ ] Happy path works end to end — n/a: the page body is unchanged and only its gate changed; a signed-in browser drive was not run in this session, so see Left for manual verification
- [ ] Data persists — n/a: no data path changed
- [ ] Create / edit / delete all exercised — n/a: Undo logic is untouched; only its guard became `hasAdminRole()`
- [ ] Empty state renders sensibly — n/a: unchanged
- [ ] Invalid input is rejected — n/a: no input changed
- [ ] Boundary cases checked — n/a: none

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | page, Undo, landing tile | all | pending: browser drive |
| management | nothing | refused | n/a — no card ever granted `audit.view`; guard is `perms.isAdmin` only |
| staff | nothing | refused | n/a — retired role |
| doctor | nothing | refused | n/a — as management |
| volunteer | nothing | refused | n/a — as management |
| signed out | nothing | login | n/a — `requireAdminUser()` redirects to /login |

- [ ] Every role above tested — n/a: not driven; the guard is the same function `/admin/assistant` and `/admin/security` use, pinned by `check-permission-catalogue.mjs` (F)
- [ ] A role that should not have access is blocked server-side — n/a: see above; `undoChange` asks `hasAdminRole()` server-side

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: the entry was `menu: false`; the `/admin` tile is now in the Admin-only list
- [x] Manual updated — the topic is `adminOnly: true` instead of `activity: "audit.view"`
- [ ] Translatable strings — n/a: only two retired labels removed, in both dictionaries
- [ ] Mobile viewport — n/a: no layout change
- [ ] Browser console clean — n/a: not driven
- [ ] Network clean — n/a: not driven

## 6. Regression

- [x] The pages nearest the change still work — the build compiles every route; `check-permission-catalogue.mjs` (A–G), `check-home-screens.mjs`, `acceptance-matrix.mjs --check` and `check-activity-lists.mjs` are green in the lint gate
- [ ] Any shared file touched checked from a second page — n/a: shared files changed are registries and dictionaries only, by key removal; the build and checks above read them
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Decision file — `docs/decisions/2026-11-02-recent-changes-admin-only.md`
- [x] `README.md` still accurate — it does not name these activities
- [ ] **Release notes.** — n/a: Admin already was the only one who could open the page; nobody would notice
- [x] Commit messages say why
- [x] Claims were measured — the ten other findings are the live `activities-grantable` output on dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: no date logic
- [ ] Boundary or banding change — n/a: none
- [ ] Evidence pasted is the tool output, unedited — deferred: release manager for deploy output; the gates above are unedited
- [ ] Public pages re-checked — n/a: public site unaffected

### Deploy safety

- [ ] `deploy: production` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] New secret/env var — n/a: none

### Migration ordering — *skip if no migration*

- [ ] Migration and code that reads it in one PR? — n/a: the code does not read the migration's effect; either order works
- [ ] `--env production --dry-run` clean — deferred: release manager
- [ ] Destructive migration backup — n/a: deletes two unused catalogue rows, guarded
- [ ] Apply plan stated — deferred: release manager, `0301` with the next release

### Rollback

- [ ] Rollback position stated — n/a: the reverse is re-inserting two `permission_activities` rows plus the old code; nothing depends on them

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | The backlog item said no migration was needed; check A requires one | fixed — `0301`, recorded in the decision file |
| 2 | info | `activities-grantable` reports ten other ungranted activities | deferred to backlog — listed in the PR for the planner to file |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as Admin: the Recent changes tile opens and Undo is drawn. A card-only login cannot open `/admin/recent-changes` | dev or test site |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-02

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: item 1 is outstanding, see above

Manual verification by: pending: Admin browser check of the Recent changes tile and Undo

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handled at release

Result: pass with accepted defects

Release manager acknowledgement: n/a
