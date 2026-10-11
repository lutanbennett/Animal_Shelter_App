# Feature test plan

## Header

| | |
|---|---|
| Feature | Record permission gaps: Edit links on the record tabs only at Edit, and the medical create and "End today" actions ask `can()`
| Backlog item | `docs/backlog.md` → "Record tabs show Edit links to a login at Read only" and "The medical create and "End today" actions ask no permission" |
| Branch / worktree | `claude/record-permission-gaps` @ `C:DevelopmentAnimal_Shelter_record-permission-gaps` |
| Dev server | not started: no UI a live role can reach changed (see section 4) |
| PR | opened from this branch after this commit |
| Tested by / date | Claude, 2026-10-11 |
| Carries a migration? | no |
| Tested at SHA | `901bc2c6` |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog asked for: Edit links (and End today) on the record tabs sit behind `can()` at Edit, and the six named create / End-today actions start with the same check
- [x] Files/areas touched listed: `src/app/residents/[id]/[section]/page.tsx`; `src/app/{weight,prescriptions,diets}/actions.ts`; `src/app/clinic-visits/new/actions.ts`; `scripts/check-permission-catalogue.mjs` (section F pin); docs
- [x] Roles affected identified: a role holding a medical activity at Read only, and not who-and-where, would stop seeing Edit links; none exists. Admin, management and doctor (Edit) unchanged
- [x] Anything explicitly **out of scope** written down: four more writers (`createBloodTest`, `createProcedure` and the two attachment deletes) have the same gap; spun out to the backlog branch

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly ("Already up to date")
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Paste its closing `gates:` lines below exactly as printed. They are the evidence, and running the script again regenerates them
- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

```
=== gates: build exited 0 after 327s

gates: typecheck=0 lint=0 build=0
```

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main`, and no other in-flight branch carries one — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration
- [ ] Applied to **dev** (`qxkmhwybjggxvsfxsxbd`) and recorded in `schema_migrations` — n/a: no migration
- [ ] File is re-runnable (`if not exists` / `or replace` / `drop … if exists`) — n/a: no migration
- [ ] Existing rows still read correctly after the change (checked against real dev data) — n/a: no migration
- [ ] **Constraints and defaults exercised against real rows** in a `begin; … rollback;` harness — n/a: no migration
- [ ] Down-migration written, or the reason one is not needed is stated — n/a: no migration
- [ ] Production apply plan stated for the release manager (which file, which project, when) — n/a: no migration

## 4. Functional checks

- [x] Reachability re-established, not quoted: a read-only query on dev's `roles` / `role_permissions` lists every role holding `medical.visits|prescriptions|diet|weight` at Read. Only `head_of_medical` (diet, prescriptions), whose scope is `who_and_where`, so `requireFullResident` refuses it before any tab renders
- [x] Wording exists: `t.common.notAllowed` and `vetVisits.errors.notAuthorized` are in the dictionary and typecheck against it
- [ ] Data persists — n/a: no write changed; a permission check was added in front of existing writes
- [ ] Create / edit / delete all exercised — n/a: same; a real create as management is in Left for manual verification
- [ ] Empty state renders sensibly — n/a: no new list or view
- [ ] Invalid input is rejected with a readable message — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: no input handling changed

### Role access matrix


| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | everything | unchanged | not driven: `can()` answers yes to every key |
| management | record tabs; create actions | Edit links shown; creates succeed | not driven in a browser: holds Edit on all four (`0132`); left for manual |
| doctor | record tabs; create actions | unchanged | not driven: left for manual |
| volunteer / Head of Medical (Read only) | — | cannot open the tabs (who-and-where) | checked by query and by `requireFullResident`'s code, not by a browser |
| signed out | — | `/login` | n/a: proxy gate unchanged |

- [x] Every role above tested (or the reason it was not is in its row)
- [x] A role that should not have access is blocked server-side: the six actions now refuse in code, ahead of RLS (read in the diff; not called with a Read-only login, since none can open the tabs)

`node scripts/check-permission-catalogue.mjs` prints `all ok` with the four activities added to the pin.

## 5. Cross-cutting

- [ ] Nav entry correct (`src/app/NavLinks.tsx`) — n/a: no nav change
- [ ] Manual updated (`src/lib/manual/en.ts`) — n/a: the manual describes who edits records by role, which is unchanged for every live role
- [ ] Translatable strings go through the translation path — n/a: no new strings; existing `notAllowed` / `notAuthorized` reused
- [ ] Mobile viewport (375px) — n/a: no layout change
- [ ] Browser console clean — n/a: server-side guard change, no client code touched; the pages were fetched by script and returned 200 with their forms
- [ ] Network clean — n/a: server-side guard change, no client requests added

## 6. Regression

- [x] The pages nearest the change still work: the four edit pages and the hub open for management (script); the volunteer's hub → card journey still works (script)
- [ ] Any shared file touched checked from a second, unrelated page — n/a: no shared file touched; `requireFullResident` and `can` are used as they are, not changed
- [x] Nothing merged from `main` during `sync` was broken by this branch (nothing merged: already up to date; gates green)

## 7. Documentation

- [x] Backlog items ticked in `docs/backlog.md` on this branch (both); one follow-up on the `backlog` branch
- [x] Non-obvious design choices added as a new file in `docs/decisions/` (`2026-10-11-record-permission-gaps.md`)
- [ ] `README.md` still accurate — n/a: README says nothing about page guards
- [ ] **Release notes.** — n/a: no live role can reach either path (the only Read-only holder, Head of Medical, is who-and-where and cannot open the tabs; Edit holders see no difference), so no shelter user would notice
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** Before-and-after behaviour (404 → no-access; card → no-access) measured by running the live script with the old pages restored, then the new; role cells read from dev

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date or time logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: a permission cutoff, and both sides were asserted (Read refused, Edit opens; no-record refused, record opens; who-and-where redirected first)
- [x] **Evidence pasted into this plan is the tool's actual output, unedited.** (the gates lines and the section F lines are as printed)
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read and the ref matches production — deferred: release manager
- [ ] `strip-baked-env` seen in the deploy output — deferred: release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: no new secret or env var

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `node scripts/apply-migrations.mjs --env production --dry-run` — n/a: no migration
- [ ] Production backup for a destructive migration — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — deferred: release manager (app-only change; a Pi rebuild at the previous SHA reverts it fully, nothing in the database to undo)

## Defects found

| # | Severity | What | Status |
|---|---|---|---|
| 1 | minor | Blood-test and procedure create / attachment-delete actions ask no `can()` | deferred to backlog ("Blood-test and procedure writes ask no permission") |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| 1 | As management: open a resident → Weight tab. Edit links show on each reading; add a weight and it saves | `/residents/<id>/weight` |
| 2 | As management: Prescriptions and Diet tabs show Edit and End today; End today on a current row works | `/residents/<id>/prescriptions`, `/diet` |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude (Opus 5.5)  Date: 2026-10-10

### Manual verification

- [ ] The manual list above is empty, or every item in it was checked by a person — n/a: not yet — two items are waiting for Lutan

Manual verification by: pending: the two rows in Left for manual verification

### Result

- [ ] Open defects are either fixed or explicitly accepted above — n/a: both are minor and deferred to the backlog, recorded above; accepting them is the release manager's call
- [ ] Checklist pasted into the PR — n/a: not yet — the PR does not exist at this commit
- [ ] Handed to the production release manager — n/a: not yet — after merge

Result: pass with accepted defects

Release manager acknowledgement: pending  Date: —
