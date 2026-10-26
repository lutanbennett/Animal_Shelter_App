# Feature test plan

## Header

| | |
|---|---|
| Feature | Delete the dead `limited` / volunteer-floor branches and the two stub functions that fed them |
| Backlog item | `docs/backlog.md` → **Delete the dead `limited` branches left behind by the stub removal** (ticked here) |
| Branch / worktree | `claude/limited-branches-cleanup` @ `C:\Development\Animal_Shelter_limited-branches-cleanup` |
| Dev server | `node scripts/worktree.mjs dev` → `http://localhost:3008` |
| PR | opened after this commit; number on the PR |
| Tested by / date | Claude / 2026-10-26 |
| Carries a migration? | no |
| Tested at SHA | `bfafc5b4` (`origin/main` already merged; later commits are docs only) |

## 1. Scope and risk

- [x] Change is described in one sentence, and it matches what the backlog item asked for: `readsWhoAndWhereOnly()` (constant false) and `mayOpenResidentRecord()` (constant true) are deleted with every branch they fed, keeping each live `else` path, so no login's access changes
- [x] Files/areas touched listed: `src/lib/residents/{who-and-where,list-view,export,card-landing}.ts`, `src/lib/enclosures/details.ts`, `src/app/residents/{page.tsx,export/route.ts,ResidentsTable.tsx}`, `src/app/residents/[id]/{page.tsx,ResidentHub.tsx,[section]/page.tsx}`, `src/app/r/[code]/page.tsx`, both i18n dictionaries (one unused string), `scripts/check-permission-catalogue.mjs`, `scripts/check-card-taps.mjs`
- [x] Roles affected identified: none changes behaviour; checked as volunteer and admin (a volunteer holds `view_residents`, so it takes the same path as everyone)
- [x] Out of scope written down: the six clinic-login database functions are reported, not dropped (needs a migration; filed on the `backlog` branch); `src/lib/clinics/scope.ts` is live and stays; no card created or changed

## 2. Automated gates

- [x] `node scripts/worktree.mjs sync` — `origin/main` merged in cleanly (already up to date)
- [x] `node scripts/gates.mjs` ends `gates: typecheck=0 lint=0 build=0`. Closing line as printed:

```
gates: typecheck=0 lint=0 test=0 build=0
```

- [ ] CI green on the PR — n/a: not yet — the PR does not exist at this commit

## 3. Schema and data — *skip if no migration*

- [ ] Migration number is one above the highest on `main` — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --status` reviewed before applying — n/a: no migration in this PR
- [ ] `node scripts/apply-migrations.mjs --dry-run` reviewed — n/a: no migration in this PR
- [ ] Applied to **dev** — n/a: no migration in this PR
- [ ] File is re-runnable — n/a: no migration in this PR
- [ ] Existing rows still read correctly after the change — n/a: no schema change; the same views are read as before
- [ ] **Constraints and defaults exercised against real rows** — n/a: no migration in this PR
- [ ] Down-migration written — n/a: no migration in this PR
- [ ] Production apply plan stated — n/a: no migration in this PR

## 4. Functional checks

- [x] Happy path works end to end: as volunteer and as admin on dev, `/residents` lists 186 rows, `/residents/export` returns a CSV, a resident's hub opens, an enclosure page lists its occupants
- [ ] Data persists — n/a: nothing is written by this change
- [ ] Create / edit / delete all exercised — n/a: no write path changed
- [ ] Empty state renders sensibly — n/a: no empty-state code changed; the table's no-matches row keeps the colspan of 8 the live path always used
- [ ] Invalid input is rejected with a readable message — n/a: no input handling changed
- [ ] Boundary cases checked — n/a: no input, threshold or date logic changed

### Role access matrix

| Role | Can reach | Expected | Result |
|---|---|---|---|
| admin | `/residents`, export, hub, enclosures | as before | 200 on each; hub shows the edit and record-death links |
| management | not driven | as before | not driven; same code path as admin |
| staff | retired role | n/a | n/a |
| doctor | not used on purpose | n/a | not used: the card test role, left alone by instruction |
| volunteer | `/residents` (186 rows), export, hub, enclosure page, `/r/<id>` | as before | 200 on each; hub shows the edit link |
| signed out | not touched | public card unchanged | not driven; a signed-out visitor still gets the public card (`!appAccess`) |

- [ ] Every role above tested — n/a: admin and volunteer were driven, and the table gives the reason for each other row
- [ ] A role that should not have access is blocked server-side — n/a: no guard was added or removed; `requireFullResident()` still refuses a login with no read of the record, and `check-permission-catalogue.mjs` pins it

## 5. Cross-cutting

- [ ] Nav entry correct — n/a: no nav change
- [ ] Manual updated — n/a: no user-visible behaviour change
- [ ] Translatable strings go through the translation path — n/a: one unused string removed from both dictionaries; none added
- [ ] Mobile viewport (375px) — n/a: no layout change; the only markup change drops a wrapper that was always rendered
- [ ] Browser console clean — n/a: pages were fetched, not watched in a console
- [ ] Network clean — n/a: every request above returned 200

## 6. Regression

- [x] The pages nearest the change still work: `/residents`, `/residents/export`, `/residents/[id]`, `/enclosures`, an enclosure page, `/r/[id]`, `/clinic-visits/new` — all 200 for the volunteer; the first four and the hub also for admin
- [x] Any shared file touched checked from a second, unrelated page — `who-and-where.ts` is imported by `/r/[code]`, `/residents/[id]`, the enclosure pages and the section pages; each was loaded
- [x] Nothing merged from `main` during `sync` was broken by this branch — nothing was merged; already up to date

## 7. Documentation

- [x] Backlog item ticked in `docs/backlog.md` on this branch
- [x] Non-obvious design choices added as `docs/decisions/2026-10-26-dead-limited-branches-removed.md`
- [x] `README.md` still accurate (it does not mention the removed functions)
- [ ] **Release notes.** n/a: dead code removal, no visible change for any login
- [x] Commit messages say why, not just what
- [x] **Claims in commit messages and `docs/decisions.md` were measured, not reasoned.** The "can never run" claim was read at each call site (no guard was negated or combined) and the live paths were exercised in the browser

## 8. Pre-production gate

### Tested build

- [ ] Tested SHA recorded in the header, and it is the tip of `main` at deploy time — deferred: production release manager
- [ ] Deployed SHA matches the tested SHA — deferred: production release manager

### On the deployed build

- [ ] Deployed to test: `npm run deploy:test` — deferred: production release manager
- [ ] Smoke-tested on `test.lannacare.org` — deferred: production release manager
- [ ] **Timezone-sensitive behaviour proved** — n/a: no date logic touched
- [ ] **For a boundary or banding change, the assertions cover both edges** — n/a: no boundary or banding change
- [ ] **Evidence pasted into this plan is the tool's actual output, unedited** — n/a: the one evidence line is the `gates:` output as printed
- [ ] Public pages re-checked after a cache purge — n/a: no public page touched

### Deploy safety

- [ ] `deploy: production → Supabase project <ref>` line read — deferred: production release manager
- [ ] `strip-baked-env` line seen in the deploy output — deferred: production release manager
- [ ] Any new secret/env var exists in the production Cloudflare environment — n/a: none added

### Migration ordering — *skip if no migration*

- [ ] Does this PR contain both a migration and code that reads it? — n/a: no migration
- [ ] `--env production --dry-run` run and clean — n/a: no migration
- [ ] Production backup fresh — n/a: no migration
- [ ] Apply plan stated — n/a: no migration

### Rollback

- [ ] Rollback position stated — n/a: code-only and reversible by redeploying the previous SHA; no schema involved

## Defects found

| # | Severity | What | Status (fixed / accepted / deferred to backlog) |
|---|---|---|---|
| 1 | low, pre-existing | `check-card-taps.mjs` is red on dev (5 role expectations stale against the current card state: volunteer, doctor_out, sic, hom, hm). It passed `whoAndWhereOnly: false` before and now omits it, which is the same value, so this change moves nothing | accepted: not caused here |
| 2 | low, pre-existing | `check-hard-coded-security.mjs` lists 5 FAILs, all in migration `0264` (retired role columns), a file this PR does not touch | accepted: not caused here |

## Left for manual verification

| # | What to check | Where |
|---|---|---|
| | | |

## Sign-off

### Automated and scripted checks

- [x] Everything in this checklist that could be verified without human eyes was run, not assumed
- [x] Nothing is ticked that was not actually executed

Automated checks by: Claude  Date: 2026-10-26

### Manual verification

- [x] The manual list above is empty, or every item in it was checked by a person. The list is empty: this removes code that could not run, with no screen a person needs to look at

Manual verification by: n/a: nothing for a person to look at

### Result

- [x] Open defects are either fixed or explicitly accepted above
- [ ] Checklist pasted into the PR — n/a: the PR carries a link to this file
- [ ] Handed to the production release manager — n/a: not yet, the PR is not merged

Result: pass with accepted defects

Release manager acknowledgement: n/a
