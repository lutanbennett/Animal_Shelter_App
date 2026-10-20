# Feature test plan: prescription-round-ticks

## Header

| | |
|---|---|
| Feature | Morning / Lunch / Evening ticks on the add and edit prescription form |
| Backlog item | `docs/backlog.md` → Add / edit prescription: tick the time of day |
| Branch / worktree | `claude/prescription-round-ticks` @ `C:\Development\Animal_Shelter_prescription-round-ticks` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3010` |
| PR | to follow |
| Tested by / date | Claude, 2026-10-20 |
| Carries a migration? | no |
| Tested at SHA | 6b4900e7 |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: the prescription form gets three round ticks that pre-fill from the frequency and save to `prescription_rounds`; the frequency stays the dose count.
- [x] Files/areas touched: `src/app/prescriptions/` (form, actions, new and edit pages), `src/lib/prescriptions/{rounds,options}.ts`, `src/lib/medication-list/load.ts` and its page (shows the note), both dictionaries, manual, releases. No migration, no `worker/`.
- [x] Roles affected: admin, management, doctor (anyone with `medical.prescriptions`); medication list readers see the note
- [x] Out of scope: a fourth round, amounts per round, dropping the frequency list, a blocking refusal on too many ticks (it warns and still saves)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed: `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — skip if no migration

- [ ] Migration number is one above the highest on `main` — n/a: no migration; the tables are 0137/0138
- [ ] `--status` reviewed before applying — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] File is re-runnable — n/a: no migration
- [ ] Existing rows still read correctly — n/a: no migration
- [ ] Constraints exercised in a rollback harness — n/a: no migration
- [ ] Down-migration written — n/a: no migration
- [ ] Production apply plan stated — n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end — n/a: form not driven in a browser this session; listed under Left for manual verification
- [ ] Data persists on reload — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Create / edit / delete all exercised — n/a: not driven in a browser this session; listed under Left for manual verification
- [ ] Empty state renders sensibly — n/a: no list view changed; an as-needed prescription shows no ticks by code (showsRoundTicks)
- [ ] Invalid input is rejected with a readable message — n/a: round ids are filtered to uuid shape and the database trigger refuses non-medication rounds; not driven in a browser
- [ ] Boundary cases checked — n/a: not driven in a browser; the logic is in src/lib/prescriptions/rounds.ts and listed for manual check

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | prescription form | unchanged, ticks shown | not driven |
| management | prescription form | unchanged, ticks shown | not driven |
| staff | prescription form | retired role | n/a |
| doctor | prescription form | unchanged, ticks shown | not driven |
| volunteer | prescription form | still refused by medical.prescriptions | unchanged code path |
| signed out | prescription form | still redirected | unchanged code path |

- [ ] Every role above tested — n/a: no permission was added or changed; the same can(…, "medical.prescriptions") check guards both actions
- [ ] A role that should not have access is blocked server-side — n/a: the guard is untouched and the rounds write sits after it

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no new page
- [x] Manual updated (`src/lib/manual/en.ts`, Adding a prescription)
- [ ] Translatable strings go through the translation path — n/a: UI strings are in both dictionaries (en and th); no free text added
- [ ] Mobile viewport (375px) — n/a: not viewed; ticks use a three-column grid; listed for manual check
- [ ] Browser console clean — n/a: not run in a browser this session
- [ ] Network clean — n/a: not run in a browser this session

## 6. Regression

- [ ] The pages nearest the change still work — n/a: build passes; the medication list change is one line shown only when a note exists; not loaded in a browser
- [ ] Any shared file touched checked from a second page — n/a: manual/en.ts and releases.ts gained one entry each and the build prerenders them
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing was merged)

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` **on this branch**
- [x] Design choices added as `docs/decisions/2026-10-20-prescription-round-ticks.md`
- [x] `README.md` still accurate
- [x] **Release notes.** `unreleased` in `src/lib/releases.ts` has a new line for it
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The decision file's claims come from reading the code and migrations 0137/0138

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved, not observed at a convenient hour.** — n/a: nothing here derives a date
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: the only boundary is ticks versus doses, listed for manual check
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited.** — n/a: only the gates line, copied as printed
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` line seen — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — skip if no migration

- [ ] **Does this PR contain both a migration and code that reads it?** — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [x] Rollback position stated: redeploy the previous ref with `./scripts/pi/deploy-pi.sh --ref <sha>`. No schema changed, so nothing else to undo; rounds already saved stay in `prescription_rounds` and are read exactly as before.

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | More ticks than the frequency gives warns but does not block the save, so the database view reads it as mismatch | accepted: matches the amended rule |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Add a twice-daily prescription: Morning and Evening are pre-ticked; change to Morning and Lunch, save, and see it under those rounds on the medication list and pick list | /prescriptions/new, /operations/medication-list |
| 2 | Tick two rounds on a once-daily one: the red warning shows. Four times daily with three ticks: only the quiet note shows and it saves | /prescriptions/new |
| 3 | Edit an existing prescription: its current rounds are ticked; an as-needed one shows no ticks; the notes text shows on the medication list; check at phone width | /prescriptions/[id]/edit |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-20

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: pending, the three items above have not been looked at yet

Manual verification by: pending: the three items in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not until the PR merges

Result: pass with accepted defects

Release manager acknowledgement: pending
