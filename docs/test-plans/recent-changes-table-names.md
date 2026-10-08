# Feature test plan

## Header

| | |
|---|---|
| Feature | Recent changes names the four settings tables and gives each its true undo answer |
| Backlog item | `docs/backlog.md` → "Recent changes shows `roles`, `role_permissions`, `impact_baselines` and `facility_maps` entries with no table name, and the wrong undo reason" |
| Branch / worktree | `claude/recent-changes-table-names` @ `C:\Development\Animal_Shelter_recent-changes-table-names` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3003` |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-08 |
| Carries a migration? | no |
| Tested at SHA | `dde21c10` (after `sync`) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — the four tables with an audit trigger that the page did not know get names (en + th), a place in the filter, and an undo answer that is true for each
- [x] Files/areas touched listed — `src/lib/audit/recent-changes.ts`, `src/lib/audit/undo.ts`, `src/app/admin/recent-changes/page.tsx` and `actions.ts`, both dictionaries, `src/lib/manual/en.ts`, `src/lib/releases.ts`, `docs/backlog.md`, `docs/decisions/2026-10-08-recent-changes-settings-tables.md`
- [x] Roles affected identified — admin only (`audit.view` / `audit.undo`); no other role reaches the page
- [x] Anything explicitly **out of scope** written down — a permission row shows its activity key (`website.content`): no translated activity names exist yet. No permission editor is built, and permissions are deliberately not undoable here (decision file)

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (release-handover docs only)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
=== gates: build exited 0 after 205s

gates: typecheck=0 lint=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number — n/a: no migration
- [ ] `--status` reviewed — n/a: no migration
- [ ] `--dry-run` reviewed — n/a: no migration
- [ ] Applied to dev — n/a: no migration
- [ ] Re-runnable — n/a: no migration
- [x] Existing rows still read correctly after the change (checked against real dev data) — all 1,066 dev `audit_log` rows run through the real `toEntry`/`undoKind` and both dictionaries, on `origin/main` and on this branch (output below)
- [x] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — the impact-figure edit undo, as an admin at aal2 under RLS, on the newest `impact_baselines` UPDATE: asserted the guarded update matched exactly 1 row, the count and date went back to their Before values (300 → null, 2026-10-01 → null, the "not entered" pair the check constraint allows), the stamp trigger set `set_by` to the admin, and a new audit row was written under the admin's login. Rolled back; nothing kept
- [ ] Down-migration — n/a: no migration
- [ ] Production apply plan — n/a: no migration

Before (`origin/main` code) and after (this branch), same rows:

```
before: { total: 1066, blankEn: 106, blankTh: 106, notInFilter: 106, nonFileRowsSayingFile: 5 }
  role_permissions DELETE -> reinsert: 36   role_permissions UPDATE -> file: 1   roles UPDATE -> file: 1
  impact_baselines UPDATE -> file: 3        (INSERTs -> added: 65)
  undo offered on new tables: 36
after:  { total: 1066, blankEn: 0, blankTh: 0, notInFilter: 0, nonFileRowsSayingFile: 0 }
  role_permissions DELETE -> permissions: 36   role_permissions UPDATE -> permissions: 1   roles UPDATE -> permissions: 1
  impact_baselines UPDATE -> edit: 3           (INSERTs -> added: 65)
```

Harness output: `HARNESS rows=1 count 300-><NULL> date 2026-10-01-><NULL> set_by_is_admin=t new_audit_row=t`

## 4. Functional checks

- [x] Happy path works end to end — the impact-figure undo write, as above; the labels and undo kinds for every dev row, as above
- [ ] Data persists — n/a: the only write is the existing Undo action; its persistence for impact figures was shown inside a rolled-back transaction, deliberately not committed
- [x] Create / edit / delete all exercised — INSERT (added, no button), UPDATE and DELETE rows of each of the four tables run through `undoKind`; `facility_maps` has no rows on dev yet, its answer is by table and does not depend on op
- [ ] Empty state renders sensibly — n/a: unchanged; `?table=facility_maps` (no rows on dev) loaded at 375 px without error
- [ ] Invalid input is rejected — n/a: no new input; `parseFilters` accepts only `AUDITED_TABLES`, now eleven
- [x] Boundary cases checked — a role row with `archived_at` gets the permissions reason, not "use Restore" (permissions check comes first); an unknown future table gets "not undone here", not "Files"

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/admin/recent-changes`, all four new filters | loads | loads, en + th (phone-width run) |
| management | — | unchanged by this PR (`audit.view` is admin's) | n/a: access rules not touched |
| staff | — | unchanged | n/a: access rules not touched |
| vet | — | unchanged | n/a: access rules not touched |
| volunteer | — | unchanged | n/a: access rules not touched |
| signed out | — | redirected to login | redirected to `/login?next=…` (browser pane) |

- [ ] Every role above tested — n/a: no access rule, policy or route guard changed; admin and signed-out were loaded
- [x] A role that should not have access is blocked server-side — signed out, the URL redirected to login

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [x] Manual updated (`src/lib/manual/en.ts`) and the topic reads correctly at `/manual` — `/manual` loaded as admin, en + th
- [x] Translatable strings go through the translation path — all new words are in both dictionaries; typecheck holds `th` to `en`'s shape
- [x] Mobile viewport (375px) — `check-phone-width.mjs --roles=admin`: `/admin/recent-changes` unfiltered and filtered to `role_permissions`, `impact_baselines`, `roles`, `facility_maps`, en + th: "No page scrolls sideways", 0 warnings
- [ ] Browser console clean — n/a: the rendered page was driven only by the phone-width script, not inspected in the pane (no admin login there); listed for manual verification
- [ ] Network clean — n/a: same reason

## 6. Regression

- [x] The pages nearest the change still work — `/admin`, `/admin/website`, `/admin/facility-map`, `/admin/recent-changes` loaded at 375 px, en + th, as admin
- [x] Any shared file touched checked from a second, unrelated page — `manual/en.ts` via `/manual`, the dictionaries via `/admin` and `/admin/website`, loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — the merge was docs only; gates green after it

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch, and the `facility_maps` audit item's "follow-up" note marked closed
- [x] Non-obvious design choices added — `docs/decisions/2026-10-08-recent-changes-settings-tables.md`
- [ ] `README.md` still accurate — n/a: README does not describe Recent changes' tables
- [x] **Release notes.** One line added to `unreleased` in `src/lib/releases.ts`
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** — every count in the commits and the decision file is from the before/after run and the harness above

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] Timezone-sensitive behaviour proved — n/a: nothing here reads a date or the clock
- [ ] Boundary or banding change covers both edges — n/a: no threshold or band
- [ ] Evidence pasted is the tool's actual output — deferred: production release manager
- [ ] Public pages re-checked after a cache purge — n/a: no public page changed (an undone impact figure revalidates `/`, as saving one on Settings → Website already does)

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` seen — deferred: production release manager
- [ ] Any new secret/env var exists in production — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Migration and the code that reads it — n/a: no migration; the four triggers already exist (0132, 0156, 0165)
- [ ] `--env production --dry-run` — n/a: no migration
- [ ] Production backup — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: production release manager — code only; rolling back brings the blank labels back and the Undo on deleted permission rows, nothing in the data changes

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | major | Found during this work: on `main`, 36 deleted `role_permissions` rows offered Undo, which would put a permission back | fixed in this PR |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Filter Kind of record to Permission, Role and Impact figure: each line shows its kind under the record, and an edit or delete of a permission reads "Roles and permissions can't be undone here…" | Settings → Recent changes, on a phone |
| 2 | An impact figure edit shows Undo this change; pressing it puts the number back, and Settings → Website shows the old number | Settings → Recent changes, then Settings → Website → Home page |
| 3 | Replace a facility plan: the change appears as Facility plan, pointing to Undo the replace | Settings → Facility map, then Recent changes |
| 4 | The Thai names and the three new reasons read naturally | the same screens in Thai |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-08

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — four items await Lutan

Manual verification by: pending: the four checks in Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass
