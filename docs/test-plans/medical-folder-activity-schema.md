# Feature test plan — medical-folder-activity-schema

## Header

| | |
|---|---|
| Feature | Schema half: filing into the Medical folder needs its own activity, `photos.medical_add` |
| Backlog item | `docs/backlog.md` → **THE RESIDENTS CARD CAN FILE PHOTOS INTO THE MEDICAL FOLDER, AND IT SHOULD NOT** (left open: the app half remains) |
| Branch / worktree | `claude/medical-folder-activity-schema` @ `C:\Development\Animal_Shelter_medical-folder-activity-schema` |
| Dev server | not started — no UI surface in this PR |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-28 |
| Carries a migration? | yes — `0278_medical_folder_filing_activity.sql` |
| Tested at SHA | `ba5aa982` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — a new activity `photos.medical_add`, granted by Add medical photos and Manage medical, which `record_attachment()` and the two attachment folder guards now ask for the Medical folder
- [x] Files/areas touched listed — `supabase/migrations/0278_medical_folder_filing_activity.sql`, `scripts/check-medical-folder-activity.mjs`, `docs/decisions/2026-10-28-medical-folder-activity-schema.md`, and one catalogue line plus two labels (`src/lib/permissions/catalogue.ts`, `en.ts`, `th.ts`) because `check-permission-catalogue` requires the file to match `permission_activities`
- [x] Roles affected identified — a role holding `photos.resident_add` without Add medical photos / Manage medical would lose Medical filing; none do on dev. Nothing in the app reads the new activity yet
- [x] Anything explicitly **out of scope** written down — the uploader, `photoCategoriesFor()` and its `return ["Medical"]` fallback, the Move action, the upload route are the app half (decision file lists them)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (one docs file)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing lines:

```
=== gates: build exited 0 after 75s

gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [x] Migration number is one above the highest on `main`, and no other in-flight branch carries one — `check-migration-numbers.mjs`: ok, `0278` against highest `0277`
- [x] `node scripts/apply-migrations.mjs --status` reviewed before applying — dev 278 applied, 1 pending
- [x] `node scripts/apply-migrations.mjs --dry-run` reviewed — `ok`; the consumer warnings are expected (the app half is not on `main`)
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — `applying 0278_medical_folder_filing_activity.sql … ok`
- [x] File is re-runnable — `create or replace`, `alter policy`, `on conflict` upserts
- [x] Existing rows still read correctly after the change — n/a in substance: no column or view changed; only a function body, two policies, one activity row and two grant rows
- [x] **Constraints and defaults exercised against real rows** in a rolled-back harness (`scripts/check-medical-folder-activity.mjs`, dev). Asserted: a login with only `photos.resident_add` is refused Medical through `record_attachment()` (P0001) and a direct insert (42501); the Residents shape (`resident_add` + `resident_publish`) is refused Medical in five spellings (case, padding, tab, newlines) by both paths and still files into Shelter, Foster and Adoption by both; `photos.medical_add` files into Medical by both paths and is still refused Shelter without publish; Admin files into both holding no cell; the activity is on exactly Add medical photos and Manage medical, not Residents. Result `HARNESS-OK 0278: all assertions held`
- [x] Down-migration written, or the reason one is not needed is stated — not needed: additive; code that ignores the activity is unaffected, and every login that filed into Medical and matters holds it
- [x] Production apply plan stated for the release manager — `0278` on `dbkodyyxxhtygxcxmfcu` with the next release, any time before the app half deploys; `0276` may land first, the file does not depend on it. Read the runner's NOTICE for roles that lose Medical filing on production

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; database behaviour asserted in §3
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface; inserts exercised in §3
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected with a readable message — n/a: no UI; the refusals are asserted in §3
- [ ] Boundary cases checked — n/a: no UI; folder spellings asserted in §3

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | files into Medical and Shelter | allowed | harness D passed |
| management | n/a: not exercised as a role; the Residents shape (publish + resident_add) is | refused Medical, other folders ok | harness B passed |
| staff | n/a: retired role | | |
| doctor | n/a: a resident_add-only login stands in | refused Medical | harness A passed |
| volunteer | n/a: no photo filing activity | | |
| signed out | n/a: no policy for anon changed | | |

- [ ] Every role above tested — n/a: harness uses one-cell logins per activity shape rather than named roles
- [ ] A role that should not have access is blocked server-side — n/a: covered by harness A and B, which are server-side

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: nothing a user sees changes
- [ ] Translatable strings — n/a: the one label added (`photos.medical_add`) is for Who does what and is in `en.ts` and `th.ts`
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — build compiled every page; `check-permission-catalogue` and `check-hard-coded-security` (clean) ran
- [ ] Any shared file touched checked from a second, unrelated page — n/a: only a catalogue line and two label lines added
- [x] Nothing merged from `main` during `sync` was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: deliberately left open; the app half is next
- [x] Non-obvious design choices added as a new file in `docs/decisions/` — `2026-10-28-medical-folder-activity-schema.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: nothing a user sees changes until the app half ships; the app-half PR carries the note
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned** — the who-loses reading is a dev query, the behaviour is the harness

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: nothing derives a date
- [ ] **Boundary or banding change** — n/a: no threshold; the folder-spelling edge is in the harness
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — deferred: release manager, for deploy output; the gates output above is unedited
- [ ] Public pages re-checked — n/a: the public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering — *skip if no migration*

- [x] **Does this PR contain both a migration and code that reads it?** — no; the only code is a catalogue line, which no page reads
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — deferred: release manager
- [ ] Destructive migration backup — n/a: additive
- [x] Apply plan stated — `0278` on production with the next release, before the app half deploys

### Rollback

- [x] Rollback position stated — code rollback does not revert `0278` and does not need to; to restore the old Medical rule a new migration would be written. Purely additive otherwise

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low | First gates run red: `check-permission-catalogue` wanted `photos.medical_add` in the catalogue | fixed — one line and two labels |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-28

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person — empty: no UI surface

Manual verification by: n/a: no UI surface, nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: handed over through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
