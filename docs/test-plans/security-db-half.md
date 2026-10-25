# Feature test plan

## Header

| | |
|---|---|
| Feature | Remove the hard-coded security from the database (migration `0259`) |
| Backlog item | `docs/backlog.md` → *Remove all hard-coded security: a role is a placeholder that gets no permissions until a card is assigned* (database half; app half was #920) |
| Branch / worktree | `claude/security-db-half` @ `C:\Development\Animal_Shelter_security-db-half` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3001` |
| PR | see the PR this plan is pasted into |
| Tested by / date | Claude (`claude/security-db-half`) / 2026-10-25 |
| Carries a migration? | yes — `0259_remove_hard_coded_security_from_the_database.sql` |
| Tested at SHA | `56d06452` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — *no function, view or policy in the database decides access from a column on `roles` any more; the card check beside it is the whole decision.*
- [x] Files/areas touched listed — `supabase/migrations/0259_*.sql`; `src/lib/permissions/can.ts`, `src/lib/home/roles.ts`, `src/app/admin/who-does-what/page.tsx`, `src/lib/contacts/visibility.ts`, `src/lib/residents/who-and-where.ts`, `src/lib/permissions/fixed-for-now.ts`; eight `scripts/check-*.mjs` and `scripts/dev-signin.mjs` (the dropped column); new `scripts/check-no-role-column-security.mjs`; `docs/` (decision, faults log, registry, backlog). **No `worker/` change, no `.github/workflows/ci.yml`, no `scripts/gen-card-walkthrough.mjs`, no `docs/release-procedure.md`** — those belong to `ci-audit-and-walkthrough-fixes` this batch.
- [x] Roles affected identified — admin (**unchanged, proved**), management (unchanged), second_in_command, head_of_medical, head_of_maintenance, volunteer, doctor (all **widened**, measured below), public_viewer (unchanged, still out of the app), signed-out public (unchanged)
- [x] Anything explicitly **out of scope** written down — no card, `card_grants` row or cell was created, for any role and specifically not the doctor (Card review 2 owns that); the four remaining scope columns and `opens_app` are left on `roles` (nothing reads them; dropping them reaches a dozen scripts); `role_extras` not dropped; `readsWhoAndWhereOnly()` and its six callers left in place. All four are in the decision file.

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (merge `726d19b1`; brought in the other stream's `ci.yml` and `gen-card-walkthrough.mjs` changes, which this branch does not touch)
- [x] `node scripts/gates.mjs` ends with all four at zero. Run after the sync:

```
=== gates: build exited 0 after 42s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers` : `ok — 0259_… (against origin/main 1786dec4, highest 0258_diets_readers_per_serving.sql)`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — 259 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `dry-run 0259_… ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0259_… ok`
- [x] File is re-runnable (`or replace` / `drop … if exists` / `drop column if exists`) — **proved, not assumed**: the whole file was executed a second time against dev after an edit to its comments, and succeeded
- [x] Existing rows still read correctly after the change (checked against real dev data) — every role's reads measured against the real 101 residents, 9 deceased, 4 adopted and ~140 attachments on dev; see the matrix in §4
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness. Eight assertions, each raising on failure, run against real dev rows and rolled back. What was asserted, not merely that it ran:
  - **A1** no function, view or policy in `public`/`private` reads any of the six role columns **in code** — SQL comments are stripped first, exactly as `check-hard-coded-security.mjs` does for `src/`. *A1 caught a real thing on its first run:* `reassign_recurring_job()` matched, and it was a comment of mine recording that the column used to be read. Code clean, comment kept.
  - **A2** `roles.sees_login_emails` no longer exists.
  - **A3** `volunteer_contacts` and `doctor_contacts` no longer exist.
  - **A4** `has_permission()` still contains the `r.key = 'admin'` short-circuit — the thing that must **not** change.
  - **A5** the `admin` role holds **zero cells**, and an Admin login still reads **every** resident through RLS (impersonated, not read from the function body).
  - **A6** that same Admin login reads **every deceased** record, and `may_open_resident_record()` (`0249`) allows it — the archive is a different path from the main list.
  - **A7** `public_viewer`, which holds no cards, is **not** inside the app — kept out by its cards, not by its name.
  - **A8** `holds_app_role()` still lets Admin in without a card.
  - Result: the harness raises on any failure and exited **0**. The same assertions are now a committed script, `scripts/check-no-role-column-security.mjs`, which also exits 0.
- [x] Down-migration written, or the reason one is not needed is stated — **not written, and the reason is the point:** a down-migration would restore clauses that read a role column, which is the thing Lutan has forbidden in those words. The rollback position is a redeploy, not a schema revert; §8 says so. The migration is additive-or-replacing only (no table or data is dropped except the unread `sees_login_emails` column and two views that return nothing).
- [x] Production apply plan stated for the release manager — `0259_remove_hard_coded_security_from_the_database.sql`, production project `dbkodyyxxhtygxcxmfcu`, at the next release. **Apply order does not matter for this one** (see §8): the app half already shipped in #920 and reads none of these columns, so the migration and the code are independent.

## 4. Functional checks

- [x] Happy path works end to end — signed in as Admin on `http://localhost:3001` and loaded `/residents`, `/residents?all=1`, `/residents?status=adopted`, a resident record and `/admin/who-does-what`
- [x] Data persists — reload the page and the change is still there — the counts are the same across reloads and across the `?all=1` / `?status=adopted` navigations
- [ ] Create / edit / delete all exercised — n/a: this PR creates, edits and deletes nothing; it removes clauses from read and write *policies*. What the policies now allow is measured in the matrix below rather than by driving each form.
- [x] Empty state renders sensibly — `/residents?status=adopted` renders its own "Showing adopted residents only" state over 4 rows; the two dropped views were empty by construction before being dropped, which is why they were dropped
- [ ] Invalid input is rejected with a readable message, not a crash — n/a: no input surface changed; `record_attachment()` keeps its existing `raise exception` messages and loses only the clinic-login branches
- [x] Boundary cases checked — the three resident sets were each read separately (current / deceased / adopted), because they come through different paths; a role with **no** cards (`public_viewer`) and a role with **no** cards that is Admin were both checked, as the two ends of `holds_app_role()`

### Role access matrix

Measured by impersonating **one real single-role login per role** through RLS on dev (`set_config('request.jwt.claims', …)` with `role = authenticated`), before the migration and again after. 17 surfaces × 8 roles. **103 surfaces unchanged, 33 changed, and every one of the 33 was a role reading MORE.**

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | **unchanged on every surface** — 101 residents (92 current + 9 deceased), 4 adopted, 9 contacts, all views | **unchanged on all 17 surfaces.** Proved again with a real signed-in login: `92 residents · 9 deceased hidden`, then `101 residents · including 9 deceased`, then `4 residents — Showing adopted residents only`, and an adopted record opened in full |
| management | everything its cards give | unchanged | **unchanged on all 17** |
| staff | — | retired by `0173` | n/a — not a live role |
| doctor | what its cards give | widened; its own-clinic confinement gone | residents 0 → 101, attachments 0 → 141, translation_queue 78 → 129, current_placement 0 → 99, immunization_compliance 0 → 346. **Loses** `doctor_contacts` (dropped) and the visit-report attachment path. No doctor logins on production |
| volunteer | what its cards give | widened to its own `view_residents` card | residents 0 → 101, attachments 0 → 135, current_placement 0 → 99, translation_queue 0 → 129, immunization_compliance 0 → 346 |
| second_in_command / head_of_medical / head_of_maintenance | what their cards give | widened the same way | attachments, current_placement, translation_queue, immunization_compliance all widened; head_of_maintenance also residents 0 → 101 |
| signed out | the public site | unchanged | unchanged; `private.has_app_access()` still refuses |
| public_viewer | the public site | unchanged — still outside the app | unchanged. It is now kept out **by holding no cards** rather than by its name |

- [x] Every role above tested — all eight live roles, by impersonation, before and after
- [x] A role that should not have access is blocked server-side — `public_viewer` is refused by `private.has_app_access()` at the database, asserted in the harness (A7), not checked by looking at the UI

**The two things in this matrix that need a person's judgement, not just a tick**, both recorded in `docs/card-access-faults.md` for Card review 2 and repeated under **Defects**:

1. The widenings in the *card-faithful* group are the rule working: each role holds `view_residents`, which grants `resident.record` at read, and a role column was overriding its own card. If that is too much access, the **card** is wrong.
2. Six views — `current_placement`, `translation_queue`, `immunization_compliance`, `immunization_duplicate_check`, `resident_current_state`, `app_users` — have **no card check at all**. They were gated by `has_app_access()` and a role column and nothing else, so every login in the app now reads them in full. No card was created, per Lutan's instruction.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: not touched; no page was added or removed
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: not touched. Nothing a shelter user is told to do changed; what changed is which rows a role is served
- [ ] Translatable strings — n/a: no new or changed user-facing string in this PR
- [ ] Mobile viewport (375px) — n/a: no layout or component change
- [x] Browser console clean — `read_console_messages` on `/admin/who-does-what` after the change: no errors, no warnings
- [x] Network clean — the pages loaded above returned no 4xx/5xx; `/residents`, `/residents?all=1`, `/residents?status=adopted`, a resident record and `/admin/who-does-what` all rendered

## 6. Regression

- [x] The pages nearest the change still work — `/residents` (list, `?all=1`, `?status=adopted`), a resident record page, `/admin/who-does-what`
- [x] Any shared file touched checked from a second, unrelated page, **by loading it** — `src/lib/permissions/can.ts` lost `Permissions.scopes`, which every page's guard goes through. Loaded `/admin/who-does-what`, a page in a different area from `/residents`, and it rendered its card grid and still printed *"Admin: Everything, always. Admin's powers are a rule, not a setting, so they cannot be taken away."* — so `parsePermissions()` still supplies what an unrelated page expects at runtime
- [x] Nothing merged from `main` during `sync` was broken by this branch — gates re-run clean **after** the merge (§2); the merge brought in `ci.yml` and `gen-card-walkthrough.mjs` from the other stream, neither touched here
- [x] The two live-database checks still clean on dev — `node scripts/check-production.mjs role-cards-coverage --env test` → *"Every held card is covered by its role's access"*; `cards-union --env test` → every role *"exactly the union of its cards"*
- [x] `node scripts/check-hard-coded-security.mjs` exits 0 **and its count has gone down** — the `roles-scope-people` mechanism left the registry entirely rather than being counted down, because the three comments that anchored it now describe history. **Six mechanisms to five.**

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch** — the parent item now reads *DONE, BOTH HALVES*, with the measured result and what is left (the production apply). Also updated: the harness-sweep item, which was **HELD until hard-coded security is removed** — its blocker is gone, so it is no longer held. It is not ticked, because its own work remains
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `docs/decisions/2026-10-25-security-database-half.md`, which leads on *what replaced each function and why that shape*, and records the two shapes that were available and **not** taken
- [x] `README.md` still accurate — checked; it describes environments and deploys, and names none of these functions, columns or views
- [ ] **Release notes.** — n/a: `0259` is applied to production at the next release, so nothing changes for any shelter user until then. The decision file and the backlog item both record that apply as the outstanding step, and the truth rule forbids a note promising something that is not live yet; the note belongs in the PR that confirms it applied. **When it is written it should not be a technical note** — what a user would notice is that some roles see more than they did, and that is Card review 2's outcome to describe, not this PR's
- [x] Commit messages say why, not just what — four commits, each leading with the reason
- [x] **Claims in commit messages and the decision file were measured, not reasoned** — this mattered more than usual here and is worth being specific about. *"The role columns only ever subtracted, so removing them cannot take access away"* is a claim about 108 policies that sounds plausible and could easily have been wrong. It was not reasoned: every role's reads were measured on real dev rows before and after, and the 103-unchanged / 33-widened / 0-lost split is that measurement, not an inference from it. The same applies to Admin: its mechanism was **read on dev before anything changed** (`scope_residents = 'all'`, zero cards, zero cells) rather than assumed from the fact that Admin reaches everything

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing in this PR derives a date, a "today" or any instant; it removes boolean clauses from access predicates
- [ ] **Both edges of a band / both sides of a boundary** — n/a: no threshold, band, rounding rule, retry window or pagination limit is touched. The nearest thing to a cutoff is "a role with at least one cell is in the app", and both ends of it were checked (§4: Admin with zero cells is in; `public_viewer` with zero cells is out)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited** — the `gates:` block in §2, the `check-migration-numbers` line in §3 and the check outputs in §6 are as printed
- [ ] Public pages re-checked after a cache purge — deferred: production release manager

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: this PR adds no secret and no environment variable

### Migration ordering

- [x] **Does this PR contain both a migration and code that reads it?** — **No, and that is what makes the ordering safe.** The `src/` changes here *remove* the last reads of `roles.sees_login_emails`; they do not read anything `0259` creates. The app half (#920) already shipped and reads none of these columns. So the apply and the deploy are independent and may run in either order. The one ordering that would matter is reversed and harmless: if `0259` is applied before this PR's code ships, the old code would select a dropped column on Who does what — so **apply `0259` at or after this PR's deploy**, which is what the release does anyway.
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — deferred: production release manager
- [ ] For a **destructive or rewriting** migration only: a production backup exists and is fresh — n/a: nothing is rewritten and no data is dropped. The only dropped column, `sees_login_emails`, was read by nothing, and the two dropped views return no rows
- [x] Apply plan stated — `0259_remove_hard_coded_security_from_the_database.sql`, production project `dbkodyyxxhtygxcxmfcu`, at or after this PR's deploy. **Then run `node scripts/check-no-role-column-security.mjs --env production`**, which should print three `ok` lines, and re-run `role-cards-coverage` and `cards-union` there

### Rollback

- [x] Rollback position stated, **including what it does not cover** — the rollback is `./scripts/pi/deploy-pi.sh --ref <sha>` on the Pi (`npx wrangler rollback --env production` reverts only the Worker fallback). **Neither reverts `0259`, and no down-migration exists on purpose** — reversing it would mean restoring clauses that read a role column, which is the thing being removed. If the widenings in §4 turn out to be unacceptable on production, **the remedy is to take the card away from the role on Settings → Who does what, not to revert the migration**: that is the whole point of the change, and since `0257` the database applies a card change the moment it is made. The one thing a redeploy cannot undo is the dropped `sees_login_emails` column; nothing reads it, so nothing needs it back

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | **Needs Lutan's eye** | Six views have **no card gate at all** (`current_placement`, `translation_queue`, `immunization_compliance`, `immunization_duplicate_check`, `resident_current_state`, `app_users`): they were gated by `has_app_access()` plus a role column and nothing else, so every login in the app now reads them in full | **Accepted, deliberately.** No card was created, per Lutan 2026-10-25: *"No creating cards just remove permissions."* Each is a row in `docs/card-access-faults.md` for **Card review 2**, which is where card sets get proposed and approved |
| 2 | Low (not live) | The doctor loses `doctor_contacts` (dropped), the visit-report attachment path, and its three `doctor_read_*` policies; its own-clinic confinement is gone with `is_clinic_login()` | **Accepted.** Lowest priority by Lutan's own ranking and **no doctor logins exist on production**. Recorded in the faults log; his remedy is a new set of doctor cards, which is Card review 2 |
| 3 | Pre-existing, **not caused by this PR** | `resident_who_and_where` has no `has_app_access()` gate at all, so `public_viewer` reads all 101 resident rows on dev. True before `0259` and still true after it | **Deferred to the faults log**, flagged as the one reading a near-public role can reach, so worth settling first. Not patched here: patching it would be exactly the "coded fix that masks the issue" this programme exists to stop |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | **Whether the widenings in §4 are acceptable**, now that a role gets exactly what its cards give. The volunteer, Head of Maintenance and doctor now read the full resident record because each holds `view_residents`. This is a judgement about the card set, not about the code | `docs/card-access-faults.md`, "Kind 1" — and it is **Card review 2's** job |
| 2 | **The six views with no card gate** (Defect 1). These need a card proposed; one cannot be created here | `docs/card-access-faults.md`, "Kind 2" |
| 3 | On production after the apply: that the Director, who is on Admin, still sees **286 current + 13 Deceased + 1 Adopted**. Proved on dev with a real Admin login (92 + 9 + 4, all three separately), but dev is not production and the numbers are his, read on 2026-10-25 | `lannacare.org` → Residents, then *Show all*, then the Adopted filter |

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: rows 1 to 3 are open and signed as pending below

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (`claude/security-db-half`)  Date: 2026-10-25

### Manual verification

Manual verification by: pending: the three items in Left for manual verification — the two card-set judgements are Card review 2's, and the production resident counts are after the apply

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: pasted once the PR exists
- [ ] Handed to the production release manager. n/a: after merge

Result: pass with accepted defects

Release manager acknowledgement: n/a: after merge
