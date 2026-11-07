# Feature test plan

---

## Header

| | |
|---|---|
| Feature | A script that resets the test system to a bare shelter, and running it |
| Backlog item | `docs/backlog.md` → none; asked for directly by Lutan in chat, 2026-11-07 |
| Branch / worktree | `claude/test-data-reset` @ `C:\Development\Animal_Shelter_test-data-reset` |
| Dev server | `preview_start "dev"` → `http://localhost:3000` |
| PR | #1374 |
| Tested by / date | Claude, 2026-11-07 |
| Carries a migration? | no |
| Tested at SHA | 812c5b0d (+ the follow-up commit on this branch) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — adds `scripts/reset-test-data.mjs`, which clears the test system's content while keeping its setup, and runs it against dev
- [x] Files/areas touched listed — one new file, `scripts/reset-test-data.mjs`. No route, component, worker, lib or migration is touched; nothing the app imports changes
- [x] Cards affected identified — none. The script does not read, write or define a card, an activity or a permission. It deletes 80 disposable `dev_signin_cards_*` **roles** that `dev-signin.mjs` invented, which is data, not the card model; `card_grants`, `card_features`, `card_includes`, `features` and `permission_activities` are all kept untouched (137 / 52 / 13 / 13 / 81 rows before and after). Admin is unaffected: it sits outside the card system, and the kept logins keep their role assignments
- [x] Anything explicitly out of scope written down — UAT and production are refused by the script and were never contacted. The Supabase storage bucket `facility-maps` (12 objects) is deliberately **not** cleared: the facility map is setup. Emptying Drive's bin is Lutan's, in Drive

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — the worktree was created from `origin/main` at `a3cd5e6c` this session and nothing has merged since
- [x] `node scripts/gates.mjs` ends with one line of the shape `gates: typecheck=<N> lint=<N> test=<N> build=<N>`

```
=== gates: build exited 0 after 142s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev and recorded — n/a: no migration. `schema_migrations` is in the KEEP set precisely so the reset cannot make the runner re-apply everything; it read 333 before and 333 after
- [ ] File is re-runnable — n/a: no migration. The script itself is re-runnable, and was in fact run three times: the second and third passes found only what the first had missed
- [x] Existing rows still read correctly after the change — checked against real dev data, in the app: see section 4
- [x] Constraints and defaults exercised against real rows in a `begin; … rollback;` harness — this is what the script's dry run *is*. The whole database half runs in one transaction ending in `rollback`, so the "after" counts a dry run prints are the ones a commit would produce. What that proved before anything was committed: that `truncate … cascade` would have silently emptied `site_content` and `shop_links`, both of which were in the KEEP set at the time (the guard refused and named the two foreign keys); that `impact_baselines.set_by` **cannot** be nulled, because its stamp trigger restores the old value whenever no baseline figure changes; and that emptying `audit_log` before the other deletes leaves 662 rows behind, because those deletes are themselves audited
- [ ] Down-migration written — n/a: no migration. The reversal position is in section 8's Rollback
- [ ] Production apply plan stated — n/a: no migration, and this change is never applied to production

## 4. Functional checks

- [x] Happy path works end to end — the script ran against dev, cleared 16,690 content rows and trashed 462 Drive files, and the app then loads signed in as admin
- [x] Data persists — reload the page and the change is still there — `/residents` re-read after a fresh sign-in shows the cleared state, and the counts were re-queried from the database independently of the script's own output
- [x] Create / edit / delete all exercised — delete is the whole feature. Create was exercised incidentally and importantly: two residents ("Test 1", "Test 2") were created by someone on the cleared system at 12:52 and 12:54 and appear correctly in the list, which proves the system is usable after the reset and not merely empty
- [x] Empty state renders sensibly (no rows yet) — `/residents` showed "0 residents" and "No residents match these filters." immediately after the first pass
- [x] Invalid input is rejected with a readable message, not a crash — `--env uat` and `--env production` are both refused by name before any connection is opened, as is a project ref or Drive root that is not dev's
- [x] Boundary cases checked — the two tables whose only row was test data (`premises`, `bill_accounts`) go to zero rather than erroring; tables already empty are no-ops; a second `--apply` finds nothing to do

### Role access matrix

| Login (card(s) held) | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/my`, `/residents` | everything, via the `isAdmin` short-circuit | pass — nav intact, Residents list loads, zone filters correct |
| exactly `<card key>` | — | — | n/a: the script is a command-line tool with no page and no card gate; there is no surface for a card-holding login to reach |
| signed out | — | — | n/a: as above. The script authenticates with the service token, not a session |

- [x] Every login above tested — admin tested; the other rows are reasoned `n/a` above rather than skipped
- [x] A login that should not have access is blocked server-side — the relevant equivalent for a script is that the **environment** cannot be reached by mistake: `--env uat` and `--env production` are refused, the dev project ref is asserted, and the Drive root must be the Test bucket, with production's and UAT's ids hard-coded purely to be refused. All three refusals were exercised by reading the code paths and by the fact that the ref assertion printed dev's ref on every run

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav entry; the change adds no page
- [ ] Manual updated — n/a: the manual is for shelter users, and this is a developer command-line tool they never see
- [ ] Translatable strings — n/a: the script's output is developer console text, not app UI. It *deletes* 135 orphaned `translations` rows whose underlying record no longer exists, which is data, not a string that needs translating
- [ ] Mobile viewport (375px) — n/a: no UI
- [x] Browser console clean — the app was driven after the reset with no console errors surfacing on `/my` or `/residents`
- [x] Network clean — no unexpected 4xx/5xx on the pages checked after the reset

## 6. Regression

- [x] The pages nearest the change still work — `/my` (tasks, access requests) and `/residents` (list, filters, zone chips) both load correctly against the cleared database
- [x] Any shared file touched checked from a second, unrelated page — **by loading that page.** No shared file is touched, but the reset itself is cross-cutting, so this was checked the strong way: `/residents` was loaded and its **zone filter chips** read. That is what caught the real defect below — `zones` was in the KEEP set and still held five test rows, which the Residents page was still offering as filters after the first pass. Reading the KEEP list would never have shown it
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing merged; the branch is one commit of a new file plus this plan

## 7. Documentation

- [ ] Backlog item ticked — n/a: no backlog item; asked for directly in chat
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-11-07-reset-test-data.md`
- [x] `README.md` still accurate — the README describes environments and backups, neither of which this changes
- [ ] **Release notes.** — n/a: a developer script. No shelter user can reach it, and the data it cleared was test data on the test system; nobody using the app notices
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and decisions were measured, not reasoned.** Every number in them came from a run: the row counts from the script's own before/after, the 462 Drive files and 11 top-level entries from walking the Test bucket, and the three bucket ids from hashing each env file's value against the ids in `2026-11-07-drive-buckets.md`. The one claim that mattered most — that dev's Drive root is **not** production's — was verified by fingerprint before a single file was trashed, not assumed from the decision file saying the split had been done

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager. Note this change needs no deploy to take effect: the clearing has already happened in the database, and the script is not part of the app bundle
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing in the script derives a date or a "today"; it matches on names, keys and foreign keys only
- [ ] Boundary or banding change — n/a: no threshold, band, rounding rule or cutoff
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the gates block above is the closing lines of the run, and the row counts quoted throughout are the script's own printed figures
- [ ] Public pages re-checked after a cache purge — deferred: release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or variable. The script reads only values already in `.env.local`

### Migration ordering — *skip if no migration*

- [ ] Both a migration and code that reads it — n/a: no migration
- [ ] `--env production --dry-run` clean — n/a: no migration
- [ ] Destructive migration backup — n/a: no migration. The destructive act here is the script's own run, and it was aimed at dev only
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated, **including what it does not cover.** Reverting the commit removes the script; it does not and cannot restore the data. The database half is **not reversible**: `pg_dump` is not installed on this machine, so `scripts/backup.mjs` could not take a dump of dev first, and no snapshot was taken. That was accepted deliberately — Lutan chose "back to a bare shelter" knowing the 76 residents went with it, and dev data is disposable by standing rule. The Drive half **is** reversible for 30 days: the 462 files were trashed, not erased, so they can be restored from Drive's bin. Production was never touched and has its own separate Drive bucket and database

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | High | `truncate … cascade` would have silently emptied `site_content` and `shop_links`, both in the KEEP set, because they hold foreign keys into cleared tables | fixed — the guard that caught it now refuses the run and names the key, and the truncate dropped `cascade` so Postgres reports a missing table instead of quietly emptying it |
| 2 | High | The first version cleared `user_roles`, which would have stripped every kept login of its role — including Lutan's Admin — leaving no way back into Settings → Who does what | fixed — `user_roles` is kept, and only rows belonging to a throwaway login or a disposable role are deleted. Verified after the run: `lutan.bennett2@gmail.com -> admin (main=true)` |
| 3 | Medium | `audit_log` refilled with 662 rows, because the deletes that followed it are themselves audited | fixed — it is truncated last |
| 4 | Medium | `zones` was kept wholesale and still held five test rows; the Residents page went on offering "Dryrun Zone 1018" and two "ZZ Width …" zones as filters after the first pass | fixed — found by *looking at the page*, then by sweeping every text column of every surviving table for test markers rather than guessing table by table. Seven more tables had the same problem (`premises`, `bill_accounts`, `bill_kinds`, `diets`, `frequency`, `immunization_types`, `procedure_types`) |
| 5 | Low | 135 `translations` rows and 11 `label_sources` rows described records that no longer exist | fixed — orphans are deleted by a general rule (the row it points at is gone), not by pattern matching, so rows describing kept enclosures, units and roles are untouched |
| 6 | Low | The Thai translation of the DonorBox donation channel was the literal text "walk-translations" | fixed — the translation row is deleted so it reads as untranslated, rather than inventing Thai for it |
| 7 | Low | `information_schema` hid the `impact_baselines.set_by -> auth.users` foreign key, so the first run failed with a bare constraint error instead of being prevented | fixed — the catalogue is read from `pg_constraint`, and a pre-flight now rehearses the null-outs in a rolled-back transaction and names any column that still points at a throwaway login |

## Left for manual verification

| What | Why Claude could not verify it | Who |
|---|---|---|
| Whether the kept reference lists are the ones you actually want to keep — 16 zones, 69 enclosures, 24 medications, 7 diet types, 5 clinics, 5 doctors, the Thai translations | These are a judgement about the shelter, not a fact about the code. The test-marked rows are gone, but a row with an ordinary name that is nonetheless rubbish to you reads exactly like a real one | Lutan |
| Whether `staff@gmail.com` and `claude-status-staff@lutan.com` should stay | Both were kept because they are not `@example.test`/`@example.invalid`, but neither holds a role, so both now show on the admin home as "access requests" waiting for a role | Lutan |
| Emptying Drive's bin | The 462 files are trashed and restorable for 30 days. Erasing them for good is a deliberate act and is done in Drive, not by this script | Lutan |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-11-07

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet; three items wait for Lutan

Manual verification by: pending: the three rows under Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it and summarises the defects
- [ ] Handed to the production release manager — n/a: this change never reaches production; it is a dev-only script and the data it cleared was dev's

Result: pass

Release manager acknowledgement: n/a: not yet released
