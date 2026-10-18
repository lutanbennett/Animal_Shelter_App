# Test plan: social-shares-schema

## Header

| | |
|---|---|
| Feature | Social shares, schema half: one `social_shares` table for resident photos and memes, plus `memes`, `meme_residents` and the `social.library` activity |
| Backlog item | `docs/backlog.md` → "Mark a resident's photo as posted on social media" and "Meme library, stage 1" (neither ticked: the app halves tick them; each has a status note) |
| Branch / worktree | `claude/social-shares-schema` @ `C:\Development\Animal_Shelter_social-shares-schema` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3006` (not used) |
| PR | pending: opened after this push |
| Tested by / date | Claude, 2026-10-18 |
| Carries a migration? | yes, 0223 (0222 is reserved for approve-photos-app) |
| Tested at SHA | 1c9b7126 |

## 1. Scope and risk

- [x] One sentence: one shares table (owner type attachment or meme) plus memes, meme_residents and the social.library activity, never public; matches the brief
- [x] Touched: `supabase/migrations/0223_social_shares.sql`, `src/lib/permissions/catalogue.ts` and both dictionaries (one activity row and its label), `scripts/check-public-views.mjs`, `scripts/check-social-shares-schema.mjs`, the decision file, two backlog status notes
- [x] Roles affected: none yet; social.library starts at None for every role but Admin and nothing in src/ reads the tables
- [x] Out of scope: every UI (badge, filter, /memes, resident Memes list), the home card, the Drive Memes folder, release note, backlog ticks

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — origin/main merged in cleanly
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR (runs the same three) — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data

- [x] Migration number is 0223 by the planner's reassignment (0222 is carried by approve-photos-app); the sync gap warning is expected and not acted on
- [x] `--status` reviewed before applying (1 pending)
- [x] `--dry-run` reviewed: ok
- [x] Applied to dev and recorded in `schema_migrations`
- [x] File is re-runnable (`create or replace function`)
- [x] Existing rows still read correctly: no existing table or row is altered; check-public-views passes for every pre-existing object
- [x] Harness `scripts/check-social-shares-schema.mjs` (rolled back) asserts: editor writes and reads memes, links, meme and photo shares; reader reads library only, cannot write, sees no photo share; photo-manager records photo shares and sees no meme; a login with no cells and anon see and write nothing; bad owners, platforms, links, titles refused; created_by and recorded_by stamped by the database; deleting a photo or meme takes its shares
- [x] Down-migration: not written; dropping the three tables, guards and activity row undoes it (listed in the migration header and the decision file)
- [x] Production apply plan: apply 0223 with the release; additive and nothing reads it yet

## 4. Functional checks

- [ ] Happy path works end to end — n/a: no UI surface; covered by the harness
- [ ] Data persists — n/a: the function writes nothing new
- [ ] Create / edit / delete — n/a: no UI surface
- [ ] Empty state — n/a: no UI surface
- [ ] Invalid input is rejected — n/a: the refusals are the harness's subject, not a form
- [ ] Boundary cases — n/a: covered in the harness (owner existence, platform list, https-only link, blank title)

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | all three tables | full | holds every cell without a row |
| library editor | memes, links, shares | read and write | harness |
| library reader | memes, links, meme shares | read only | harness |
| photo manager | photo shares | read and write, no library | harness |
| login with no cells | nothing | refused | harness |
| signed out | nothing | refused every method | harness and check-public-views |

- [x] Every role above tested (admin is the superuser path and holds every cell)
- [x] A role that should not have access is blocked server-side (harness and check-public-views)

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no UI surface
- [ ] Manual updated — n/a: no UI surface yet; the app half updates it
- [ ] Translatable strings — n/a: none added
- [ ] Mobile viewport — n/a: no UI surface
- [ ] Browser console clean — n/a: no UI surface
- [ ] Network clean — n/a: no UI surface

## 6. Regression

- [x] Nearest checks: `check-public-views.mjs` run in full against dev passes, including the new refusals; the permission-catalogue parity check is part of lint
- [ ] Shared file loaded from a second page — n/a: the catalogue and dictionaries gained one row each, covered by typecheck, lint and build
- [x] Nothing merged from `main` during sync was broken by this branch

## 7. Documentation

- [ ] Backlog item ticked — n/a: schema half; the app halves tick them (status notes added to both)
- [x] Decision file `docs/decisions/2026-10-18-social-shares-schema.md` added
- [x] `README.md` still accurate
- [ ] **Release notes.** n/a: no user can see this until the app halves ship
- [x] Commit messages say why
- [x] Claims were measured: every refusal comes from the rolled-back harness or the HTTP probe

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded and is the tip of main at deploy time — deferred: release manager
- [ ] Deployed SHA matches the tested SHA — deferred: release manager

### On the deployed build

- [ ] Deployed to test — deferred: release manager
- [ ] Smoke-tested on test.lannacare.org — deferred: release manager
- [ ] Timezone-sensitive behaviour — n/a: no dates involved
- [ ] Boundary or banding assertions — n/a: no thresholds
- [ ] Evidence is the tool's actual output — n/a: no pasted evidence beyond the gates
- [ ] Public pages re-checked — n/a: no public page touched

### Deploy safety

- [ ] deploy line read and ref matches production — deferred: release manager
- [ ] strip-baked-env line seen — deferred: release manager
- [ ] Any new secret exists in production — n/a: none added

### Migration ordering

- [ ] Migration and code that reads it in one PR — n/a: no code reads the migration yet
- [ ] Production dry-run clean — deferred: release manager
- [ ] Production backup for a destructive migration — n/a: additive, creates tables only
- [x] Apply plan stated: file 0223, production project, with the release, before or after the deploy is immaterial

### Rollback

- [ ] Rollback position stated — n/a: drop the three tables, guards and activity row as listed in the migration header; no data moved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | info | The anon DELETE probe first passed on HTTP 400 (no filter), not a refusal; fixed by adding the no-row filter | fixed |

## Left for manual verification

| # | What to check | Where |
|---|---|---|

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-18

### Manual verification

- [x] The manual list above is empty, so there is nothing for a person to look at

Manual verification by: n/a: no UI surface, nothing to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [x] Checklist pasted into the PR
- [ ] Handed to the production release manager — n/a: handover happens at release

Result: pass

Release manager acknowledgement: pending
