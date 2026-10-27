# Feature test plan — staff-removal

## Header

| | |
|---|---|
| Feature | Role checks skip archived roles; the archived Staff role, its cards, cells and one archived login link are deleted |
| Backlog item | `docs/backlog.md` → **REMOVE `staff` COMPLETELY, AND STOP REPORTING ARCHIVED ROLES AS LIVE ROLES** (ticked) |
| Branch / worktree | `claude/staff-removal` @ `C:\Development\Animal_Shelter_staff-removal` |
| Dev server | not started — no UI surface in this PR |
| PR | filled in at open |
| Tested by / date | Claude / 2026-10-27 |
| Carries a migration? | yes — `0270_delete_staff_role.sql` |
| Tested at SHA | `a435a56d` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for — role checks exclude archived roles, and the archived staff row and what hangs off it are deleted
- [x] Files/areas touched listed — `scripts/lib/readonly-checks.mjs`, `supabase/migrations/0270_delete_staff_role.sql`, `docs/decisions/2026-10-27-staff-role-deleted.md`, `docs/backlog.md`, this plan
- [x] Roles affected identified — none live: nobody could hold Staff (0 live logins on production, 02:18 UTC 2026-10-27)
- [x] Anything explicitly **out of scope** written down — no card assigned to any role; `app_role` enum value kept; release-note tag types kept

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` already merged, up to date
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 test=0 build=0`
- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is one above the highest on `main` — `0270` against `0269`, migration-numbers check ok
- [x] `--status` reviewed before applying — dev 270 applied, 1 pending
- [x] `--dry-run` reviewed — `0270 … ok`
- [x] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) — `applying 0270_delete_staff_role.sql … ok`
- [x] File is re-runnable — every statement is keyed on the archived staff row existing; second run deletes nothing
- [x] Existing rows still read correctly — `role-cards-coverage` clean and `cards-union` exact for every remaining role on dev after the apply; `check-cards-count` and `check-card-grants` pass
- [x] Constraints exercised against real rows — the live-login guard is the same shape as 0173's; the cascade deletion ran on dev's own staff row; not separately harnessed on production, which is read-only here
- [x] Down-migration reason stated — not needed: the role is retired and unholdable, deletion is what was asked for
- [x] Production apply plan stated — `0270` on `dbkodyyxxhtygxcxmfcu` with the next release; production count read before deleting: 0 live logins, 1 archived login (approved by Lutan), 13 cards, 31 cells

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface
- [ ] Data persists — n/a: no UI surface
- [ ] Create / edit / delete all exercised — n/a: no UI surface
- [ ] Empty state renders sensibly — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: no UI surface
- [ ] Boundary cases checked — n/a: no UI surface

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | nothing changed | unchanged | n/a — no policy, grant or card changed |

- [ ] Every role above tested — n/a: no access rule changed
- [ ] A role that should not have access is blocked server-side — n/a: no access rule changed

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface
- [ ] Translatable strings go through the translation path — n/a: no strings
- [ ] Mobile viewport (375px) — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] The pages nearest the change still work — build gate compiles all of `src/`, which is untouched; `check-hard-coded-security.mjs` prints `no coded security outside the Admin bypass`
- [ ] Any shared file touched checked from a second page — n/a: no shared app file touched
- [x] Nothing merged from `main` during `sync` was broken — nothing merged

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md`
- [x] Non-obvious design choices in `docs/decisions/` — `2026-10-27-staff-role-deleted.md`
- [x] `README.md` still accurate
- [ ] **Release notes.** — n/a: no shelter user would notice; nobody could hold Staff
- [x] Commit messages say why
- [x] **Claims were measured, not reasoned** — counts read from production with the new named check, timestamped

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded, tip of `main` at deploy — deferred: release manager
- [ ] Deployed SHA matches — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no dates derived
- [ ] **Boundary or banding change** — n/a: no threshold
- [ ] **Evidence pasted is unedited** — n/a: no deploy output pasted
- [ ] Public pages re-checked after a cache purge — n/a: public site reads none of this

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: release manager
- [ ] `strip-baked-env` seen — deferred: release manager
- [ ] Any new secret/env var exists in production — n/a: none

### Migration ordering

- [x] **Both a migration and code that reads it?** — no; `-- consumer: none`
- [ ] `--env production --dry-run` run and clean — deferred: release manager
- [ ] Production backup for a destructive migration — deferred: release manager, deletes one archived role and its dependent rows
- [x] Apply plan stated — with the next release

### Rollback

- [x] Rollback position stated — code rollback does not undo `0270` and does not need to; no code reads the staff row

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | info | After this, `medical_records`, `assistant` and Send to hospital are held by no live role | accepted — already true, hidden by the phantom; for Lutan's card-assignment rebuild |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | none — no UI surface | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-27

### Manual verification

- [x] The manual list above is empty — empty: no UI surface

Manual verification by: n/a: no UI surface

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR body links it
- [ ] Handed to the production release manager — n/a: through the release's PR list

Result: pass

Release manager acknowledgement: n/a: not yet released
