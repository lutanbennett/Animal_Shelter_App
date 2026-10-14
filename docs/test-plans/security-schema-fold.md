# Feature test plan — security-schema-fold

## Header

| | |
|---|---|
| Feature | `0195`: website tables read by permission (F2), audit triggers on nine tables plus `app.actor` (F4), shelter-day defaults (W1) |
| Backlog item | `docs/backlog.md` → the three items filed 2026-10-14 from the database review (ticked) |
| Branch / worktree | `claude/security-schema-fold` @ `C:\Development\Animal_Shelter_security-schema-fold` |
| Dev server | not started — no UI surface in this PR |
| PR | see PR list |
| Tested by / date | Claude / 2026-10-14 |
| Carries a migration? | yes — `0195_security_schema_fold.sql` |
| Tested at SHA | recorded in the PR |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — three small security fixes in one migration
- [x] Files/areas touched listed — `supabase/migrations/0195_security_schema_fold.sql`, `scripts/check-security-schema-fold.mjs`, `docs/backlog.md`, `docs/decisions/2026-10-14-security-schema-fold.md`, this plan
- [x] Roles affected identified — non-website roles lose read of three website tables; nothing visible changes for a visitor
- [x] Anything explicitly **out of scope** written down — the other database-review findings; making the correction scripts set `app.actor`

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
GATES_PLACEHOLDER
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `0195` after `0194`, claimed by the brief
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 195 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — first run asked for grants on the two recreated views; added; second `ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0195_security_schema_fold.sql … ok`
- [x] File is re-runnable — `drop policy/trigger if exists`, `create or replace`
- [x] Existing rows still read correctly after the change — `check-public-views.mjs` exit 0 before and after; `check-app-access-gate.mjs` HARNESS-OK before and after
- [x] **Constraints and defaults exercised against real rows** — `scripts/check-security-schema-fold.mjs` (rolled back): per-role row counts on the three tables (admin/management 1/7/3; doctor, volunteer, head_of_medical, head_of_maintenance, second_in_command 0); anon reads the public views and is refused the base table; one audited update on each of eight tables with rows (`bills_inbox` is empty, trigger present); `app.actor` names the actor with no login; a non-uuid `app.actor` is ignored without raising; `bill_date` default is `shelter_today()`; both round views answer. `HARNESS-OK`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: policies and triggers restore by re-running 0018/0059/0121; the function change is backwards compatible
- [x] Production apply plan stated for the release manager — `0195` on `dbkodyyxxhtygxcxmfcu` with the next release

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; exercised in the §3 harness
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; audited updates in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no UI input
- [ ] Boundary cases checked — n/a: no UI surface; garbage `app.actor` covered in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | site_content/pages/photos | read | 1/7/3 rows |
| management | same | read | 1/7/3 rows |
| doctor, volunteer, head_of_medical, head_of_maintenance, second_in_command | same | none | 0/0/0 |
| signed out | public_site_* views | read; base table refused | 1 and 7 rows; base refused |

- [x] Every role above tested — all live dev roles with a user, in the harness
- [x] A role that should not have access is blocked server-side — the policy refuses, asserted in the harness

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — `/admin/website` and the cashflow forecast keep a reading policy (website.content, reports.cashflow); the public site reads the views, checked by `check-public-views.mjs`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no app file touched
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates ran after sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` — all three, with notes
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-14-security-schema-fold.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no shelter user would notice; behind-the-scenes access and audit changes
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — row counts from the harness; "no reader" by grep (and the script readers it found)

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: the only date change is a column default and two unread views; default read from the catalogue
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager
- [ ] Public pages re-checked after a cache purge — deferred: release manager, the public site must still show its content

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no code change; the app code already works with both policies
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no data rewritten
- [x] Apply plan stated — with the next release

### Rollback

- [x] Rollback position stated — code rollback does not revert `0195` and does not need to

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | Brief said correction scripts set `app.actor`; they do not | deferred to backlog — database half done |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | After production apply: public home page and /admin/website still show content; cashflow forecast still shows the clinic visit estimate | test/production site |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-14

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: the one item is for after the production apply

Manual verification by: n/a: no UI surface changed on dev; the single post-apply look is listed above

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
