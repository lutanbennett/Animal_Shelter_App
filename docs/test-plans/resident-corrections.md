# Feature test plan

## Header

| | |
|---|---|
| Feature | Near-duplicate warning in the bulk loader, and `scripts/correct-resident.mjs` |
| Backlog item | `docs/backlog.md` → *A reviewable script for resident corrections, and a near-duplicate warning in the bulk loader* |
| Branch / worktree | `claude/resident-corrections-script` @ `C:\Development\Animal_Shelter_resident-corrections-script` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` (not used: scripts only) |
| PR | opened from this commit |
| Tested by / date | Claude, 2026-10-09 |
| Carries a migration? | no |
| Tested at SHA | `eb56f0e3` (after `sync`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the loader's run lists possible duplicates, and a fixed script removes a resident entered twice, refusing anything with history. One change from the item, decided by Lutan in chat on 2026-10-09: it runs on the live database, by a chat, with no manual step (decision file §4)
- [x] Files/areas touched listed: `scripts/load-residents.mjs`, `scripts/lib/near-names.mjs` (new), `scripts/correct-resident.mjs` (new), `README.md`, `docs/backlog.md`, `docs/decisions/2026-10-09-resident-corrections-script.md`
- [x] Roles affected identified: none. Both scripts reach the database through the Management API as the owner; no app login uses them
- [x] Out of scope written down: no live run from this stream (a worktree cannot read production); Drive is never touched by the script; no merging of history (`--merge-into` refused); the Admin placement-delete policy is a separate backlog item

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (sync exit 0)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`:

```
=== gates: build exited 0 after 248s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [ ] Migration number is one above the highest on `main` — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the scripts were run against real dev rows (section 4)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness: every `correct-resident.mjs` dry run below runs the real delete inside `begin…rollback` on dev, and its `do $$` block asserts each deleted row count, re-checks every history table, and raises if the kept resident changed in anything but the `--copy` fields. R-2625 → R-5282 with `--copy thai_name,colour` came back `ok`, so the triggers (deceased lock, audit, translations drop) and foreign keys all let it through and the kept-unchanged check held
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [x] Happy path works end to end, dry run on dev: R-2625 removed in favour of R-5282, copying the Thai name and colour into blanks: `Trying it (rolled back) … ok` and the exact apply line printed. The loader against a 6-row CSV listed 4 possible duplicates (bracket tag, close spelling, same Thai name, `B1` ~ `B1 (Cat)`), still refused the exact clash `Lucky`, and without that row ran its rolled-back load `ok`
- [ ] Data persists — n/a: no `--apply` was run by this stream; the first real request is the first apply
- [x] Create / edit / delete all exercised: the delete (with its copy edit) inside the rolled-back transaction
- [x] Empty state renders sensibly: a code that does not exist → `There is no resident R-9999 in the test database. Nothing was changed.`
- [x] Invalid input is rejected with a readable message, not a crash, each run on dev: unknown option, same code twice, `--copy name` (lists the allowed fields), `--merge-into` (says why), `--apply` with a receipt that already exists, names that do not look alike, `--copy` onto a detail the original already has, `--copy` of a blank, a resident with vet visits / tests / Drive (R-0394: 7 reasons), a resident still deceased (R-0057: names "Withdraw this death"), `--env uat`, and `NEXT_PUBLIC_SUPABASE_URL` pointed at the live project with `--env test`
- [ ] Boundary cases checked: the withdrawn-death path (Intake + Deceased + DeceasedInError) — n/a: dev has no resident in that state, and making one means recording and withdrawing a death through the app; listed for manual verification

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | n/a | scripts only | n/a |
| management | n/a | scripts only | n/a |
| staff | n/a | scripts only | n/a |
| vet | n/a | scripts only | n/a |
| volunteer | n/a | scripts only | n/a |
| signed out | n/a | scripts only | n/a |

- [ ] Every role above tested — n/a: no app surface; the scripts run as the database owner through the Management API
- [ ] A role that should not have access is blocked server-side — n/a: no app surface

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no page
- [ ] Manual updated — n/a: no user-facing feature
- [ ] Translatable strings go through the translation path — n/a: console output for the operator only
- [ ] Mobile viewport (375px) — n/a: no page
- [ ] Browser console clean — n/a: no page
- [ ] Network clean — n/a: no page

## 6. Regression

- [x] The nearest thing still works: `load-residents.mjs` dry run on dev with the near-duplicate change in, exact-name refusal unchanged, rolled-back load `ok`; `check-script-integrity.mjs`: `169 .mjs files parsed … ok`
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared app file touched; `near-names.mjs` is new and used only by the two scripts
- [x] Nothing merged from `main` during `sync` was broken by this branch: gates green after the sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch; the placement-delete finding went on the `backlog` branch as its own item
- [x] Non-obvious design choices added as `docs/decisions/2026-10-09-resident-corrections-script.md`
- [x] `README.md` still accurate: scripts list names `correct-resident.mjs` and the loader's duplicate list
- [ ] **Release notes.** — n/a: a maintenance script no shelter user sees; nothing in the app changed
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and the decision file were measured, not reasoned**: the R-0240 path was read from the triggers and policies on dev (`pg_trigger`: `placement_history_immutable` is BEFORE UPDATE only); the foreign keys and their delete actions were read from `pg_constraint` on dev; the undo not clearing the deceased Drive IDs was read from `0049`

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour** — n/a: nothing here derives a date except the receipt's file name
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the spelling threshold was checked both sides (`Lucky`~`Lucy` matches at 1 letter; `Max`/`Mia` under 4 letters does not; `Somchai`/`Somsak` does not), but no app boundary changed
- [x] **Evidence pasted into this plan is the tool's actual output, unedited**: the gates lines and quoted messages are as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` run and clean — n/a: no migration
- [ ] For a **destructive or rewriting** migration only: a production backup exists — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: nothing deployed depends on these scripts, so reverting the PR removes them. A removal already applied is not undone by any rollback; its receipt on the Desktop holds every deleted row for re-inserting by hand

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | Low | First run: a label with an apostrophe ("the website's …") broke the SQL | fixed in `correct-resident.mjs` (labels quoted) |
| 2 | Low | First run: said "--force-names was given" when it was not | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | The first real duplicate removal on the live database: the dry run reads sensibly, the receipt lands on the Desktop, and the dog is gone from the app afterwards | a chat in the main checkout, on Lutan's next request |
| 2 | A dog whose death was recorded and withdrawn (like R-0317) is removed, not refused | the first such request |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-09

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: two items are waiting on the first live requests

Manual verification by: pending: the two items above, on the first live requests

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: none open; both fixed
- [ ] Checklist pasted into the PR — n/a: linked from the PR body instead
- [ ] Handed to the production release manager — n/a: not yet — at release time

Result: pass

Release manager acknowledgement: pending: at release time
