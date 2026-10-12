# Feature test plan

## Header

| | |
|---|---|
| Feature | Read the eight writers with no `can()`; readable refusals in maintenance and projects; catalogue check G |
| Backlog item | `docs/backlog.md` → "Admin, maintenance, projects and intake writers contain no `can()` call" |
| Branch / worktree | `claude/writers-no-can` @ `C:\Development\Animal_Shelter_writers-no-can` |
| Dev server | not started: nothing driven in a browser (see section 4) |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-12 |
| Carries a migration? | no |
| Tested at SHA | `f5cbbc18` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: all eight areas read (none open), a database refusal in maintenance and projects shows the existing not-allowed wording, and the catalogue check asserts every `"use server"` file names a guard or is listed with a reason
- [x] Files/areas touched listed: `src/app/maintenance/actions.ts`, `src/app/projects/actions.ts`, `scripts/check-permission-catalogue.mjs`, `src/lib/releases.ts`, docs
- [x] Roles affected identified: any role refused by RLS on maintenance or projects now reads "not allowed"; no role's access changed, no `can()` added
- [x] Anything explicitly **out of scope** written down: no key added or changed, no migration, the five placement actions' table policies not re-read

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — branch was cut from current `main` this session; rerun before merge
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three). n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 268s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying. n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed. n/a: no migration
- [ ] Applied to **dev** and recorded in `schema_migrations`. n/a: no migration
- [ ] File is re-runnable. n/a: no migration
- [ ] Existing rows still read correctly after the change. n/a: no migration
- [ ] Constraints and defaults exercised against real rows. n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated. n/a: no migration
- [ ] Production apply plan stated for the release manager. n/a: no migration

## 4. Functional checks

- [ ] Happy path works end to end. n/a: no happy-path behaviour changed, only the text of a refusal
- [ ] Data persists — reload the page and the change is still there. n/a: no write behaviour changed
- [ ] Create / edit / delete all exercised. n/a: no write behaviour changed
- [ ] Empty state renders sensibly. n/a: no UI surface
- [x] Invalid input is rejected with a readable message, not a crash: the 42501 branch returns `t.common.notAllowed`; other errors pass through unchanged (code read, typecheck clean)
- [ ] Boundary cases checked. n/a: no input handling changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| all roles | maintenance and project writers | unchanged: RLS decides as before; a refusal now reads "not allowed" | not driven in a browser; read from the policies (0141, 0149, 0179) |

- [ ] Every role above tested. n/a: access is unchanged and no role was signed in; the table records the reading, not a drive
- [x] A role that should not have access is blocked server-side: unchanged, by RLS; check G asserts a guard is named in every server-action file and a service-role file carries its own admin check (62 files, all ok)

## 5. Cross-cutting

- [ ] Nav entry correct. n/a: no nav change
- [ ] Manual updated. n/a: no feature change to document
- [ ] Translatable strings. n/a: reuses `t.common.notAllowed`, no new strings
- [ ] Mobile viewport (375px). n/a: no layout change
- [ ] Browser console clean. n/a: no page changed
- [ ] Network clean. n/a: no page changed

## 6. Regression

- [x] The pages nearest the change still work: build compiled every route (`gates` build=0); not loaded in a browser
- [ ] Any shared file touched checked from a second page. n/a: no shared UI file touched
- [ ] Nothing merged from `main` during `sync` was broken by this branch. n/a: nothing merged in yet, rerun at sync

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-12-writers-without-can-read.md`
- [ ] `README.md` still accurate. n/a: nothing it describes changed
- [x] **Release notes.** `unreleased` gained a line: a role refused on a maintenance job or project folder now sees the usual not-allowed message instead of database wording. No outstanding manual step
- [x] Commit messages say why, not just what
- [x] Claims in the decision file were measured by reading the code and policies named there, not reasoned from names; the placement-table caveat is stated in it

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time. deferred: release manager
- [ ] Deployed SHA matches the tested SHA. deferred: release manager

### On the deployed build

- [ ] Deployed to test. deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org`. deferred: release manager
- [ ] Timezone-sensitive behaviour proved. n/a: nothing here touches dates
- [ ] Boundary or banding change covers both edges. n/a: no boundary or banding change
- [x] Evidence pasted into this plan is the tool's actual output, unedited
- [ ] Public pages re-checked. n/a: no public page changed

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read. deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output. deferred: release manager
- [ ] Any new secret/env var exists in production. n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Migration and reading code in one PR? n/a: no migration
- [ ] `--env production --dry-run` run and clean. n/a: no migration
- [ ] Destructive migration backup. n/a: no migration
- [ ] Apply plan stated. n/a: no migration

### Rollback

- [ ] Rollback position stated. n/a: code only; revert the PR, nothing here touches data or schema

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| none | | | |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | Signed in as a role without maintenance or project rights, try to add a job or folder: the message reads "not allowed", not database text | `/maintenance`, `/projects` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-12

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person. n/a: not yet checked, row 1 is open and signed as pending below

Manual verification by: pending: row 1 of Left for manual verification

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR. n/a: pasted once the PR exists
- [ ] Handed to the production release manager. n/a: after merge

Result: pass

Release manager acknowledgement: n/a: after merge
